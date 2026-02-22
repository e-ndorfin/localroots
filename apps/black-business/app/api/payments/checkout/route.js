import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { POINTS_PER_DOLLAR } from "@/lib/constants";
import { getClient } from "@/lib/xrpl/client";
import { getOrCreateCustomerWallet } from "@/lib/xrpl/wallets";
import { mintMPT } from "@/lib/xrpl/loyalty";

export async function POST(request) {
  try {
    const user = await requireAuth();
    const { businessId, amountCents } = await request.json();

    if (!businessId || !amountCents) {
      return NextResponse.json(
        { error: "Missing required fields: businessId, amountCents" },
        { status: 400 }
      );
    }

    // Dev fallback — no Stripe key means process payment inline
    if (!process.env.STRIPE_SECRET_KEY) {
      const supabase = await createClient();

      // Credit business balance
      const { data: biz } = await supabase
        .from("businesses")
        .select("balance_cents")
        .eq("id", businessId)
        .single();

      if (biz) {
        await supabase
          .from("businesses")
          .update({
            balance_cents: biz.balance_cents + amountCents,
            updated_at: new Date().toISOString(),
          })
          .eq("id", businessId);
      }

      // Award loyalty points
      const earnedPoints = Math.floor((amountCents / 100) * POINTS_PER_DOLLAR);

      if (earnedPoints > 0) {
        await supabase.from("points_ledger").insert({
          customer_user_id: user.id,
          business_id: businessId,
          type: "earn",
          points: earnedPoints,
          description: `Purchase of $${(amountCents / 100).toFixed(2)}`,
        });

        // On-chain: mint MPT to customer (non-fatal on failure)
        try {
          const client = await getClient();
          const { address } = await getOrCreateCustomerWallet(supabase, user.id);
          await mintMPT(client, address, earnedPoints);
        } catch (xrplErr) {
          console.error("XRPL mint in dev checkout failed (non-fatal):", xrplErr.message);
        }
      }

      return NextResponse.json({
        clientSecret: `cs_test_mock_${Date.now()}_${businessId}`,
        earnedPoints,
      });
    }

    const Stripe = (await import("stripe")).default;
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "cad",
      metadata: { businessId: String(businessId), customerUserId: user.id },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status });
  }
}
