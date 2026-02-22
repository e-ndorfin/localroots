import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

export async function POST(request) {
  try {
    const user = await requireAuth();

    // Block business accounts
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role === "business") {
      return NextResponse.json({ error: "Business accounts cannot deposit into the vault" }, { status: 403 });
    }

    const { amountCents } = await request.json();
    if (!amountCents || amountCents <= 0) {
      return NextResponse.json({ error: "positive amountCents required" }, { status: 400 });
    }

    // Dev fallback — no Stripe key means return a mock secret
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ clientSecret: `cs_test_vault_mock_${Date.now()}` });
    }

    const Stripe = (await import("stripe")).default;
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "cad",
      metadata: { type: "vault_deposit", userId: user.id },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status });
  }
}
