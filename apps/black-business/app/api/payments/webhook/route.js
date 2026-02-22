import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { POINTS_PER_DOLLAR } from "@/lib/constants";
import { getClient } from "@/lib/xrpl/client";
import { getOrCreateCustomerWallet, getOrCreateBusinessWallet, sendRLUSDToBusiness } from "@/lib/xrpl/wallets";
import { mintMPT } from "@/lib/xrpl/loyalty";

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const sig = request.headers.get("stripe-signature");

    let event;

    if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET) {
      const Stripe = (await import("stripe")).default;
      const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
      try {
        event = stripe.webhooks.constructEvent(
          rawBody,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } catch (err) {
        console.error("Webhook signature verification failed:", err.message);
        return NextResponse.json(
          { error: "Webhook signature verification failed" },
          { status: 400 }
        );
      }
    } else {
      // Dev mode — parse body as JSON without verification
      event = JSON.parse(rawBody);
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      const { businessId, customerUserId } = paymentIntent.metadata;
      const amount = paymentIntent.amount;

      const supabase = await createClient();

      // Credit business balance
      const { data: biz } = await supabase
        .from("businesses")
        .select("balance_cents")
        .eq("id", businessId)
        .single();

      await supabase
        .from("businesses")
        .update({
          balance_cents: biz.balance_cents + amount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", businessId);

      // Calculate and award loyalty points
      const points = Math.floor((amount / 100) * POINTS_PER_DOLLAR);

      if (points > 0) {
        await supabase.from("points_ledger").insert({
          customer_user_id: customerUserId,
          business_id: businessId,
          type: "earn",
          points,
          description: `Purchase of $${(amount / 100).toFixed(2)}`,
        });

        // On-chain: mint MPT to customer (non-fatal on failure)
        try {
          const client = await getClient();
          const { address } = await getOrCreateCustomerWallet(supabase, customerUserId);
          await mintMPT(client, address, points);
        } catch (xrplErr) {
          console.error("XRPL mint in webhook failed (non-fatal):", xrplErr.message);
        }
      }

      // On-chain: send RLUSD to business wallet with 97/3 split (non-fatal)
      try {
        const xrplClient = await getClient();
        const { address: bizAddr } = await getOrCreateBusinessWallet(supabase, businessId);
        await sendRLUSDToBusiness(xrplClient, bizAddr, amount);
      } catch (xrplErr) {
        console.error("XRPL RLUSD transfer in webhook failed (non-fatal):", xrplErr.message);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status });
  }
}
