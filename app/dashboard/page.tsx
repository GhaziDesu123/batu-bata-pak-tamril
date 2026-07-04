import { getDashboardData } from "./action";
import DashboardClientPage from "./DashboardClientPage";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const data = await getDashboardData(currentMonth, currentYear);

  return <DashboardClientPage data={data} currentMonth={currentMonth} currentYear={currentYear} userName={session?.user?.name || "Admin"} />;
}
