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

async function seedGlobalCategories() {
  const defaultCategories = [
    { nombre: 'Servicios', icon: '💡' },
    { nombre: 'Educación', icon: '📚' },
    { nombre: 'Alimentación', icon: '🛒' },
    { nombre: 'Salud', icon: '🏥' },
    { nombre: 'Transporte', icon: '🚗' },
    { nombre: 'Ocio', icon: '🎬' },
  ];

  for (const cat of defaultCategories) {
    const exists = await prisma.categoria.findFirst({
      where: { nombre: cat.nombre, hogarId: null, usuarioId: null },
    });
    if (!exists) {
      await prisma.categoria.create({
        data: { ...cat, hogarId: null, usuarioId: null },
      });
      console.log(`Categoría global creada: ${cat.nombre}`);
    }
  }
}

async function main() {
  try {
    await prisma.$connect();
    console.log('Conexión a base de datos establecida');

    await promoverAdmin();
    await seedGlobalCategories();

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
