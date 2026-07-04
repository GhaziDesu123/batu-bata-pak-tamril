// app/dashboard/karyawan/action.ts
"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs"; // Pastikan import bcryptjs

// 1. READ: Ambil semua data karyawan
export async function getKaryawan() {
  try {
    return await db.karyawan.findMany({
      orderBy: { created_at: "desc" },
    });
  } catch (error) {
    console.error("Gagal mengambil data karyawan:", error);
    throw new Error("Gagal load data karyawan dari database.");
  }
}

// 2. CREATE: Tambah karyawan baru + Auto-generate Akun Login
export async function createKaryawan(formData: { nama: string; tlp?: string; alamat?: string; upah_per_bata: number }) {
  try {
    // A. Ambil kata pertama dari nama, lowercase-kan untuk username
    const namaPertama = formData.nama.trim().split(/\s+/)[0].toLowerCase();
    let username = namaPertama;

    // Antisipasi jika ada username kembar di tabel users
    const existingUser = await db.users.findUnique({ where: { username } });
    if (existingUser) {
      const angkaAcakDuaDigit = Math.floor(10 + Math.random() * 90);
      username = `${namaPertama}${angkaAcakDuaDigit}`;
    }

    // B. Buat password: username + 3 angka random (100 - 999)
    const tigaAngkaRandom = Math.floor(100 + Math.random() * 900);
    const passwordPlain = `${username}${tigaAngkaRandom}`; // Teks biasa untuk dikirim ke client

    // C. Hash password untuk disimpan ke database secara aman
    const hashedPassword = await bcrypt.hash(passwordPlain, 10);

    // D. Jalankan Prisma Transaction (kedua tabel harus sukses masuk)
    await db.$transaction(async (tx) => {
      // 1. Daftarkan akun login ke tabel users
      await tx.users.create({
        data: {
          nama: formData.nama,
          username: username,
          password: hashedPassword,
          role: "karyawan", // set default role
        },
      });

      // 2. Daftarkan data operasional ke tabel karyawan
      await tx.karyawan.create({
        data: {
          nama: formData.nama,
          tlp: formData.tlp || null,
          alamat: formData.alamat || null,
          upah_per_bata: formData.upah_per_bata,
          status: "active",
        },
      });
    });

    revalidatePath("/dashboard/karyawan");

    // Kembalikan status sukses BESERTA data akun mentah agar bisa di-copy admin via SweetAlert
    return {
      success: true,
      account: {
        username,
        passwordPlain,
      },
    };
  } catch (error) {
    console.error("Gagal menambah karyawan:", error);
    return { success: false, error: "Gagal menambahkan data karyawan dan akun." };
  }
}

// 3. UPDATE: Edit data karyawan
export async function updateKaryawan(
  id: number,
  formData: {
    nama: string;
    tlp?: string;
    alamat?: string;
    upah_per_bata: number;
    status: "active" | "inactive";
  }
) {
  try {
    await db.karyawan.update({
      where: { id },
      data: formData,
    });

    revalidatePath("/dashboard/karyawan");
    return { success: true };
  } catch (error) {
    console.error("Gagal mengupdate karyawan:", error);
    return { success: false, error: "Gagal memperbarui data karyawan." };
  }
}

// 4. DELETE (Hard Delete)
export async function deleteKaryawan(id: number) {
  try {
    await db.karyawan.delete({
      where: { id },
    });
    revalidatePath("/dashboard/karyawan");
    return { success: true };
  } catch (error) {
    console.error("Gagal menghapus karyawan:", error);
    return { success: false, error: "Gagal menghapus data. Karyawan mungkin sudah memiliki relasi data produksi." };
  }
}
