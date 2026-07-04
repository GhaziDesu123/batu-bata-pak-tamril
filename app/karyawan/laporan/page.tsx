"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Home as HomeIcon, ClipboardPlus, History } from "lucide-react";

export default function SubmitReportPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [tanggal, setTanggal] = useState("");
  const [jumlahPalet, setJumlahPalet] = useState("");
  const [catatan, setCatatan] = useState("");
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingFoto, setIsUploadingFoto] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setTanggal(today);
  }, []);

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
      if (typeof reader.result === "string") {
        setFotoPreview(reader.result);
      }
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

    if (!res.ok) {
      throw new Error("Gagal mengupload foto ke server");
    }

    const data = await res.json();
    return data.secure_url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user) {
      toast.error("Sesi login tidak valid atau telah berakhir. Silakan login ulang.");
      return;
    }

    if (!fotoFile) {
      toast.error("Foto bukti produksi wajib diupload!");
      return;
    }

    setIsSubmitting(true);
    setIsUploadingFoto(true);

    try {
      const fotoUrl = await uploadFotoKeCloudinary(fotoFile);
      setIsUploadingFoto(false);

      const res = await fetch("/api/laporan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tanggal_laporan: tanggal,
          quantity: jumlahPalet,
          catatan,
          foto_url: fotoUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal mengirim laporan");
      }

      toast.success("Laporan berhasil dikirim dan menunggu persetujuan!");

      setJumlahPalet("");
      setCatatan("");
      setFotoFile(null);
      setFotoPreview(null);

      setTimeout(() => {
        router.push("/karyawan/riwayat");
      }, 1500);
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat mengirim laporan");
    } finally {
      setIsSubmitting(false);
      setIsUploadingFoto(false);
    }
  };

  return (
    <div className="pb-[160px]">
      <main className="pb-8 animate-in fade-in duration-500 max-w-screen-sm mx-auto">
        <section className="px-4 mt-6">
          <h2 className="text-lg font-bold">Kirim Laporan Produksi</h2>
          <p className="text-xs text-[#56423d] mt-0.5">Isi data produksi hari ini untuk diverifikasi pemilik</p>
        </section>

        <form className="mt-6 px-4 flex flex-col gap-6" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#56423d] px-1 tracking-wider uppercase" htmlFor="report-date">
              Tanggal Produksi
            </label>
            <div className="relative">
              <input
                className="w-full h-12 px-4 bg-white border border-[#dcc0ba] rounded-xl text-sm font-medium appearance-none outline-none focus:ring-2 focus:ring-[#9a4028]/20 focus:border-[#9a4028]"
                id="report-date"
                type="date"
                value={tanggal}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setTanggal(e.target.value)}
                required
              />
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#515f74]">calendar_today</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#56423d] px-1 tracking-wider uppercase" htmlFor="quantity">
              Jumlah Bata (Pcs)
            </label>
            <div className="relative">
              <input
                className="w-full h-12 px-4 bg-white border border-[#dcc0ba] rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#9a4028]/20 focus:border-[#9a4028]"
                id="quantity"
                inputMode="numeric"
                placeholder="0"
                type="number"
                value={jumlahPalet}
                onChange={(e) => setJumlahPalet(e.target.value)}
                min="1"
                required
              />
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#515f74]">inventory_2</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#56423d] px-1 tracking-wider uppercase">Foto Bukti Produksi</label>

            <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border-2 border-dashed border-[#dcc0ba] bg-[#edeeef] group cursor-pointer transition-all active:scale-[0.98]">
              {fotoPreview ? (
                <>
                  <img src={fotoPreview} alt="Preview foto produksi" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">Ganti Foto</span>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-t from-[#edeeef] via-transparent to-transparent">
                  <div className="w-16 h-16 rounded-full bg-[#9a4028] flex items-center justify-center mb-4 shadow-lg text-white">
                    <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      add_a_photo
                    </span>
                  </div>
                  <p className="text-lg font-bold text-[#191c1d]">Ketuk untuk Upload Foto</p>
                  <p className="text-xs text-[#56423d] mt-2">Pastikan bata terlihat jelas dan tersusun rapi</p>
                </div>
              )}
              <input accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" type="file" onChange={handleFotoChange} />
            </div>
            <p className="text-[11px] text-[#56423d] px-1">Format JPG, PNG, atau WEBP. Maksimal ukuran 2MB.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#56423d] px-1 tracking-wider uppercase" htmlFor="notes">
              Catatan Tambahan
            </label>
            <textarea
              className="w-full p-4 bg-white border border-[#dcc0ba] rounded-xl text-sm font-medium resize-none outline-none focus:ring-2 focus:ring-[#9a4028]/20 focus:border-[#9a4028]"
              id="notes"
              placeholder="Catatan kondisi produksi, kendala, dsb (opsional)"
              rows={3}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
            ></textarea>
          </div>

          <div className="mt-4">
            <button
              className="w-full h-[52px] bg-[#9a4028] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none hover:bg-[#b9573e]"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  {isUploadingFoto ? "Mengupload foto..." : "Mengirim laporan..."}
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">send</span> Kirim Laporan
                </>
              )}
            </button>
          </div>
        </form>
      </main>

      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 bg-white border-t border-[#dcc0ba] h-20">
        <Link href="/karyawan" className="flex flex-col items-center justify-center text-[#515f74] pt-2 w-20 transition-colors hover:text-[#9a4028]">
          <HomeIcon className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-wider mt-1">Beranda</span>
        </Link>
        <Link href="/karyawan/laporan" className="flex flex-col items-center justify-center text-[#9a4028] border-t-2 border-[#9a4028] pt-2 w-20 transition-colors">
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
