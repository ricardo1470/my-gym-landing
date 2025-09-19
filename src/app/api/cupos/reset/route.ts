import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Cupo from "@/models/Cupo";

export async function POST() {
    try {
        await connectDB();

        let cupo = await Cupo.findOne();
        if (!cupo) {
            cupo = await Cupo.create({ max: 10, usados: 0 });
        } else {
            cupo.usados = 0;
            cupo.max = 10;
            await cupo.save();
        }

        return NextResponse.json({ ok: true, message: "Cupos reseteados a 10" });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Error al resetear" }, { status: 500 });
    }
}
