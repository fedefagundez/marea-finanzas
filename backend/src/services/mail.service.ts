import { Resend } from 'resend';
import { config } from '../config/index.js';

const resend = config.resend.apiKey ? new Resend(config.resend.apiKey) : null;

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const subject = 'Recuperación de contraseña - Marea';
  const html = `
    <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; color: #0B2530;">
      <h2 style="color: #0891B2;">Recuperá tu contraseña</h2>
      <p>Hiciste una solicitud para restablecer tu contraseña en <strong>Marea</strong>.</p>
      <p>Hacé clic en el siguiente botón para continuar. El enlace expira en 1 hora.</p>
      <a href="${resetUrl}" style="display: inline-block; background: #06B6D4; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 12px 0;">Restablecer contraseña</a>
      <p style="font-size: 13px; color: #64828A;">Si no solicitaste este cambio, podés ignorar este correo.</p>
      <p style="font-size: 12px; color: #94AEB5; word-break: break-all;">Si el botón no funciona, copiá y pegá este enlace en tu navegador:<br>${resetUrl}</p>
    </div>
  `;

  console.log('========================================');
  console.log('Link de recuperación para', to, ':', resetUrl);
  console.log('========================================');

  if (!resend) return;

  const { error } = await resend.emails.send({
    from: 'Marea <onboarding@resend.dev>',
    to,
    subject,
    html,
  });

  if (error) {
    console.error('Error al enviar email con Resend:', JSON.stringify(error, null, 2));
    throw new Error('No se pudo enviar el email de recuperación');
  }
}
