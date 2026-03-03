// src/app/api/payment/nequi/route.ts
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { connectDB } from "@/lib/mongodb";
import Reserva from "@/models/Reserva";
import Inscripcion from "@/models/Inscripcion";
import { getNequiClient } from "@/lib/nequi";
import { calculatePlanAmount, isSimulationEnabled, isValidPlanId } from "@/lib/payment-config";
import { rateLimit } from "@/lib/rate-limit";

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown";
}

function getSessionToken(req: Request, searchParams: URLSearchParams): string | null {
  const auth = req.headers.get("authorization");
  if (auth && auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  return searchParams.get("token");
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = await rateLimit({
      key: `payment-nequi-post:${ip}`,
      limit: 20,
      windowMs: 60 * 1000,
    });

    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes, intenta de nuevo en unos segundos." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
      );
    }

    const { inscripcionId } = await req.json();

    if (!inscripcionId) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      );
    }

    await connectDB();

    // Verificar que existe la inscripción
    const inscripcion = await Inscripcion.findById(inscripcionId);
    if (!inscripcion) {
      return NextResponse.json(
        { error: "Inscripción no encontrada" },
        { status: 404 }
      );
    }

    const planId = String(inscripcion.planId || "");
    if (!isValidPlanId(planId)) {
      return NextResponse.json(
        { error: "La inscripción no tiene un plan válido" },
        { status: 400 }
      );
    }

    const { planNombre, monto } = calculatePlanAmount(
      planId,
      Boolean(inscripcion.discountApplied),
      Number(inscripcion.discountPercentage || 0)
    );

    // Reusar intento activo para evitar duplicados.
    const activeReserva = await Reserva.findOne({
      inscripcionId,
      pagoEstado: { $in: ["pendiente", "aprobado"] },
    }).sort({ createdAt: -1 });

    if (activeReserva) {
      if (!activeReserva.paymentSessionToken) {
        activeReserva.paymentSessionToken = randomBytes(24).toString("hex");
        await activeReserva.save();
      }

      return NextResponse.json({
        ok: true,
        message: "Ya existe un pago en curso para esta inscripción",
        reservaId: activeReserva._id,
        sessionToken: activeReserva.paymentSessionToken,
        simulationMode: Boolean(activeReserva.simulationMode),
      });
    }

    const sessionToken = randomBytes(24).toString("hex");

    // Crear reserva con estado pendiente de pago
    const reserva = await Reserva.create({
      inscripcionId,
      clienteNombre: inscripcion.nombre,
      clienteEmail: inscripcion.email,
      clientePhone: inscripcion.phone,
      planId,
      planNombre,
      pagoMonto: monto,
      pagoMetodo: 'nequi',
      pagoEstado: 'pendiente',
      estado: 'pendiente',
      fechaHora: new Date(), // Temporal, se actualizará al agendar
      paymentSessionToken: sessionToken,
      simulationMode: false,
      notificacionesEnviadas: {
        whatsappCliente: false,
        whatsappEntrenador: false,
        emailCliente: false,
        emailEntrenador: false,
      }
    });

    const nequiClient = getNequiClient();

    // Verificar si Nequi está configurado
    if (!nequiClient.isConfigured()) {
      // Modo simulación solo cuando se habilita explícitamente.
      if (!isSimulationEnabled()) {
        await Reserva.findByIdAndDelete(reserva._id);
        return NextResponse.json(
          { error: "Pasarela Nequi no configurada correctamente" },
          { status: 503 }
        );
      }

      console.log('⚠️ Nequi no configurado. Usando modo simulación segura.');
      reserva.simulationMode = true;
      reserva.pagoId = `SIM_PENDING_${Date.now()}`;
      await reserva.save();

      return NextResponse.json({
        ok: true,
        message: "Solicitud de pago creada (SIMULACIÓN)",
        reservaId: reserva._id,
        sessionToken,
        simulationMode: true,
        instructions: "Modo simulación habilitado. El estado se actualizará automáticamente."
      });
    }

    // MODO PRODUCCIÓN: Enviar notificación push real a Nequi
    try {
      const nequiResponse = await nequiClient.sendPushPayment({
        phoneNumber: inscripcion.phone,
        code: process.env.NEQUI_MERCHANT_CODE || 'NIT_1',
        value: monto.toString(),
        reference1: String(reserva._id),
        reference2: planNombre,
        reference3: inscripcion.email,
      });

      // Guardar el transaction ID de Nequi
      reserva.pagoId = nequiResponse.transactionId;
      await reserva.save();

      console.log('✅ Pago Nequi enviado:', nequiResponse.transactionId);

      return NextResponse.json({
        ok: true,
        message: "Notificación de pago enviada a Nequi",
        reservaId: reserva._id,
        sessionToken,
        transactionId: nequiResponse.transactionId,
        simulationMode: false,
        instructions: "El cliente recibirá una notificación en su app Nequi para confirmar el pago."
      });

    } catch (nequiError) {
      console.error('❌ Error enviando pago a Nequi:', nequiError);
      
      // Si falla Nequi, eliminar la reserva creada
      await Reserva.findByIdAndDelete(reserva._id);
      
      return NextResponse.json(
        { error: "Error al procesar el pago con Nequi. Por favor intenta nuevamente." }, 
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Error en pago Nequi:", error);
    return NextResponse.json(
      { error: "Error al procesar el pago" }, 
      { status: 500 }
    );
  }
}

// GET para consultar estado del pago
export async function GET(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = await rateLimit({
      key: `payment-nequi-get:${ip}`,
      limit: 60,
      windowMs: 60 * 1000,
    });

    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes, intenta de nuevo en unos segundos." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
      );
    }

    const { searchParams } = new URL(req.url);
    const reservaId = searchParams.get('reservaId');
    const token = getSessionToken(req, searchParams);

    if (!reservaId || !token) {
      return NextResponse.json(
        { error: "reservaId y token son requeridos" },
        { status: 400 }
      );
    }

    await connectDB();
    const reserva = await Reserva.findById(reservaId);

    if (!reserva || reserva.paymentSessionToken !== token) {
      return NextResponse.json(
        { error: "No autorizado para consultar esta reserva" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ok: true,
      pagoEstado: reserva.pagoEstado,
      estado: reserva.estado,
      pagoFecha: reserva.pagoFecha,
    });

  } catch (error) {
    console.error("Error consultando pago:", error);
    return NextResponse.json(
      { error: "Error al consultar pago" }, 
      { status: 500 }
    );
  }
}
