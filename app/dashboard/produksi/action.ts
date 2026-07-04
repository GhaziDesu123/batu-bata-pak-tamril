"use server";

import db from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// 1. Ambil list karyawan aktif untuk dropdown form
export async function getKaryawanAktif() {
  try {
    return await db.karyawan.findMany({
      where: { status: "active" },
      select: { id: true, nama: true },
      orderBy: { nama: "asc" },
    });
  } catch (error) {
    console.error("Gagal mengambil data karyawan aktif:", error);
    return [];
  }
}

// 2. READ: Ambil semua data laporan produksi beserta data karyawannya
export async function getLaporanProduksi() {
  try {
    const data = await db.laporanProduksi.findMany({
      include: {
        karyawan: {
          select: { nama: true, upah_per_bata: true },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return data.map((item) => ({
      id: item.id,
      id_karyawan: item.id_karyawan,
      nama_karyawan: item.karyawan.nama,
      upah_per_bata: Number(item.karyawan.upah_per_bata),
      tanggal_laporan: item.tanggal_laporan.toISOString().split("T")[0],
      quantity: item.quantity,
      foto: item.foto,
      status: item.status,
      rejection_note: item.rejection_note || "",
      created_at: item.created_at.toISOString(),
    }));
  } catch (error) {
    console.error("Gagal mengambil laporan produksi:", error);
    throw new Error("Gagal load data produksi.");
  }
}

// 3. CREATE: Input laporan produksi manual oleh admin (otomatis approved)
// FIXED: sekarang juga update stok & gaji, sama seperti approveLaporanProduksi
export async function createLaporanProduksi(formData: { id_karyawan: number; tanggal_laporan: string; quantity: number; foto?: string }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Sesi login tidak ditemukan. Silakan login ulang." };
    }

    const adminId = parseInt((session.user as any).id);

    // Ambil data karyawan buat hitung upah
    const karyawan = await db.karyawan.findUnique({
      where: { id: formData.id_karyawan },
    });

    if (!karyawan) {
      return { success: false, error: "Data karyawan tidak ditemukan." };
    }

    const upahPerBata = Number(karyawan.upah_per_bata);
    const tanggalObj = new Date(formData.tanggal_laporan);
    const bulan = tanggalObj.getMonth() + 1;
    const tahun = tanggalObj.getFullYear();

    // Hitung stok sekarang
    const [agregatMasuk, agregatKeluar] = await Promise.all([db.stokBata.aggregate({ _sum: { quantity: true }, where: { tipe: "masuk" } }), db.stokBata.aggregate({ _sum: { quantity: true }, where: { tipe: "keluar" } })]);
    const stokSekarang = (agregatMasuk._sum.quantity || 0) - (agregatKeluar._sum.quantity || 0);
    const stokSetelah = stokSekarang + formData.quantity;

    // Cek gaji bulan ini sudah ada atau belum
    const gajiExisting = await db.gaji.findUnique({
      where: { id_karyawan_bulan_tahun: { id_karyawan: formData.id_karyawan, bulan, tahun } },
    });

    const totalProduksiBaru = (gajiExisting?.total_produksi || 0) + formData.quantity;
    const totalGajiBaru = totalProduksiBaru * upahPerBata;

    // Jalankan semua dalam satu transaksi
    await db.$transaction(async (tx) => {
      // 1. Buat laporan produksi (otomatis approved)
      const laporan = await tx.laporanProduksi.create({
        data: {
          id_karyawan: formData.id_karyawan,
          tanggal_laporan: tanggalObj,
          quantity: formData.quantity,
          foto: formData.foto || "https://placehold.co/600x400",
          status: "approved",
          verified_by: adminId,
          verified_at: new Date(),
        },
      });

      // 2. Tambah stok masuk
      await tx.stokBata.create({
        data: {
          tipe_referensi: "produksi",
          id_referensi: laporan.id,
          tipe: "masuk",
          quantity: formData.quantity,
          stok_setelah: stokSetelah,
          keterangan: `Produksi manual (admin) - ${karyawan.nama}`,
          created_by: adminId,
        },
      });

      // 3. Upsert gaji bulan ini
      await tx.gaji.upsert({
        where: { id_karyawan_bulan_tahun: { id_karyawan: formData.id_karyawan, bulan, tahun } },
        update: {
          total_produksi: totalProduksiBaru,
          upah_per_bata: upahPerBata,
          total_gaji: totalGajiBaru,
          // status_pembayaran & tanggal_pembayaran TIDAK diubah
          // agar status paid yang sudah ada tidak ter-reset
        },
        create: {
          id_karyawan: formData.id_karyawan,
          bulan,
          tahun,
          total_produksi: formData.quantity,
          upah_per_bata: upahPerBata,
          total_gaji: formData.quantity * upahPerBata,
          status_pembayaran: "unpaid",
        },
      });
    });

    revalidatePath("/dashboard/produksi");
    revalidatePath("/dashboard/stok");
    revalidatePath("/dashboard/gaji");
    return { success: true };
  } catch (error: any) {
    console.error("Gagal membuat laporan produksi:", error);
    return { success: false, error: "Gagal menyimpan laporan produksi harian." };
  }
}

// 4. APPROVE: Setujui laporan dari karyawan
export async function approveLaporanProduksi(id: number) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Sesi login tidak ditemukan." };
    }

    const adminId = parseInt((session.user as any).id);

    const laporan = await db.laporanProduksi.findUnique({
      where: { id },
      include: { karyawan: true },
    });

    if (!laporan) {
      return { success: false, error: "Laporan tidak ditemukan." };
    }

    // Hitung stok sekarang
    const agregatMasuk = await db.stokBata.aggregate({ _sum: { quantity: true }, where: { tipe: "masuk" } });
    const agregatKeluar = await db.stokBata.aggregate({ _sum: { quantity: true }, where: { tipe: "keluar" } });
    const stokSekarang = (agregatMasuk._sum.quantity || 0) - (agregatKeluar._sum.quantity || 0);
    const stokSetelah = stokSekarang + laporan.quantity;

    // Ambil data gaji bulan ini kalau sudah ada
    const bulan = laporan.tanggal_laporan.getMonth() + 1;
    const tahun = laporan.tanggal_laporan.getFullYear();
    const upahPerBata = Number(laporan.karyawan.upah_per_bata);

    const gajiExisting = await db.gaji.findUnique({
      where: { id_karyawan_bulan_tahun: { id_karyawan: laporan.id_karyawan, bulan, tahun } },
    });

    const totalProduksiBaru = (gajiExisting?.total_produksi || 0) + laporan.quantity;
    const totalGajiBaru = totalProduksiBaru * upahPerBata;

    await db.$transaction([
      // 1. Approve laporan
      db.laporanProduksi.update({
        where: { id },
        data: {
          status: "approved",
          verified_by: adminId,
          verified_at: new Date(),
          rejection_note: null,
        },
      }),
      // 2. Tambah stok masuk
      db.stokBata.create({
        data: {
          tipe_referensi: "produksi",
          id_referensi: id,
          tipe: "masuk",
          quantity: laporan.quantity,
          stok_setelah: stokSetelah,
          keterangan: `Produksi disetujui - Laporan ID #${id}`,
          created_by: adminId,
        },
      }),
      // 3. Upsert gaji bulan ini
      db.gaji.upsert({
        where: { id_karyawan_bulan_tahun: { id_karyawan: laporan.id_karyawan, bulan, tahun } },
        update: {
          total_produksi: totalProduksiBaru,
          upah_per_bata: upahPerBata,
          total_gaji: totalGajiBaru,
          // status_pembayaran & tanggal_pembayaran TIDAK diubah saat update
          // agar status paid yang sudah ada tidak ter-reset
        },
        create: {
          id_karyawan: laporan.id_karyawan,
          bulan,
          tahun,
          total_produksi: laporan.quantity,
          upah_per_bata: upahPerBata,
          total_gaji: laporan.quantity * upahPerBata,
          status_pembayaran: "unpaid",
        },
      }),
    ]);

    revalidatePath("/dashboard/produksi");
    revalidatePath("/dashboard/stok");
    revalidatePath("/dashboard/gaji");
    return { success: true };
  } catch (error) {
    console.error("Gagal approve laporan:", error);
    return { success: false, error: "Gagal menyetujui laporan." };
  }
}

// 5. REJECT: Tolak laporan dari karyawan
export async function rejectLaporanProduksi(id: number, alasan: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { success: false, error: "Sesi login tidak ditemukan." };
    }

    const adminId = parseInt((session.user as any).id);

    await db.laporanProduksi.update({
      where: { id },
      data: {
        status: "rejected",
        verified_by: adminId,
        verified_at: new Date(),
        rejection_note: alasan,
      },
    });

    revalidatePath("/dashboard/produksi");
    return { success: true };
  } catch (error) {
    console.error("Gagal reject laporan:", error);
    return { success: false, error: "Gagal menolak laporan." };
  }
}

// 6. DELETE: Hapus Laporan
export async function deleteLaporanProduksi(id: number) {
  try {
    await db.laporanProduksi.delete({
      where: { id },
    });
    revalidatePath("/dashboard/produksi");
    return { success: true };
  } catch (error) {
    console.error("Gagal menghapus laporan produksi:", error);
    return { success: false, error: "Gagal menghapus data laporan." };
  }
}
