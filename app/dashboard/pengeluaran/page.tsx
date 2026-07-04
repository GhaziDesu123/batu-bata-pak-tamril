import React from "react";
import PengeluaranClientPage from "./PengeluaranClientPage";
import { getPengeluaran } from "./action";

export default async function PengeluaranPage() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Load awal data pengeluaran dari server action
  const initialPengeluaran = await getPengeluaran(currentMonth, currentYear);

  return <PengeluaranClientPage initialPengeluaran={initialPengeluaran} currentMonth={currentMonth} currentYear={currentYear} />;
}
