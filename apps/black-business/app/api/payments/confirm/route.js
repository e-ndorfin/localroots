import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { POINTS_PER_DOLLAR, TRANSACTION_FEE_PERCENT } from "@/lib/constants";
import { getClient } from "@/lib/xrpl/client";
import { getOrCreateCustomerWallet, getOrCreateBusinessWallet, sendRLUSDToBusiness } from "@/lib/xrpl/wallets";
import { mintMPT } from "@/lib/xrpl/loyalty";

/**
 * POST /api/payments/confirm
 *
 * Called by the frontend after Stripe payment succeeds.
 * Handles all post-payment work:
 *   1. Verify the PaymentIntent succeeded with Stripe
 *   2. Credit business balance (minus platform fee)
 *   3. Award loyalty points in Supabase
 *   4. Mint MPT on-chain to customer
 *   5. Send RLUSD on-chain (97% to business wallet, 3% to vault)
 *
 * Body: { paymentIntentId, businessId, amountCents }
 */
export async function POST(request) {
  try {
    const user = await requireAuth();
    const { paymentIntentId, businessId, amountCents } = await request.json();

    if (!businessId || !amountCents) {
      return NextResponse.json(
        { error: "Missing required fields: businessId, amountCents" },
        { status: 400 }
      );
    }

    // Verify with Stripe that this payment actually succeeded
    if (process.env.STRIPE_SECRET_KEY && paymentIntentId) {
      const Stripe = (await import("stripe")).default;
      const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (pi.status !== "succeeded") {
        return NextResponse.json(
          { error: `Payment not confirmed: status is ${pi.status}` },
          { status: 400 }
        );
      }
    }

    const supabase = await createClient();

    // 1. Credit business balance (minus platform fee)
    const feeCents = Math.round(amountCents * (TRANSACTION_FEE_PERCENT / 100));
    const businessCreditCents = amountCents - feeCents;

    const { data: biz } = await supabase
      .from("businesses")
      .select("balance_cents")
      .eq("id", businessId)
      .single();

    if (biz) {
      await supabase
        .from("businesses")
        .update({
          balance_cents: (biz.balance_cents || 0) + businessCreditCents,
          updated_at: new Date().toISOString(),
        })
        .eq("id", businessId);
    }

    // 2. Award loyalty points
    const earnedPoints = Math.floor((amountCents / 100) * POINTS_PER_DOLLAR);

    if (earnedPoints > 0) {
      await supabase.from("points_ledger").insert({
        customer_user_id: user.id,
        business_id: businessId,
        type: "earn",
        points: earnedPoints,
        description: `Purchase of $${(amountCents / 100).toFixed(2)}`,
      });
    }

    // 3. On-chain: mint MPT to customer (non-fatal)
    let mptTxHash = null;
    if (earnedPoints > 0) {
      try {
        const client = await getClient();
        const { address } = await getOrCreateCustomerWallet(supabase, user.id);
        await mintMPT(client, address, earnedPoints);
        mptTxHash = "minted";
      } catch (xrplErr) {
        console.error("XRPL MPT mint failed (non-fatal):", xrplErr.message);
      }
    }

    // 4. On-chain: send RLUSD to business wallet (97%) and vault (3%) — non-fatal
    let rlusdTxHash = null;
    try {
      const client = await getClient();
      const { address: bizAddr } = await getOrCreateBusinessWallet(supabase, businessId);
      const { businessTxHash } = await sendRLUSDToBusiness(client, bizAddr, amountCents);
      rlusdTxHash = businessTxHash;
    } catch (xrplErr) {
      console.error("XRPL RLUSD business transfer failed (non-fatal):", xrplErr.message);
    }

    return NextResponse.json({
      earnedPoints,
      businessCredited: businessCreditCents,
      feeCents,
      mptTxHash,
      rlusdTxHash,
    });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status });
  }
}
