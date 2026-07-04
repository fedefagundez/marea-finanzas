import app from './app.js';
import { config } from './config/index.js';
import { prisma } from './lib/prisma.js';

async function promoverAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const usuario = await prisma.usuario.findUnique({ where: { email: adminEmail } });
  if (usuario && usuario.rol !== 'ADMIN') {
    await prisma.usuario.update({
      where: { email: adminEmail },
      data: { rol: 'ADMIN' },
    });
    console.log(`Usuario ${adminEmail} promovido a administrador`);
  }
}

async function main() {
  try {
    await prisma.$connect();
    console.log('Conexión a base de datos establecida');

    await promoverAdmin();

    app.listen(config.port, () => {
      console.log(`Servidor corriendo en puerto ${config.port}`);
    });
  } catch (error) {
    console.error('Error al iniciar:', error);
    process.exit(1);
  }
}

main();

process.on('SIGTERM', () => {
  prisma.$disconnect();
  process.exit();
});

process.on('SIGINT', () => {
  prisma.$disconnect();
  process.exit();
});
