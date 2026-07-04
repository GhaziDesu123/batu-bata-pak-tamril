"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. READ: Ambil data transaksi penjualan berdasarkan bulan dan tahun
export async function getTransaksiPenjualan(bulan: number, tahun: number) {
  try {
    const startDate = new Date(tahun, bulan - 1, 1);
    const endDate = new Date(tahun, bulan, 0, 23, 59, 59);

    const data = await db.transaksiPenjualan.findMany({
      where: {
        tanggal_transaksi: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { tanggal_transaksi: "desc" },
    });

    return data.map((item) => ({
      id: item.id,
      created_by: item.created_by,
      tanggal_transaksi: item.tanggal_transaksi.toISOString().split("T")[0],
      quantity: item.quantity,
      harga_per_bata: Number(item.harga_per_bata),
      total: Number(item.total),
      nama_pembeli: item.nama_pembeli || "",
      notes: item.notes || "",
      created_at: item.created_at.toISOString(),
    }));
  } catch (error) {
    console.error("Gagal mengambil data transaksi penjualan:", error);
    throw new Error("Gagal load data penjualan.");
  }
}

// 2. CREATE: Simpan transaksi penjualan + Potong Stok
export async function createTransaksiPenjualan(formData: { tanggal_transaksi: string; nama_pembeli?: string; quantity: number; harga_per_bata: number; notes?: string; created_by: number }) {
  try {
    const totalHarga = formData.quantity * formData.harga_per_bata;

    // LANGKAH OPTIMASI 1: Hitung stok di luar blok transaction untuk mencegah DB deadlock/timeout
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
    const currentStock = totalMasuk - totalKeluar;

    // Validasi ketersediaan stok awal
    if (currentStock < formData.quantity) {
      return {
        success: false,
        error: `Stok tidak mencukupi! Stok saat ini: ${currentStock.toLocaleString("id-ID")} pcs, permintaan: ${formData.quantity.toLocaleString("id-ID")} pcs.`,
      };
    }

    // LANGKAH OPTIMASI 2: Jalankan proses tulis data secara atomik dengan handling timeout yang longgar
    await db.$transaction(
      async (tx) => {
        // Buat record penjualan
        const transaksi = await tx.transaksiPenjualan.create({
          data: {
            created_by: formData.created_by,
            tanggal_transaksi: new Date(formData.tanggal_transaksi),
            quantity: formData.quantity,
            harga_per_bata: formData.harga_per_bata,
            total: totalHarga,
            nama_pembeli: formData.nama_pembeli || null,
            notes: formData.notes || null,
          },
        });

        // Buat potongan ledger di tabel stok_bata
        // Note: Pastikan "penjualan" ditulis huruf kecil/besar sesuai aturan Enum di schema.prisma milik lu
        await tx.stokBata.create({
          data: {
            tipe_referensi: "penjualan",
            id_referensi: transaksi.id,
            tipe: "keluar",
            quantity: formData.quantity,
            stok_setelah: currentStock - formData.quantity,
            keterangan: `Penjualan kepada ${formData.nama_pembeli || "Pembeli Umum"}`,
            created_by: formData.created_by,
          },
        });
      },
      {
        maxWait: 8000, // Waktu tunggu antrean koneksi dinaikkan ke 8 detik
        timeout: 15000, // Waktu eksekusi transaksi dinaikkan ke 15 detik
      }
    );

    revalidatePath("/dashboard/penjualan");
    return { success: true, error: null };
  } catch (error: any) {
    console.error("Gagal mencatat transaksi penjualan di Server:", error);
    return {
      success: false,
      error: error.message || "Gagal menyimpan transaksi penjualan akibat gangguan database.",
    };
  }
}
