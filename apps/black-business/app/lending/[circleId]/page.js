"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CircleDetail from "@/components/lending/CircleDetail";
import LoanRequestForm from "@/components/lending/LoanRequestForm";
import TrancheProgress from "@/components/lending/TrancheProgress";
import RepaymentForm from "@/components/lending/RepaymentForm";
import TierIndicator from "@/components/lending/TierIndicator";

export default function CirclePage() {
  const params = useParams();
  const circleId = params.circleId;
  const [circle, setCircle] = useState(null);
  const [members, setMembers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/lending/circles/${circleId}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) {
          setCircle(data.circle);
          setMembers(data.members || []);
          setLoans(data.loans || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [circleId]);

  return (
    <div className="space-y-4">
      <CircleDetail circleId={circleId} circle={circle} members={members} loading={loading} />
      <div className="grid gap-3 lg:grid-cols-2">
        <LoanRequestForm circleId={circleId} />
        <TierIndicator tier="Micro" />
        <TrancheProgress loans={loans} />
        <RepaymentForm loans={loans} />
      </div>
    </div>
  );
}
