import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = Number((session.user as any).id);
    if (!userId) {
      return NextResponse.json({ message: "Session tidak valid" }, { status: 401 });
    }

    const body = await request.json();
    const { password_lama, password_baru, konfirmasi_password } = body;

    // Validasi input
    if (!password_lama || !password_baru || !konfirmasi_password) {
      return NextResponse.json({ message: "Semua field wajib diisi" }, { status: 400 });
    }

    if (password_baru.length < 6) {
      return NextResponse.json({ message: "Password baru minimal 6 karakter" }, { status: 400 });
    }

    if (password_baru !== konfirmasi_password) {
      return NextResponse.json({ message: "Konfirmasi password tidak cocok" }, { status: 400 });
    }

    if (password_lama === password_baru) {
      return NextResponse.json({ message: "Password baru tidak boleh sama dengan password lama" }, { status: 400 });
    }

    // Ambil user dari DB
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ message: "User tidak ditemukan" }, { status: 404 });
    }

    // Verifikasi password lama
    const isValid = await bcrypt.compare(password_lama, user.password);
    if (!isValid) {
      return NextResponse.json({ message: "Password lama tidak sesuai" }, { status: 400 });
    }

    // Hash password baru & simpan
    const hashedPassword = await bcrypt.hash(password_baru, 10);
    await prisma.users.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: "Password berhasil diubah" }, { status: 200 });
  } catch (error: any) {
    console.error("PUT Ubah Password Error:", error);
    return NextResponse.json({ message: "Terjadi kesalahan server", error: error.message }, { status: 500 });
  }
}
