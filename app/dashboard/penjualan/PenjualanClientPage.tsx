"use client";
import React, { useState, useTransition, useEffect, useMemo } from "react";
import { Plus, Calendar, User, Layers, CircleDollarSign, ClipboardList, ChevronLeft, ChevronRight } from "lucide-react";
import { createTransaksiPenjualan, getTransaksiPenjualan } from "./action";
import { useSession } from "next-auth/react";
import Swal from "sweetalert2";

interface TransaksiPenjualanMapped {
  id: number;
  created_by: number;
  tanggal_transaksi: string;
  quantity: number;
  harga_per_bata: number;
  total: number;
  nama_pembeli: string;
  notes: string;
  created_at: string;
}

interface Props {
  initialData: TransaksiPenjualanMapped[];
  currentMonth: number;
  currentYear: number;
}

const PAGE_SIZE_OPTIONS = [5, 10, 15, 25];

export default function PenjualanClientPage({ initialData, currentMonth, currentYear }: Props) {
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const [dataPenjualan, setDataPenjualan] = useState<TransaksiPenjualanMapped[]>(initialData);
  const [isOpenModal, setIsOpenModal] = useState(false);

  const [filterBulan, setFilterBulan] = useState(currentMonth);
  const [filterTahun, setFilterTahun] = useState(currentYear);

  const [tanggalTransaksi, setTanggalTransaksi] = useState(new Date().toISOString().split("T")[0]);
  const [namaPembeli, setNamaPembeli] = useState("");
  const [quantity, setQuantity] = useState("");
  const [hargaPerBata, setHargaPerBata] = useState("800");
  const [notes, setNotes] = useState("");

  // === PAGINATION STATE ===
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalRows = dataPenjualan.length;
  const totalPages = Math.ceil(totalRows / pageSize);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return dataPenjualan.slice(start, start + pageSize);
  }, [dataPenjualan, currentPage, pageSize]);

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
    startTransition(async () => {
      const updatedData = await getTransaksiPenjualan(filterBulan, filterTahun);
      setDataPenjualan(updatedData);
    });
  }, [filterBulan, filterTahun]);

  const estimasiTotalForm = (Number(quantity) || 0) * (Number(hargaPerBata) || 0);
  const totalOmzetBulanIni = dataPenjualan.reduce((sum, item) => sum + item.total, 0);

  const handleOpenAdd = () => {
    setTanggalTransaksi(new Date().toISOString().split("T")[0]);
    setNamaPembeli("");
    setQuantity("");
    setHargaPerBata("800");
    setNotes("");
    setIsOpenModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!tanggalTransaksi || !quantity || !hargaPerBata) {
      Swal.fire({ icon: "error", title: "Oops...", text: "Form bertanda bintang (*) wajib diisi!", confirmButtonColor: "#94442e" });
      return;
    }

    // Ambil userId dari session NextAuth — bukan localStorage
    const userId = (session?.user as any)?.id;
    if (!userId) {
      Swal.fire({ icon: "error", title: "Sesi Habis", text: "Silakan login kembali.", confirmButtonColor: "#94442e" });
      return;
    }

    startTransition(async () => {
      const res = await createTransaksiPenjualan({
        tanggal_transaksi: tanggalTransaksi,
        nama_pembeli: namaPembeli,
        quantity: parseInt(quantity),
        harga_per_bata: parseInt(hargaPerBata),
        notes: notes,
        created_by: parseInt(userId),
      });

      if (res.success) {
        Swal.fire({ icon: "success", title: "Berhasil!", text: "Transaksi penjualan dicatat, stok otomatis dipotong.", timer: 2000, showConfirmButton: false });
        setIsOpenModal(false);
        const refreshed = await getTransaksiPenjualan(filterBulan, filterTahun);
        setDataPenjualan(refreshed);
        setCurrentPage(1);
      } else {
        Swal.fire({ icon: "error", title: "Transaksi Gagal!", text: res.error || "Gagal menyimpan transaksi", confirmButtonColor: "#94442e" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <select value={filterBulan} onChange={(e) => setFilterBulan(parseInt(e.target.value))} className="bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-lg p-2.5 font-medium outline-none focus:border-[#94442e]">
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString("id-ID", { month: "long" })}
              </option>
            ))}
          </select>
          <select value={filterTahun} onChange={(e) => setFilterTahun(parseInt(e.target.value))} className="bg-gray-50 border border-gray-300 text-gray-800 text-sm rounded-lg p-2.5 font-medium outline-none focus:border-[#94442e]">
            {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-[#94442e] text-white px-4 py-2.5 rounded-lg font-medium hover:bg-[#b35c44] transition-all text-sm shadow-sm cursor-pointer">
          <Plus className="w-4 h-4" />
          Catat Penjualan Baru
        </button>
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
                <th className="px-6 py-4">Nama Pembeli</th>
                <th className="px-6 py-4 text-right">Jumlah (Pcs)</th>
                <th className="px-6 py-4 text-right">Harga Satuan</th>
                <th className="px-6 py-4 text-right">Total Transaksi</th>
                <th className="px-6 py-4">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {isPending ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400 bg-gray-50/50">
                    Memperbarui data kas penjualan...
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400 bg-gray-50/50">
                    Tidak ada catatan transaksi penjualan pada periode ini.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-500 whitespace-nowrap">
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {item.tanggal_transaksi}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{item.nama_pembeli || "Pembeli Umum"}</td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">{item.quantity.toLocaleString("id-ID")}</td>
                    <td className="px-6 py-4 text-right text-gray-600">Rp {item.harga_per_bata.toLocaleString("id-ID")}</td>
                    <td className="px-6 py-4 text-right text-green-600 font-bold">Rp {item.total.toLocaleString("id-ID")}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs max-w-xs truncate" title={item.notes}>
                      {item.notes || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {dataPenjualan.length > 0 && !isPending && (
              <tfoot>
                <tr className="bg-gray-50 font-bold text-gray-900 border-t-2 border-gray-200">
                  <td colSpan={3} className="px-6 py-4 text-right">
                    TOTAL PENDAPATAN PERIODE:
                  </td>
                  <td colSpan={3} className="px-6 py-4 text-right text-base text-green-600 font-extrabold">
                    Rp {totalOmzetBulanIni.toLocaleString("id-ID")}
                  </td>
                </tr>
              </tfoot>
            )}
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
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">Catat Penjualan Bata</h3>
              <button onClick={() => setIsOpenModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1 cursor-pointer">
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">Tanggal Transaksi *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={tanggalTransaksi}
                    onChange={(e) => setTanggalTransaksi(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#94442e]"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">Nama Pembeli</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={namaPembeli}
                    onChange={(e) => setNamaPembeli(e.target.value)}
                    placeholder="Contoh: Pak Anto (Kosongkan jika umum)"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#94442e]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">Jumlah Bata (Pcs) *</label>
                  <div className="relative">
                    <Layers className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="0"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#94442e] font-bold"
                      min="1"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">Harga Satuan *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-on-surface-variant">Rp</span>
                    <input
                      type="number"
                      value={hargaPerBata}
                      onChange={(e) => setHargaPerBata(e.target.value)}
                      placeholder="800"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#94442e] font-bold"
                      min="1"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-dashed border-gray-300 flex justify-between items-center text-sm">
                <span className="font-medium text-gray-500">Estimasi Total Pendapatan:</span>
                <span className="font-extrabold text-[#94442e] text-base">Rp {estimasiTotalForm.toLocaleString("id-ID")}</span>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">Catatan Tambahan</label>
                <div className="relative">
                  <ClipboardList className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Keterangan pengiriman, DP, atau nomor truk..."
                    rows={2}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#94442e]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsOpenModal(false)} className="px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-lg cursor-pointer" disabled={isPending}>
                  Batal
                </button>
                <button type="submit" className="px-5 py-2 text-sm font-medium text-white bg-[#94442e] hover:bg-[#b35c44] rounded-lg shadow-sm cursor-pointer" disabled={isPending}>
                  {isPending ? "Menyimpan..." : "Simpan Transaksi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
