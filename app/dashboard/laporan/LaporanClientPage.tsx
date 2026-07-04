"use client";

import { useState, useTransition } from "react";
import { getLaporanProduksi, getLaporanPenjualan, getLaporanPengeluaran, getLaporanLabaBersih, getLaporanGaji } from "./action";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { FileText, TrendingUp, TrendingDown, Package, ShoppingCart, Receipt, Wallet, Users, RefreshCw } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { ProduksiPDF, PenjualanPDF, PengeluaranPDF, LabaBersihPDF, GajiPDF } from "./LaporanPDF";

// ── Types ──────────────────────────────────────────────────────────────────
interface ProduksiItem {
  id: number;
  nama_karyawan: string;
  tanggal_laporan: string;
  quantity: number;
  upah_per_bata: number;
  estimasi_upah: number;
}
interface PenjualanItem {
  id: number;
  tanggal_transaksi: string;
  nama_pembeli: string;
  quantity: number;
  harga_per_bata: number;
  total: number;
  notes: string;
}
interface PengeluaranItem {
  id: number;
  tanggal_pengeluaran: string;
  kategori: string;
  deskripsi: string;
  total: number;
}
interface LabaBersih {
  totalPenjualan: number;
  totalPengeluaran: number;
  totalGaji: number;
  totalBiaya: number;
  labaBersih: number;
}
interface GajiItem {
  id: number;
  nama_karyawan: string;
  total_produksi: number;
  upah_per_bata: number;
  total_gaji: number;
  status_pembayaran: string;
  tanggal_pembayaran: string | null;
}

interface Props {
  initialProduksi: ProduksiItem[];
  initialPenjualan: PenjualanItem[];
  initialPengeluaran: PengeluaranItem[];
  initialLabaBersih: LabaBersih;
  initialGaji: GajiItem[];
  currentMonth: number;
  currentYear: number;
}

const NAMA_BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const TABS = ["Produksi", "Penjualan", "Pengeluaran", "Laba Bersih", "Gaji"];
const PIE_COLORS = ["#94442e", "#b35c44", "#d5836b", "#e2b49a"];

export default function LaporanClientPage({ initialProduksi, initialPenjualan, initialPengeluaran, initialLabaBersih, initialGaji, currentMonth, currentYear }: Props) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState("Produksi");
  const [filterBulan, setFilterBulan] = useState(currentMonth);
  const [filterTahun, setFilterTahun] = useState(currentYear);
  const [isExporting, setIsExporting] = useState(false);

  const [produksi, setProduksi] = useState(initialProduksi);
  const [penjualan, setPenjualan] = useState(initialPenjualan);
  const [pengeluaran, setPengeluaran] = useState(initialPengeluaran);
  const [labaBersih, setLabaBersih] = useState(initialLabaBersih);
  const [gaji, setGaji] = useState(initialGaji);

  const handleFilterChange = (bulan: number, tahun: number) => {
    setFilterBulan(bulan);
    setFilterTahun(tahun);
    startTransition(async () => {
      const [p, pj, pe, lb, g] = await Promise.all([getLaporanProduksi(bulan, tahun), getLaporanPenjualan(bulan, tahun), getLaporanPengeluaran(bulan, tahun), getLaporanLabaBersih(bulan, tahun), getLaporanGaji(bulan, tahun)]);
      setProduksi(p);
      setPenjualan(pj);
      setPengeluaran(pe);
      setLabaBersih(lb);
      setGaji(g);
    });
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      let doc;
      let fileName;

      switch (activeTab) {
        case "Produksi":
          doc = <ProduksiPDF data={produksi} bulan={filterBulan} tahun={filterTahun} />;
          fileName = `Laporan-Produksi-${filterBulan}-${filterTahun}.pdf`;
          break;
        case "Penjualan":
          doc = <PenjualanPDF data={penjualan} bulan={filterBulan} tahun={filterTahun} />;
          fileName = `Laporan-Penjualan-${filterBulan}-${filterTahun}.pdf`;
          break;
        case "Pengeluaran":
          doc = <PengeluaranPDF data={pengeluaran} bulan={filterBulan} tahun={filterTahun} />;
          fileName = `Laporan-Pengeluaran-${filterBulan}-${filterTahun}.pdf`;
          break;
        case "Laba Bersih":
          doc = <LabaBersihPDF data={labaBersih} bulan={filterBulan} tahun={filterTahun} />;
          fileName = `Laporan-Laba-Bersih-${filterBulan}-${filterTahun}.pdf`;
          break;
        case "Gaji":
          doc = <GajiPDF data={gaji} bulan={filterBulan} tahun={filterTahun} />;
          fileName = `Laporan-Gaji-${filterBulan}-${filterTahun}.pdf`;
          break;
        default:
          return;
      }

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Gagal export PDF:", error);
      alert("Gagal membuat PDF, coba lagi.");
    } finally {
      setIsExporting(false);
    }
  };

  // Chart data produksi — group by tanggal
  const produksiChartData = Object.values(
    produksi.reduce((acc, item) => {
      const key = item.tanggal_laporan;
      if (!acc[key]) acc[key] = { tanggal: key.slice(5), total: 0 };
      acc[key].total += item.quantity;
      return acc;
    }, {} as Record<string, { tanggal: string; total: number }>)
  ).slice(-7);

  // Chart data pengeluaran by kategori
  const pengeluaranByKategori = Object.values(
    pengeluaran.reduce((acc, item) => {
      if (!acc[item.kategori]) acc[item.kategori] = { name: item.kategori, value: 0 };
      acc[item.kategori].value += item.total;
      return acc;
    }, {} as Record<string, { name: string; value: number }>)
  );

  // Summary stats
  const totalProduksiPcs = produksi.reduce((sum, i) => sum + i.quantity, 0);
  const totalPenjualanRp = penjualan.reduce((sum, i) => sum + i.total, 0);
  const totalPengeluaranRp = pengeluaran.reduce((sum, i) => sum + i.total, 0);
  const totalGajiTerbayar = gaji.filter((g) => g.status_pembayaran === "paid").reduce((sum, i) => sum + i.total_gaji, 0);

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-['Hanken_Grotesk']">Laporan Operasional</h1>
          <p className="text-sm text-gray-500 mt-0.5">Ringkasan performa pabrik dan keuangan periodik.</p>
        </div>
        <div className="flex items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 ml-1">Bulan</label>
            <select value={filterBulan} onChange={(e) => handleFilterChange(parseInt(e.target.value), filterTahun)} className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:border-[#94442e] outline-none">
              {NAMA_BULAN.map((b, i) => (
                <option key={i + 1} value={i + 1}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 ml-1">Tahun</label>
            <select value={filterTahun} onChange={(e) => handleFilterChange(filterBulan, parseInt(e.target.value))} className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:border-[#94442e] outline-none">
              {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            {isPending && <RefreshCw className="w-4 h-4 animate-spin text-[#94442e]" />}
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 bg-[#94442e] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#7e3522] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {isExporting ? "Membuat PDF..." : "Export PDF"}
            </button>
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Produksi</span>
            <Package className="w-4 h-4 text-[#94442e]" />
          </div>
          <p className="text-2xl font-black text-gray-800">
            {totalProduksiPcs.toLocaleString("id-ID")} <span className="text-sm font-normal text-gray-400">Pcs</span>
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Penjualan</span>
            <ShoppingCart className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-black text-gray-800">
            Rp {(totalPenjualanRp / 1000000).toFixed(1)} <span className="text-sm font-normal text-gray-400">jt</span>
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Pengeluaran</span>
            <Receipt className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-black text-gray-800">
            Rp {(totalPengeluaranRp / 1000000).toFixed(1)} <span className="text-sm font-normal text-gray-400">jt</span>
          </p>
        </div>
        <div className={`border rounded-xl p-4 shadow-sm ${labaBersih.labaBersih >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Laba Bersih</span>
            {labaBersih.labaBersih >= 0 ? <TrendingUp className="w-4 h-4 text-green-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />}
          </div>
          <p className={`text-2xl font-black ${labaBersih.labaBersih >= 0 ? "text-green-700" : "text-red-700"}`}>
            Rp {(Math.abs(labaBersih.labaBersih) / 1000000).toFixed(1)} <span className="text-sm font-normal">jt</span>
          </p>
        </div>
      </div>

      {/* TABS */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-semibold transition-all border-b-2 ${activeTab === tab ? "text-[#94442e] border-[#94442e]" : "text-gray-400 border-transparent hover:text-gray-700"}`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* ── TAB: PRODUKSI ── */}
      {activeTab === "Produksi" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4">Produksi Harian (7 Hari Terakhir)</h3>
              {produksiChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={produksiChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="tanggal" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => [`${v.toLocaleString("id-ID")} pcs`, "Produksi"]} />
                    <Bar dataKey="total" fill="#94442e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Belum ada data produksi</div>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-col gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Total Produksi Bulan Ini</p>
                <p className="text-2xl font-black text-[#94442e]">{totalProduksiPcs.toLocaleString("id-ID")} Pcs</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Jumlah Laporan Approved</p>
                <p className="text-2xl font-black text-gray-800">{produksi.length}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Estimasi Total Upah</p>
                <p className="text-2xl font-black text-green-600">Rp {produksi.reduce((s, i) => s + i.estimasi_upah, 0).toLocaleString("id-ID")}</p>
              </div>
            </div>
          </div>

          {/* Tabel */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">
                Data Rinci Produksi — {NAMA_BULAN[filterBulan - 1]} {filterTahun}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-3">Tanggal</th>
                    <th className="px-5 py-3">Karyawan</th>
                    <th className="px-5 py-3 text-right">Jumlah (Pcs)</th>
                    <th className="px-5 py-3 text-right">Upah/Bata</th>
                    <th className="px-5 py-3 text-right">Estimasi Upah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {produksi.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-gray-400">
                        Belum ada data produksi periode ini.
                      </td>
                    </tr>
                  ) : (
                    produksi.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-gray-500">{item.tanggal_laporan}</td>
                        <td className="px-5 py-3 font-semibold text-gray-800">{item.nama_karyawan}</td>
                        <td className="px-5 py-3 text-right font-bold">{item.quantity.toLocaleString("id-ID")}</td>
                        <td className="px-5 py-3 text-right text-gray-500">Rp {item.upah_per_bata.toLocaleString("id-ID")}</td>
                        <td className="px-5 py-3 text-right font-bold text-green-600">Rp {item.estimasi_upah.toLocaleString("id-ID")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {produksi.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-50 border-t-2 border-gray-200 font-bold text-sm">
                      <td colSpan={2} className="px-5 py-3 text-right text-gray-700">
                        TOTAL:
                      </td>
                      <td className="px-5 py-3 text-right text-[#94442e]">{totalProduksiPcs.toLocaleString("id-ID")} Pcs</td>
                      <td></td>
                      <td className="px-5 py-3 text-right text-green-600">Rp {produksi.reduce((s, i) => s + i.estimasi_upah, 0).toLocaleString("id-ID")}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: PENJUALAN ── */}
      {activeTab === "Penjualan" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4">Tren Penjualan Harian</h3>
              {penjualan.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart
                    data={penjualan
                      .slice()
                      .reverse()
                      .map((p) => ({ tanggal: p.tanggal_transaksi.slice(5), total: p.total }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="tanggal" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`} />
                    <Tooltip formatter={(v: any) => [`Rp ${v.toLocaleString("id-ID")}`, "Total"]} />
                    <Line type="monotone" dataKey="total" stroke="#94442e" strokeWidth={2} dot={{ fill: "#94442e", r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Belum ada data penjualan</div>
              )}
            </div>
            <div className="flex flex-col gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Total Pendapatan</p>
                <p className="text-2xl font-black text-green-600">Rp {totalPenjualanRp.toLocaleString("id-ID")}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Jumlah Transaksi</p>
                <p className="text-2xl font-black text-gray-800">{penjualan.length}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Total Bata Terjual</p>
                <p className="text-2xl font-black text-gray-800">{penjualan.reduce((s, i) => s + i.quantity, 0).toLocaleString("id-ID")} Pcs</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">
                Data Transaksi Penjualan — {NAMA_BULAN[filterBulan - 1]} {filterTahun}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-3">Tanggal</th>
                    <th className="px-5 py-3">Pembeli</th>
                    <th className="px-5 py-3 text-right">Jumlah (Pcs)</th>
                    <th className="px-5 py-3 text-right">Harga/Bata</th>
                    <th className="px-5 py-3 text-right">Total</th>
                    <th className="px-5 py-3">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {penjualan.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-gray-400">
                        Belum ada transaksi penjualan.
                      </td>
                    </tr>
                  ) : (
                    penjualan.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-gray-500">{item.tanggal_transaksi}</td>
                        <td className="px-5 py-3 font-semibold text-gray-800">{item.nama_pembeli}</td>
                        <td className="px-5 py-3 text-right">{item.quantity.toLocaleString("id-ID")}</td>
                        <td className="px-5 py-3 text-right text-gray-500">Rp {item.harga_per_bata.toLocaleString("id-ID")}</td>
                        <td className="px-5 py-3 text-right font-bold text-green-600">Rp {item.total.toLocaleString("id-ID")}</td>
                        <td className="px-5 py-3 text-gray-400 text-xs truncate max-w-xs">{item.notes}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {penjualan.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-50 border-t-2 border-gray-200 font-bold text-sm">
                      <td colSpan={4} className="px-5 py-3 text-right text-gray-700">
                        TOTAL PENDAPATAN:
                      </td>
                      <td className="px-5 py-3 text-right text-green-600">Rp {totalPenjualanRp.toLocaleString("id-ID")}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: PENGELUARAN ── */}
      {activeTab === "Pengeluaran" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4">Pengeluaran per Kategori</h3>
              {pengeluaranByKategori.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pengeluaranByKategori} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                      {pengeluaranByKategori.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => [`Rp ${v.toLocaleString("id-ID")}`, "Total"]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Belum ada data pengeluaran</div>
              )}
            </div>
            <div className="flex flex-col gap-4">
              <div className="bg-white border border-red-100 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Total Pengeluaran</p>
                <p className="text-2xl font-black text-red-600">Rp {totalPengeluaranRp.toLocaleString("id-ID")}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Per Kategori</p>
                <div className="space-y-2">
                  {pengeluaranByKategori.map((k, i) => (
                    <div key={k.name} className="flex justify-between items-center text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        {k.name}
                      </span>
                      <span className="font-bold">Rp {k.value.toLocaleString("id-ID")}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">
                Data Pengeluaran — {NAMA_BULAN[filterBulan - 1]} {filterTahun}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-3">Tanggal</th>
                    <th className="px-5 py-3">Kategori</th>
                    <th className="px-5 py-3">Deskripsi</th>
                    <th className="px-5 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {pengeluaran.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-gray-400">
                        Belum ada data pengeluaran.
                      </td>
                    </tr>
                  ) : (
                    pengeluaran.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 text-gray-500">{item.tanggal_pengeluaran}</td>
                        <td className="px-5 py-3">
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs font-bold">{item.kategori}</span>
                        </td>
                        <td className="px-5 py-3 text-gray-700">{item.deskripsi}</td>
                        <td className="px-5 py-3 text-right font-bold text-red-600">Rp {item.total.toLocaleString("id-ID")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {pengeluaran.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-50 border-t-2 border-gray-200 font-bold text-sm">
                      <td colSpan={3} className="px-5 py-3 text-right text-gray-700">
                        TOTAL PENGELUARAN:
                      </td>
                      <td className="px-5 py-3 text-right text-red-600">Rp {totalPengeluaranRp.toLocaleString("id-ID")}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: LABA BERSIH ── */}
      {activeTab === "Laba Bersih" && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-green-700 mb-1">Total Pendapatan</p>
              <p className="text-2xl font-black text-green-700">Rp {labaBersih.totalPenjualan.toLocaleString("id-ID")}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-red-700 mb-1">Total Biaya</p>
              <p className="text-2xl font-black text-red-700">Rp {labaBersih.totalBiaya.toLocaleString("id-ID")}</p>
              <p className="text-xs text-red-500 mt-1">Operasional + Gaji</p>
            </div>
            <div className={`border rounded-xl p-5 shadow-sm ${labaBersih.labaBersih >= 0 ? "bg-blue-50 border-blue-200" : "bg-red-50 border-red-200"}`}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${labaBersih.labaBersih >= 0 ? "text-blue-700" : "text-red-700"}`}>{labaBersih.labaBersih >= 0 ? "Laba Bersih" : "Rugi Bersih"}</p>
              <p className={`text-2xl font-black ${labaBersih.labaBersih >= 0 ? "text-blue-700" : "text-red-700"}`}>Rp {Math.abs(labaBersih.labaBersih).toLocaleString("id-ID")}</p>
            </div>
          </div>

          {/* Breakdown Visual */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-6">
              Breakdown Keuangan — {NAMA_BULAN[filterBulan - 1]} {filterTahun}
            </h3>
            <div className="space-y-4">
              {[
                { label: "Pendapatan Penjualan", value: labaBersih.totalPenjualan, color: "bg-green-500", textColor: "text-green-700" },
                { label: "Pengeluaran Operasional", value: -labaBersih.totalPengeluaran, color: "bg-red-400", textColor: "text-red-600" },
                { label: "Gaji Karyawan (Terbayar)", value: -labaBersih.totalGaji, color: "bg-orange-400", textColor: "text-orange-600" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold text-gray-700">{item.label}</span>
                    <span className={`text-sm font-bold ${item.textColor}`}>
                      {item.value >= 0 ? "+" : "-"} Rp {Math.abs(item.value).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${labaBersih.totalPenjualan > 0 ? Math.min((Math.abs(item.value) / labaBersih.totalPenjualan) * 100, 100) : 0}%` }} />
                  </div>
                </div>
              ))}

              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-800">Laba Bersih</span>
                  <span className={`text-xl font-black ${labaBersih.labaBersih >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {labaBersih.labaBersih >= 0 ? "+" : "-"} Rp {Math.abs(labaBersih.labaBersih).toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: GAJI ── */}
      {activeTab === "Gaji" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Total Gaji</p>
              <p className="text-2xl font-black text-gray-800">Rp {gaji.reduce((s, g) => s + g.total_gaji, 0).toLocaleString("id-ID")}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-green-700 mb-1">Terbayar</p>
              <p className="text-2xl font-black text-green-700">Rp {totalGajiTerbayar.toLocaleString("id-ID")}</p>
              <p className="text-xs text-green-600 mt-1">{gaji.filter((g) => g.status_pembayaran === "paid").length} karyawan</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-red-700 mb-1">Belum Bayar</p>
              <p className="text-2xl font-black text-red-700">Rp {(gaji.reduce((s, g) => s + g.total_gaji, 0) - totalGajiTerbayar).toLocaleString("id-ID")}</p>
              <p className="text-xs text-red-600 mt-1">{gaji.filter((g) => g.status_pembayaran === "unpaid").length} karyawan</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">
                Rekap Gaji Karyawan — {NAMA_BULAN[filterBulan - 1]} {filterTahun}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-3">Karyawan</th>
                    <th className="px-5 py-3 text-right">Total Produksi</th>
                    <th className="px-5 py-3 text-right">Upah/Bata</th>
                    <th className="px-5 py-3 text-right">Total Gaji</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3">Tgl Bayar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {gaji.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-gray-400">
                        Belum ada data gaji periode ini.
                      </td>
                    </tr>
                  ) : (
                    gaji.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 font-semibold text-gray-800">{item.nama_karyawan}</td>
                        <td className="px-5 py-3 text-right">{item.total_produksi.toLocaleString("id-ID")} Pcs</td>
                        <td className="px-5 py-3 text-right text-gray-500">Rp {item.upah_per_bata.toLocaleString("id-ID")}</td>
                        <td className="px-5 py-3 text-right font-bold text-[#94442e]">Rp {item.total_gaji.toLocaleString("id-ID")}</td>
                        <td className="px-5 py-3 text-center">
                          {item.status_pembayaran === "paid" ? (
                            <span className="px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-bold">Lunas</span>
                          ) : (
                            <span className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-bold">Belum Bayar</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-gray-400 text-xs">{item.tanggal_pembayaran || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {gaji.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-50 border-t-2 border-gray-200 font-bold text-sm">
                      <td colSpan={3} className="px-5 py-3 text-right text-gray-700">
                        TOTAL GAJI:
                      </td>
                      <td className="px-5 py-3 text-right text-[#94442e]">Rp {gaji.reduce((s, g) => s + g.total_gaji, 0).toLocaleString("id-ID")}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
