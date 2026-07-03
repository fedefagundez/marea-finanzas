import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

const hasSmtpConfig = Boolean(config.smtp.host && config.smtp.host !== 'smtp.example.com' && config.smtp.user);

let testAccount: nodemailer.TestAccount | null = null;
let testTransporter: nodemailer.Transporter | null = null;

async function getTestTransporter(): Promise<nodemailer.Transporter> {
  if (testTransporter) return testTransporter;

  testAccount = await nodemailer.createTestAccount();
  testTransporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  return testTransporter;
}

const prodTransporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    })
  : null;

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

  if (!prodTransporter) {
    const transporter = await getTestTransporter();
    const info = await transporter.sendMail({
      from: '"Marea" <no-reply@marea.app>',
      to,
      subject,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log('========================================');
    console.log('Modo desarrollo: email enviado a Ethereal');
    console.log('Para:', to);
    console.log('Link de recuperación:', resetUrl);
    console.log('Ver el email en:', previewUrl);
    console.log('========================================');
    return;
  }

  await prodTransporter.sendMail({
    from: `"Marea" <${config.smtp.user}>`,
    to,
    subject,
    html,
  });
}
