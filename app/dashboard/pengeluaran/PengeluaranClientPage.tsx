"use client";

import React, { useState, useTransition, useEffect, useMemo } from "react";
import { Plus, Calendar, Tag, FileText, DollarSign, Trash2, RefreshCw, Wallet, ChevronLeft, ChevronRight } from "lucide-react";
import { getPengeluaran, createPengeluaran, deletePengeluaran } from "./action";
import { useSession } from "next-auth/react";
import Swal from "sweetalert2";

interface PengeluaranType {
  id: number;
  tanggal_pengeluaran: string;
  kategori: string;
  deskripsi: string;
  total: number;
}

interface Props {
  initialPengeluaran: PengeluaranType[];
  currentMonth: number;
  currentYear: number;
}

const KATEGORI_DEFAULT = ["Bahan Bakar", "Alat & Perlengkapan", "Upah Harian", "Transportasi", "Lain-lain"];
const PAGE_SIZE_OPTIONS = [5, 10, 15, 25];

export default function PengeluaranClientPage({ initialPengeluaran, currentMonth, currentYear }: Props) {
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const [listPengeluaran, setListPengeluaran] = useState<PengeluaranType[]>(initialPengeluaran || []);

  useEffect(() => {
    if (initialPengeluaran) setListPengeluaran(initialPengeluaran);
  }, [initialPengeluaran]);

  const [isOpenModal, setIsOpenModal] = useState(false);
  const [filterBulan, setFilterBulan] = useState(currentMonth);
  const [filterTahun, setFilterTahun] = useState(currentYear);

  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [kategori, setKategori] = useState("Bahan Bakar");
  const [customKategori, setCustomKategori] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [total, setTotal] = useState("");

  // === PAGINATION STATE ===
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalRows = listPengeluaran.length;
  const totalPages = Math.ceil(totalRows / pageSize);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return listPengeluaran.slice(start, start + pageSize);
  }, [listPengeluaran, currentPage, pageSize]);

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const totalBiayaOperasional = listPengeluaran.reduce((sum, item) => sum + item.total, 0);

  useEffect(() => {
    setCurrentPage(1);
    startTransition(async () => {
      const updatedData = await getPengeluaran(filterBulan, filterTahun);
      setListPengeluaran(updatedData);
    });
  }, [filterBulan, filterTahun]);

  const handleOpenModal = () => {
    setTanggal(new Date().toISOString().split("T")[0]);
    setKategori("Bahan Bakar");
    setCustomKategori("");
    setDeskripsi("");
    setTotal("");
    setIsOpenModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const kategoriFinal = kategori === "Lain-lain" && customKategori ? customKategori : kategori;

    if (!kategoriFinal || !deskripsi || !total) {
      Swal.fire({ icon: "error", title: "Oops...", text: "Semua kolom wajib diisi!", confirmButtonColor: "#94442e" });
      return;
    }

    // Ambil userId dari session NextAuth — bukan localStorage
    const userId = (session?.user as any)?.id;
    if (!userId) {
      Swal.fire({ icon: "error", title: "Sesi Habis", text: "Silakan login kembali.", confirmButtonColor: "#94442e" });
      return;
    }

    startTransition(async () => {
      const res = await createPengeluaran({
        tanggal_pengeluaran: tanggal,
        kategori: kategoriFinal,
        deskripsi,
        total: parseInt(total),
        created_by: parseInt(userId),
      });

      if (res.success) {
        Swal.fire({ icon: "success", title: "Berhasil!", text: "Catatan pengeluaran berhasil disimpan.", timer: 2000, showConfirmButton: false });
        setIsOpenModal(false);
        const refreshedData = await getPengeluaran(filterBulan, filterTahun);
        setListPengeluaran(refreshedData);
        setCurrentPage(1);
      } else {
        Swal.fire({ icon: "error", title: "Gagal", text: res.error || "Gagal menyimpan data.", confirmButtonColor: "#94442e" });
      }
    });
  };

  const handleDelete = (id: number) => {
    Swal.fire({
      title: "Hapus Catatan?",
      text: "Data pengeluaran operasional ini akan dihapus secara permanen!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#94442e",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        startTransition(async () => {
          const res = await deletePengeluaran(id);
          if (res.success) {
            Swal.fire({ icon: "success", title: "Dihapus!", text: "Catatan pengeluaran berhasil dihapus.", timer: 2000, showConfirmButton: false });
            const refreshedData = await getPengeluaran(filterBulan, filterTahun);
            setListPengeluaran(refreshedData);
            setCurrentPage(1);
          } else {
            Swal.fire({ icon: "error", title: "Gagal", text: res.error || "Gagal menghapus data.", confirmButtonColor: "#94442e" });
          }
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#94442e] text-white p-6 rounded-xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-white/10 rounded-xl border border-white/20 hidden sm:block shadow-inner">
            <Wallet className="w-8 h-8 text-amber-200" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-200">Total Pengeluaran Operasional</p>
            <h2 className="text-4xl font-black mt-1 tracking-tight text-white">Rp {totalBiayaOperasional.toLocaleString("id-ID")}</h2>
            <p className="text-xs text-amber-100/70 mt-1">*Total akumulasi biaya dari filter bulan dan tahun yang sedang Anda pilih.</p>
          </div>
        </div>
        <button
          onClick={handleOpenModal}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-white text-[#94442e] px-5 py-3 rounded-xl font-bold hover:bg-amber-50 active:scale-95 transition-all text-sm shadow-md border border-white cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Catat Pengeluaran Baru
        </button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 text-gray-700 font-bold text-sm">
          <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin text-[#94442e]" : "text-gray-400"}`} />
          <span>Riwayat Pengeluaran Kas Usaha</span>
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
                <th className="px-6 py-4">Kategori Pengeluaran</th>
                <th className="px-6 py-4">Deskripsi / Keterangan</th>
                <th className="px-6 py-4 text-right">Nominal Biaya</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {isPending && listPengeluaran.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400 bg-gray-50/50">
                    Memuat riwayat pengeluaran kas...
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400 bg-gray-50/50">
                    Belum ada rekam data pengeluaran operasional di periode ini.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {item.tanggal_pengeluaran}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-md text-xs font-bold border border-amber-200 uppercase tracking-wider">{item.kategori}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 max-w-xs truncate" title={item.deskripsi}>
                      {item.deskripsi}
                    </td>
                    <td className="px-6 py-4 text-right font-extrabold text-red-600 bg-red-50/10 whitespace-nowrap">Rp {item.total.toLocaleString("id-ID")}</td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
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
              <h3 className="font-bold text-lg text-gray-800">Catat Pengeluaran Operasional</h3>
              <button onClick={() => setIsOpenModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1 cursor-pointer">
                &times;
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">Tanggal Pengeluaran *</label>
                <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#94442e]" required />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">Kategori Operasional *</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <select
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#94442e] bg-white text-gray-800 font-medium"
                  >
                    {KATEGORI_DEFAULT.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {kategori === "Lain-lain" && (
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">Tulis Kategori Kustom *</label>
                  <input
                    type="text"
                    value={customKategori}
                    onChange={(e) => setCustomKategori(e.target.value)}
                    placeholder="Misal: Pajak, Konsumsi Rapat"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#94442e]"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">Deskripsi / Keterangan *</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                    placeholder="Contoh: Pembelian Solar 20 Liter untuk mesin"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#94442e]"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">Total Biaya (Rp) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-on-surface-variant">Rp</span>
                  <input
                    type="number"
                    value={total}
                    onChange={(e) => setTotal(e.target.value)}
                    placeholder="0"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#94442e] font-extrabold text-red-600"
                    min="1"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsOpenModal(false)} className="px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-lg cursor-pointer" disabled={isPending}>
                  Batal
                </button>
                <button type="submit" className="px-5 py-2 text-sm font-medium text-white bg-[#94442e] hover:bg-[#b35c44] rounded-lg shadow-sm cursor-pointer" disabled={isPending}>
                  {isPending ? "Menyimpan..." : "Simpan Pengeluaran"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
