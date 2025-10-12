import nodemailer from "nodemailer";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS, // contraseña de aplicación en Gmail
  },
});

export async function sendConfirmationMail(
  nombre: string,
  email: string,
  planId: string
) {
  try {
        const info = await transporter.sendMail({
            from: `"Entrenador Personal" <${process.env.GMAIL_USER}>`,
            to: email, // Solo al cliente que se inscribe
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

    console.log("📧 Correo enviado con éxito:");
    console.log("MessageId:", info.messageId);
    console.log("Response:", info.response);
    console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
    console.log("Full info:", info);

    return info;
  } catch (error) {
    console.error("❌ Error enviando correo:", error);
    throw error;
  }
}

export async function sendAdminNotification(
    nombre: string,
    email: string,
    phone: string, // Agregamos el teléfono para la notificación
    planId: string
) {
    if (!ADMIN_EMAIL) {
        console.warn("ADMIN_EMAIL no está configurado. No se envió la notificación al administrador.");
        return;
    }

    try {
        const info = await transporter.sendMail({
            from: `"Notificaciones LeadForm" <${process.env.GMAIL_USER}>`,
            to: ADMIN_EMAIL, // Envía a tu correo (GMAIL_USER)
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
        console.log("📧 Correo de notificación a Admin enviado con éxito a:", ADMIN_EMAIL);
        return info;
    } catch (error) {
        console.error("❌ Error enviando correo de notificación a Admin:", error);
        // No lanzamos error aquí, ya que el correo del cliente fue enviado
    }
}
