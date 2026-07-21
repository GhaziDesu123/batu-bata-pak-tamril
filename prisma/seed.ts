import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  await prisma.users.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      nama: "Administrator",
      username: "admin",
      password: hashedPassword,
      role: "pemilik",
    },
  });

  // Tambah akun admin baru
  const hashedPassword2 = await bcrypt.hash("password123", 10);
  await prisma.users.upsert({
    where: { username: "admin2" },
    update: {},
    create: {
      nama: "Admin Dua",
      username: "admin2",
      password: hashedPassword2,
      role: "pemilik",
    },
  });

  console.log("✅ Seed selesai!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
