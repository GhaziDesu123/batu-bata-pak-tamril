// app/api/profile/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET — Ambil profile user yang sedang login
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt((session.user as any).id);

  const profile = await prisma.userProfile.findUnique({
    where: { user_id: userId },
  });

  return NextResponse.json({
    foto: profile?.foto || null,
    email: profile?.email || null,
    tanggal_lahir: profile?.tanggal_lahir || null,
  });
}

// PUT — Update profile user yang sedang login
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt((session.user as any).id);
  const body = await request.json();

  const { foto, email, tanggal_lahir } = body;

  const updated = await prisma.userProfile.upsert({
    where: { user_id: userId },
    update: {
      foto: foto !== undefined ? foto : undefined,
      email: email !== undefined ? email : undefined,
      tanggal_lahir: tanggal_lahir ? new Date(tanggal_lahir) : undefined,
    },
    create: {
      user_id: userId,
      foto: foto || null,
      email: email || null,
      tanggal_lahir: tanggal_lahir ? new Date(tanggal_lahir) : null,
    },
  });

  return NextResponse.json({ success: true, profile: updated });
}
