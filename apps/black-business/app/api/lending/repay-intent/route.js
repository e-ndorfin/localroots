import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth";

export async function POST(request) {
  try {
    const user = await requireAuth();
    const { amountCents } = await request.json();

    if (!amountCents || amountCents <= 0) {
      return NextResponse.json({ error: "positive amountCents required" }, { status: 400 });
    }

    // Dev fallback — no Stripe key means return a mock secret
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ clientSecret: `cs_test_repay_mock_${Date.now()}` });
    }

    const Stripe = (await import("stripe")).default;
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "cad",
      metadata: { type: "loan_repayment", userId: user.id },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status });
  }
}
