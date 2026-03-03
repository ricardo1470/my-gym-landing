// src/app/api/payment/status/route.ts
import { NextResponse } from "next/server";
import { createHash, createHmac, timingSafeEqual } from "crypto";
import { connectDB } from "@/lib/mongodb";
import Reserva from "@/models/Reserva";
import type { IReservaDocument } from "@/models/Reserva";
import { getNequiClient, interpretPaymentStatus } from "@/lib/nequi";
import { isSimulationEnabled } from "@/lib/payment-config";
import { rateLimit } from "@/lib/rate-limit";
import { isReplayRequest } from "@/lib/replay-protection";
import PaymentAudit from "@/models/PaymentAudit";
import { ensureMembershipFields } from "@/lib/membership";

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

/**
 * Consultar estado de pago en Nequi
 * Este endpoint puede ser llamado por polling desde el frontend
 * o como webhook si configuras notificaciones de Nequi
 */
export async function GET(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = await rateLimit({
      key: `payment-status-get:${ip}`,
      limit: 80,
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
    
    // Usar lean() para obtener un objeto plano de JavaScript
    const reservaDoc = await Reserva.findById(reservaId).lean<IReservaDocument>();

    if (!reservaDoc || reservaDoc.paymentSessionToken !== token) {
      return NextResponse.json(
        { error: "No autorizado para consultar esta reserva" },
        { status: 403 }
      );
    }

    // Si ya está aprobado, retornar estado
    if (reservaDoc.pagoEstado === 'aprobado') {
      return NextResponse.json({
        ok: true,
        pagoEstado: 'aprobado',
        estado: reservaDoc.estado,
        message: 'Pago ya confirmado'
      });
    }

    const nequiClient = getNequiClient();

    // Si Nequi no está configurado, usar simulación segura si está habilitada.
    if (!nequiClient.isConfigured()) {
      if (!isSimulationEnabled()) {
        return NextResponse.json(
          { error: "Pasarela Nequi no configurada" },
          { status: 503 }
        );
      }

      if (reservaDoc.pagoEstado === "pendiente") {
        const createdAt = reservaDoc.createdAt ? new Date(reservaDoc.createdAt).getTime() : Date.now();
        const shouldAutoApprove = Date.now() - createdAt > 3000;
        if (shouldAutoApprove) {
          await Reserva.findByIdAndUpdate(reservaId, {
            pagoEstado: "aprobado",
            pagoFecha: new Date(),
          });
          const reservaAfter = await Reserva.findById(reservaId);
          if (reservaAfter) {
            ensureMembershipFields(reservaAfter, new Date());
            await reservaAfter.save();
          }
          return NextResponse.json({
            ok: true,
            pagoEstado: "aprobado",
            estado: reservaDoc.estado,
            simulationMode: true,
          });
        }
      }

      return NextResponse.json({
        ok: true,
        pagoEstado: reservaDoc.pagoEstado,
        estado: reservaDoc.estado,
        simulationMode: true
      });
    }

    // Consultar estado real en Nequi
    if (!reservaDoc.pagoId) {
      return NextResponse.json(
        { error: "No hay transactionId de Nequi" },
        { status: 400 }
      );
    }

    try {
      const statusResponse = await nequiClient.getPaymentStatus(reservaDoc.pagoId);
      const { estado, descripcion } = interpretPaymentStatus(statusResponse.status);

      // Para actualizar, necesitamos el documento de Mongoose (no lean)
      const reserva = await Reserva.findById(reservaId);
      
      if (!reserva) {
        return NextResponse.json(
          { error: "Reserva no encontrada" },
          { status: 404 }
        );
      }

      if (statusResponse.value) {
        const reportedAmount = Number(statusResponse.value);
        if (Number.isFinite(reportedAmount) && reportedAmount !== Number(reserva.pagoMonto)) {
          await PaymentAudit.create({
            source: "payment-api",
            eventType: "amount_mismatch_on_status_poll",
            reservaId: reserva._id,
            transactionId: statusResponse.trnId || reserva.pagoId,
            statusCode: statusResponse.status,
            amount: reportedAmount,
            metadata: { expectedAmount: reserva.pagoMonto },
          });

          return NextResponse.json(
            { error: "Monto inconsistente reportado por la pasarela" },
            { status: 409 }
          );
        }
      }

      if (statusResponse.trnId && reserva.pagoId && statusResponse.trnId !== reserva.pagoId) {
        await PaymentAudit.create({
          source: "payment-api",
          eventType: "transaction_mismatch_on_status_poll",
          reservaId: reserva._id,
          transactionId: statusResponse.trnId,
          statusCode: statusResponse.status,
          metadata: { expectedTransactionId: reserva.pagoId },
        });

        return NextResponse.json(
          { error: "transactionId inconsistente reportado por la pasarela" },
          { status: 409 }
        );
      }

      // Actualizar reserva según el estado
      if (estado === 'aprobado' && reserva.pagoEstado !== 'aprobado') {
        reserva.pagoEstado = 'aprobado';
        reserva.pagoFecha = new Date();
        ensureMembershipFields(reserva, reserva.pagoFecha);
        await reserva.save();

        console.log(`✅ Pago confirmado para reserva ${reservaId}`);
      } else if (estado === 'rechazado' || estado === 'caducado') {
        reserva.pagoEstado = 'rechazado';
        await reserva.save();
      }

      return NextResponse.json({
        ok: true,
        pagoEstado: reserva.pagoEstado,
        estado: reserva.estado,
        nequiStatus: statusResponse.status,
        descripcion,
        trnId: statusResponse.trnId,
      });

    } catch (nequiError) {
      console.error('Error consultando estado en Nequi:', nequiError);
      return NextResponse.json(
        { error: "Error consultando estado del pago" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Error verificando pago:", error);
    return NextResponse.json(
      { error: "Error al verificar pago" },
      { status: 500 }
    );
  }
}

/**
 * Webhook para recibir notificaciones de Nequi (opcional)
 * Nequi puede enviarte notificaciones cuando cambie el estado del pago
 */
export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = await rateLimit({
      key: `payment-status-webhook:${ip}`,
      limit: 120,
      windowMs: 60 * 1000,
    });

    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes webhook" },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
      );
    }

    const rawBody = await req.text();
    const signature = req.headers.get("x-nequi-signature") || req.headers.get("x-signature");
    const timestamp =
      req.headers.get("x-nequi-timestamp") ||
      req.headers.get("x-timestamp") ||
      req.headers.get("x-webhook-timestamp");
    const eventId =
      req.headers.get("x-nequi-event-id") ||
      req.headers.get("x-event-id") ||
      req.headers.get("x-request-id") ||
      "";
    const secret = process.env.NEQUI_WEBHOOK_SECRET;
    const requireTimestamp = process.env.NEQUI_WEBHOOK_REQUIRE_TIMESTAMP !== "false";
    const maxAgeMs = Number(process.env.NEQUI_WEBHOOK_MAX_AGE_MS || "300000");

    if (!secret) {
      return NextResponse.json(
        { error: "NEQUI_WEBHOOK_SECRET no configurado" },
        { status: 500 }
      );
    }

    if (!signature) {
      return NextResponse.json({ error: "Firma requerida" }, { status: 401 });
    }

    if (requireTimestamp && !timestamp) {
      return NextResponse.json({ error: "Timestamp requerido" }, { status: 400 });
    }

    if (timestamp) {
      const ts = Number(timestamp);
      if (!Number.isFinite(ts)) {
        return NextResponse.json({ error: "Timestamp inválido" }, { status: 400 });
      }

      const drift = Math.abs(Date.now() - ts);
      if (drift > maxAgeMs) {
        return NextResponse.json({ error: "Webhook expirado" }, { status: 401 });
      }
    }

    const payloadToSign = timestamp ? `${timestamp}.${rawBody}` : rawBody;
    const expected = createHmac("sha256", secret).update(payloadToSign).digest("hex");
    const normalizedSig = signature.startsWith("sha256=") ? signature.slice(7) : signature;
    const isValidSignature =
      normalizedSig.length === expected.length &&
      timingSafeEqual(Buffer.from(normalizedSig), Buffer.from(expected));

    if (!isValidSignature) {
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    }

    const replayKey = createHash("sha256")
      .update(`${eventId}|${timestamp || ""}|${normalizedSig}`)
      .digest("hex");
    if (await isReplayRequest(replayKey, maxAgeMs)) {
      return NextResponse.json({ error: "Webhook duplicado/replay detectado" }, { status: 409 });
    }

    const body = JSON.parse(rawBody) as Record<string, unknown>;
    const reservaId =
      String(body.reservaId || body.reference1 || body.orderId || "").trim();
    const statusCode = String(body.status || body.nequiStatus || "").trim();
    const transactionId = String(body.transactionId || body.trnId || "").trim();

    if (!reservaId || !statusCode) {
      return NextResponse.json(
        { error: "Payload de webhook incompleto" },
        { status: 400 }
      );
    }

    await connectDB();
    const reserva = await Reserva.findById(reservaId);
    if (!reserva) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
    }

    if (transactionId && reserva.pagoId && transactionId !== reserva.pagoId) {
      return NextResponse.json(
        { error: "transactionId no corresponde con la reserva" },
        { status: 409 }
      );
    }

    const rawAmount = body.amount ?? body.value ?? body.paymentValue;
    const amount = Number(rawAmount);
    if (rawAmount !== undefined && Number.isFinite(amount) && amount !== Number(reserva.pagoMonto)) {
      await PaymentAudit.create({
        source: "nequi-webhook",
        eventType: "amount_mismatch",
        reservaId: reserva._id,
        transactionId: transactionId || reserva.pagoId,
        statusCode,
        amount,
        payloadHash: createHash("sha256").update(rawBody).digest("hex"),
        metadata: { expectedAmount: reserva.pagoMonto, eventId, ip },
      });

      return NextResponse.json({ error: "Monto inválido en webhook" }, { status: 409 });
    }

    const merchantFromBody = String(
      body.merchantCode || body.code || body.merchantId || ""
    ).trim();
    const expectedMerchant = String(process.env.NEQUI_MERCHANT_CODE || "").trim();
    if (merchantFromBody && expectedMerchant && merchantFromBody !== expectedMerchant) {
      await PaymentAudit.create({
        source: "nequi-webhook",
        eventType: "merchant_mismatch",
        reservaId: reserva._id,
        transactionId: transactionId || reserva.pagoId,
        statusCode,
        payloadHash: createHash("sha256").update(rawBody).digest("hex"),
        metadata: { merchantFromBody, expectedMerchant, eventId, ip },
      });

      return NextResponse.json({ error: "Comercio inválido en webhook" }, { status: 409 });
    }

    const { estado } = interpretPaymentStatus(statusCode);
    if (estado === "aprobado") {
      reserva.pagoEstado = "aprobado";
      reserva.pagoFecha = new Date();
      ensureMembershipFields(reserva, reserva.pagoFecha);
    } else if (estado === "rechazado" || estado === "caducado" || estado === "fallido") {
      reserva.pagoEstado = "rechazado";
    }

    if (transactionId) {
      reserva.pagoId = transactionId;
    }

    await reserva.save();

    await PaymentAudit.create({
      source: "nequi-webhook",
      eventType: "webhook_processed",
      reservaId: reserva._id,
      transactionId: transactionId || reserva.pagoId,
      statusCode,
      amount: Number.isFinite(amount) ? amount : undefined,
      payloadHash: createHash("sha256").update(rawBody).digest("hex"),
      metadata: { eventId, ip, timestamp },
    });

    return NextResponse.json({ ok: true, message: "Webhook procesado" });

  } catch (error) {
    console.error("Error procesando webhook:", error);
    return NextResponse.json(
      { error: "Error procesando webhook" },
      { status: 500 }
    );
  }
}
