"use server";

import db from "@/lib/prisma";

export async function getDashboardData(bulan: number, tahun: number) {
  try {
    const startDate = new Date(tahun, bulan - 1, 1);
    const endDate = new Date(tahun, bulan, 0, 23, 59, 59);

    const [totalProduksi, totalPenjualan, totalPengeluaran, stokMasuk, stokKeluar, laporanPending, karyawanAktif, gajiUnpaid, produksiPerHari, penjualanPerHari] = await Promise.all([
      // Total produksi approved bulan ini
      db.laporanProduksi.aggregate({
        _sum: { quantity: true },
        where: { status: "approved", tanggal_laporan: { gte: startDate, lte: endDate } },
      }),
      // Total penjualan bulan ini
      db.transaksiPenjualan.aggregate({
        _sum: { total: true },
        where: { tanggal_transaksi: { gte: startDate, lte: endDate } },
      }),
      // Total pengeluaran bulan ini
      db.pengeluaran.aggregate({
        _sum: { total: true },
        where: { tanggal_pengeluaran: { gte: startDate, lte: endDate } },
      }),
      // Stok masuk
      db.stokBata.aggregate({
        _sum: { quantity: true },
        where: { tipe: "masuk" },
      }),
      // Stok keluar
      db.stokBata.aggregate({
        _sum: { quantity: true },
        where: { tipe: "keluar" },
      }),
      // Laporan pending (butuh verifikasi)
      db.laporanProduksi.count({
        where: { status: "pending" },
      }),
      // Karyawan aktif
      db.karyawan.count({
        where: { status: "active" },
      }),
      // Gaji belum dibayar bulan ini
      db.gaji.aggregate({
        _sum: { total_gaji: true },
        where: { bulan, tahun, status_pembayaran: "unpaid" },
      }),
      // Produksi per hari bulan ini (untuk chart)
      db.laporanProduksi.groupBy({
        by: ["tanggal_laporan"],
        _sum: { quantity: true },
        where: { status: "approved", tanggal_laporan: { gte: startDate, lte: endDate } },
        orderBy: { tanggal_laporan: "asc" },
      }),
      // Penjualan per hari bulan ini (untuk chart)
      db.transaksiPenjualan.groupBy({
        by: ["tanggal_transaksi"],
        _sum: { total: true },
        where: { tanggal_transaksi: { gte: startDate, lte: endDate } },
        orderBy: { tanggal_transaksi: "asc" },
      }),
    ]);

    const stokSekarang = (stokMasuk._sum.quantity || 0) - (stokKeluar._sum.quantity || 0);
    const totalPenjualanNum = Number(totalPenjualan._sum.total || 0);
    const totalPengeluaranNum = Number(totalPengeluaran._sum.total || 0);

    // Merge chart data produksi & penjualan per hari
    const chartMap: Record<string, { tanggal: string; produksi: number; penjualan: number }> = {};

    produksiPerHari.forEach((item) => {
      const key = item.tanggal_laporan.toISOString().split("T")[0];
      const label = key.slice(8); // ambil tanggal saja (DD)
      if (!chartMap[key]) chartMap[key] = { tanggal: label, produksi: 0, penjualan: 0 };
      chartMap[key].produksi = item._sum.quantity || 0;
    });

    penjualanPerHari.forEach((item) => {
      const key = item.tanggal_transaksi.toISOString().split("T")[0];
      const label = key.slice(8);
      if (!chartMap[key]) chartMap[key] = { tanggal: label, produksi: 0, penjualan: 0 };
      chartMap[key].penjualan = Number(item._sum.total || 0);
    });

    const chartData = Object.values(chartMap).sort((a, b) => a.tanggal.localeCompare(b.tanggal));

    // 5 laporan pending terbaru
    const laporanPendingList = await db.laporanProduksi.findMany({
      where: { status: "pending" },
      include: { karyawan: { select: { nama: true } } },
      orderBy: { created_at: "desc" },
      take: 5,
    });

    return {
      totalProduksi: totalProduksi._sum.quantity || 0,
      totalPenjualan: totalPenjualanNum,
      totalPengeluaran: totalPengeluaranNum,
      labaBersih: totalPenjualanNum - totalPengeluaranNum,
      stokSekarang,
      laporanPending,
      karyawanAktif,
      gajiUnpaid: Number(gajiUnpaid._sum.total_gaji || 0),
      chartData,
      laporanPendingList: laporanPendingList.map((l) => ({
        id: l.id,
        nama_karyawan: l.karyawan.nama,
        tanggal: l.tanggal_laporan.toISOString().split("T")[0],
        quantity: l.quantity,
      })),
    };
  } catch (error) {
    console.error("Gagal ambil data dashboard:", error);
    return null;
  }
}
