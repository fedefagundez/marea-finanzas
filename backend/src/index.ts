import app from './app.js';
import { config } from './config/index.js';
import { prisma } from './lib/prisma.js';

async function main() {
  try {
    await prisma.$connect();
    console.log('Conexión a base de datos establecida');

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
