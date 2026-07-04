"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { tandaiSudahDibayar } from "../action";
import { ArrowLeft, Phone, MapPin, CheckCircle2, Clock, Wallet, Package, ChevronDown, ChevronUp, Coins, TrendingUp } from "lucide-react";
import Swal from "sweetalert2";

interface GajiHistory {
  id: number;
  bulan: number;
  tahun: number;
  total_produksi: number;
  upah_per_bata: number;
  total_gaji: number;
  status_pembayaran: string;
  tanggal_pembayaran: string | null;
}

interface Props {
  data: {
    id: number;
    nama: string;
    tlp: string;
    alamat: string;
    upah_per_bata: number;
    status: string;
    history: GajiHistory[];
  };
  bulanAktif: number;
  tahunAktif: number;
}

const NAMA_BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

export default function DetailGajiClient({ data, bulanAktif, tahunAktif }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const gajiAktif = data.history.find((g) => g.bulan === bulanAktif && g.tahun === tahunAktif);
  const totalSemuaGaji = data.history.reduce((sum, g) => sum + g.total_gaji, 0);
  const totalTerbayar = data.history.filter((g) => g.status_pembayaran === "paid").reduce((sum, g) => sum + g.total_gaji, 0);

  const handleTandaiLunas = (id: number) => {
    Swal.fire({
      title: "Tandai Gaji Lunas?",
      text: "Pastikan pembayaran sudah diselesaikan kepada karyawan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#94442e",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Tandai Lunas!",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        startTransition(async () => {
          const res = await tandaiSudahDibayar(id);
          if (res.success) {
            Swal.fire({ icon: "success", title: "Berhasil!", text: "Gaji berhasil ditandai lunas.", timer: 1500, showConfirmButton: false });
            router.refresh();
          } else {
            Swal.fire({ icon: "error", title: "Gagal", text: res.error || "Gagal memperbarui status.", confirmButtonColor: "#94442e" });
          }
        });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* BACK BUTTON */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#94442e] transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Penggajian
      </button>

      {/* PROFIL KARYAWAN */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#94442e] to-[#b35c44] text-white rounded-2xl p-6 shadow-lg shadow-[#94442e]/20">
        {/* decorative glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-16 -left-10 w-48 h-48 bg-black/10 rounded-full blur-2xl" />

        <div className="relative flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white font-black text-2xl shrink-0 shadow-inner">{data.nama.charAt(0).toUpperCase()}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-black">{data.nama}</h1>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${data.status === "active" ? "bg-green-400/20 text-green-200 border border-green-300/30" : "bg-gray-400/20 text-gray-200"}`}>
                {data.status === "active" ? "Aktif" : "Non-Aktif"}
              </span>
            </div>
            <div className="flex flex-col gap-1 mt-2">
              {data.tlp !== "-" && (
                <span className="flex items-center gap-1.5 text-sm text-amber-100">
                  <Phone className="w-3.5 h-3.5" /> {data.tlp}
                </span>
              )}
              {data.alamat !== "-" && (
                <span className="flex items-center gap-1.5 text-sm text-amber-100">
                  <MapPin className="w-3.5 h-3.5" /> {data.alamat}
                </span>
              )}
            </div>
          </div>
          <div className="text-right shrink-0 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
            <p className="text-[10px] text-amber-200 font-semibold uppercase tracking-wider">Tarif Aktif</p>
            <p className="text-lg font-black">Rp {data.upah_per_bata.toLocaleString("id-ID")}</p>
            <p className="text-[10px] text-amber-100/70">per bata</p>
          </div>
        </div>
      </div>

      {/* SUMMARY STATS */}
      <div className="grid grid-cols-3 gap-4">
        <div className="relative bg-white border border-gray-200 rounded-xl p-4 shadow-sm overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gray-300" />
          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center mb-2">
            <Package className="w-4.5 h-4.5 text-gray-500" />
          </div>
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Total Gaji (Semua)</p>
          <p className="text-lg font-black text-gray-800 mt-0.5">Rp {totalSemuaGaji.toLocaleString("id-ID")}</p>
        </div>
        <div className="relative bg-white border border-gray-200 rounded-xl p-4 shadow-sm overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-green-500" />
          <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center mb-2">
            <CheckCircle2 className="w-4.5 h-4.5 text-green-600" />
          </div>
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Terbayar</p>
          <p className="text-lg font-black text-green-600 mt-0.5">Rp {totalTerbayar.toLocaleString("id-ID")}</p>
        </div>
        <div className="relative bg-white border border-gray-200 rounded-xl p-4 shadow-sm overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-400" />
          <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center mb-2">
            <Clock className="w-4.5 h-4.5 text-red-500" />
          </div>
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Belum Bayar</p>
          <p className="text-lg font-black text-red-600 mt-0.5">Rp {(totalSemuaGaji - totalTerbayar).toLocaleString("id-ID")}</p>
        </div>
      </div>

      {/* GAJI BULAN AKTIF */}
      {gajiAktif ? (
        <div
          className={`relative rounded-2xl border-2 p-5 shadow-sm overflow-hidden ${
            gajiAktif.status_pembayaran === "paid" ? "border-green-200 bg-gradient-to-br from-green-50 to-white" : "border-red-200 bg-gradient-to-br from-red-50 to-white"
          }`}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Gaji Periode Dipilih</p>
              <p className="text-lg font-black text-gray-800 mt-0.5">
                {NAMA_BULAN[gajiAktif.bulan - 1]} {gajiAktif.tahun}
              </p>
            </div>
            {gajiAktif.status_pembayaran === "paid" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 border border-green-200 rounded-full text-xs font-bold shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5" /> Lunas
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 border border-red-200 rounded-full text-xs font-bold shadow-sm">
                <Clock className="w-3.5 h-3.5" /> Belum Dibayar
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                <Package className="w-3.5 h-3.5" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">Produksi</span>
              </div>
              <p className="text-base font-black text-gray-800">{gajiAktif.total_produksi.toLocaleString("id-ID")} pcs</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                <Coins className="w-3.5 h-3.5" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">Upah/Bata</span>
              </div>
              <p className="text-base font-black text-gray-800">Rp {gajiAktif.upah_per_bata.toLocaleString("id-ID")}</p>
            </div>
            <div className="bg-[#94442e]/[0.06] rounded-xl p-3 border border-[#94442e]/10 shadow-sm">
              <div className="flex items-center gap-1.5 text-[#94442e]/70 mb-1">
                <Wallet className="w-3.5 h-3.5" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">Total Gaji</span>
              </div>
              <p className="text-base font-black text-[#94442e]">Rp {gajiAktif.total_gaji.toLocaleString("id-ID")}</p>
            </div>
          </div>

          {gajiAktif.status_pembayaran === "paid" && gajiAktif.tanggal_pembayaran && (
            <p className="text-xs text-green-600 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Dibayar pada: {gajiAktif.tanggal_pembayaran}
            </p>
          )}

          {gajiAktif.status_pembayaran === "unpaid" && (
            <button
              onClick={() => handleTandaiLunas(gajiAktif.id)}
              disabled={isPending}
              className="mt-2 w-full py-2.5 bg-[#94442e] text-white font-bold rounded-xl text-sm hover:bg-[#7e3522] transition-colors shadow-md shadow-[#94442e]/20 disabled:opacity-70"
            >
              <Wallet className="w-4 h-4 inline mr-2" />
              {isPending ? "Memproses..." : "Tandai Lunas Sekarang"}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-6 text-center text-gray-400">
          Belum ada data gaji untuk periode {NAMA_BULAN[bulanAktif - 1]} {tahunAktif}.
        </div>
      )}

      {/* RIWAYAT SEMUA GAJI — timeline style */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#94442e]" />
          <div>
            <h3 className="font-bold text-gray-800">Riwayat Gaji Seluruh Periode</h3>
            <p className="text-xs text-gray-400 mt-0.5">{data.history.length} periode tercatat</p>
          </div>
        </div>

        {data.history.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Belum ada riwayat gaji.</div>
        ) : (
          <div className="relative px-5 py-2">
            {/* garis vertikal timeline */}
            <div className="absolute left-[27px] top-6 bottom-6 w-px bg-gray-200" />

            {data.history.map((g) => (
              <div key={g.id} className="relative py-3">
                <button onClick={() => setExpandedId(expandedId === g.id ? null : g.id)} className="w-full flex items-center justify-between text-left group">
                  <div className="flex items-center gap-3 relative z-10">
                    <div className={`w-4 h-4 rounded-full border-2 border-white shadow ring-2 ${g.status_pembayaran === "paid" ? "bg-green-500 ring-green-100" : "bg-red-400 ring-red-100"}`} />
                    <div>
                      <p className="font-semibold text-gray-800 text-sm group-hover:text-[#94442e] transition-colors">
                        {NAMA_BULAN[g.bulan - 1]} {g.tahun}
                      </p>
                      <p className="text-xs text-gray-400">{g.total_produksi.toLocaleString("id-ID")} pcs produksi</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[#94442e] text-sm">Rp {g.total_gaji.toLocaleString("id-ID")}</span>
                    <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#94442e]/10 transition-colors">
                      {expandedId === g.id ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                    </div>
                  </div>
                </button>

                {expandedId === g.id && (
                  <div className="mt-3 ml-7 rounded-xl bg-gray-50 border border-gray-100 p-4 grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-2.5 border border-gray-100">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Total Produksi</p>
                      <p className="text-sm font-bold text-gray-800 mt-0.5">{g.total_produksi.toLocaleString("id-ID")} pcs</p>
                    </div>
                    <div className="bg-white rounded-lg p-2.5 border border-gray-100">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Upah/Bata (Snapshot)</p>
                      <p className="text-sm font-bold text-gray-800 mt-0.5">Rp {g.upah_per_bata.toLocaleString("id-ID")}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2.5 border border-gray-100">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Status</p>
                      <p className={`text-sm font-bold mt-0.5 ${g.status_pembayaran === "paid" ? "text-green-600" : "text-red-600"}`}>{g.status_pembayaran === "paid" ? "Lunas" : "Belum Dibayar"}</p>
                    </div>
                    <div className="bg-white rounded-lg p-2.5 border border-gray-100">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Tanggal Bayar</p>
                      <p className="text-sm font-bold text-gray-800 mt-0.5">{g.tanggal_pembayaran || "-"}</p>
                    </div>
                    {g.status_pembayaran === "unpaid" && (
                      <div className="col-span-2">
                        <button onClick={() => handleTandaiLunas(g.id)} disabled={isPending} className="w-full py-2 bg-[#94442e] text-white font-bold rounded-lg text-xs hover:bg-[#7e3522] transition-colors shadow-sm">
                          {isPending ? "Memproses..." : "Tandai Lunas"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
