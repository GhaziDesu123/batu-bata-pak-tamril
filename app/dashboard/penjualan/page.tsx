import React from "react";
import PenjualanClientPage from "./PenjualanClientPage";
import { getTransaksiPenjualan } from "./action";
export const dynamic = "force-dynamic";

export default async function PenjualanPage() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Load data awal bulan & tahun berjalan
  const initialData = await getTransaksiPenjualan(currentMonth, currentYear);

  return <PenjualanClientPage initialData={initialData} currentMonth={currentMonth} currentYear={currentYear} />;
}
