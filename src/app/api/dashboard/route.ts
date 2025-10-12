// src/app/api/dashboard/route.ts

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Inscripcion from '@/models/Inscripcion';
import Visit from '@/models/Visit';
import Cupo from '@/models/Cupo';

export async function GET(req: Request) {
    const url = new URL(req.url);
    const password = url.searchParams.get('password');
    const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD;

    if (!DASHBOARD_PASSWORD) {
        return NextResponse.json({ error: "Contraseña de Dashboard no configurada en variables de entorno." }, { status: 500 });
    }

    if (password !== DASHBOARD_PASSWORD) {
        return NextResponse.json({ error: "Acceso denegado. Contraseña incorrecta." }, { status: 401 });
    }

    try {
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
