"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. Ambil data agregat stok berjalan saat ini (Total kumulatif, tidak terikat bulan)
export async function getStokSekarang() {
  try {
    const agregatMasuk = await db.stokBata.aggregate({
      _sum: { quantity: true },
      where: { tipe: "masuk" },
    });

    const agregatKeluar = await db.stokBata.aggregate({
      _sum: { quantity: true },
      where: { tipe: "keluar" },
    });

    const totalMasuk = agregatMasuk._sum.quantity || 0;
    const totalKeluar = agregatKeluar._sum.quantity || 0;

    return totalMasuk - totalKeluar;
  } catch (error) {
    console.error("Gagal menghitung stok saat ini:", error);
    return 0;
  }
}

// 2. Ambil list riwayat ledger stok berdasarkan filter bulan & tahun
export async function getLedgerStok(bulan: number, tahun: number) {
  try {
    const startDate = new Date(tahun, bulan - 1, 1);
    const endDate = new Date(tahun, bulan, 0, 23, 59, 59);

    const logs = await db.stokBata.findMany({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { created_at: "desc" },
    });

    return logs.map((log) => ({
      id: log.id,
      tanggal: log.created_at.toISOString().split("T")[0],
      tipe_referensi: log.tipe_referensi, // produksi / penjualan / penyesuaian
      tipe: log.tipe, // masuk / keluar
      quantity: log.quantity,
      stok_setelah: log.stok_setelah,
      keterangan: log.keterangan || "-",
    }));
  } catch (error) {
    console.error("Gagal mengambil log ledger stok:", error);
    return [];
  }
}

// 3. Simpan Koreksi / Adjustment Stok Manual dari Admin
export async function createStokAdjustment(formData: { tipe: "masuk" | "keluar"; quantity: number; keterangan: string; created_by: number }): Promise<{ success: boolean; error: string | null }> {
  try {
    // Ambil stok real terakhir saat ini
    const currentStock = await getStokSekarang();

    // Hitung proyeksi kalkulasi setelah dikoreksi
    const stokSetelah = formData.tipe === "masuk" ? currentStock + formData.quantity : currentStock - formData.quantity;

    if (stokSetelah < 0) {
      return { success: false, error: "Adjustment gagal! Hasil stok akhir tidak boleh minus." };
    }

    await db.stokBata.create({
      data: {
        tipe_referensi: "penyesuaian", // Flag penyesuaian manual sesuai PRD
        id_referensi: 0,
        tipe: formData.tipe,
        quantity: formData.quantity,
        stok_setelah: stokSetelah,
        keterangan: `[Adjustment Manual] ${formData.keterangan}`,
        created_by: formData.created_by,
      },
    });

    revalidatePath("/dashboard/stok");
    return { success: true, error: null };
  } catch (error: any) {
    console.error("Gagal melakukan adjustment stok:", error);
    return { success: false, error: error.message || "Gagal memproses penyesuaian stok." };
  }
}
