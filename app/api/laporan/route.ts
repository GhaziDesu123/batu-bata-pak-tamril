// app/api/laporan/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST — Karyawan submit laporan produksi baru
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tanggal_laporan, quantity, catatan, foto_url } = body;

    if (!tanggal_laporan || !quantity) {
      return NextResponse.json({ message: "Data laporan tidak lengkap" }, { status: 400 });
    }

    // Cari data karyawan berdasarkan nama user yang sedang login
    const namaUser = session.user.name;
    if (!namaUser) {
      return NextResponse.json({ message: "Nama user tidak valid" }, { status: 400 });
    }

    const karyawan = await prisma.karyawan.findFirst({
      where: { nama: namaUser },
    });
    if (!karyawan) {
      return NextResponse.json({ message: `Data karyawan dengan nama "${namaUser}" tidak ditemukan. Hubungi pemilik untuk memastikan data karyawan sudah benar.` }, { status: 404 });
    }

    const laporan = await prisma.laporanProduksi.create({
      data: {
        id_karyawan: karyawan.id,
        tanggal_laporan: new Date(tanggal_laporan),
        quantity: parseInt(quantity),
        foto: foto_url || "https://placehold.co/600x400",
        status: "pending",
        rejection_note: catatan || null,
      },
    });

    return NextResponse.json({ message: "Laporan berhasil dikirim", data: laporan }, { status: 201 });
  } catch (error: any) {
    console.error("POST Laporan Error:", error);
    return NextResponse.json({ message: "Terjadi kesalahan server", error: error.message }, { status: 500 });
  }
}

// GET — Ambil laporan milik karyawan yang login (untuk halaman riwayat)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const namaUser = session.user.name;
    if (!namaUser) {
      return NextResponse.json({ message: "Nama user tidak valid" }, { status: 400 });
    }

    const karyawan = await prisma.karyawan.findFirst({
      where: { nama: namaUser },
    });

    if (!karyawan) {
      return NextResponse.json([], { status: 200 });
    }

    const laporan = await prisma.laporanProduksi.findMany({
      where: { id_karyawan: karyawan.id },
      orderBy: { created_at: "desc" },
    });

    const mapped = laporan.map((item) => ({
      id: item.id,
      tanggal_laporan: item.tanggal_laporan.toISOString().split("T")[0],
      quantity: item.quantity,
      foto: item.foto,
      status: item.status,
      rejection_note: item.rejection_note,
      created_at: item.created_at.toISOString(),
    }));

    return NextResponse.json(mapped, { status: 200 });
  } catch (error: any) {
    console.error("GET Laporan Error:", error);
    return NextResponse.json({ message: "Terjadi kesalahan server", error: error.message }, { status: 500 });
  }
}
