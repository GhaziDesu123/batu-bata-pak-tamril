"use client";

import Link from "next/link";
import { Clock, CheckCircle2, XCircle, ClipboardPlus, ArrowRight, History, Layers, ChevronRight, Home as HomeIcon, Coins } from "lucide-react";

interface RiwayatItem {
  id: number;
  quantity: number;
  status: "pending" | "approved" | "rejected";
  tanggal_laporan: string;
}

interface HomeData {
  nama: string;
  upahPerBata: number;
  todayTotal: number;
  monthTotal: number;
  pendingCount: number;
  lastReport: { id: number; quantity: number; status: "pending" | "approved" | "rejected" } | null;
  recentLaporan: RiwayatItem[];
}

const DAILY_GOAL = 18000;

const STATUS_STYLE = {
  pending: { label: "Menunggu", bg: "bg-[#fef3c7]", text: "text-[#92400e]", icon: Clock },
  approved: { label: "Disetujui", bg: "bg-[#dcfce7]", text: "text-[#166534]", icon: CheckCircle2 },
  rejected: { label: "Ditolak", bg: "bg-[#ffdad6]", text: "text-[#93000a]", icon: XCircle },
};

export default function KaryawanHomeClient({ data }: { data: HomeData }) {
  const namaDepan = data.nama.split(" ")[0];
  const progress = DAILY_GOAL > 0 ? Math.min(100, Math.round((data.todayTotal / DAILY_GOAL) * 100)) : 0;

  return (
    <div className="pb-32">
      <main className="px-4 mt-6 space-y-6 max-w-screen-sm mx-auto">
        <section>
          <h1 className="text-xl font-bold text-[#191c1d]">Halo, {namaDepan}</h1>
          <p className="text-sm text-[#56423d]">Semangat kerja hari ini!</p>
        </section>

        <section className="relative overflow-hidden rounded-xl bg-white border border-[#dcc0ba] p-4">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h2 className="text-[10px] font-bold tracking-wider text-[#515f74] mb-1">PRODUKSI HARI INI</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#9a4028]">{data.todayTotal.toLocaleString("id-ID")}</span>
                <span className="text-sm text-[#56423d]">/ {DAILY_GOAL.toLocaleString("id-ID")} pcs</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-[#9d422b]">{progress}%</span>
            </div>
          </div>

          <div className="w-full h-6 bg-[#e7e8e9] rounded-full overflow-hidden flex p-1 border border-[#dcc0ba]">
            <div className="h-full bg-[#9a4028] rounded-full transition-all duration-1000 ease-out relative shadow-sm" style={{ width: `${progress}%` }}>
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
            </div>
          </div>

          <div className="mt-4 flex gap-4">
            <div className="flex-1 bg-[#f3f4f5] p-3 rounded border border-[#dcc0ba]/30">
              <span className="text-[10px] font-bold tracking-wider text-[#515f74] block">TOTAL BULAN INI</span>
              <span className="text-lg font-semibold">{data.monthTotal.toLocaleString("id-ID")} pcs</span>
            </div>
            <div className="flex-1 bg-[#f3f4f5] p-3 rounded border border-[#dcc0ba]/30">
              <span className="text-[10px] font-bold tracking-wider text-[#515f74] block">MENUNGGU APPROVAL</span>
              <span className="text-lg font-semibold text-[#9a4028]">{data.pendingCount} laporan</span>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-[#dcc0ba] p-4 rounded-xl flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <Clock className="w-5 h-5 text-[#515f74]" />
              {data.lastReport ? (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${STATUS_STYLE[data.lastReport.status].bg} ${STATUS_STYLE[data.lastReport.status].text}`}>{STATUS_STYLE[data.lastReport.status].label.toUpperCase()}</span>
              ) : (
                <span className="bg-[#e7e8e9] text-[#56423d] text-[10px] font-bold px-2 py-0.5 rounded">KOSONG</span>
              )}
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider text-[#515f74] block">LAPORAN TERAKHIR</span>
              <p className="font-semibold text-sm truncate">{data.lastReport ? `${data.lastReport.quantity.toLocaleString("id-ID")} pcs` : "Belum ada laporan"}</p>
              <p className="text-[10px] text-[#56423d]">{data.lastReport ? "LAP-" + String(data.lastReport.id).padStart(4, "0") : "Kirim laporan pertamamu"}</p>
            </div>
          </div>

          <div className="bg-white border border-[#dcc0ba] p-4 rounded-xl flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <Coins className="w-5 h-5 text-[#9a4028]" />
              <span className="bg-[#b9573e] text-white text-[10px] font-bold px-2 py-0.5 rounded">AKTIF</span>
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-wider text-[#515f74] block">TARIF PER BATA</span>
              <p className="font-semibold text-sm">Rp {data.upahPerBata.toLocaleString("id-ID")}</p>
              <p className="text-[10px] text-[#56423d]">Per pcs produksi</p>
            </div>
          </div>
        </section>

        <section>
          <Link href="/karyawan/laporan" className="w-full h-[72px] bg-[#9a4028] text-white rounded-xl flex items-center justify-between px-6 shadow-md hover:bg-[#b9573e] transition-colors active:scale-[0.98]">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-2 rounded">
                <ClipboardPlus className="w-6 h-6" />
              </div>
              <span className="text-lg font-semibold">Kirim Laporan Baru</span>
            </div>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </section>

        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-bold tracking-wider text-[#515f74]">LAPORAN TERBARU</h3>
            <Link href="/karyawan/riwayat" className="text-[#9a4028] text-xs font-semibold">
              Lihat Semua
            </Link>
          </div>

          {data.recentLaporan.length === 0 ? (
            <div className="bg-white border border-dashed border-[#dcc0ba] rounded-xl p-6 text-center text-[#89726c] text-sm">Belum ada laporan bulan ini.</div>
          ) : (
            <div className="bg-white border border-[#dcc0ba] divide-y divide-[#dcc0ba]/30 rounded-xl overflow-hidden">
              {data.recentLaporan.map((l) => {
                const style = STATUS_STYLE[l.status];
                const StatusIcon = style.icon;
                return (
                  <div key={l.id} className="p-4 flex items-center gap-4 hover:bg-[#f3f4f5] transition-colors">
                    <div className={`w-10 h-10 rounded flex items-center justify-center ${style.bg}`}>
                      <StatusIcon className={`w-5 h-5 ${style.text}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">LAP-{String(l.id).padStart(4, "0")}</p>
                      <p className="text-xs text-[#56423d]">
                        {new Date(l.tanggal_laporan).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} • {l.quantity.toLocaleString("id-ID")} pcs
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-bold tracking-wider ${style.text}`}>{style.label.toUpperCase()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 bg-white border-t border-[#dcc0ba] h-20">
        <Link href="/karyawan" className="flex flex-col items-center justify-center text-[#9a4028] border-t-2 border-[#9a4028] pt-2 w-20 transition-colors">
          <HomeIcon className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-wider mt-1">Beranda</span>
        </Link>
        <Link href="/karyawan/laporan" className="flex flex-col items-center justify-center text-[#515f74] pt-2 w-20 transition-colors hover:text-[#9a4028]">
          <ClipboardPlus className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-wider mt-1">Laporan</span>
        </Link>
        <Link href="/karyawan/riwayat" className="flex flex-col items-center justify-center text-[#515f74] pt-2 w-20 transition-colors hover:text-[#9a4028]">
          <History className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-wider mt-1">Riwayat</span>
        </Link>
      </nav>
    </div>
  );
}
