import { get } from "@vercel/blob";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { StatsSummary } from "@/lib/types";
import SharedDashboard from "@/components/SharedDashboard";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

interface Share {
  name: string;
  stats: StatsSummary;
  createdAt: string;
}

async function loadShare(id: string): Promise<Share | null> {
  if (!UUID_RE.test(id)) return null;
  try {
    const res = await get(`shares/${id}.json`, { access: "private" });
    if (!res || res.statusCode !== 200 || !res.stream) return null;
    return JSON.parse(await new Response(res.stream).text()) as Share;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const share = await loadShare(id);
  if (!share) return { title: "BetLedger" };
  const net = share.stats.netPnl;
  const money = `${net < 0 ? "−" : "+"}$${Math.abs(net).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  return {
    title: `${share.name}'s BetLedger — ${money} all-time`,
    description: `${share.stats.settledCount} settled bets, graded. ${net < 0 ? "The house wins." : "Printing money."}`,
    robots: { index: false },
  };
}

export default async function SharedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const share = await loadShare(id);
  if (!share) notFound();
  return <SharedDashboard name={share.name} stats={share.stats} />;
}
