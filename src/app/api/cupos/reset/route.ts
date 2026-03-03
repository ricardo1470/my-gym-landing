// src/app/api/cupos/reset/route.ts

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Cupo from '@/models/Cupo';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    const { password } = await req.json();
    const DASHBOARD_PASSWORD_HASH = process.env.DASHBOARD_PASSWORD_HASH;

    if (!password || !DASHBOARD_PASSWORD_HASH) {
        return NextResponse.json({ error: "Acceso denegado. Credenciales inválidas." }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, DASHBOARD_PASSWORD_HASH);

    if (!isPasswordValid) {
        return NextResponse.json({ error: "Acceso denegado. Contraseña incorrecta." }, { status: 401 });
    }

    try {
        await connectDB();

        const cupo = await Cupo.findOne();
        if (!cupo) {
            return NextResponse.json({ error: "No hay configuración de cupos." }, { status: 404 });
        }

        cupo.planDiscounts.forEach(p => {
            p.usedCupos = 0;
        });
        cupo.lastReset = new Date();

        await cupo.save();

        return NextResponse.json({
            ok: true,
            message: "Contadores de cupos restablecidos exitosamente.",
            newCuposStatus: cupo.planDiscounts
        });

    } catch (err) {
        console.error('Error al restablecer cupos:', err);
        return NextResponse.json({ error: 'Error interno al restablecer cupos' }, { status: 500 });
    }
}
