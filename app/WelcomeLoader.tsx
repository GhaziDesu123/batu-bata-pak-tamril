"use client";
import React, { useState, useEffect } from "react";

interface WelcomeLoaderProps {
  onComplete: () => void;
}

export default function WelcomeLoader({ onComplete }: WelcomeLoaderProps) {
  const [text, setText] = useState("");
  const fullText = "Seelamat Datang di Sistem Manajemen Batu Bata...";

  useEffect(() => {
    let index = 0;
    // Mengatur kecepatan mengetik (per milidetik)
    const typingInterval = setInterval(() => {
      setText((prev) => prev + fullText.charAt(index));
      index++;

      if (index >= fullText.length) {
        clearInterval(typingInterval);

        // Kasih jeda 1.5 detik setelah selesai ngetik sebelum masuk dashboard
        setTimeout(() => {
          onComplete();
        }, 1500);
      }
    }, 60); // 60ms per huruf (bisa kamu kecilin kalau mau lebih cepet)

    return () => clearInterval(typingInterval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white transition-all duration-500">
      {/* Animasi Kursor Berkedip */}
      <style>{`
        @keyframes cursorBlink {
          50% { opacity: 0; }
        }
        .animate-cursor {
          animation: cursorBlink 0.8s step-end infinite;
        }
      `}</style>

      <div className="flex flex-col items-center gap-6 max-w-md px-6 text-center">
        {/* Logo Bata 3D Glowing ala Cyberpunk Industrial */}
        <div className="relative w-20 h-10 bg-orange-600 rounded-sm border-b-4 border-r-2 border-orange-800 shadow-[0_0_40px_rgba(234,88,12,0.6)] animate-pulse mb-2">
          <div className="absolute inset-0 border-t border-l border-orange-400 rounded-sm"></div>
        </div>

        {/* Box Teks Mengetik (Aman & Responsif di HP) */}
        <div className="min-h-[60px] flex items-center justify-center">
          <h1 className="text-lg md:text-xl font-mono tracking-wider text-orange-400 font-bold">
            {text}
            <span className="inline-block w-2 h-5 bg-orange-500 ml-1 animate-cursor">|</span>
          </h1>
        </div>

        {/* Teks Subtitle Kecil */}
        <p className="text-xs text-slate-500 font-sans tracking-widest uppercase animate-pulse mt-4">Loading Server....</p>
      </div>
    </div>
  );
}
