"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { Toaster } from "react-hot-toast";

export default function KaryawanLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const namaKaryawan = session?.user?.name || "Staf";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const confirmLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <div className="bg-[#f8f9fa] text-[#191c1d] min-h-screen font-sans">
      <header className="w-full top-0 sticky z-50 bg-[#f8f9fa] border-b border-[#dcc0ba]">
        <div className="flex justify-between items-center px-4 h-12 max-w-screen-xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#9a4028] flex items-center justify-center shadow-md shadow-[#9a4028]/20 border border-[#b9573e]/30 shrink-0">
              <span className="material-symbols-outlined text-white text-lg font-bold tracking-tighter">grid_view</span>
            </div>
            <span className="font-semibold text-lg text-[#9d422b]">Batu Bata Pak Tamril</span>
          </div>

          <div className="flex items-center gap-2">
            <button className="w-10 h-10 flex items-center justify-center text-[#9a4028] active:scale-95 transition-transform duration-150 hover:bg-[#f3f4f5] rounded-full">
              <Bell className="w-5 h-5" />
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-9 h-9 rounded-full bg-[#9a4028] flex items-center justify-center text-white font-bold text-sm border border-[#b9573e]/30 hover:scale-105 transition-transform"
              >
                {namaKaryawan.charAt(0).toUpperCase()}
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-fadeIn">
                  <div className="px-4 py-2 border-b border-gray-50">
                    <p className="text-sm font-bold text-gray-800 truncate">{namaKaryawan}</p>
                    <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mt-0.5">Karyawan</p>
                  </div>

                  <Link href="/karyawan/profil" onClick={() => setIsDropdownOpen(false)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <span className="material-symbols-outlined text-lg text-gray-400">person</span>
                    <span className="font-semibold">Edit Profil</span>
                  </Link>

                  <div className="border-t border-gray-50 my-1" />

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
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
        </div>
      </header>

      {children}

      {/* TOASTER — ini yang bikin toast.success/error keliatan */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#fff",
            color: "#191c1d",
            border: "1px solid #dcc0ba",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: "600",
          },
          success: {
            iconTheme: {
              primary: "#9a4028",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ba1a1a",
              secondary: "#fff",
            },
          },
        }}
      />

      {/* Modal Konfirmasi Logout */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsLogoutModalOpen(false)} />
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full relative z-10 shadow-2xl border border-gray-100 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-100">
              <span className="material-symbols-outlined text-2xl font-bold">logout</span>
            </div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Konfirmasi Keluar</h3>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed px-2">Apakah Anda yakin ingin keluar dari sistem?</p>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button onClick={() => setIsLogoutModalOpen(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                Batal
              </button>
              <button onClick={confirmLogout} className="px-4 py-2.5 rounded-xl bg-red-600 text-sm font-bold text-white shadow-md hover:bg-red-700 transition-colors">
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
