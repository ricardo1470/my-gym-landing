// src/app/api/dashboard/route.ts

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Inscripcion from '@/models/Inscripcion';
import Visit from '@/models/Visit';
import Cupo from '@/models/Cupo';
import bcrypt from 'bcryptjs';

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
        });

    } catch (err) {
        console.error('Error al obtener datos del dashboard:', err);
        return NextResponse.json({ error: 'Error interno del servidor al obtener datos' }, { status: 500 });
    }
}
