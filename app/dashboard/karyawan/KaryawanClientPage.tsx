"use client";

import React, { useState, useTransition, useMemo } from "react";
import { Plus, Pencil, Trash2, Phone, MapPin, DollarSign, User, ChevronLeft, ChevronRight } from "lucide-react";
import { createKaryawan, updateKaryawan, deleteKaryawan } from "./action";
import Swal from "sweetalert2";

interface Karyawan {
  id: number;
  nama: string;
  tlp: string | null;
  alamat: string | null;
  upah_per_bata: any;
  status: "active" | "inactive";
}

interface Props {
  initialData: Karyawan[];
}

const PAGE_SIZE_OPTIONS = [5, 10, 15, 25];

export default function KaryawanClientPage({ initialData }: Props) {
  const [isPending, startTransition] = useTransition();
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [editingKaryawan, setEditingKaryawan] = useState<Karyawan | null>(null);

  // State Form
  const [nama, setNama] = useState("");
  const [tlp, setTlp] = useState("");
  const [alamat, setAlamat] = useState("");
  const [upah, setUpah] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  // === PAGINATION STATE ===
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalRows = initialData.length;
  const totalPages = Math.ceil(totalRows / pageSize);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return initialData.slice(start, start + pageSize);
  }, [initialData, currentPage, pageSize]);

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleOpenAdd = () => {
    setEditingKaryawan(null);
    setNama("");
    setTlp("");
    setAlamat("");
    setUpah("150");
    setStatus("active");
    setIsOpenModal(true);
  };

  const handleOpenEdit = (karyawan: Karyawan) => {
    setEditingKaryawan(karyawan);
    setNama(karyawan.nama);
    setTlp(karyawan.tlp || "");
    setAlamat(karyawan.alamat || "");
    setUpah(karyawan.upah_per_bata.toString());
    setStatus(karyawan.status);
    setIsOpenModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !upah) {
      Swal.fire({ icon: "error", title: "Oops...", text: "Nama dan Upah per bata wajib diisi!", confirmButtonColor: "#3B82F6" });
      return;
    }

    startTransition(async () => {
      if (editingKaryawan) {
        const res = await updateKaryawan(editingKaryawan.id, {
          nama,
          tlp: tlp || undefined,
          alamat: alamat || undefined,
          upah_per_bata: parseFloat(upah),
          status,
        });
        if (res.success) {
          Swal.fire({ icon: "success", title: "Berhasil!", text: "Data karyawan berhasil diperbarui.", timer: 2000, showConfirmButton: false });
          setIsOpenModal(false);
        } else {
          Swal.fire({ icon: "error", title: "Gagal!", text: res.error || "Gagal mengupdate data", confirmButtonColor: "#EF4444" });
        }
      } else {
        const res = await createKaryawan({
          nama,
          tlp: tlp || undefined,
          alamat: alamat || undefined,
          upah_per_bata: parseFloat(upah),
        });

        if (res.success && res.account) {
          Swal.fire({
            icon: "success",
            title: "Karyawan & Akun Berhasil Dibuat!",
            html: `
              <p style="font-size: 14px; text-align: left; margin-bottom: 8px; color: #4b5563;">
                Sistem telah men-generate akun login otomatis untuk karyawan ini:
              </p>
              <div style="text-align: left; background: #f3f4f6; padding: 14px; border-radius: 8px; font-family: monospace; border: 1px solid #e5e7eb;">
                <p style="margin: 4px 0; font-size: 14px;"><strong>Username:</strong> <span style="color: #dd6b20; font-weight: bold; user-select: all;">${res.account.username}</span></p>
                <p style="margin: 4px 0; font-size: 14px;"><strong>Password:</strong> <span style="color: #dd6b20; font-weight: bold; user-select: all;">${res.account.passwordPlain}</span></p>
              </div>
              <p style="font-size: 11px; color: #9ca3af; margin-top: 10px; font-style: italic; text-align: left;">
                *Klik dua kali pada teks orange untuk menyalin kredensial tersebut lalu berikan kepada karyawan.
              </p>
            `,
            confirmButtonColor: "#3B82F6",
            confirmButtonText: "Selesai",
          });
          setIsOpenModal(false);
        } else {
          Swal.fire({ icon: "error", title: "Gagal!", text: res.error || "Gagal menambahkan data", confirmButtonColor: "#EF4444" });
        }
      }
    });
  };

  const handleDelete = (id: number) => {
    Swal.fire({
      title: "Apakah Anda yakin?",
      text: "Jika sudah ada riwayat produksi, disarankan mengubah status menjadi 'Non-Aktif' saja melalui menu edit.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    }).then((result) => {
      if (result.isConfirmed) {
        startTransition(async () => {
          const res = await deleteKaryawan(id);
          if (res.success) {
            Swal.fire({ icon: "success", title: "Dihapus!", text: "Karyawan berhasil dihapus.", timer: 1500, showConfirmButton: false });
          } else {
            Swal.fire({ icon: "error", title: "Gagal!", text: res.error || "Gagal menghapus karyawan", confirmButtonColor: "#EF4444" });
          }
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-outline-variant/30 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-on-surface">Manajemen Karyawan</h1>
          <p className="text-sm text-on-surface-variant">Kelola data profil, nomor telepon, dan tarif upah per bata karyawan produksi.</p>
        </div>
        <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-all text-sm shadow-sm">
          <Plus className="w-4 h-4" />
          Tambah Karyawan
        </button>
      </div>

      {/* TABEL */}
      <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
        {/* KONTROL ATAS TABEL */}
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
              <tr className="bg-surface-container-low border-b border-outline-variant/30 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                <th className="px-6 py-4">Nama Karyawan</th>
                <th className="px-6 py-4">No. Telepon</th>
                <th className="px-6 py-4">Alamat</th>
                <th className="px-6 py-4">Tarif Upah / Bata</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 text-sm text-on-surface">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-on-surface-variant bg-surface-container-low/10">
                    Belum ada data karyawan. Silakan klik "Tambah Karyawan".
                  </td>
                </tr>
              ) : (
                paginatedData.map((karyawan) => (
                  <tr key={karyawan.id} className="hover:bg-surface-container-low/20 transition-colors">
                    <td className="px-6 py-4 font-medium flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">{karyawan.nama.charAt(0).toUpperCase()}</div>
                      {karyawan.nama}
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">
                      {karyawan.tlp ? (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" /> {karyawan.tlp}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Tidak ada</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant max-w-xs truncate">
                      {karyawan.alamat ? (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 shrink-0" /> {karyawan.alamat}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Tidak ada</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-primary">Rp {Number(karyawan.upah_per_bata).toLocaleString("id-ID")}/bata</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${karyawan.status === "active" ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-600 border-gray-300"}`}
                      >
                        {karyawan.status === "active" ? "Aktif" : "Non-Aktif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(karyawan)}
                          className="p-1.5 rounded-lg bg-gray-50 text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors border border-outline-variant/20 shadow-sm"
                          title="Edit Karyawan"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(karyawan.id)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-600 hover:text-white transition-colors border border-red-100 shadow-sm" title="Hapus Karyawan">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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

      {/* MODAL FORM */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-xl border border-outline-variant shadow-xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="px-6 py-4 bg-surface-container-low border-b border-outline-variant/30 flex justify-between items-center">
              <h3 className="font-bold text-lg text-on-surface">{editingKaryawan ? "Edit Data Karyawan" : "Tambah Karyawan Baru"}</h3>
              <button onClick={() => setIsOpenModal(false)} className="text-on-surface-variant hover:text-on-surface text-xl font-semibold p-1">
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-on-surface-variant mb-1.5">Nama Lengkap *</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-on-surface-variant" />
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Contoh: Sukarno Hardjo"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-outline-variant rounded-lg focus:outline-none focus:border-primary bg-surface-container-low/40"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-on-surface-variant mb-1.5">No. Telepon</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-on-surface-variant" />
                  <input
                    type="tel"
                    value={tlp}
                    onChange={(e) => setTlp(e.target.value)}
                    placeholder="Contoh: 08123456789"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-outline-variant rounded-lg focus:outline-none focus:border-primary bg-surface-container-low/40"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-on-surface-variant mb-1.5">Tarif Upah per Bata (Rp) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-on-surface-variant">Rp</span>
                  <input
                    type="number"
                    value={upah}
                    onChange={(e) => setUpah(e.target.value)}
                    placeholder="Contoh: 150"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-outline-variant rounded-lg focus:outline-none focus:border-primary bg-surface-container-low/40 font-semibold text-primary"
                    min="1"
                    required
                  />
                </div>
              </div>
              {editingKaryawan && (
                <div>
                  <label className="block text-xs font-semibold uppercase text-on-surface-variant mb-1.5">Status Karyawan</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
                    className="w-full px-3 py-2 text-sm border border-outline-variant rounded-lg focus:outline-none focus:border-primary bg-surface-container-low/40"
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Non-Aktif (Keluar)</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold uppercase text-on-surface-variant mb-1.5">Alamat Tempat Tinggal</label>
                <textarea
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder="Masukkan alamat lengkap rumah..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-outline-variant rounded-lg focus:outline-none focus:border-primary bg-surface-container-low/40 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/30">
                <button type="button" onClick={() => setIsOpenModal(false)} className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-gray-100 rounded-lg transition-colors" disabled={isPending}>
                  Batal
                </button>
                <button type="submit" className="px-5 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg shadow-sm transition-colors flex items-center gap-2" disabled={isPending}>
                  {isPending ? "Menyimpan..." : editingKaryawan ? "Simpan Perubahan" : "Tambah Karyawan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
