// app/dashboard/karyawan/page.tsx
import React from "react";
export const dynamic = "force-dynamic";
import KaryawanClientPage from "./KaryawanClientPage"; // Sesuaikan nama client page lu
import { getKaryawan } from "./action"; // Sesuaikan fungsi read data lu

export default async function KaryawanPage() {
  // 1. Ambil data mentah dari database via action
  const rawData = await getKaryawan();

  // 2. Kita bersihkan datanya (Convert Decimal & Date jadi Plain Object)
  const dataKaryawan = rawData.map((karyawan) => ({
    ...karyawan,
    // Convert objek Decimal Prisma jadi number javascript biasa
    upah_per_bata: Number(karyawan.upah_per_bata),

    // Amannya, tipe Date juga kita bikin string atau plaintext biar gak rewel serialization-nya
    created_at: karyawan.created_at ? new Date(karyawan.created_at).toISOString() : null,
  }));

  // 3. Sekarang aman dibakar ke Client Component! Gak bakal ngamuk lagi
  return <KaryawanClientPage initialData={dataKaryawan} />;
}
