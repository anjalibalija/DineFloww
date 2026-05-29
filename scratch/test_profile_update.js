const prisma = require('../backend/prisma/client');

async function testUpdate() {
  try {
    // Find first user
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('No user found in database!');
      process.exit(1);
    }
    console.log('Found user:', user.email);
    console.log('Current profilePicture length:', user.profilePicture ? user.profilePicture.length : 0);

    const testBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { profilePicture: testBase64 }
    });

    console.log('Updated user profilePicture length:', updated.profilePicture.length);
    console.log('Success!');
  } catch (error) {
    console.error('Error during update:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

testUpdate();
