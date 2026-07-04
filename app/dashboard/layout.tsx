"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

interface ProfileData {
  foto: string | null;
  email: string | null;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Redirect kalau belum login
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Ambil data foto profil dari API (table user_profile)
  useEffect(() => {
    if (session?.user) {
      fetch("/api/profile")
        .then((res) => res.json())
        .then((data) => setProfile(data))
        .catch(() => setProfile(null));
    }
  }, [session]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setCurrentDate(now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);

    return () => {
      clearInterval(interval);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const confirmLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  if (status === "loading" || !session) return null;

  const userNama = session.user?.name || "Pengguna";
  const userRole = (session.user as any)?.role === "pemilik" ? "Pemilik" : "Karyawan";

  const menuItems = [
    { name: "Dashboard", icon: "dashboard", href: "/dashboard" },
    { name: "Manajemen Produksi", icon: "factory", href: "/dashboard/produksi" },
    { name: "Data Karyawan", icon: "group", href: "/dashboard/karyawan" },
    { name: "Transaksi Penjualan", icon: "payments", href: "/dashboard/penjualan" },
    { name: "Data Pengeluaran", icon: "receipt_long", href: "/dashboard/pengeluaran" },
    { name: "Data Penggajian", icon: "account_balance_wallet", href: "/dashboard/gaji" },
    { name: "Manajemen Stok", icon: "inventory_2", href: "/dashboard/stok" },
    { name: "Laporan", icon: "assessment", href: "/dashboard/laporan" },
  ];

  return (
    <div className="font-['Work_Sans'] text-gray-900 bg-gray-50 min-h-screen relative">
      <aside className="bg-[#1a1a1e] h-screen w-64 fixed left-0 top-0 border-r border-gray-800 flex flex-col z-50 select-none">
        <div className="p-5 border-b border-gray-800/60 bg-[#151518]/50 flex items-center gap-3.5 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-[#94442e] flex items-center justify-center shadow-md shadow-[#94442e]/20 border border-[#b35c44]/30 shrink-0">
            <span className="material-symbols-outlined text-white text-xl font-bold tracking-tighter">grid_view</span>
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="font-['Hanken_Grotesk'] text-[15px] font-black text-white tracking-tight leading-tight truncate">
              Batu Bata <span className="text-[#94442e] font-extrabold">Pak Tamril</span>
            </h1>
            <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-widest mt-0.5 whitespace-nowrap">Sistem Informasi</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col justify-between">
          <div className="p-4">
            <p className="text-gray-600 text-[10px] font-bold uppercase mb-2 tracking-widest px-4">Menu Utama</p>
            <div className="space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-4 py-2.5 transition-all duration-200 rounded-xl group ${
                      isActive ? "bg-[#94442e] text-white font-bold shadow-md shadow-[#94442e]/20 translate-x-1" : "text-gray-400 hover:bg-[#2d2d34] hover:text-white hover:translate-x-1"
                    }`}
                  >
                    <span className={`material-symbols-outlined mr-3 transition-colors text-lg ${isActive ? "text-white" : "text-gray-400 group-hover:text-white"}`}>{item.icon}</span>
                    <span className="text-sm tracking-wide">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="p-4 bg-[#141417] border-t border-gray-800/40 mt-auto shrink-0">
            <p className="text-gray-600 text-[10px] font-bold uppercase mb-2 tracking-widest px-4">Lainnya</p>
            <div className="space-y-1">
              <Link
                href="/dashboard/settings"
                className={`flex items-center px-4 py-2.5 transition-all duration-200 rounded-xl group ${
                  pathname === "/dashboard/settings" ? "bg-[#94442e] text-white font-bold shadow-md translate-x-1" : "text-gray-400 hover:bg-[#2d2d34] hover:text-white hover:translate-x-1"
                }`}
              >
                <span className="material-symbols-outlined mr-3 text-lg text-gray-400 group-hover:text-white">settings</span>
                <span className="text-sm tracking-wide">Pengaturan</span>
              </Link>

              <button
                onClick={() => setIsLogoutModalOpen(true)}
                className="w-full text-red-400 flex items-center px-4 py-2.5 transition-all duration-200 rounded-xl hover:bg-red-950/30 hover:text-red-300 hover:translate-x-1 text-left cursor-pointer"
              >
                <span className="material-symbols-outlined mr-3 text-lg text-red-400/80">logout</span>
                <span className="text-sm font-semibold tracking-wide">Keluar</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="ml-64 flex flex-col min-h-screen relative">
        <header className="bg-white h-16 px-6 sticky top-0 z-40 flex justify-between items-center border-b border-gray-200 shadow-xs select-none">
          <div className="flex items-center gap-4">
            <h2 className="font-['Hanken_Grotesk'] text-xl font-black text-gray-800 tracking-tight">{menuItems.find((i) => i.href === pathname)?.name || "Dashboard"}</h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col text-right border-r border-gray-200 pr-5">
              <span className="text-xs font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-md font-mono self-end shadow-3xs">{currentTime || "00:00:00"}</span>
              <span className="text-[10px] text-gray-400 font-medium mt-0.5">{currentDate || "Memuat tanggal..."}</span>
            </div>

            <div className="relative select-none" ref={dropdownRef}>
              <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 cursor-pointer group outline-none">
                <div className="text-right hidden sm:block min-w-[100px]">
                  <p className="text-sm font-black leading-none text-gray-800 tracking-tight truncate group-hover:text-[#94442e] transition-colors">{userNama}</p>
                  <p className="text-[9px] uppercase text-gray-400 font-extrabold tracking-widest mt-1 bg-gray-100 px-1.5 py-0.5 rounded-sm inline-block max-w-full truncate">{userRole}</p>
                </div>

                <div className="w-9 h-9 rounded-xl bg-[#94442e] flex items-center justify-center text-white font-black shadow-md shadow-[#94442e]/10 border border-[#b35c44]/20 border-t-transparent tracking-tighter group-hover:scale-105 transition-transform overflow-hidden">
                  {profile?.foto ? <img src={profile.foto} alt={userNama} className="w-full h-full object-cover" /> : userNama.charAt(0).toUpperCase()}
                </div>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-fadeIn">
                  <div className="px-4 py-2 border-b border-gray-50 sm:hidden">
                    <p className="text-xs font-bold text-gray-800 truncate">{userNama}</p>
                    <p className="text-[10px] uppercase text-gray-400 font-extrabold tracking-wider mt-0.5">{userRole}</p>
                  </div>

                  <Link href="/dashboard/settings" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <span className="material-symbols-outlined text-lg text-gray-400">settings</span>
                    <span>Pengaturan Akun</span>
                  </Link>

                  <div className="border-t border-gray-50 my-1" />

                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      setIsLogoutModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg text-red-500">logout</span>
                    <span className="font-semibold">Keluar</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="p-6 flex-1 bg-gray-50">{children}</div>
      </main>

      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 select-none">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300" onClick={() => setIsLogoutModalOpen(false)} />
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full relative z-10 shadow-2xl border border-gray-100 text-center transform transition-all duration-300 scale-100">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-100">
              <span className="material-symbols-outlined text-2xl font-bold">logout</span>
            </div>
            <h3 className="font-['Hanken_Grotesk'] text-lg font-black text-gray-900 tracking-tight">Konfirmasi Keluar</h3>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed px-2">
              Apakah Anda yakin ingin keluar? Sesi aktif Anda di <span className="font-semibold text-gray-700">Sistem Pak Tamril</span> akan berakhir.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button onClick={() => setIsLogoutModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
                Batal
              </button>
              <button onClick={confirmLogout} className="px-4 py-2.5 rounded-xl bg-red-600 text-sm font-bold text-white shadow-md shadow-red-600/10 hover:bg-red-700 transition-colors cursor-pointer">
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
