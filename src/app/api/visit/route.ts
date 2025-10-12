// src/app/api/visit/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Visit from '@/models/Visit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        await connectDB();

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _ip = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || 'N/A';
        const userAgent = req.headers.get('user-agent') || 'N/A';

        const country = req.headers.get('x-vercel-ip-country') || 'Desconocido';
        const city = req.headers.get('x-vercel-ip-city') || 'Desconocida';

        await Visit.create({
            country,
            city,
            userAgent,
        });

        return NextResponse.json({ ok: true });

    } catch (err) {
        console.error('Error al registrar visita:', err);
        return NextResponse.json({ ok: false, error: 'Tracking error' }, { status: 500 });
    }
}
