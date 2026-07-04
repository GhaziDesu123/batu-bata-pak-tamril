import React from "react";

export default function DashboardLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50/70 backdrop-blur-sm transition-all duration-300">
      {/* Inject Style khusus untuk animasi progress bar di bawah agar zero-config (tanpa edit tailwind.config.js) */}
      <style>{`
        @keyframes customShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-shimmer {
          animation: customShimmer 1.5s infinite linear;
        }
      `}</style>

      <div className="flex flex-col items-center gap-5 bg-white p-8 rounded-2xl border border-slate-100 shadow-2xl max-w-xs w-full text-center">
        {/* ANIMASI BATU BATA BERGANTIAN */}
        <div className="flex flex-col items-center justify-center gap-1 h-16">
          {/* Baris Atas (Bata Kunci Tengah) */}
          <div className="w-12 h-6 bg-orange-600 rounded-sm border-b-2 border-orange-800 shadow-sm animate-bounce [animation-delay:0.4s]"></div>

          {/* Baris Bawah (Dua Bata Berdampingan) */}
          <div className="flex gap-1">
            <div className="w-12 h-6 bg-orange-500 rounded-sm border-b-2 border-orange-700 shadow-sm animate-bounce [animation-delay:0s]"></div>
            <div className="w-12 h-6 bg-orange-500 rounded-sm border-b-2 border-orange-700 shadow-sm animate-bounce [animation-delay:0.2s]"></div>
          </div>
        </div>

        {/* TEKS PROSES */}
        <div className="space-y-1">
          <p className="text-xs text-slate-500 animate-pulse">Memuat data halaman, tunggu bentar bro</p>
        </div>

        {/* Progress Bar Tipis Eksklusif di Bagian Bawah */}
        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden relative">
          <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full animate-shimmer"></div>
        </div>
      </div>
    </div>
  );
}
