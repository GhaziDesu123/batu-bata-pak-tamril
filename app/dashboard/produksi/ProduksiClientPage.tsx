"use client";

import React, { useState, useTransition, useMemo } from "react";
import { Plus, Trash2, Calendar, Layers, CheckCircle2, XCircle, AlertCircle, Eye, ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { createLaporanProduksi, deleteLaporanProduksi, approveLaporanProduksi, rejectLaporanProduksi } from "./action";
import Swal from "sweetalert2";

interface LaporanProduksiMapped {
  id: number;
  id_karyawan: number;
  nama_karyawan: string;
  upah_per_bata: number;
  tanggal_laporan: string;
  quantity: number;
  foto: string;
  status: "pending" | "approved" | "rejected";
  rejection_note: string;
  created_at: string;
}

interface Props {
  initialData: LaporanProduksiMapped[];
  karyawanOptions: { id: number; nama: string }[];
}

const PAGE_SIZE_OPTIONS = [5, 10, 15, 25];

export default function ProduksiClientPage({ initialData, karyawanOptions }: Props) {
  const [isPending, startTransition] = useTransition();
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isDetailModal, setIsDetailModal] = useState(false);
  const [selectedLaporan, setSelectedLaporan] = useState<LaporanProduksiMapped | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const [idKaryawan, setIdKaryawan] = useState("");
  const [tanggalLaporan, setTanggalLaporan] = useState(new Date().toISOString().split("T")[0]);
  const [quantity, setQuantity] = useState("");

  // === PAGINATION STATE ===
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Hitung data yang ditampilkan
  const totalRows = initialData.length;
  const totalPages = Math.ceil(totalRows / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return initialData.slice(start, start + pageSize);
  }, [initialData, currentPage, pageSize]);

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // reset ke halaman 1 kalau ganti ukuran
  };

  const handleOpenAdd = () => {
    setIdKaryawan("");
    setTanggalLaporan(new Date().toISOString().split("T")[0]);
    setQuantity("");
    setIsOpenModal(true);
  };

  const handleOpenDetail = (item: LaporanProduksiMapped) => {
    setSelectedLaporan(item);
    setRejectNote("");
    setShowRejectForm(false);
    setIsDetailModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idKaryawan || !tanggalLaporan || !quantity) {
      Swal.fire({ icon: "error", title: "Oops...", text: "Semua form wajib diisi!", confirmButtonColor: "#94442e" });
      return;
    }
    startTransition(async () => {
      const res = await createLaporanProduksi({
        id_karyawan: parseInt(idKaryawan),
        tanggal_laporan: tanggalLaporan,
        quantity: parseInt(quantity),
      });
      if (res.success) {
        Swal.fire({ icon: "success", title: "Berhasil!", text: "Laporan produksi berhasil dicatat dan otomatis disetujui.", timer: 2500, showConfirmButton: false });
        setIsOpenModal(false);
      } else {
        Swal.fire({ icon: "error", title: "Gagal!", text: res.error || "Gagal mengirim laporan", confirmButtonColor: "#94442e" });
      }
    });
  };

  const handleApprove = (id: number) => {
    Swal.fire({
      title: "Setujui Laporan?",
      text: "Laporan produksi ini akan disetujui dan masuk perhitungan stok & upah.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Setujui",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        startTransition(async () => {
          const res = await approveLaporanProduksi(id);
          if (res.success) {
            Swal.fire({ icon: "success", title: "Disetujui!", text: "Laporan berhasil disetujui.", timer: 1500, showConfirmButton: false });
            setIsDetailModal(false);
          } else {
            Swal.fire({ icon: "error", title: "Gagal", text: res.error, confirmButtonColor: "#94442e" });
          }
        });
      }
    });
  };

  const handleReject = () => {
    if (!rejectNote.trim()) {
      Swal.fire({ icon: "error", title: "Oops...", text: "Alasan penolakan wajib diisi!", confirmButtonColor: "#94442e" });
      return;
    }
    if (!selectedLaporan) return;
    startTransition(async () => {
      const res = await rejectLaporanProduksi(selectedLaporan.id, rejectNote);
      if (res.success) {
        Swal.fire({ icon: "success", title: "Ditolak", text: "Laporan berhasil ditolak.", timer: 1500, showConfirmButton: false });
        setIsDetailModal(false);
      } else {
        Swal.fire({ icon: "error", title: "Gagal", text: res.error, confirmButtonColor: "#94442e" });
      }
    });
  };

  const handleDelete = (id: number) => {
    Swal.fire({
      title: "Hapus Laporan Ini?",
      text: "Data laporan yang dihapus tidak bisa dikembalikan!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        startTransition(async () => {
          const res = await deleteLaporanProduksi(id);
          if (res.success) {
            Swal.fire({ icon: "success", title: "Dihapus!", text: "Laporan produksi berhasil dihapus.", timer: 1500, showConfirmButton: false });
          } else {
            Swal.fire({ icon: "error", title: "Gagal!", text: res.error, confirmButtonColor: "#94442e" });
          }
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Laporan Produksi Harian</h1>
          <p className="text-sm text-gray-500">Verifikasi laporan dari karyawan, atau catat hasil cetak secara manual.</p>
        </div>
        <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-[#94442e] text-white px-4 py-2.5 rounded-lg font-medium hover:bg-[#7e3522] transition-all text-sm shadow-sm">
          <Plus className="w-4 h-4" />
          Input Manual (Auto-Approve)
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* KONTROL ATAS TABEL: tampilkan X baris */}
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
                <th className="px-6 py-4">Nama Karyawan</th>
                <th className="px-6 py-4">Jumlah Cetak</th>
                <th className="px-6 py-4">Estimasi Upah</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400 bg-gray-50/50">
                    Belum ada riwayat laporan produksi.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => {
                  const estimasiUpah = item.quantity * item.upah_per_bata;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/40 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-500 whitespace-nowrap">
                        <span className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {item.tanggal_laporan}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">{item.nama_karyawan}</td>
                      <td className="px-6 py-4 font-bold text-gray-700">
                        {item.quantity.toLocaleString("id-ID")} <span className="text-xs font-normal text-gray-400">Pcs</span>
                      </td>
                      <td className="px-6 py-4 text-green-600 font-bold">Rp {estimasiUpah.toLocaleString("id-ID")}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.status === "pending" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200">
                            <AlertCircle className="w-3 h-3" /> Menunggu Verifikasi
                          </span>
                        )}
                        {item.status === "approved" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border bg-green-50 text-green-700 border-green-200">
                            <CheckCircle2 className="w-3 h-3" /> Disetujui
                          </span>
                        )}
                        {item.status === "rejected" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border bg-red-50 text-red-700 border-red-200" title={item.rejection_note}>
                            <XCircle className="w-3 h-3" /> Ditolak
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleOpenDetail(item)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors border border-blue-100" title="Lihat Detail">
                            <Eye className="w-4 h-4" />
                          </button>
                          {item.status === "pending" && (
                            <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-600 hover:text-white transition-colors border border-red-100" title="Hapus Laporan">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION BAWAH */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-3">
            <p className="text-xs text-gray-400">
              Halaman {currentPage} dari {totalPages}
            </p>
            <div className="flex items-center gap-1">
              {/* Prev */}
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Nomor halaman */}
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

              {/* Next */}
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

      {/* MODAL DETAIL + APPROVE/REJECT */}
      {isDetailModal && selectedLaporan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-bold text-lg text-gray-800">Detail Laporan Produksi</h3>
              <button onClick={() => setIsDetailModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1">
                &times;
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-gray-500">Foto Bukti Produksi</label>
                <div className="w-full aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
                  {selectedLaporan.foto ? <img src={selectedLaporan.foto} alt="Bukti produksi" className="w-full h-full object-cover" /> : <ImageIcon className="w-10 h-10 text-gray-300" />}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase text-gray-500">Karyawan</label>
                  <p className="text-sm font-bold text-gray-800">{selectedLaporan.nama_karyawan}</p>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase text-gray-500">Tanggal</label>
                  <p className="text-sm font-bold text-gray-800">{selectedLaporan.tanggal_laporan}</p>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase text-gray-500">Jumlah Cetak</label>
                  <p className="text-sm font-bold text-gray-800">{selectedLaporan.quantity.toLocaleString("id-ID")} Pcs</p>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase text-gray-500">Estimasi Upah</label>
                  <p className="text-sm font-bold text-green-600">Rp {(selectedLaporan.quantity * selectedLaporan.upah_per_bata).toLocaleString("id-ID")}</p>
                </div>
              </div>
              {selectedLaporan.rejection_note && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                  <label className="block text-xs font-semibold uppercase text-red-600 mb-1">Catatan Penolakan</label>
                  <p className="text-sm text-red-700">{selectedLaporan.rejection_note}</p>
                </div>
              )}
              {showRejectForm && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase text-gray-500">Alasan Penolakan *</label>
                  <textarea
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    placeholder="Jelaskan alasan laporan ini ditolak..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#94442e]"
                  />
                </div>
              )}
              {selectedLaporan.status === "pending" && (
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  {!showRejectForm ? (
                    <>
                      <button onClick={() => setShowRejectForm(true)} className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors" disabled={isPending}>
                        Tolak Laporan
                      </button>
                      <button onClick={() => handleApprove(selectedLaporan.id)} className="px-5 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm transition-colors" disabled={isPending}>
                        {isPending ? "Memproses..." : "Setujui Laporan"}
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setShowRejectForm(false)} className="px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" disabled={isPending}>
                        Batal
                      </button>
                      <button onClick={handleReject} className="px-5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors" disabled={isPending}>
                        {isPending ? "Memproses..." : "Konfirmasi Tolak"}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL INPUT LAPORAN MANUAL */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">Catat Hasil Produksi Manual</h3>
              <button onClick={() => setIsOpenModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1">
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-800">
                Laporan yang diinput di sini akan otomatis berstatus <strong>Disetujui</strong>, gunakan untuk kasus darurat saja (karyawan tidak bisa akses app).
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">Pilih Karyawan *</label>
                <select
                  value={idKaryawan}
                  onChange={(e) => setIdKaryawan(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#94442e] bg-white text-gray-800 font-medium"
                  required
                >
                  <option value="">-- Pilih Karyawan --</option>
                  {karyawanOptions.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">Tanggal Cetak *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={tanggalLaporan}
                    onChange={(e) => setTanggalLaporan(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#94442e]"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5">Jumlah Cetak (Pcs) *</label>
                <div className="relative">
                  <Layers className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Contoh: 1500"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-[#94442e] font-semibold"
                    min="1"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsOpenModal(false)} className="px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-lg" disabled={isPending}>
                  Batal
                </button>
                <button type="submit" className="px-5 py-2 text-sm font-medium text-white bg-[#94442e] hover:bg-[#7e3522] rounded-lg shadow-sm" disabled={isPending}>
                  {isPending ? "Mengirim..." : "Simpan & Setujui"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
