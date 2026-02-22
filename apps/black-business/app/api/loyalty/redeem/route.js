import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";
import { POINTS_REDEMPTION_RATE, RLUSD_CURRENCY_HEX, RLUSD_ISSUER } from "@/lib/constants";
import { getClient } from "@/lib/xrpl/client";
import { getOrCreateCustomerWallet, getOrCreateBusinessWallet } from "@/lib/xrpl/wallets";
import { redeemMPT } from "@/lib/xrpl/loyalty";
import { submitTx } from "@/lib/xrpl/helpers";
import * as xrpl from "xrpl";

/**
 * POST /api/loyalty/redeem
 *
 * Redeems loyalty points for a discount at a business.
 * Body: { businessId, points }
 */
export async function POST(request) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { businessId, points } = await request.json();

    if (!businessId || !points || points <= 0) {
      return NextResponse.json(
        { error: "Missing or invalid fields: businessId, points (must be > 0)" },
        { status: 400 }
      );
    }

    // Calculate current balance
    const { data: rows, error: balanceError } = await supabase
      .from("points_ledger")
      .select("points")
      .eq("customer_user_id", user.id);

    if (balanceError) throw balanceError;

    const balance = rows.reduce((sum, row) => sum + row.points, 0);

    if (balance < points) {
      return NextResponse.json(
        { error: `Insufficient points: have ${balance}, need ${points}` },
        { status: 400 }
      );
    }

    // Insert redemption (negative points)
    const { error: insertError } = await supabase.from("points_ledger").insert({
      customer_user_id: user.id,
      business_id: businessId,
      type: "redeem",
      points: -points,
      description: `Redeemed ${points} points at business ${businessId}`,
    });

    if (insertError) throw insertError;

    // Calculate discount in cents: (points / redemption_rate) * 100
    const discountCents = Math.floor(points / POINTS_REDEMPTION_RATE) * 100;

    // Credit the discount to the business balance (read-then-write)
    const { data: biz, error: bizError } = await supabase
      .from("businesses")
      .select("balance_cents")
      .eq("id", businessId)
      .single();

    if (bizError) throw bizError;

    const { error: updateError } = await supabase
      .from("businesses")
      .update({
        balance_cents: biz.balance_cents + discountCents,
        updated_at: new Date().toISOString(),
      })
      .eq("id", businessId);

    if (updateError) throw updateError;

    // On-chain: transfer MPT back to platform (non-fatal on failure)
    try {
      const client = await getClient();
      const { wallet } = await getOrCreateCustomerWallet(supabase, user.id);
      await redeemMPT(client, wallet, points);
    } catch (xrplErr) {
      console.error("XRPL redeem failed (non-fatal):", xrplErr.message);
    }

    // On-chain: send RLUSD from platform master to business wallet (non-fatal)
    try {
      if (process.env.PLATFORM_MASTER_SEED && RLUSD_ISSUER && discountCents > 0) {
        const client = await getClient();
        const { address: bizAddr } = await getOrCreateBusinessWallet(supabase, businessId);
        const platformWallet = xrpl.Wallet.fromSeed(process.env.PLATFORM_MASTER_SEED);
        const value = (discountCents / 100).toFixed(2);
        await submitTx(
          {
            TransactionType: "Payment",
            Account: platformWallet.address,
            Destination: bizAddr,
            Amount: {
              currency: RLUSD_CURRENCY_HEX,
              issuer: RLUSD_ISSUER,
              value,
            },
          },
          client,
          platformWallet,
          `Redeem RLUSD($${value} -> business ${bizAddr})`
        );
      }
    } catch (xrplErr) {
      console.error("XRPL redeem RLUSD transfer failed (non-fatal):", xrplErr.message);
    }

    const remainingBalance = balance - points;

    return NextResponse.json({ remainingBalance, discountCents });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status });
  }
}
