import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultCategories = [
  { nombre: 'Servicios', icon: '💡' },
  { nombre: 'Educación', icon: '📚' },
  { nombre: 'Alimentación', icon: '🛒' },
  { nombre: 'Salud', icon: '🏥' },
  { nombre: 'Transporte', icon: '🚗' },
  { nombre: 'Ocio', icon: '🎬' },
  { nombre: 'Metas', icon: '🎯' },
];

async function main() {
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
  console.log('Seed de categorías completado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
