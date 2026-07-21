"use client";

import React, { useState, useTransition, useEffect, useMemo } from "react";
import { Plus, Calendar, Layers, ClipboardList, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { getStokSekarang, getLedgerStok, createStokAdjustment } from "./action";
import { useSession } from "next-auth/react";
import Swal from "sweetalert2";

interface LedgerType {
  id: number;
  tanggal: string;
  tipe_referensi: string;
  tipe: string;
  quantity: number;
  stok_setelah: number;
  keterangan: string;
}

interface Props {
  stokSaatIni: number;
  initialLedger: LedgerType[];
  currentMonth: number;
  currentYear: number;
}

const PAGE_SIZE_OPTIONS = [5, 10, 15, 25];

export default function StokClientPage({ stokSaatIni, initialLedger, currentMonth, currentYear }: Props) {
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const [liveStok, setLiveStok] = useState(stokSaatIni);
  const [ledgerData, setLedgerData] = useState<LedgerType[]>(initialLedger);
  const [isOpenModal, setIsOpenModal] = useState(false);

  const [filterBulan, setFilterBulan] = useState(currentMonth);
  const [filterTahun, setFilterTahun] = useState(currentYear);

  const [tipeAdj, setTipeAdj] = useState<"masuk" | "keluar">("masuk");
  const [quantityAdj, setQuantityAdj] = useState("");
  const [keteranganAdj, setKeteranganAdj] = useState("");

  // === PAGINATION STATE ===
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalRows = ledgerData.length;
  const totalPages = Math.ceil(totalRows / pageSize);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return ledgerData.slice(start, start + pageSize);
  }, [ledgerData, currentPage, pageSize]);

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
    startTransition(async () => {
      const updatedLedger = await getLedgerStok(filterBulan, filterTahun);
      const updatedStok = await getStokSekarang();
      setLedgerData(updatedLedger);
      setLiveStok(updatedStok);
    });
  }, [filterBulan, filterTahun]);

  const handleOpenModal = () => {
    setTipeAdj("masuk");
    setQuantityAdj("");
    setKeteranganAdj("");
    setIsOpenModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!quantityAdj || !keteranganAdj) {
      Swal.fire({ icon: "error", title: "Oops...", text: "Semua form adjustment wajib diisi!", confirmButtonColor: "#94442e" });
      return;
    }

    // Ambil userId dari session NextAuth — bukan localStorage
    const userId = (session?.user as any)?.id;
    if (!userId) {
      Swal.fire({ icon: "error", title: "Sesi Habis", text: "Silakan login kembali.", confirmButtonColor: "#94442e" });
      return;
    }

    startTransition(async () => {
      const res = await createStokAdjustment({
        tipe: tipeAdj,
        quantity: parseInt(quantityAdj),
        keterangan: keteranganAdj,
        created_by: parseInt(userId),
      });

      if (res.success) {
        Swal.fire({ icon: "success", title: "Berhasil!", text: "Adjustment stok fisik berhasil disimpan.", timer: 2000, showConfirmButton: false });
        setIsOpenModal(false);
        const refreshedStok = await getStokSekarang();
        const refreshedLedger = await getLedgerStok(filterBulan, filterTahun);
        setLiveStok(refreshedStok);
        setLedgerData(refreshedLedger);
        setCurrentPage(1);
      } else {
        Swal.fire({ icon: "error", title: "Gagal!", text: res.error || "Gagal memproses adjustment.", confirmButtonColor: "#94442e" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-[#94442e] to-[#b35c44] text-white p-6 rounded-xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-white/10 rounded-xl border border-white/20 hidden sm:block shadow-inner">
            <Layers className="w-8 h-8 text-amber-200" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-200">Total Stok Bata Saat Ini</p>
            <h2 className="text-4xl font-black mt-1 tracking-tight text-white flex items-baseline gap-2">
              {liveStok.toLocaleString("id-ID")}
              <span className="text-sm font-medium text-amber-100/80">Pcs</span>
            </h2>
            <p className="text-xs text-amber-100/70 mt-1 max-w-md">*Kalkulasi bersih real-time dari log produksi disetujui, penjualan, dan penyesuaian manual.</p>
          </div>
        </div>
        <button
          onClick={handleOpenModal}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-white text-[#94442e] px-5 py-3 rounded-xl font-bold hover:bg-amber-50 active:scale-95 transition-all text-sm shadow-md border border-white cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Adjustment Stok Manual
        </button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 text-gray-700 font-bold text-sm">
          <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin text-[#94442e]" : "text-gray-400"}`} />
          <span>Riwayat Ledger Mutasi & Audit Trail</span>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={filterBulan}
            onChange={(e) => setFilterBulan(parseInt(e.target.value))}
            className="bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-lg p-2.5 font-medium outline-none focus:border-[#94442e] w-full sm:w-auto"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString("id-ID", { month: "long" })}
              </option>
            ))}
          </select>
          <select
            value={filterTahun}
            onChange={(e) => setFilterTahun(parseInt(e.target.value))}
            className="bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-lg p-2.5 font-medium outline-none focus:border-[#94442e] w-full sm:w-auto"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Tampilkan</span>
            <select value={pageSize} onChange={(e) => handlePageSizeChange(parseInt(e.target.value))} className="border border-gray-200 rounded-lg px-2 py-1 text-sm font-medium bg-gray-50 outline-none focus:border-[#94442e]">
              {PAGE_SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <span>baris</span>
          </div>
          <p className="text-xs text-gray-400">{totalRows === 0 ? "Tidak ada data" : `Menampilkan ${Math.min((currentPage - 1) * pageSize + 1, totalRows)}–${Math.min(currentPage * pageSize, totalRows)} dari ${totalRows} data`}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Referensi Modul</th>
                <th className="px-6 py-4">Arah Pergerakan</th>
                <th className="px-6 py-4 text-right">Jumlah Perubahan</th>
                <th className="px-6 py-4 text-right">Sisa Stok Berjalan</th>
                <th className="px-6 py-4">Keterangan Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {isPending ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400 bg-gray-50/50">
                    Sinkronisasi mutasi log ledger...
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400 bg-gray-50/50">
                    Tidak ditemukan pergerakan mutasi stok pada periode bulan ini.
                  </td>
                </tr>
              ) : (
                paginatedData.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {log.tanggal}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                          log.tipe_referensi === "produksi" ? "bg-blue-50 text-blue-600" : log.tipe_referensi === "penjualan" ? "bg-orange-50 text-orange-600" : "bg-purple-50 text-purple-600"
                        }`}
                      >
                        {log.tipe_referensi}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide shadow-sm min-w-[130px] ${
                          log.tipe === "masuk" ? "bg-green-100 text-green-700 border border-green-200" : "bg-red-100 text-red-700 border border-red-200"
                        }`}
                      >
                        {log.tipe === "masuk" ? "⬇ BATA MASUK" : "⬆ BATA KELUAR"}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${log.tipe === "masuk" ? "text-green-600" : "text-red-600"}`}>
                      {log.tipe === "masuk" ? "+" : "-"}
                      {log.quantity.toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4 text-right font-extrabold text-gray-900 bg-gray-50/30">{log.stok_setelah.toLocaleString("id-ID")}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs max-w-xs truncate" title={log.keterangan}>
                      {log.keterangan}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-3">
            <p className="text-xs text-gray-400">
              Halaman {currentPage} dari {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1))
                .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === "..." ? (
                    <span key={`dots-${idx}`} className="px-2 text-gray-400 text-sm">
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setCurrentPage(item as number)}
                      className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors ${currentPage === item ? "bg-[#94442e] text-white shadow-sm" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                    >
                      {item}
                    </button>
                  )
                )}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">Koreksi / Adjustment Stok Fisik</h3>
              <button onClick={() => setIsOpenModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1 cursor-pointer">
                &times;
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">Tipe Penyesuaian *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTipeAdj("masuk")}
                    className={`py-2 rounded-lg text-sm font-bold border transition-all cursor-pointer ${tipeAdj === "masuk" ? "bg-green-50 border-green-500 text-green-700 shadow-sm" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                  >
                    Barang Masuk (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipeAdj("keluar")}
                    className={`py-2 rounded-lg text-sm font-bold border transition-all cursor-pointer ${tipeAdj === "keluar" ? "bg-red-50 border-red-500 text-red-700 shadow-sm" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                  >
                    Barang Keluar (-)
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">Jumlah Selisih Bata (Pcs) *</label>
                <div className="relative">
                  <Layers className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={quantityAdj}
                    onChange={(e) => setQuantityAdj(e.target.value)}
                    placeholder="Masukkan angka kuantitas selisih"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#94442e] font-bold"
                    min="1"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">Alasan Penyesuaian Fisik *</label>
                <div className="relative">
                  <ClipboardList className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <textarea
                    value={keteranganAdj}
                    onChange={(e) => setKeteranganAdj(e.target.value)}
                    placeholder="Contoh: Koreksi stok opname bulanan..."
                    rows={3}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#94442e]"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsOpenModal(false)} className="px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-lg cursor-pointer" disabled={isPending}>
                  Batal
                </button>
                <button type="submit" className="px-5 py-2 text-sm font-medium text-white bg-[#94442e] hover:bg-[#b35c44] rounded-lg shadow-sm cursor-pointer" disabled={isPending}>
                  {isPending ? "Memproses..." : "Simpan Koreksi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
