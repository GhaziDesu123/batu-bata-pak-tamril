"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. Ambil semua list pengeluaran berdasarkan filter bulan & tahun
export async function getPengeluaran(bulan: number, tahun: number) {
  try {
    const startDate = new Date(tahun, bulan - 1, 1);
    const endDate = new Date(tahun, bulan, 0, 23, 59, 59);

    const data = await db.pengeluaran.findMany({
      where: {
        tanggal_pengeluaran: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { tanggal_pengeluaran: "desc" },
    });

    return data.map((item) => ({
      id: item.id,
      tanggal_pengeluaran: item.tanggal_pengeluaran.toISOString().split("T")[0],
      kategori: item.kategori,
      deskripsi: item.deskripsi,
      total: Number(item.total), // Konversi Decimal ke number
    }));
  } catch (error) {
    console.error("Gagal mengambil data pengeluaran:", error);
    return [];
  }
}

// 2. Simpan Catatan Pengeluaran Baru
export async function createPengeluaran(formData: { tanggal_pengeluaran: string; kategori: string; deskripsi: string; total: number; created_by: number }): Promise<{ success: boolean; error: string | null }> {
  try {
    await db.pengeluaran.create({
      data: {
        tanggal_pengeluaran: new Date(formData.tanggal_pengeluaran),
        kategori: formData.kategori,
        deskripsi: formData.deskripsi,
        total: formData.total,
        created_by: formData.created_by,
      },
    });

    revalidatePath("/dashboard/pengeluaran");
    revalidatePath("/dashboard"); // Revalidate dashboard agar ringkasan laba bersih ter-update
    return { success: true, error: null };
  } catch (error: any) {
    console.error("Gagal menyimpan pengeluaran:", error);
    return { success: false, error: error.message || "Gagal menyimpan data." };
  }
}

// 3. Hapus Catatan Pengeluaran
export async function deletePengeluaran(id: number): Promise<{ success: boolean; error: string | null }> {
  try {
    await db.pengeluaran.delete({
      where: { id },
    });

    revalidatePath("/dashboard/pengeluaran");
    revalidatePath("/dashboard");
    return { success: true, error: null };
  } catch (error: any) {
    console.error("Gagal menghapus pengeluaran:", error);
    return { success: false, error: error.message || "Gagal menghapus data." };
  }
}
