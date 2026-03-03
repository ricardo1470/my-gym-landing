// src/lib/mailer.ts (EXTENDIDO)
import nodemailer from "nodemailer";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;
const TRAINER_EMAIL = process.env.TRAINER_EMAIL || process.env.GMAIL_USER;

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

type TrainerNotificationReserva = {
  _id: { toString: () => string } | string;
  clienteNombre: string;
  clienteEmail: string;
  clientePhone: string;
  planNombre: string;
  fechaHora: Date;
  duracion: number;
  pagoMonto: number;
  notas?: string;
};

export async function sendConfirmationMail(
  nombre: string,
  email: string,
  planId: string
) {
  try {
    const info = await transporter.sendMail({
      from: `"Entrenador Personal" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "¡Gracias por inscribirte a tu plan personalizado! 💪",
      text: `Hola ${nombre}, gracias por inscribirte. El plan "${planId}" ha sido registrado.
En menos de 24 horas nos pondremos en contacto contigo.`,
      html: `
        <h2>Hola ${nombre},</h2>
        <p>🎉 Gracias por confiar en nosotros. Hemos recibido tu inscripción con el plan:</p>
        <blockquote><strong>Plan ${planId.toUpperCase()}</strong></blockquote>
        <p>Nos pondremos en contacto contigo en menos de 24 horas.</p>
        <p>💪 ¡Vamos a comenzar tu transformación!</p>
      `,
    });

    console.log("📧 Correo enviado con éxito:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error enviando correo:", error);
    throw error;
  }
}

export async function sendAdminNotification(
  nombre: string,
  email: string,
  phone: string,
  planId: string
) {
  if (!ADMIN_EMAIL) {
    console.warn("ADMIN_EMAIL no está configurado.");
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Notificaciones LeadForm" <${process.env.GMAIL_USER}>`,
      to: ADMIN_EMAIL,
      subject: `🚨 ¡NUEVO LEAD! - ${nombre} se inscribió al plan ${planId.toUpperCase()}`,
      html: `
        <h2>Detalles de la Nueva Inscripción:</h2>
        <p><strong>El cliente ya recibió su correo de confirmación.</strong></p>
        <ul>
          <li><strong>Nombre:</strong> ${nombre}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Teléfono:</strong> ${phone}</li>
          <li><strong>Plan Seleccionado:</strong> ${planId.toUpperCase()}</li>
        </ul>
        <p>Fecha/Hora (UTC): ${new Date().toISOString()}</p>
      `,
    });
    console.log("📧 Notificación a Admin enviada:", ADMIN_EMAIL);
    return info;
  } catch (error) {
    console.error("❌ Error enviando notificación a Admin:", error);
  }
}

// NUEVAS FUNCIONES PARA RESERVAS

export async function sendReservaConfirmation(
  nombre: string,
  email: string,
  planNombre: string,
  fechaHora: Date,
  monto: number
) {
  try {
    const fechaStr = fechaHora.toLocaleDateString('es-CO', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const horaStr = fechaHora.toLocaleTimeString('es-CO', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });

    const info = await transporter.sendMail({
      from: `"Tribu Team" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "✅ Tu sesión ha sido confirmada - Tribu Team",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-box { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .emoji { font-size: 24px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Sesión Confirmada</h1>
            </div>
            <div class="content">
              <p>¡Hola <strong>${nombre}</strong>! 🎉</p>
              
              <p>Tu sesión de <strong>${planNombre}</strong> ha sido agendada exitosamente.</p>
              
              <div class="info-box">
                <p><strong>📅 Fecha:</strong> ${fechaStr}</p>
                <p><strong>⏰ Hora:</strong> ${horaStr}</p>
                <p><strong>⏱️ Duración:</strong> 60 minutos</p>
                <p><strong>💰 Monto pagado:</strong> $${monto.toLocaleString('es-CO')} COP</p>
              </div>
              
              <h3>📋 Instrucciones importantes:</h3>
              <ul>
                <li>Llega 5 minutos antes de tu sesión</li>
                <li>Usa ropa cómoda y deportiva</li>
                <li>Trae una botella de agua</li>
                <li>Si necesitas reagendar, avísanos con 24h de anticipación</li>
              </ul>
              
              <p>Si tienes alguna pregunta, contáctanos por WhatsApp: <strong>+57 318 522 8487</strong></p>
              
              <p>¡Nos vemos pronto! 💪🔥</p>
              
              <div class="footer">
                <p>Tribu Team - Tu transformación comienza aquí</p>
                <p>Cali, Colombia</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("📧 Confirmación de reserva enviada al cliente:", email);
    return info;
  } catch (error) {
    console.error("❌ Error enviando confirmación de reserva:", error);
    throw error;
  }
}

export async function sendTrainerNotification(reserva: TrainerNotificationReserva) {
  if (!TRAINER_EMAIL) {
    console.warn("TRAINER_EMAIL no está configurado.");
    return;
  }

  try {
    const fechaStr = new Date(reserva.fechaHora).toLocaleDateString('es-CO', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const horaStr = new Date(reserva.fechaHora).toLocaleTimeString('es-CO', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });

    const info = await transporter.sendMail({
      from: `"Sistema Tribu Team" <${process.env.GMAIL_USER}>`,
      to: TRAINER_EMAIL,
      subject: `🔔 Nueva Sesión: ${reserva.clienteNombre} - ${fechaStr}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a1a1a; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; }
            .client-info { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #4CAF50; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🔔 Nueva Sesión Agendada</h2>
            </div>
            <div class="content">
              <div class="client-info">
                <h3>Información del Cliente</h3>
                <p><strong>Nombre:</strong> ${reserva.clienteNombre}</p>
                <p><strong>Email:</strong> ${reserva.clienteEmail}</p>
                <p><strong>Teléfono:</strong> ${reserva.clientePhone}</p>
                <p><strong>Plan:</strong> ${reserva.planNombre}</p>
              </div>
              
              <div class="client-info">
                <h3>Detalles de la Sesión</h3>
                <p><strong>📅 Fecha:</strong> ${fechaStr}</p>
                <p><strong>⏰ Hora:</strong> ${horaStr}</p>
                <p><strong>⏱️ Duración:</strong> ${reserva.duracion} minutos</p>
                <p><strong>💰 Monto:</strong> $${reserva.pagoMonto.toLocaleString('es-CO')} COP</p>
                <p><strong>📋 ID Reserva:</strong> ${reserva._id}</p>
              </div>
              
              ${reserva.notas ? `
              <div class="client-info">
                <h3>Notas del Cliente</h3>
                <p>${reserva.notas}</p>
              </div>
              ` : ''}
              
              <p><strong>El cliente ya recibió su confirmación por email.</strong></p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("📧 Notificación al entrenador enviada:", TRAINER_EMAIL);
    return info;
  } catch (error) {
    console.error("❌ Error enviando notificación al entrenador:", error);
  }
}

export async function sendMembershipRenewalReminder(params: {
  nombre: string;
  email: string;
  planNombre: string;
  membershipEndDate: Date;
  renewalType: "due_soon" | "expired";
  discountPercentage?: number;
  discountCuposDisponibles?: number;
}) {
  const {
    nombre,
    email,
    planNombre,
    membershipEndDate,
    renewalType,
    discountPercentage = 0,
    discountCuposDisponibles = 0,
  } = params;

  const fechaFin = membershipEndDate.toLocaleDateString("es-CO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const hasOffer = discountPercentage > 0 && discountCuposDisponibles > 0;
  const subject =
    renewalType === "due_soon"
      ? `⏰ Tu plan ${planNombre} vence pronto`
      : `🚀 Reactiva tu plan ${planNombre}`;

  const intro =
    renewalType === "due_soon"
      ? `Tu membresía vence el <strong>${fechaFin}</strong>.`
      : `Tu membresía venció el <strong>${fechaFin}</strong>.`;

  const offerBlock = hasOffer
    ? `
      <div style="background:#ecfdf5;border-left:4px solid #10b981;padding:12px;margin:16px 0;">
        <p style="margin:0;"><strong>Oferta activa:</strong> ${discountPercentage}% OFF</p>
        <p style="margin:0;">Cupos disponibles: ${discountCuposDisponibles}</p>
      </div>
    `
    : "";

  const info = await transporter.sendMail({
    from: `"Tribu Team" <${process.env.GMAIL_USER}>`,
    to: email,
    subject,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;">
        <h2>Hola ${nombre},</h2>
        <p>${intro}</p>
        <p>Renueva ahora para mantener continuidad en tu progreso.</p>
        ${offerBlock}
        <p>Responde este correo o contáctanos por WhatsApp para renovar hoy mismo.</p>
        <p><strong>Tribu Team</strong></p>
      </div>
    `,
  });

  console.log("📧 Recordatorio de renovación enviado:", info.messageId, email);
  return info;
}
