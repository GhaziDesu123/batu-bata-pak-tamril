import React from "react";
import StokClientPage from "./StokClientPage";
import { getStokSekarang, getLedgerStok } from "./action";
export const dynamic = "force-dynamic";
export default async function StokPage() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Load inisiasi data dari server action
  const stokSaatIni = await getStokSekarang();
  const initialLedger = await getLedgerStok(currentMonth, currentYear);

  return <StokClientPage stokSaatIni={stokSaatIni} initialLedger={initialLedger} currentMonth={currentMonth} currentYear={currentYear} />;
}
