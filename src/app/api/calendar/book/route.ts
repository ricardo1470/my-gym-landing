// src/app/api/calendar/book/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Reserva from "@/models/Reserva";
import { sendReservaConfirmation, sendTrainerNotification } from "@/lib/mailer";
import { rateLimit } from "@/lib/rate-limit";

type ReservaNotificationData = {
  _id: string;
  clienteNombre: string;
  clienteEmail: string;
  clientePhone: string;
  planNombre: string;
  fechaHora: Date;
  duracion: number;
  pagoMonto: number;
};

// Función auxiliar para crear evento en Google Calendar (placeholder)
async function createGoogleCalendarEvent(reserva: ReservaNotificationData) {
  // TODO: Implementar integración real con Google Calendar API
  // Por ahora retornamos datos simulados

  const eventId = `event_${reserva._id}_${Date.now()}`;
  const calendarLink = `https://calendar.google.com/calendar/event?eid=${eventId}`;

  /* En producción usarías algo como:
  const { google } = require('googleapis');
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const event = {
    summary: `Sesión ${reserva.planNombre} - ${reserva.clienteNombre}`,
    description: `Cliente: ${reserva.clienteNombre}\nTeléfono: ${reserva.clientePhone}`,
    start: {
      dateTime: reserva.fechaHora.toISOString(),
      timeZone: 'America/Bogota',
    },
    end: {
      dateTime: new Date(reserva.fechaHora.getTime() + reserva.duracion * 60000).toISOString(),
      timeZone: 'America/Bogota',
    },
    attendees: [
      { email: reserva.clienteEmail },
      { email: process.env.TRAINER_EMAIL },
    ],
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
  });

  return {
    eventId: response.data.id,
    calendarLink: response.data.htmlLink,
  };
  */

  return { eventId, calendarLink };
}

// Función para generar mensaje de WhatsApp
function generateWhatsAppMessage(reserva: ReservaNotificationData, isTrainer: boolean = false) {
  const fecha = new Date(reserva.fechaHora);
  const fechaStr = fecha.toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const horaStr = fecha.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  if (isTrainer) {
    return `🔔 *NUEVA SESIÓN AGENDADA*\n\n` +
      `👤 Cliente: ${reserva.clienteNombre}\n` +
      `📱 Teléfono: ${reserva.clientePhone}\n` +
      `📧 Email: ${reserva.clienteEmail}\n` +
      `💪 Plan: ${reserva.planNombre}\n` +
      `📅 Fecha: ${fechaStr}\n` +
      `⏰ Hora: ${horaStr}\n` +
      `💰 Monto: $${reserva.pagoMonto.toLocaleString('es-CO')}\n` +
      `\n📋 ID Reserva: ${reserva._id}`;
  }

  return `✅ *RESERVA CONFIRMADA*\n\n` +
    `¡Hola ${reserva.clienteNombre}! 🎉\n\n` +
    `Tu sesión de ${reserva.planNombre} ha sido agendada:\n\n` +
    `📅 Fecha: ${fechaStr}\n` +
    `⏰ Hora: ${horaStr}\n` +
    `⏱️ Duración: ${reserva.duracion} minutos\n` +
    `💰 Monto pagado: $${reserva.pagoMonto.toLocaleString('es-CO')}\n\n` +
    `📋 Código de reserva: ${reserva._id}\n\n` +
    `Nos vemos pronto! 💪🔥`;
}

export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const rl = await rateLimit({
      key: `calendar-book:${ip}`,
      limit: 20,
      windowMs: 60 * 1000,
    });

    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes, intenta de nuevo en unos segundos." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
      );
    }

    const { reservaId, fechaHora, notas, paymentSessionToken } = await req.json();

    if (!reservaId || !fechaHora || !paymentSessionToken) {
      return NextResponse.json(
        { error: "reservaId, fechaHora y paymentSessionToken son requeridos" },
        { status: 400 }
      );
    }

    await connectDB();

    const reserva = await Reserva.findById(reservaId);

    if (!reserva) {
      return NextResponse.json(
        { error: "Reserva no encontrada" },
        { status: 404 }
      );
    }

    if (reserva.paymentSessionToken !== paymentSessionToken) {
      return NextResponse.json(
        { error: "No autorizado para agendar esta reserva" },
        { status: 403 }
      );
    }

    // Verificar que el pago esté aprobado
    if (reserva.pagoEstado !== 'aprobado') {
      return NextResponse.json(
        { error: "El pago debe estar aprobado antes de agendar" },
        { status: 400 }
      );
    }

    const fechaSeleccionada = new Date(fechaHora);

    // Verificar que la fecha no esté en el pasado
    if (fechaSeleccionada < new Date()) {
      return NextResponse.json(
        { error: "No puedes agendar en el pasado" },
        { status: 400 }
      );
    }

    // Verificar que el horario esté disponible
    const reservaExistente = await Reserva.findOne({
      fechaHora: fechaSeleccionada,
      estado: { $in: ['confirmada', 'pendiente'] },
      _id: { $ne: reservaId }
    });

    if (reservaExistente) {
      return NextResponse.json(
        { error: "Este horario ya no está disponible" },
        { status: 409 }
      );
    }

    // Actualizar la reserva
    reserva.fechaHora = fechaSeleccionada;
    reserva.estado = 'confirmada';
    if (notas) reserva.notas = notas;

    const reservaData: ReservaNotificationData = {
      _id: String(reserva._id),
      clienteNombre: reserva.clienteNombre,
      clienteEmail: reserva.clienteEmail,
      clientePhone: reserva.clientePhone,
      planNombre: reserva.planNombre,
      fechaHora: reserva.fechaHora,
      duracion: reserva.duracion,
      pagoMonto: reserva.pagoMonto,
    };

    // Crear evento en Google Calendar
    try {
      const { eventId, calendarLink } = await createGoogleCalendarEvent(reservaData);
      reserva.googleEventId = eventId;
      reserva.googleCalendarLink = calendarLink;
    } catch (calendarError) {
      console.error("Error creando evento en calendario:", calendarError);
      // Continuar aunque falle el calendario
    }

    await reserva.save();

    // Enviar notificaciones
    const notificaciones = {
      emailCliente: false,
      emailEntrenador: false,
      whatsappCliente: false,
      whatsappEntrenador: false,
    };

    // Enviar emails
    try {
      await sendReservaConfirmation(
        reserva.clienteNombre,
        reserva.clienteEmail,
        reserva.planNombre,
        fechaSeleccionada,
        reserva.pagoMonto
      );
      notificaciones.emailCliente = true;
    } catch (error) {
      console.error("Error enviando email al cliente:", error);
    }

    try {
      await sendTrainerNotification(reserva);
      notificaciones.emailEntrenador = true;
    } catch (error) {
      console.error("Error enviando email al entrenador:", error);
    }

    // Generar links de WhatsApp
    const mensajeCliente = generateWhatsAppMessage(reservaData, false);
    const mensajeEntrenador = generateWhatsAppMessage(reservaData, true);

    const whatsappClienteLink = `https://wa.me/57${reserva.clientePhone.replace(/\D/g, '')}?text=${encodeURIComponent(mensajeCliente)}`;
    const whatsappEntrenadorLink = `https://wa.me/573185228487?text=${encodeURIComponent(mensajeEntrenador)}`;

    // Marcar que las notificaciones de WhatsApp están listas
    notificaciones.whatsappCliente = true;
    notificaciones.whatsappEntrenador = true;

    reserva.notificacionesEnviadas = notificaciones;
    await reserva.save();

    return NextResponse.json({
      ok: true,
      message: "Sesión agendada exitosamente",
      reserva: {
        id: reserva._id,
        fechaHora: reserva.fechaHora,
        estado: reserva.estado,
        googleCalendarLink: reserva.googleCalendarLink,
      },
      notificaciones: {
        emailsEnviados: notificaciones.emailCliente && notificaciones.emailEntrenador,
        whatsappLinks: {
          cliente: whatsappClienteLink,
          entrenador: whatsappEntrenadorLink,
        }
      }
    });

  } catch (error) {
    console.error("Error agendando sesión:", error);
    return NextResponse.json(
      { error: "Error al agendar la sesión" },
      { status: 500 }
    );
  }
}
