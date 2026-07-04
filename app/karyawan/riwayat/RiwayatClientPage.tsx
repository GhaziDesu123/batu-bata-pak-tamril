"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Home as HomeIcon, ClipboardPlus, History, Search, TrendingUp, Package, ChevronRight, X, Clock, CheckCircle2, XCircle } from "lucide-react";

interface LaporanItem {
  id: number;
  tanggal_laporan: string;
  quantity: number;
  foto: string;
  status: "pending" | "approved" | "rejected";
  rejection_note: string | null;
  created_at: string;
}

const NAMA_BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

const STATUS_STYLE = {
  pending: { label: "Menunggu", bg: "bg-[#fef3c7]", text: "text-[#92400e]", icon: Clock },
  approved: { label: "Disetujui", bg: "bg-[#dcfce7]", text: "text-[#166534]", icon: CheckCircle2 },
  rejected: { label: "Ditolak", bg: "bg-[#ffdad6]", text: "text-[#93000a]", icon: XCircle },
};

export default function RiwayatClientPage({ initialData }: { initialData: LaporanItem[] }) {
  const [laporanList] = useState<LaporanItem[]>(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBulan, setFilterBulan] = useState(new Date().getMonth() + 1);
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear());
  const [selected, setSelected] = useState<LaporanItem | null>(null);

  const laporanPeriode = useMemo(() => {
    return laporanList.filter((l) => {
      const d = new Date(l.tanggal_laporan);
      return d.getMonth() + 1 === filterBulan && d.getFullYear() === filterTahun;
    });
  }, [laporanList, filterBulan, filterTahun]);

  const laporanTampil = useMemo(() => {
    if (!searchQuery.trim()) return laporanPeriode;
    const q = searchQuery.toLowerCase();
    return laporanPeriode.filter((l) => `lap-${l.id}`.includes(q) || l.tanggal_laporan.includes(q));
  }, [laporanPeriode, searchQuery]);

  const monthlyTotal = laporanPeriode.reduce((sum, l) => sum + l.quantity, 0);
  const approvedCount = laporanPeriode.filter((l) => l.status === "approved").length;
  const approvalRate = laporanPeriode.length > 0 ? Math.round((approvedCount / laporanPeriode.length) * 1000) / 10 : 0;

  return (
    <div className="pb-32">
      <main className="px-4 mt-6 space-y-6 max-w-screen-sm mx-auto">
        <section className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-[#dcc0ba] rounded-xl p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-[#515f74] block mb-1">TOTAL BULAN INI</span>
              <p className="text-2xl font-bold text-[#9a4028]">{monthlyTotal.toLocaleString("id-ID")}</p>
            </div>
            <span className="text-xs text-[#56423d] flex items-center gap-1 mt-2">
              <Package className="w-3.5 h-3.5" /> {laporanPeriode.length} laporan
            </span>
          </div>
          <div className="bg-white border border-[#dcc0ba] rounded-xl p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-[#515f74] block mb-1">TINGKAT DISETUJUI</span>
              <p className="text-2xl font-bold text-[#515f74]">{approvalRate}%</p>
            </div>
            <div className="w-full bg-[#e7e8e9] h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-[#9a4028] h-full rounded-full transition-all duration-500" style={{ width: `${approvalRate}%` }} />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#89726c]" />
            <input
              type="text"
              placeholder="Cari ID laporan atau tanggal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-4 bg-white border border-[#dcc0ba] rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#9a4028]/20 focus:border-[#9a4028] transition-all"
            />
          </div>
          <div className="flex gap-2">
            <select value={filterBulan} onChange={(e) => setFilterBulan(parseInt(e.target.value))} className="flex-1 h-11 px-3 bg-white border border-[#dcc0ba] rounded-xl text-sm font-medium outline-none focus:border-[#9a4028]">
              {NAMA_BULAN.map((nama, i) => (
                <option key={i + 1} value={i + 1}>
                  {nama}
                </option>
              ))}
            </select>
            <select value={filterTahun} onChange={(e) => setFilterTahun(parseInt(e.target.value))} className="w-28 h-11 px-3 bg-white border border-[#dcc0ba] rounded-xl text-sm font-medium outline-none focus:border-[#9a4028]">
              {[filterTahun - 1, filterTahun, filterTahun + 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#191c1d] px-1">Riwayat Laporan</h2>

          {laporanTampil.length === 0 ? (
            <div className="bg-white border border-dashed border-[#dcc0ba] rounded-xl p-8 text-center text-[#89726c]">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Belum ada laporan untuk periode ini.</p>
            </div>
          ) : (
            laporanTampil.map((l) => {
              const style = STATUS_STYLE[l.status];
              const StatusIcon = style.icon;
              return (
                <button
                  key={l.id}
                  onClick={() => setSelected(l)}
                  className="w-full bg-white border border-[#dcc0ba] rounded-xl p-4 flex justify-between items-center text-left transition-transform active:scale-[0.98] hover:border-[#9a4028]/40"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold tracking-wider text-[#515f74]">LAP-{String(l.id).padStart(4, "0")}</span>
                    <p className="font-semibold text-base text-[#191c1d]">{new Date(l.tanggal_laporan).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Package className="w-3.5 h-3.5 text-[#89726c]" />
                      <span className="text-sm text-[#56423d]">{l.quantity.toLocaleString("id-ID")} pcs</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${style.bg} ${style.text}`}>
                      <StatusIcon className="w-3 h-3" /> {style.label.toUpperCase()}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#89726c]" />
                  </div>
                </button>
              );
            })
          )}
        </section>
      </main>

      {selected && (
        <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative z-10 bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="sticky top-0 bg-white flex justify-between items-center px-5 py-4 border-b border-[#dcc0ba]">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-[#515f74]">LAP-{String(selected.id).padStart(4, "0")}</span>
                <p className="font-bold text-[#191c1d]">{new Date(selected.tanggal_laporan).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
              <button onClick={() => setSelected(null)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#f3f4f5]">
                <X className="w-5 h-5 text-[#56423d]" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <img src={selected.foto} alt="Bukti produksi" className="w-full aspect-[4/3] object-cover rounded-xl border border-[#dcc0ba]" />

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#f3f4f5] rounded-lg p-3">
                  <span className="text-[10px] font-bold tracking-wider text-[#515f74] block">JUMLAH</span>
                  <span className="text-base font-bold text-[#191c1d]">{selected.quantity.toLocaleString("id-ID")} pcs</span>
                </div>
                <div className="bg-[#f3f4f5] rounded-lg p-3">
                  <span className="text-[10px] font-bold tracking-wider text-[#515f74] block">STATUS</span>
                  <span className={`text-sm font-bold ${STATUS_STYLE[selected.status].text}`}>{STATUS_STYLE[selected.status].label}</span>
                </div>
              </div>

              {selected.status === "rejected" && selected.rejection_note && (
                <div className="bg-[#ffdad6] border border-[#ffb4a2] rounded-lg p-3">
                  <span className="text-[10px] font-bold tracking-wider text-[#93000a] block mb-1">CATATAN PENOLAKAN</span>
                  <p className="text-sm text-[#93000a]">{selected.rejection_note}</p>
                </div>
              )}

              {selected.status === "pending" && <div className="bg-[#fef3c7] border border-[#fde68a] rounded-lg p-3 text-sm text-[#92400e]">Laporan masih menunggu persetujuan pemilik.</div>}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 bg-white border-t border-[#dcc0ba] h-20">
        <Link href="/karyawan" className="flex flex-col items-center justify-center text-[#515f74] pt-2 w-20 transition-colors hover:text-[#9a4028]">
          <HomeIcon className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-wider mt-1">Beranda</span>
        </Link>
        <Link href="/karyawan/laporan" className="flex flex-col items-center justify-center text-[#515f74] pt-2 w-20 transition-colors hover:text-[#9a4028]">
          <ClipboardPlus className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-wider mt-1">Laporan</span>
        </Link>
        <Link href="/karyawan/riwayat" className="flex flex-col items-center justify-center text-[#9a4028] border-t-2 border-[#9a4028] pt-2 w-20 transition-colors">
          <History className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-wider mt-1">Riwayat</span>
        </Link>
      </nav>
    </div>
  );
}
