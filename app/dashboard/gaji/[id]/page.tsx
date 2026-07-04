import { getDetailGajiKaryawan } from "../action";
import DetailGajiClient from "./DetailGajiClient";
import { notFound } from "next/navigation";

export default async function DetailGajiPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ bulan?: string; tahun?: string }> }) {
  const { id: idParam } = await params;
  const { bulan: bulanParam, tahun: tahunParam } = await searchParams;

  const id = parseInt(idParam);
  const bulan = parseInt(bulanParam || String(new Date().getMonth() + 1));
  const tahun = parseInt(tahunParam || String(new Date().getFullYear()));

  const data = await getDetailGajiKaryawan(id);

  if (!data) notFound();

  return <DetailGajiClient data={data} bulanAktif={bulan} tahunAktif={tahun} />;
}
