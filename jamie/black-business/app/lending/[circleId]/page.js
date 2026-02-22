import CircleDetail from "@/components/lending/CircleDetail";
import LoanRequestForm from "@/components/lending/LoanRequestForm";
import TrancheProgress from "@/components/lending/TrancheProgress";
import RepaymentForm from "@/components/lending/RepaymentForm";
import TierIndicator from "@/components/lending/TierIndicator";

export default function CirclePage({ params }) {
  return <div className="space-y-4"><CircleDetail circleId={params.circleId} /><div className="grid gap-3 lg:grid-cols-2"><LoanRequestForm /><TierIndicator tier="Micro" /><TrancheProgress /><RepaymentForm /></div></div>;
}
