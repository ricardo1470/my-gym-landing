import nodemailer from "nodemailer";

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
  objetivo: string
) {
  try {
    const info = await transporter.sendMail({
      from: `"Entrenador Personal" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "¡Gracias por inscribirte a tu plan personalizado! 💪",
      text: `Hola ${nombre}, gracias por inscribirte. Tu objetivo "${objetivo}" ha sido registrado.
En menos de 24 horas nos pondremos en contacto contigo.`,
      html: `
        <h2>Hola ${nombre},</h2>
        <p>🎉 Gracias por confiar en nosotros. Hemos recibido tu inscripción con el objetivo:</p>
        <blockquote><strong>${objetivo}</strong></blockquote>
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
