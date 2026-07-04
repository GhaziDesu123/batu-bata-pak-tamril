import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import RiwayatClientPage from "./RiwayatClientPage";

export default async function RiwayatPage() {
  const session = await getServerSession(authOptions);
  const namaUser = session?.user?.name || "";

  const karyawan = await prisma.karyawan.findFirst({ where: { nama: namaUser } });

  const laporan = karyawan
    ? await prisma.laporanProduksi.findMany({
        where: { id_karyawan: karyawan.id },
        orderBy: { created_at: "desc" },
      })
    : [];

  const initialData = laporan.map((l) => ({
    id: l.id,
    tanggal_laporan: l.tanggal_laporan.toISOString().split("T")[0],
    quantity: l.quantity,
    foto: l.foto,
    status: l.status,
    rejection_note: l.rejection_note,
    created_at: l.created_at.toISOString(),
  }));

  return <RiwayatClientPage initialData={initialData} />;
}
