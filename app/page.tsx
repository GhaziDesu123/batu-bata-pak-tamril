"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "react-hot-toast";
import WelcomeLoader from "./WelcomeLoader";

const loginSchema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [userRole, setUserRole] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        username: data.username,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Username atau password salah. Silakan coba lagi.");
        toast.error("Username atau password salah", {
          style: {
            fontFamily: "'Work_Sans', sans-serif",
            fontSize: "14px",
            fontWeight: "600",
            borderRadius: "12px",
          },
        });
        return;
      }

      // Ambil session terbaru untuk dapat nama & role user
      const sessionRes = await fetch("/api/auth/session");
      const sessionData = await sessionRes.json();
      const role = sessionData?.user?.role || "pemilik";
      const nama = sessionData?.user?.name || "Pengguna";

      setUserRole(role);

      toast.success(`Selamat datang kembali, ${nama}! 👋`, {
        duration: 3000,
        style: {
          fontFamily: "'Work_Sans', sans-serif",
          fontSize: "14px",
          fontWeight: "600",
          borderRadius: "12px",
          background: "#1c1c21",
          color: "#fff",
        },
        iconTheme: {
          primary: "#94442e",
          secondary: "#fff",
        },
      });

      // Jalankan animasi welcome setelah toast kelihatan dulu
      setTimeout(() => {
        setShowWelcome(true);
      }, 300);
    } catch {
      const msg = "Terjadi kesalahan koneksi";
      setError(msg);
      toast.error(msg, {
        style: {
          fontFamily: "'Work_Sans', sans-serif",
          fontSize: "14px",
          fontWeight: "600",
          borderRadius: "12px",
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-screen flex items-center justify-center bg-gray-50 overflow-hidden bg-[radial-gradient(#dbc1ba_0.6px,transparent_0.6px)] bg-[size:20px_20px] font-['Work_Sans'] text-gray-900">
      {showWelcome && (
        <WelcomeLoader
          onComplete={() => {
            if (userRole === "karyawan") {
              router.push("/karyawan");
            } else {
              router.push("/dashboard");
            }
            router.refresh();
          }}
        />
      )}

      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-[#94442e]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-[#e2c19b]/10 rounded-full blur-3xl"></div>
      </div>

      <main className="relative z-10 w-full max-w-md px-4 animate-fadeIn">
        <div className="text-center mb-8 select-none">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#94442e] rounded-2xl mb-4 shadow-lg shadow-[#94442e]/20 border border-[#b35c44]/30">
            <span className="material-symbols-outlined text-white text-2xl font-bold tracking-tighter">grid_view</span>
          </div>
          <h1 className="font-['Hanken_Grotesk'] text-2.5xl font-black text-[#1a1a1e] tracking-tight leading-tight">
            Batu Bata <span className="text-[#94442e]">Pak Tamril</span>
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Sistem Informasi Manajemen</p>
        </div>

        <div className="bg-white border border-gray-200/80 shadow-xl rounded-2xl p-8 backdrop-blur-xs">
          <div className="mb-6">
            <h2 className="font-['Hanken_Grotesk'] text-xl font-black text-gray-800 tracking-tight">Selamat Datang</h2>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Silakan masuk untuk mengelola operasional produksi.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider ml-0.5" htmlFor="username">
                Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-gray-400 text-[18px] group-focus-within:text-[#94442e] transition-colors">person</span>
                </div>
                <input
                  className="block w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm transition-all focus:bg-white focus:ring-2 focus:ring-[#94442e]/20 focus:border-[#94442e] outline-none font-medium text-gray-800 placeholder-gray-400"
                  id="username"
                  type="text"
                  placeholder="Masukkan username Anda"
                  {...register("username")}
                  onChange={(e) => {
                    register("username").onChange(e);
                    setError(null);
                  }}
                />
              </div>
              {errors.username && <p className="text-xs text-red-500 ml-1">{errors.username.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-0.5">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider" htmlFor="password">
                  Password
                </label>
                <a className="text-xs font-semibold text-[#94442e] hover:underline" href="#">
                  Lupa password?
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-gray-400 text-[18px] group-focus-within:text-[#94442e] transition-colors">lock</span>
                </div>
                <input
                  className="block w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-xl text-sm transition-all focus:bg-white focus:ring-2 focus:ring-[#94442e]/20 focus:border-[#94442e] outline-none font-medium text-gray-800 placeholder-gray-400"
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  onChange={(e) => {
                    register("password").onChange(e);
                    setError(null);
                  }}
                />
              </div>
              {errors.password && <p className="text-xs text-red-500 ml-1">{errors.password.message}</p>}
            </div>

            {error && (
              <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-100 text-red-600 rounded-xl">
                <span className="material-symbols-outlined text-[18px] font-bold">error</span>
                <p className="text-xs font-semibold leading-snug">{error}</p>
              </div>
            )}

            <button
              className="w-full h-11 bg-[#94442e] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-[#7e3522] hover:shadow-lg hover:shadow-[#94442e]/20 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none cursor-pointer mt-2 shadow-md text-sm tracking-wide"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Memverifikasi Sesi...</span>
                </>
              ) : (
                <>
                  <span>Masuk Sistem</span>
                  <span className="material-symbols-outlined text-[18px]">login</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center select-none">
            <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
              Akses terbatas hanya untuk staf berwenang. <br />
              Batu Bata Pak Tamril © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
