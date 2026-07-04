import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import KaryawanHomeClient from "./KaryawanHomeClient";

export default async function KaryawanHomePage() {
  const session = await getServerSession(authOptions);
  const namaUser = session?.user?.name || "Staf";

  const karyawan = await prisma.karyawan.findFirst({ where: { nama: namaUser } });

  let laporanBulanIni: any[] = [];

  if (karyawan) {
    const now = new Date();
    const awalBulan = new Date(now.getFullYear(), now.getMonth(), 1);
    const akhirBulan = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    laporanBulanIni = await prisma.laporanProduksi.findMany({
      where: {
        id_karyawan: karyawan.id,
        tanggal_laporan: { gte: awalBulan, lte: akhirBulan },
      },
      orderBy: { created_at: "desc" },
    });
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const todayTotal = laporanBulanIni.filter((l) => l.tanggal_laporan.toISOString().split("T")[0] === todayStr).reduce((sum, l) => sum + l.quantity, 0);
  const monthTotal = laporanBulanIni.reduce((sum, l) => sum + l.quantity, 0);
  const pendingCount = laporanBulanIni.filter((l) => l.status === "pending").length;
  const lastReport = laporanBulanIni[0] || null;
  const recentLaporan = laporanBulanIni.slice(0, 3);

  const data = {
    nama: namaUser,
    upahPerBata: karyawan ? Number(karyawan.upah_per_bata) : 0,
    todayTotal,
    monthTotal,
    pendingCount,
    lastReport: lastReport
      ? {
          id: lastReport.id,
          quantity: lastReport.quantity,
          status: lastReport.status,
        }
      : null,
    recentLaporan: recentLaporan.map((l) => ({
      id: l.id,
      quantity: l.quantity,
      status: l.status,
      tanggal_laporan: l.tanggal_laporan.toISOString().split("T")[0],
    })),
  };

  return <KaryawanHomeClient data={data} />;
}
