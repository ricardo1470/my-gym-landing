import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Cupo from "@/models/Cupo";
import Inscripcion from "@/models/Inscripcion";
import { sendConfirmationMail } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    const { nombre, email, objetivo } = await req.json();

    if (!nombre || !email || !objetivo) {
      return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
    }

    await connectDB();

    const cupo = await Cupo.findOne();
    if (!cupo) return NextResponse.json({ error: "No hay cupos configurados" }, { status: 500 });

    if (cupo.usados >= cupo.max) {
      return NextResponse.json({ error: "Ya no quedan cupos disponibles" }, { status: 400 });
    }

    // Guardar inscripción
    await Inscripcion.create({ nombre, email, objetivo });

    // Incrementar cupo
    cupo.usados++;
    await cupo.save();

    // Enviar correo de confirmación
    await sendConfirmationMail(nombre, email, objetivo);

    return NextResponse.json({
      ok: true,
      message: "Inscripción exitosa",
    });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
