"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getKaryawanDenganGaji } from "./action";
import { RefreshCw, ChevronRight, Wallet, CheckCircle2, Clock, Package, Coins } from "lucide-react";

interface KaryawanGajiType {
  id: number;
  nama: string;
  tlp: string;
  upah_per_bata: number;
  gaji_id: number | null;
  total_produksi: number;
  total_gaji: number;
  status_pembayaran: string | null;
  tanggal_pembayaran: string | null;
}

interface Props {
  initialData: KaryawanGajiType[];
  currentMonth: number;
  currentYear: number;
}

const NAMA_BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

// Avatar palette — tiap orang dapat warna konsisten berdasarkan nama, biar list gak monoton satu warna semua
const AVATAR_THEMES = [
  { bg: "from-[#94442e] to-[#b35c44]", text: "text-white" },
  { bg: "from-[#2d6a4f] to-[#40916c]", text: "text-white" },
  { bg: "from-[#1d4e89] to-[#3a7bd5]", text: "text-white" },
  { bg: "from-[#7c3aed] to-[#a78bfa]", text: "text-white" },
  { bg: "from-[#b45309] to-[#d97706]", text: "text-white" },
];

function getAvatarTheme(nama: string) {
  const idx = nama.charCodeAt(0) % AVATAR_THEMES.length;
  return AVATAR_THEMES[idx];
}

export default function PenggajianClientPage({ initialData, currentMonth, currentYear }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);
  const [filterBulan, setFilterBulan] = useState(currentMonth);
  const [filterTahun, setFilterTahun] = useState(currentYear);

  useEffect(() => {
    startTransition(async () => {
      const updated = await getKaryawanDenganGaji(filterBulan, filterTahun);
      setData(updated);
    });
  }, [filterBulan, filterTahun]);

  const totalGajiTerbayar = data.filter((k) => k.status_pembayaran === "paid").reduce((sum, k) => sum + k.total_gaji, 0);
  const totalBelumBayar = data.filter((k) => k.status_pembayaran === "unpaid").reduce((sum, k) => sum + k.total_gaji, 0);
  const jumlahLunas = data.filter((k) => k.status_pembayaran === "paid").length;
  const jumlahBelumBayar = data.filter((k) => k.status_pembayaran === "unpaid").length;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Data Penggajian</h1>
          <p className="text-sm text-gray-500">Rekap gaji karyawan — klik nama untuk lihat detail & riwayat</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={filterBulan} onChange={(e) => setFilterBulan(parseInt(e.target.value))} className="bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-lg p-2.5 font-medium outline-none focus:border-[#94442e]">
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {NAMA_BULAN[i]}
              </option>
            ))}
          </select>
          <select value={filterTahun} onChange={(e) => setFilterTahun(parseInt(e.target.value))} className="bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-lg p-2.5 font-medium outline-none focus:border-[#94442e]">
            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin text-[#94442e]" : "text-gray-400"}`} />
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#94442e] text-white p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="w-5 h-5 text-amber-200" />
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-200">Total Terbayar</p>
          </div>
          <p className="text-2xl font-black">Rp {totalGajiTerbayar.toLocaleString("id-ID")}</p>
          <p className="text-xs text-amber-100/70 mt-1">{jumlahLunas} karyawan lunas</p>
        </div>

        <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-red-400" />
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Belum Dibayar</p>
          </div>
          <p className="text-2xl font-black text-red-600">Rp {totalBelumBayar.toLocaleString("id-ID")}</p>
          <p className="text-xs text-gray-400 mt-1">{jumlahBelumBayar} karyawan belum lunas</p>
        </div>

        <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Periode</p>
          </div>
          <p className="text-2xl font-black text-gray-800">{NAMA_BULAN[filterBulan - 1]}</p>
          <p className="text-xs text-gray-400 mt-1">{filterTahun}</p>
        </div>
      </div>

      {/* LIST KARTU KARYAWAN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.length === 0 ? (
          <div className="col-span-3 bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">Belum ada data gaji untuk periode ini.</div>
        ) : (
          data.map((k) => {
            const theme = getAvatarTheme(k.nama);
            const isPaid = k.status_pembayaran === "paid";
            const isUnpaid = k.status_pembayaran === "unpaid";
            const accentBar = "bg-[#94442e]";

            return (
              <button
                key={k.id}
                onClick={() => router.push(`/dashboard/gaji/${k.id}?bulan=${filterBulan}&tahun=${filterTahun}`)}
                className="relative bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-[#94442e]/40 transition-all duration-200 text-left group overflow-hidden"
              >
                {/* accent bar kiri — nunjukin status sekilas tanpa perlu baca teks */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentBar}`} />

                {/* status badge floating pojok kanan atas */}
                <div className="absolute top-4 right-4">
                  {isPaid ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3" /> Lunas
                    </span>
                  ) : isUnpaid ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-[10px] font-bold">
                      <Clock className="w-3 h-3" /> Belum Bayar
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 text-gray-400 border border-gray-200 rounded-full text-[10px] font-bold">Belum Produksi</span>
                  )}
                </div>

                <div className="p-5 pl-6">
                  {/* PROFIL */}
                  <div className="flex items-center gap-3 mb-4 pr-20">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${theme.bg} ${theme.text} flex items-center justify-center font-bold text-lg shadow-sm shrink-0`}>{k.nama.charAt(0).toUpperCase()}</div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 group-hover:text-[#94442e] transition-colors truncate">{k.nama}</p>
                      <p className="text-xs text-gray-400 truncate">{k.tlp}</p>
                    </div>
                  </div>

                  {/* DATA CHIPS */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                        <Package className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">Produksi</span>
                      </div>
                      <p className="text-sm font-bold text-gray-800">{k.total_produksi > 0 ? `${k.total_produksi.toLocaleString("id-ID")} pcs` : "-"}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                        <Coins className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">Upah/Bata</span>
                      </div>
                      <p className="text-sm font-bold text-gray-800">Rp {k.upah_per_bata.toLocaleString("id-ID")}</p>
                    </div>
                  </div>

                  {/* TOTAL GAJI — highlight box, fokus utama card */}
                  <div className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${k.total_gaji > 0 ? "bg-[#94442e]/[0.06]" : "bg-gray-50"}`}>
                    <span className="text-xs font-semibold text-gray-500">Total Gaji</span>
                    {k.total_gaji > 0 ? <span className="text-base font-black text-[#94442e]">Rp {k.total_gaji.toLocaleString("id-ID")}</span> : <span className="text-xs font-semibold text-gray-400">Belum ada produksi</span>}
                  </div>
                </div>

                <ChevronRight className="absolute bottom-5 right-4 w-4 h-4 text-gray-300 group-hover:text-[#94442e] group-hover:translate-x-0.5 transition-all" />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
