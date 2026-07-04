"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { ArrowLeft, Home as HomeIcon, ClipboardPlus, History, User } from "lucide-react";

interface ProfilData {
  nama: string;
  tlp: string;
  alamat: string;
  foto: string | null;
  email: string;
  tanggal_lahir: string;
}

export default function ProfilClientPage({ initialData }: { initialData: ProfilData }) {
  const router = useRouter();

  const [tlp, setTlp] = useState(initialData.tlp);
  const [alamat, setAlamat] = useState(initialData.alamat);
  const [email, setEmail] = useState(initialData.email);
  const [tanggalLahir, setTanggalLahir] = useState(initialData.tanggal_lahir);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(initialData.foto);
  const [isSaving, setIsSaving] = useState(false);

  // === STATE UBAH PASSWORD ===
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordLama, setPasswordLama] = useState("");
  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasiPassword, setKonfirmasiPassword] = useState("");
  const [showLama, setShowLama] = useState(false);
  const [showBaru, setShowBaru] = useState(false);
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 2MB!");
      e.target.value = "";
      return;
    }
    setFotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") setFotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const uploadFotoKeCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Gagal mengupload foto ke server");
    const data = await res.json();
    return data.secure_url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Format email tidak valid");
      return;
    }
    setIsSaving(true);
    try {
      let fotoUrl: string | undefined;
      if (fotoFile) {
        fotoUrl = await uploadFotoKeCloudinary(fotoFile);
      }
      const res = await fetch("/api/karyawan/profil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tlp, alamat, foto_url: fotoUrl, email, tanggal_lahir: tanggalLahir }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal menyimpan profil");
      toast.success("Profil berhasil diperbarui!");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat menyimpan");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUbahPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/karyawan/ubah-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password_lama: passwordLama,
          password_baru: passwordBaru,
          konfirmasi_password: konfirmasiPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mengubah password");
      toast.success("Password berhasil diubah!");
      setShowPasswordModal(false);
      setPasswordLama("");
      setPasswordBaru("");
      setKonfirmasiPassword("");
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="pb-32">
      <div className="flex items-center gap-4 px-4 h-12 bg-[#f8f9fa] border-b border-[#dcc0ba]">
        <button onClick={() => router.back()} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#f3f4f5] transition-colors active:scale-95">
          <ArrowLeft className="w-5 h-5 text-[#56423d]" />
        </button>
        <h1 className="font-semibold text-[#56423d]">Edit Profil</h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-screen-sm mx-auto">
        {/* FOTO PROFIL */}
        <section className="flex flex-col items-center py-8 bg-white">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full border-4 border-[#dcc0ba] overflow-hidden bg-[#e7e8e9] flex items-center justify-center">
              {fotoPreview ? <img src={fotoPreview} alt={initialData.nama} className="w-full h-full object-cover" /> : <span className="text-4xl font-bold text-[#9a4028]">{initialData.nama.charAt(0).toUpperCase()}</span>}
            </div>
            <label className="absolute bottom-0 right-0 w-10 h-10 bg-[#9a4028] text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer">
              <span className="material-symbols-outlined text-sm">photo_camera</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFotoChange} />
            </label>
          </div>
          <label className="mt-4 px-4 py-2 text-[#9a4028] text-xs font-bold uppercase tracking-wider hover:underline cursor-pointer">
            Ubah Foto
            <input type="file" accept="image/*" className="hidden" onChange={handleFotoChange} />
          </label>
        </section>

        {/* FORM FIELDS */}
        <section className="px-4 space-y-6 mt-6">
          {/* NAMA — locked */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold tracking-wider text-[#56423d] ml-1">NAMA LENGKAP</label>
            <div className="relative border border-[#dcc0ba] bg-[#f3f4f5] rounded-lg flex items-center px-4 h-12 opacity-75">
              <span className="material-symbols-outlined text-[#56423d] mr-3 text-lg">badge</span>
              <input type="text" value={initialData.nama} disabled className="w-full bg-transparent border-none outline-none text-sm font-medium text-[#191c1d] cursor-not-allowed" />
              <span className="material-symbols-outlined text-[#56423d] text-sm ml-2">lock</span>
            </div>
            <p className="text-[10px] text-[#56423d] ml-1 italic">*Nama diatur oleh admin, hubungi pemilik untuk mengubah</p>
          </div>

          {/* NOMOR TELEPON */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold tracking-wider text-[#56423d] ml-1">NOMOR TELEPON</label>
            <div className="relative border border-[#dcc0ba] bg-white rounded-lg flex items-center px-4 h-12 focus-within:border-[#9a4028] focus-within:ring-2 focus-within:ring-[#9a4028]/20 transition-all">
              <span className="material-symbols-outlined text-[#56423d] mr-3 text-lg">phone_iphone</span>
              <input type="tel" value={tlp} onChange={(e) => setTlp(e.target.value)} placeholder="08xx xxxx xxxx" className="w-full bg-transparent border-none outline-none text-sm font-medium text-[#191c1d]" />
            </div>
          </div>

          {/* EMAIL */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold tracking-wider text-[#56423d] ml-1">ALAMAT EMAIL</label>
            <div className="relative border border-[#dcc0ba] bg-white rounded-lg flex items-center px-4 h-12 focus-within:border-[#9a4028] focus-within:ring-2 focus-within:ring-[#9a4028]/20 transition-all">
              <span className="material-symbols-outlined text-[#56423d] mr-3 text-lg">mail</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" className="w-full bg-transparent border-none outline-none text-sm font-medium text-[#191c1d]" />
            </div>
          </div>

          {/* TANGGAL LAHIR */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold tracking-wider text-[#56423d] ml-1">TANGGAL LAHIR</label>
            <div className="relative border border-[#dcc0ba] bg-white rounded-lg flex items-center px-4 h-12 focus-within:border-[#9a4028] focus-within:ring-2 focus-within:ring-[#9a4028]/20 transition-all">
              <span className="material-symbols-outlined text-[#56423d] mr-3 text-lg">cake</span>
              <input
                type="date"
                value={tanggalLahir}
                onChange={(e) => setTanggalLahir(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="w-full bg-transparent border-none outline-none text-sm font-medium text-[#191c1d]"
              />
            </div>
          </div>

          {/* ALAMAT */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold tracking-wider text-[#56423d] ml-1">ALAMAT DOMISILI</label>
            <div className="relative border border-[#dcc0ba] bg-white rounded-lg flex items-start py-3 px-4 min-h-[100px] focus-within:border-[#9a4028] focus-within:ring-2 focus-within:ring-[#9a4028]/20 transition-all">
              <span className="material-symbols-outlined text-[#56423d] mr-3 mt-1 text-lg">location_on</span>
              <textarea value={alamat} onChange={(e) => setAlamat(e.target.value)} placeholder="Jl. ..." rows={3} className="w-full bg-transparent border-none outline-none text-sm font-medium text-[#191c1d] resize-none" />
            </div>
          </div>
        </section>

        {/* TOMBOL SIMPAN PROFIL */}
        <div className="px-4 mt-10">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full h-[52px] bg-[#9a4028] text-white font-bold text-sm uppercase tracking-wider rounded-xl shadow-md hover:bg-[#b9573e] transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isSaving ? (
              <>
                <span className="material-symbols-outlined animate-spin">progress_activity</span> Menyimpan...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">save</span> Simpan Perubahan
              </>
            )}
          </button>
        </div>

        {/* TOMBOL UBAH PASSWORD */}
        <div className="px-4 mt-3 mb-6">
          <button
            type="button"
            onClick={() => setShowPasswordModal(true)}
            className="w-full h-[52px] bg-white border-2 border-[#9a4028] text-[#9a4028] font-bold text-sm uppercase tracking-wider rounded-xl hover:bg-[#9a4028]/5 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">lock_reset</span>
            Ubah Password
          </button>
        </div>
      </form>

      {/* MODAL UBAH PASSWORD */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)} />
          <div className="relative z-10 bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl animate-in slide-in-from-bottom duration-300">
            {/* HEADER MODAL */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-[#dcc0ba]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#9a4028]">lock_reset</span>
                <p className="font-bold text-[#191c1d]">Ubah Password</p>
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#f3f4f5]">
                <span className="material-symbols-outlined text-[#56423d]">close</span>
              </button>
            </div>

            {/* FORM UBAH PASSWORD */}
            <form onSubmit={handleUbahPassword} className="p-5 space-y-4">
              {/* PASSWORD LAMA */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold tracking-wider text-[#56423d] ml-1">PASSWORD LAMA</label>
                <div className="relative border border-[#dcc0ba] bg-white rounded-lg flex items-center px-4 h-12 focus-within:border-[#9a4028] focus-within:ring-2 focus-within:ring-[#9a4028]/20 transition-all">
                  <span className="material-symbols-outlined text-[#56423d] mr-3 text-lg">lock</span>
                  <input
                    type={showLama ? "text" : "password"}
                    value={passwordLama}
                    onChange={(e) => setPasswordLama(e.target.value)}
                    placeholder="Masukkan password saat ini"
                    required
                    className="w-full bg-transparent border-none outline-none text-sm font-medium text-[#191c1d]"
                  />
                  <button type="button" onClick={() => setShowLama(!showLama)} className="ml-2 text-[#56423d]">
                    <span className="material-symbols-outlined text-lg">{showLama ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
              </div>

              {/* PASSWORD BARU */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold tracking-wider text-[#56423d] ml-1">PASSWORD BARU</label>
                <div className="relative border border-[#dcc0ba] bg-white rounded-lg flex items-center px-4 h-12 focus-within:border-[#9a4028] focus-within:ring-2 focus-within:ring-[#9a4028]/20 transition-all">
                  <span className="material-symbols-outlined text-[#56423d] mr-3 text-lg">lock_open</span>
                  <input
                    type={showBaru ? "text" : "password"}
                    value={passwordBaru}
                    onChange={(e) => setPasswordBaru(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    required
                    className="w-full bg-transparent border-none outline-none text-sm font-medium text-[#191c1d]"
                  />
                  <button type="button" onClick={() => setShowBaru(!showBaru)} className="ml-2 text-[#56423d]">
                    <span className="material-symbols-outlined text-lg">{showBaru ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
              </div>

              {/* KONFIRMASI PASSWORD */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold tracking-wider text-[#56423d] ml-1">KONFIRMASI PASSWORD BARU</label>
                <div
                  className={`relative border bg-white rounded-lg flex items-center px-4 h-12 focus-within:ring-2 transition-all ${
                    konfirmasiPassword && konfirmasiPassword !== passwordBaru ? "border-red-400 focus-within:ring-red-400/20" : "border-[#dcc0ba] focus-within:border-[#9a4028] focus-within:ring-[#9a4028]/20"
                  }`}
                >
                  <span className="material-symbols-outlined text-[#56423d] mr-3 text-lg">lock_open</span>
                  <input
                    type={showKonfirmasi ? "text" : "password"}
                    value={konfirmasiPassword}
                    onChange={(e) => setKonfirmasiPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                    required
                    className="w-full bg-transparent border-none outline-none text-sm font-medium text-[#191c1d]"
                  />
                  <button type="button" onClick={() => setShowKonfirmasi(!showKonfirmasi)} className="ml-2 text-[#56423d]">
                    <span className="material-symbols-outlined text-lg">{showKonfirmasi ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
                {konfirmasiPassword && konfirmasiPassword !== passwordBaru && <p className="text-[10px] text-red-500 ml-1">Password tidak cocok</p>}
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={isChangingPassword || (konfirmasiPassword !== "" && konfirmasiPassword !== passwordBaru)}
                className="w-full h-[52px] bg-[#9a4028] text-white font-bold text-sm uppercase tracking-wider rounded-xl shadow-md hover:bg-[#b9573e] transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
              >
                {isChangingPassword ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span> Menyimpan...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">check_circle</span> Simpan Password Baru
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 bg-white border-t border-[#dcc0ba] h-20">
        <Link href="/karyawan" className="flex flex-col items-center justify-center text-[#515f74] pt-2 w-20 transition-colors hover:text-[#9a4028]">
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
        <Link href="/karyawan/profil" className="flex flex-col items-center justify-center text-[#9a4028] border-t-2 border-[#9a4028] pt-2 w-20 transition-colors">
          <User className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-wider mt-1">Profil</span>
        </Link>
      </nav>
    </div>
  );
}
