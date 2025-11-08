const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkThread() {
  try {
    const thread = await prisma.commentThread.findUnique({
      where: {
        id: 'cmhpyd1pn000js5shp4pdw2ey',
      },
      include: {
        comments: true,
      },
    });

    console.log('Thread data:');
    console.log(JSON.stringify(thread, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkThread();
