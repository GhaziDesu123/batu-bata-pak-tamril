"use server";

import db from "@/lib/prisma";

// 1. Data Produksi (approved only)
export async function getLaporanProduksi(bulan: number, tahun: number) {
  try {
    const startDate = new Date(tahun, bulan - 1, 1);
    const endDate = new Date(tahun, bulan, 0, 23, 59, 59);

    const data = await db.laporanProduksi.findMany({
      where: {
        status: "approved",
        tanggal_laporan: { gte: startDate, lte: endDate },
      },
      include: { karyawan: { select: { nama: true, upah_per_bata: true } } },
      orderBy: { tanggal_laporan: "desc" },
    });

    return data.map((item) => ({
      id: item.id,
      nama_karyawan: item.karyawan.nama,
      tanggal_laporan: item.tanggal_laporan.toISOString().split("T")[0],
      quantity: item.quantity,
      upah_per_bata: Number(item.karyawan.upah_per_bata),
      estimasi_upah: item.quantity * Number(item.karyawan.upah_per_bata),
    }));
  } catch (error) {
    console.error("Gagal ambil laporan produksi:", error);
    return [];
  }
}

// 2. Data Penjualan
export async function getLaporanPenjualan(bulan: number, tahun: number) {
  try {
    const startDate = new Date(tahun, bulan - 1, 1);
    const endDate = new Date(tahun, bulan, 0, 23, 59, 59);

    const data = await db.transaksiPenjualan.findMany({
      where: {
        tanggal_transaksi: { gte: startDate, lte: endDate },
      },
      orderBy: { tanggal_transaksi: "desc" },
    });

    return data.map((item) => ({
      id: item.id,
      tanggal_transaksi: item.tanggal_transaksi.toISOString().split("T")[0],
      nama_pembeli: item.nama_pembeli || "Pembeli Umum",
      quantity: item.quantity,
      harga_per_bata: Number(item.harga_per_bata),
      total: Number(item.total),
      notes: item.notes || "-",
    }));
  } catch (error) {
    console.error("Gagal ambil laporan penjualan:", error);
    return [];
  }
}

// 3. Data Pengeluaran
export async function getLaporanPengeluaran(bulan: number, tahun: number) {
  try {
    const startDate = new Date(tahun, bulan - 1, 1);
    const endDate = new Date(tahun, bulan, 0, 23, 59, 59);

    const data = await db.pengeluaran.findMany({
      where: {
        tanggal_pengeluaran: { gte: startDate, lte: endDate },
      },
      orderBy: { tanggal_pengeluaran: "desc" },
    });

    return data.map((item) => ({
      id: item.id,
      tanggal_pengeluaran: item.tanggal_pengeluaran.toISOString().split("T")[0],
      kategori: item.kategori,
      deskripsi: item.deskripsi,
      total: Number(item.total),
    }));
  } catch (error) {
    console.error("Gagal ambil laporan pengeluaran:", error);
    return [];
  }
}

// 4. Data Laba Bersih
export async function getLaporanLabaBersih(bulan: number, tahun: number) {
  try {
    const startDate = new Date(tahun, bulan - 1, 1);
    const endDate = new Date(tahun, bulan, 0, 23, 59, 59);

    const [penjualan, pengeluaran, gaji] = await Promise.all([
      db.transaksiPenjualan.aggregate({
        _sum: { total: true },
        where: { tanggal_transaksi: { gte: startDate, lte: endDate } },
      }),
      db.pengeluaran.aggregate({
        _sum: { total: true },
        where: { tanggal_pengeluaran: { gte: startDate, lte: endDate } },
      }),
      db.gaji.aggregate({
        _sum: { total_gaji: true },
        where: { bulan, tahun, status_pembayaran: "paid" },
      }),
    ]);

    const totalPenjualan = Number(penjualan._sum.total || 0);
    const totalPengeluaran = Number(pengeluaran._sum.total || 0);
    const totalGaji = Number(gaji._sum.total_gaji || 0);
    const totalBiaya = totalPengeluaran + totalGaji;
    const labaBersih = totalPenjualan - totalBiaya;

    return { totalPenjualan, totalPengeluaran, totalGaji, totalBiaya, labaBersih };
  } catch (error) {
    console.error("Gagal ambil laba bersih:", error);
    return { totalPenjualan: 0, totalPengeluaran: 0, totalGaji: 0, totalBiaya: 0, labaBersih: 0 };
  }
}

// 5. Data Gaji
export async function getLaporanGaji(bulan: number, tahun: number) {
  try {
    const data = await db.gaji.findMany({
      where: { bulan, tahun },
      include: { karyawan: { select: { nama: true } } },
      orderBy: { karyawan: { nama: "asc" } },
    });

    return data.map((item) => ({
      id: item.id,
      nama_karyawan: item.karyawan.nama,
      total_produksi: item.total_produksi,
      upah_per_bata: Number(item.upah_per_bata),
      total_gaji: Number(item.total_gaji),
      status_pembayaran: item.status_pembayaran,
      tanggal_pembayaran: item.tanggal_pembayaran ? item.tanggal_pembayaran.toISOString().split("T")[0] : null,
    }));
  } catch (error) {
    console.error("Gagal ambil laporan gaji:", error);
    return [];
  }
}
