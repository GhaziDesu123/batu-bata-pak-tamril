// prisma/seed.ts
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

  console.log("✅ Seed selesai: Akun admin default berhasil dibuat!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
