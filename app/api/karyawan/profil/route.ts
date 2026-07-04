import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PUT — Karyawan update profil sendiri (tlp, alamat, foto, email, tanggal_lahir)
// Catatan: nama SENGAJA tidak bisa diubah dari sini, karena banyak query lain
// mencari data karyawan berdasarkan kecocokan nama dengan session aktif.
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tlp, alamat, foto_url, email, tanggal_lahir } = body;

    const namaUser = session.user.name;
    const userId = (session.user as any).id;

    if (!namaUser) {
      return NextResponse.json({ message: "Nama user tidak valid" }, { status: 400 });
    }

    const karyawan = await prisma.karyawan.findFirst({ where: { nama: namaUser } });
    if (!karyawan) {
      return NextResponse.json({ message: "Data karyawan tidak ditemukan" }, { status: 404 });
    }

    const usersRecord = userId ? await prisma.users.findUnique({ where: { id: Number(userId) } }) : await prisma.users.findFirst({ where: { nama: namaUser } });

    if (!usersRecord) {
      return NextResponse.json({ message: "Data akun tidak ditemukan" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.karyawan.update({
        where: { id: karyawan.id },
        data: {
          tlp: tlp || null,
          alamat: alamat || null,
        },
      });

      await tx.userProfile.upsert({
        where: { user_id: usersRecord.id },
        update: {
          ...(foto_url && { foto: foto_url }),
          email: email || null,
          tanggal_lahir: tanggal_lahir ? new Date(tanggal_lahir) : null,
        },
        create: {
          user_id: usersRecord.id,
          foto: foto_url || null,
          email: email || null,
          tanggal_lahir: tanggal_lahir ? new Date(tanggal_lahir) : null,
        },
      });
    });

    return NextResponse.json({ message: "Profil berhasil diperbarui" }, { status: 200 });
  } catch (error: any) {
    console.error("PUT Profil Karyawan Error:", error);
    return NextResponse.json({ message: "Terjadi kesalahan server", error: error.message }, { status: 500 });
  }
}
