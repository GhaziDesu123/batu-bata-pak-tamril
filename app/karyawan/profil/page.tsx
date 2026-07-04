import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ProfilClientPage from "./ProfilClientPage";

export default async function ProfilPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const namaUser = session.user.name || "";
  const userId = (session.user as any).id;

  const karyawan = await prisma.karyawan.findFirst({ where: { nama: namaUser } });

  const usersRecord = userId ? await prisma.users.findUnique({ where: { id: Number(userId) }, include: { profile: true } }) : await prisma.users.findFirst({ where: { nama: namaUser }, include: { profile: true } });

  const initialData = {
    nama: karyawan?.nama || namaUser,
    tlp: karyawan?.tlp || "",
    alamat: karyawan?.alamat || "",
    foto: usersRecord?.profile?.foto || null,
    email: usersRecord?.profile?.email || "",
    tanggal_lahir: usersRecord?.profile?.tanggal_lahir ? usersRecord.profile.tanggal_lahir.toISOString().split("T")[0] : "",
  };

  return <ProfilClientPage initialData={initialData} />;
}
