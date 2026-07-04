import React from "react";
import ProduksiClientPage from "./ProduksiClientPage";
import { getLaporanProduksi, getKaryawanAktif } from "./action";

export default async function ProduksiPage() {
  // Fetching data paralel dari database
  const [listProduksi, listKaryawan] = await Promise.all([getLaporanProduksi(), getKaryawanAktif()]);

  return <ProduksiClientPage initialData={listProduksi} karyawanOptions={listKaryawan} />;
}
