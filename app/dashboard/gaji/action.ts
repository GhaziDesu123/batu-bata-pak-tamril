"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. Ambil semua karyawan beserta data gaji bulan & tahun tertentu
export async function getKaryawanDenganGaji(bulan: number, tahun: number) {
  try {
    const karyawan = await db.karyawan.findMany({
      where: { status: "active" },
      include: {
        gaji: {
          where: { bulan, tahun },
        },
      },
      orderBy: { nama: "asc" },
    });

    return karyawan.map((k) => {
      const gajiData = k.gaji[0] || null;
      return {
        id: k.id,
        nama: k.nama,
        tlp: k.tlp || "-",
        upah_per_bata: Number(k.upah_per_bata),
        gaji_id: gajiData?.id || null,
        total_produksi: gajiData?.total_produksi || 0,
        total_gaji: gajiData ? Number(gajiData.total_gaji) : 0,
        status_pembayaran: gajiData?.status_pembayaran || null,
        tanggal_pembayaran: gajiData?.tanggal_pembayaran ? gajiData.tanggal_pembayaran.toISOString().split("T")[0] : null,
      };
    });
  } catch (error) {
    console.error("Gagal mengambil data karyawan + gaji:", error);
    return [];
  }
}

// 2. Ambil detail gaji per karyawan (semua history)
export async function getDetailGajiKaryawan(idKaryawan: number) {
  try {
    const karyawan = await db.karyawan.findUnique({
      where: { id: idKaryawan },
    });

    if (!karyawan) return null;

    const historyGaji = await db.gaji.findMany({
      where: { id_karyawan: idKaryawan },
      orderBy: [{ tahun: "desc" }, { bulan: "desc" }],
    });

    return {
      id: karyawan.id,
      nama: karyawan.nama,
      tlp: karyawan.tlp || "-",
      alamat: karyawan.alamat || "-",
      upah_per_bata: Number(karyawan.upah_per_bata),
      status: karyawan.status,
      history: historyGaji.map((g) => ({
        id: g.id,
        bulan: g.bulan,
        tahun: g.tahun,
        total_produksi: g.total_produksi,
        upah_per_bata: Number(g.upah_per_bata),
        total_gaji: Number(g.total_gaji),
        status_pembayaran: g.status_pembayaran,
        tanggal_pembayaran: g.tanggal_pembayaran ? g.tanggal_pembayaran.toISOString().split("T")[0] : null,
      })),
    };
  } catch (error) {
    console.error("Gagal mengambil detail gaji karyawan:", error);
    return null;
  }
}

// 3. Tandai gaji lunas
export async function tandaiSudahDibayar(id: number): Promise<{ success: boolean; error: string | null }> {
  try {
    await db.gaji.update({
      where: { id },
      data: {
        status_pembayaran: "paid",
        tanggal_pembayaran: new Date(),
      },
    });

    revalidatePath("/dashboard/gaji");
    return { success: true, error: null };
  } catch (error: any) {
    console.error("Gagal memperbarui status pembayaran:", error);
    return { success: false, error: error.message || "Gagal memperbarui status pembayaran." };
  }
}
