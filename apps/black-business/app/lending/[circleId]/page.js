"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import CircleDetail from "@/components/lending/CircleDetail";
import LoanRequestForm from "@/components/lending/LoanRequestForm";
import TrancheProgress from "@/components/lending/TrancheProgress";
import RepaymentForm from "@/components/lending/RepaymentForm";
import TierIndicator from "@/components/lending/TierIndicator";
import { createClient } from "@/lib/supabase/client";

const TIER_LABELS = { 1: "Micro", 2: "Small", 3: "Medium" };

export default function CirclePage() {
  const params = useParams();
  const circleId = params.circleId;
  const [circle, setCircle] = useState(null);
  const [members, setMembers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState(null);
  const [userId, setUserId] = useState(null);

  const fetchCircleData = useCallback(() => {
    fetch(`/api/lending/circles/${circleId}`)
      .then((res) => (res.ok ? res.json() : null))
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

  useEffect(() => {
    fetchCircleData();

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      supabase
        .from("borrower_tiers")
        .select("tier")
        .eq("borrower_user_id", user.id)
        .maybeSingle()
        .then(({ data }) => setTier(TIER_LABELS[data?.tier ?? 1] || "Micro"));
    });
  }, [circleId, fetchCircleData]);

  const isMember = userId && members.some((m) => m.member_user_id === userId);

  return (
    <div className="space-y-4">
      <CircleDetail
        circleId={circleId}
        circle={circle}
        members={members}
        loading={loading}
        userId={userId}
        isMember={isMember}
        onJoined={fetchCircleData}
      />
      {isMember && (
        <div className="grid gap-3 lg:grid-cols-2">
          <LoanRequestForm circleId={circleId} />
          <TierIndicator tier={tier || "Micro"} />
          <TrancheProgress loans={loans} userId={userId} memberCount={members.length} />
          <RepaymentForm loans={loans} userId={userId} />
        </div>
      )}
    </div>
  );
}
