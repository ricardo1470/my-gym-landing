// src/app/api/dashboard/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Inscripcion from '@/models/Inscripcion';
import Visit from '@/models/Visit';
import Cupo from '@/models/Cupo';
import Reserva from '@/models/Reserva';
import type { IReservaDocument } from '@/models/Reserva';
import PaymentAudit from '@/models/PaymentAudit';
import bcrypt from 'bcryptjs';
import { getRenewalStatus, isMonthlyPlan } from '@/lib/membership';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { password } = body;

        const DASHBOARD_PASSWORD_HASH = process.env.DASHBOARD_PASSWORD_HASH;

        if (!DASHBOARD_PASSWORD_HASH) {
            return NextResponse.json({ error: "Hash de Contraseña de Dashboard no configurado." }, { status: 500 });
        }

        if (!password) {
            return NextResponse.json({ error: "Acceso denegado. Contraseña requerida." }, { status: 401 });
        }

        const isPasswordValid = await bcrypt.compare(password, DASHBOARD_PASSWORD_HASH);

        if (!isPasswordValid) {
            return NextResponse.json({ error: "Acceso denegado. Credenciales inválidas." }, { status: 401 });
        }

        await connectDB();

        // Estadísticas existentes
        const totalInscripciones = await Inscripcion.countDocuments();
        const planSelections = await Inscripcion.aggregate([
            { $group: { _id: '$planId', count: { $sum: 1 } } }
        ]);

        const totalVisitas = await Visit.countDocuments();
        const geoData = await Visit.aggregate([
            { $group: { _id: { country: '$country', city: '$city' }, count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const hourlyData = await Visit.aggregate([
            {
                $group: {
                    _id: { $hour: '$timestamp' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const cupoStatus = await Cupo.findOne();

        // ✨ NUEVAS ESTADÍSTICAS DE RESERVAS
        
        // Total de reservas
        const totalReservas = await Reserva.countDocuments();
        
        // Reservas por estado
        const reservasPorEstado = await Reserva.aggregate([
            { $group: { _id: '$estado', count: { $sum: 1 } } }
        ]);

        // Reservas por estado de pago
        const reservasPorPagoEstado = await Reserva.aggregate([
            { $group: { _id: '$pagoEstado', count: { $sum: 1 } } }
        ]);

        // Total de ingresos (solo pagos aprobados)
        const ingresosData = await Reserva.aggregate([
            { $match: { pagoEstado: 'aprobado' } },
            { $group: { _id: null, total: { $sum: '$pagoMonto' } } }
        ]);
        const totalIngresos = ingresosData[0]?.total || 0;

        // Ingresos por plan
        const ingresosPorPlan = await Reserva.aggregate([
            { $match: { pagoEstado: 'aprobado' } },
            { 
                $group: { 
                    _id: '$planId', 
                    count: { $sum: 1 },
                    total: { $sum: '$pagoMonto' },
                    promedio: { $avg: '$pagoMonto' }
                } 
            },
            { $sort: { total: -1 } }
        ]);

        // Reservas próximas (siguientes 7 días)
        const hoy = new Date();
        const en7dias = new Date();
        en7dias.setDate(hoy.getDate() + 7);
        
        const proximasReservas = await Reserva.find({
            fechaHora: { $gte: hoy, $lte: en7dias },
            estado: { $in: ['confirmada', 'pendiente'] }
        })
        .sort({ fechaHora: 1 })
        .limit(10)
        .lean<IReservaDocument[]>();

        // Tasa de conversión (Inscripciones → Reservas con pago aprobado)
        const reservasCompletadas = await Reserva.countDocuments({ pagoEstado: 'aprobado' });
        const tasaConversion = totalInscripciones > 0 
            ? ((reservasCompletadas / totalInscripciones) * 100).toFixed(2)
            : '0';

        // Reservas por día de la semana
        const reservasPorDia = await Reserva.aggregate([
            { $match: { estado: { $in: ['confirmada', 'completada'] } } },
            {
                $group: {
                    _id: { $dayOfWeek: '$fechaHora' }, // 1=Domingo, 7=Sábado
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Método de pago más usado
        const metodosPago = await Reserva.aggregate([
            { $group: { _id: '$pagoMetodo', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Últimas reservas (para tabla)
        const ultimasReservas = await Reserva.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .lean<IReservaDocument[]>();

        // Auditoría de pagos (resumen + eventos recientes)
        const alertEventTypes = [
            'amount_mismatch',
            'merchant_mismatch',
            'transaction_mismatch_on_status_poll',
            'amount_mismatch_on_status_poll',
        ];
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const paymentAlerts24h = await PaymentAudit.countDocuments({
            createdAt: { $gte: last24h },
            eventType: { $in: alertEventTypes },
        });

        const paymentAuditByType = await PaymentAudit.aggregate([
            { $group: { _id: '$eventType', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 8 },
        ]);

        const paymentAuditRecent = await PaymentAudit.find()
            .sort({ createdAt: -1 })
            .limit(20)
            .lean<Array<{
                _id: { toString: () => string };
                source: string;
                eventType: string;
                transactionId?: string;
                statusCode?: string;
                amount?: number;
                createdAt?: Date;
            }>>();

        // Membresías mensuales (retención/renovación)
        const monthlyReservas = await Reserva.find({
            pagoEstado: 'aprobado',
            planId: { $in: ['basico', 'premium', 'elite'] },
        })
            .sort({ membershipEndDate: 1, createdAt: -1 })
            .lean<Array<{
                _id: { toString: () => string };
                clienteNombre: string;
                clienteEmail: string;
                planId: string;
                planNombre: string;
                membershipEndDate?: Date;
                pagoFecha?: Date;
                createdAt?: Date;
                renewalReminderCount?: number;
                lastRenewalReminderAt?: Date;
            }>>();

        const membershipsNormalized = monthlyReservas
            .filter((r) => isMonthlyPlan(r.planId))
            .map((r) => {
                const endDate = new Date(
                    r.membershipEndDate || r.pagoFecha || r.createdAt || new Date()
                );
                const status = getRenewalStatus(endDate, 7);
                const diasRestantes = Math.ceil((endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
                return {
                    id: r._id.toString(),
                    clienteNombre: r.clienteNombre,
                    clienteEmail: r.clienteEmail,
                    planId: r.planId,
                    planNombre: r.planNombre,
                    membershipEndDate: endDate,
                    renewalStatus: status,
                    diasRestantes,
                    renewalReminderCount: r.renewalReminderCount || 0,
                    lastRenewalReminderAt: r.lastRenewalReminderAt || null,
                };
            });

        const membershipsDueSoon = membershipsNormalized
            .filter((m) => m.renewalStatus === 'due_soon')
            .slice(0, 20);
        const membershipsExpired = membershipsNormalized
            .filter((m) => m.renewalStatus === 'expired')
            .slice(0, 20);

        return NextResponse.json({
            ok: true,
            stats: {
                totalVisitas,
                totalInscripciones,
                planSelections,
                geoData,
                hourlyData,
            },
            cupos: cupoStatus ? cupoStatus.planDiscounts.map(p => ({
                planId: p.planId,
                maxCupos: p.maxCupos,
                usedCupos: p.usedCupos,
                remainingCupos: p.maxCupos - p.usedCupos,
                discountPercentage: p.discountPercentage
            })) : [],
            lastCupoReset: cupoStatus ? cupoStatus.lastReset : null,
            
            // ✨ Nuevas estadísticas
            reservas: {
                total: totalReservas,
                porEstado: reservasPorEstado,
                porPagoEstado: reservasPorPagoEstado,
                completadas: reservasCompletadas,
                tasaConversion,
            },
            ingresos: {
                total: totalIngresos,
                porPlan: ingresosPorPlan,
            },
            proximasReservas: proximasReservas.map(r => ({
                id: r._id.toString(),
                cliente: r.clienteNombre,
                plan: r.planNombre,
                fecha: r.fechaHora,
                estado: r.estado,
                monto: r.pagoMonto,
            })),
            reservasPorDia,
            metodosPago,
            ultimasReservas: ultimasReservas.map(r => ({
                id: r._id.toString(),
                cliente: r.clienteNombre,
                email: r.clienteEmail,
                plan: r.planNombre,
                monto: r.pagoMonto,
                pagoEstado: r.pagoEstado,
                estado: r.estado,
                fechaReserva: r.fechaHora,
                createdAt: r.createdAt,
            })),
            paymentAudit: {
                alerts24h: paymentAlerts24h,
                byType: paymentAuditByType,
                recent: paymentAuditRecent.map(a => ({
                    id: a._id.toString(),
                    source: a.source,
                    eventType: a.eventType,
                    transactionId: a.transactionId || '',
                    statusCode: a.statusCode || '',
                    amount: a.amount ?? null,
                    createdAt: a.createdAt || null,
                })),
            },
            memberships: {
                totalMonthly: membershipsNormalized.length,
                dueSoonCount: membershipsDueSoon.length,
                expiredCount: membershipsExpired.length,
                dueSoon: membershipsDueSoon,
                expired: membershipsExpired,
            },
        });

    } catch (err) {
        console.error('Error al obtener datos del dashboard:', err);
        return NextResponse.json({ error: 'Error interno del servidor al obtener datos' }, { status: 500 });
    }
}
