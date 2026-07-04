import { getKaryawanDenganGaji } from "./action";
import PenggajianClientPage from "./GajiClientPage";

export default async function PenggajianPage() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const data = await getKaryawanDenganGaji(currentMonth, currentYear);

  return <PenggajianClientPage initialData={data} currentMonth={currentMonth} currentYear={currentYear} />;
}
