// app/api/karyawan/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

// ==========================================
// 1. GET: Ambil semua data list karyawan
// ==========================================
export async function GET() {
  try {
    // Mengambil semua data dari tabel karyawan, diurutkan berdasarkan ID paling awal
    const listKaryawan = await prisma.karyawan.findMany({
      orderBy: {
        id: "asc",
      },
    });

    return NextResponse.json(listKaryawan, { status: 200 });
  } catch (error: any) {
    console.error("GET Karyawan Error:", error);
    return NextResponse.json({ message: "Terjadi kesalahan saat mengambil data karyawan", error: error.message }, { status: 500 });
  }
}

// ==========================================
// 2. POST: Pendaftaran Karyawan Baru
// ==========================================
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nama, tlp, alamat, upah_per_bata } = body;

    // 1. Validasi data utama
    if (!nama || !upah_per_bata) {
      return NextResponse.json({ message: "Nama dan Upah per bata wajib diisi!" }, { status: 400 });
    }

    // 2. Generate Username dari nama pertama (di-lowercase)
    const namaPertama = nama.trim().split(/\s+/)[0].toLowerCase();
    let username = namaPertama;

    // Antisipasi jika ada nama pertama yang sama di database
    const userSama = await prisma.users.findUnique({ where: { username } });
    if (userSama) {
      const angkaTambahan = Math.floor(10 + Math.random() * 90);
      username = `${namaPertama}${angkaTambahan}`;
    }

    // 3. Generate Password: username + 3 angka random
    const tigaAngkaRandom = Math.floor(100 + Math.random() * 900);
    const passwordPlain = `${username}${tigaAngkaRandom}`;

    // 4. Hash password untuk disimpan ke database
    const hashedPassword = await bcrypt.hash(passwordPlain, 10);

    // 5. Jalankan transaksi database
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.users.create({
        data: {
          nama,
          username,
          password: hashedPassword,
          role: "karyawan",
        },
      });

      const karyawanBaru = await tx.karyawan.create({
        data: {
          nama,
          tlp: tlp || null,
          alamat: alamat || null,
          upah_per_bata: new Prisma.Decimal(upah_per_bata), // Match dengan tipe data Decimal di schema
          status: "active",
        },
      });

      return karyawanBaru;
    });

    // 6. Return data sukses BESERTA username & password plain-text nya
    return NextResponse.json(
      {
        message: "Karyawan berhasil didaftarkan!",
        data: {
          id: result.id,
          nama: result.nama,
          username: username,
          passwordAkun: passwordPlain,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST Karyawan Error:", error);
    return NextResponse.json({ message: "Terjadi kesalahan server", error: error.message }, { status: 500 });
  }
}
