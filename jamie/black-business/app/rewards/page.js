import Link from "next/link";
import PointsBalance from "@/components/rewards/PointsBalance";
import PointsHistory from "@/components/rewards/PointsHistory";
import { rewardHistory } from "@/lib/mockData";

export default function RewardsPage() {
  return <div className="space-y-4"><h1 className="text-3xl font-bold">Rewards</h1><PointsBalance points={1840} /><PointsHistory items={rewardHistory} /><Link href="/rewards/redeem" className="button-primary">Redeem Points</Link></div>;
}
