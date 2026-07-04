"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
export const dynamic = "force-dynamic";
export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [foto, setFoto] = useState("");
  const [email, setEmail] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");

  // Ambil data profile dari API saat halaman dibuka
  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        setFoto(data.foto || "");
        setEmail(data.email || "");
        setTanggalLahir(data.tanggal_lahir ? new Date(data.tanggal_lahir).toISOString().split("T")[0] : "");
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Ukuran gambar maksimal 2MB!");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setFoto(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foto, email, tanggal_lahir: tanggalLahir || null }),
      });

      if (!res.ok) throw new Error("Gagal menyimpan");

      toast.success("Pengaturan berhasil disimpan! 🧱✨", {
        style: { background: "#191c1d", color: "#fff", borderRadius: "8px" },
      });
    } catch {
      toast.error("Gagal menyimpan pengaturan");
    } finally {
      setIsSaving(false);
    }
  };

  const userNama = session?.user?.name || "Pengguna";
  const userRole = (session?.user as any)?.role === "pemilik" ? "Pemilik" : "Karyawan";

  if (isLoading) {
    return <div className="p-6 text-gray-400">Memuat pengaturan...</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-8 font-['Work_Sans'] text-[#191c1d] animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6 mb-8 select-none">
        <div>
          <h2 className="font-['Hanken_Grotesk'] text-3xl font-bold tracking-tight text-gray-900">Pengaturan Akun</h2>
          <p className="text-gray-500 text-sm mt-1">Kelola informasi profil akun Anda</p>
        </div>
        <button type="button" onClick={handleSave} disabled={isSaving} className="px-5 py-2.5 bg-[#94442e] text-white font-medium text-sm hover:bg-[#7e3522] shadow-sm transition-all rounded-lg flex items-center gap-2 disabled:opacity-70">
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <span>Simpan Perubahan</span>
          )}
        </button>
      </div>

      <section className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 mb-6 text-[#94442e] border-b border-gray-100 pb-3">
          <span className="material-symbols-outlined">person</span>
          <h3 className="font-['Hanken_Grotesk'] text-lg font-bold">Profil Pengguna</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="font-bold text-xs text-gray-500 uppercase tracking-wider">Nama Lengkap</label>
            <input type="text" value={userNama} disabled className="w-full h-11 px-4 bg-gray-100 border border-gray-200 text-gray-400 rounded-lg text-sm cursor-not-allowed" />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-xs text-gray-500 uppercase tracking-wider">Peran (Role)</label>
            <input type="text" value={userRole} disabled className="w-full h-11 px-4 bg-gray-100 border border-gray-200 text-gray-400 rounded-lg text-sm cursor-not-allowed" />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-xs text-gray-500 uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-[#94442e] focus:ring-1 focus:ring-[#94442e] outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-xs text-gray-500 uppercase tracking-wider">Tanggal Lahir</label>
            <input
              type="date"
              value={tanggalLahir}
              onChange={(e) => setTanggalLahir(e.target.value)}
              className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:border-[#94442e] focus:ring-1 focus:ring-[#94442e] outline-none transition-all"
            />
          </div>

          <div className="space-y-2 sm:col-span-2 bg-gray-50 p-4 border border-gray-200 rounded-xl flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gray-200 border border-gray-300 flex items-center justify-center overflow-hidden shrink-0 relative group">
              {foto ? <img src={foto} alt="Preview" className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-gray-400 text-3xl">add_a_photo</span>}
              {foto && (
                <button type="button" onClick={() => setFoto("")} className="absolute inset-0 bg-black/50 text-white text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  Hapus
                </button>
              )}
            </div>
            <div>
              <label className="font-bold text-xs text-gray-700 uppercase tracking-wider block">Foto Profil</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="mt-2 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#94442e] file:text-white hover:file:bg-[#7e3522] file:cursor-pointer cursor-pointer"
              />
              <p className="text-[10px] text-gray-400 mt-1.5">Mendukung format JPG, PNG, atau WEBP. Maksimal ukuran 2MB.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
