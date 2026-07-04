"use client";

import { useState, useTransition } from "react";
import { getDashboardData } from "./action";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Package, ShoppingCart, Receipt, TrendingUp, TrendingDown, Layers, Users, Clock, Wallet, AlertCircle, RefreshCw, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

const NAMA_BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

interface DashboardData {
  totalProduksi: number;
  totalPenjualan: number;
  totalPengeluaran: number;
  labaBersih: number;
  stokSekarang: number;
  laporanPending: number;
  karyawanAktif: number;
  gajiUnpaid: number;
  chartData: { tanggal: string; produksi: number; penjualan: number }[];
  laporanPendingList: { id: number; nama_karyawan: string; tanggal: string; quantity: number }[];
}

interface Props {
  data: DashboardData | null;
  currentMonth: number;
  currentYear: number;
  userName: string;
}

export default function DashboardClientPage({ data: initialData, currentMonth, currentYear, userName }: Props) {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);
  const [filterBulan, setFilterBulan] = useState(currentMonth);
  const [filterTahun, setFilterTahun] = useState(currentYear);

  const handleFilterChange = (bulan: number, tahun: number) => {
    setFilterBulan(bulan);
    setFilterTahun(tahun);
    startTransition(async () => {
      const updated = await getDashboardData(bulan, tahun);
      setData(updated);
    });
  };

  if (!data) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Gagal memuat data dashboard.</div>;
  }

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Selamat Pagi" : now.getHours() < 17 ? "Selamat Siang" : "Selamat Malam";

  return (
    <div className="space-y-6">
      {/* WELCOME BANNER */}
      <div className="bg-gradient-to-br from-[#94442e] to-[#b35c44] text-white rounded-xl p-6 shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-amber-200 text-sm font-semibold">{greeting} 👋</p>
          <h1 className="text-2xl font-black font-['Hanken_Grotesk'] mt-0.5">{userName}</h1>
          <p className="text-amber-100/70 text-xs mt-1">{now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        {data.laporanPending > 0 && (
          <Link href="/dashboard/produksi" className="flex items-center gap-2 bg-white/20 hover:bg-white/30 border border-white/30 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-all">
            <AlertCircle className="w-4 h-4 text-amber-300" />
            {data.laporanPending} Laporan Menunggu Verifikasi
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* FILTER PERIODE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin text-[#94442e]" : "text-gray-400"}`} />
          <span className="text-sm font-bold text-gray-700">
            Periode: {NAMA_BULAN[filterBulan - 1]} {filterTahun}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <select value={filterBulan} onChange={(e) => handleFilterChange(parseInt(e.target.value), filterTahun)} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-[#94442e]">
            {NAMA_BULAN.map((b, i) => (
              <option key={i + 1} value={i + 1}>
                {b}
              </option>
            ))}
          </select>
          <select value={filterTahun} onChange={(e) => handleFilterChange(filterBulan, parseInt(e.target.value))} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-[#94442e]">
            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Produksi</p>
            <div className="w-8 h-8 rounded-lg bg-[#94442e]/10 flex items-center justify-center">
              <Package className="w-4 h-4 text-[#94442e]" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-800">{data.totalProduksi.toLocaleString("id-ID")}</p>
          <p className="text-xs text-gray-400 mt-1">Pcs disetujui bulan ini</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Penjualan</p>
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-green-600">Rp {(data.totalPenjualan / 1000000).toFixed(1)}jt</p>
          <p className="text-xs text-gray-400 mt-1">Pendapatan bulan ini</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Pengeluaran</p>
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-red-500" />
            </div>
          </div>
          <p className="text-2xl font-black text-red-600">Rp {(data.totalPengeluaran / 1000000).toFixed(1)}jt</p>
          <p className="text-xs text-gray-400 mt-1">Biaya operasional</p>
        </div>

        <div className={`border rounded-xl p-5 shadow-sm ${data.labaBersih >= 0 ? "bg-blue-50 border-blue-200" : "bg-red-50 border-red-200"}`}>
          <div className="flex justify-between items-start mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Laba Bersih</p>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${data.labaBersih >= 0 ? "bg-blue-100" : "bg-red-100"}`}>
              {data.labaBersih >= 0 ? <TrendingUp className="w-4 h-4 text-blue-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />}
            </div>
          </div>
          <p className={`text-2xl font-black ${data.labaBersih >= 0 ? "text-blue-700" : "text-red-700"}`}>Rp {(Math.abs(data.labaBersih) / 1000000).toFixed(1)}jt</p>
          <p className="text-xs text-gray-400 mt-1">{data.labaBersih >= 0 ? "Untung" : "Rugi"} bulan ini</p>
        </div>
      </div>

      {/* ROW 2: STOK + INFO CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#94442e]/10 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6 text-[#94442e]" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Stok Bata</p>
            <p className="text-xl font-black text-gray-800">{data.stokSekarang.toLocaleString("id-ID")} Pcs</p>
            <p className="text-xs text-gray-400">Stok real-time</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Karyawan Aktif</p>
            <p className="text-xl font-black text-gray-800">{data.karyawanAktif} Orang</p>
            <p className="text-xs text-gray-400">Status aktif</p>
          </div>
        </div>

        <div className={`border rounded-xl p-5 shadow-sm flex items-center gap-4 ${data.gajiUnpaid > 0 ? "bg-amber-50 border-amber-200" : "bg-white border-gray-200"}`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${data.gajiUnpaid > 0 ? "bg-amber-100" : "bg-gray-50"}`}>
            <Wallet className={`w-6 h-6 ${data.gajiUnpaid > 0 ? "text-amber-600" : "text-gray-400"}`} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Gaji Belum Bayar</p>
            <p className={`text-xl font-black ${data.gajiUnpaid > 0 ? "text-amber-700" : "text-gray-800"}`}>Rp {(data.gajiUnpaid / 1000000).toFixed(1)}jt</p>
            <p className="text-xs text-gray-400">Bulan ini</p>
          </div>
        </div>
      </div>

      {/* CHART */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-1">Produksi vs Penjualan</h3>
        <p className="text-xs text-gray-400 mb-4">
          {NAMA_BULAN[filterBulan - 1]} {filterTahun}
        </p>
        {data.chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="tanggal" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}`} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`} />
              <Tooltip formatter={(value: any, name?: string) => [name === "produksi" ? `${value.toLocaleString("id-ID")} Pcs` : `Rp ${value.toLocaleString("id-ID")}`, name === "produksi" ? "Produksi" : "Penjualan"]} />
              <Legend formatter={(v) => (v === "produksi" ? "Produksi (Pcs)" : "Penjualan (Rp)")} />
              <Bar yAxisId="left" dataKey="produksi" fill="#94442e" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="penjualan" fill="#b35c44" radius={[4, 4, 0, 0]} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[260px] flex items-center justify-center text-gray-400 text-sm">Belum ada data untuk periode ini.</div>
        )}
      </div>

      {/* LAPORAN PENDING */}
      {data.laporanPendingList.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-gray-800">Laporan Menunggu Verifikasi</h3>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold">{data.laporanPending}</span>
            </div>
            <Link href="/dashboard/produksi" className="text-xs font-semibold text-[#94442e] hover:underline flex items-center gap-1">
              Lihat Semua <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {data.laporanPendingList.map((item) => (
              <div key={item.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#94442e]/10 flex items-center justify-center text-[#94442e] font-bold text-sm">{item.nama_karyawan.charAt(0).toUpperCase()}</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{item.nama_karyawan}</p>
                    <p className="text-xs text-gray-400">
                      {item.tanggal} — {item.quantity.toLocaleString("id-ID")} pcs
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Pending
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QUICK LINKS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Kelola Karyawan", href: "/dashboard/karyawan", icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Catat Penjualan", href: "/dashboard/penjualan", icon: ShoppingCart, color: "text-green-600", bg: "bg-green-50" },
          { label: "Catat Pengeluaran", href: "/dashboard/pengeluaran", icon: Receipt, color: "text-red-500", bg: "bg-red-50" },
          { label: "Lihat Laporan", href: "/dashboard/laporan", icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-[#94442e]/30 transition-all flex items-center gap-3 group">
            <div className={`w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
              <item.icon className={`w-4 h-4 ${item.color}`} />
            </div>
            <span className="text-sm font-semibold text-gray-700 group-hover:text-[#94442e] transition-colors">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
