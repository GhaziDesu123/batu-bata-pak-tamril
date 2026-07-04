// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Halaman khusus pemilik
    const pemilikRoutes = ["/dashboard"];
    const isPemilikRoute = pemilikRoutes.some((r) => path.startsWith(r));

    if (isPemilikRoute && token?.role !== "pemilik") {
      return NextResponse.redirect(new URL("/karyawan", req.url));
    }

    // Halaman khusus karyawan
    const karyawanRoutes = ["/karyawan"];
    const isKaryawanRoute = karyawanRoutes.some((r) => path.startsWith(r));

    if (isKaryawanRoute && token?.role !== "karyawan") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // Wajib login dulu
    },
    pages: {
      signIn: "/", // Kalau belum login, redirect ke halaman login (root)
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/karyawan/:path*"],
};
