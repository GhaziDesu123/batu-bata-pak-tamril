import { getLaporanProduksi, getLaporanPenjualan, getLaporanPengeluaran, getLaporanLabaBersih, getLaporanGaji } from "./action";
import LaporanClientPage from "./LaporanClientPage";

export default async function LaporanPage() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [produksi, penjualan, pengeluaran, labaBersih, gaji] = await Promise.all([
    getLaporanProduksi(currentMonth, currentYear),
    getLaporanPenjualan(currentMonth, currentYear),
    getLaporanPengeluaran(currentMonth, currentYear),
    getLaporanLabaBersih(currentMonth, currentYear),
    getLaporanGaji(currentMonth, currentYear),
  ]);

  return <LaporanClientPage initialProduksi={produksi} initialPenjualan={penjualan} initialPengeluaran={pengeluaran} initialLabaBersih={labaBersih} initialGaji={gaji} currentMonth={currentMonth} currentYear={currentYear} />;
}
