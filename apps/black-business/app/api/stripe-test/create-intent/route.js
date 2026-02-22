import { NextResponse } from "next/server";

export async function POST(request) {
  const sk = process.env.STRIPE_SECRET_KEY;

  if (!sk) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY not set in .env.local" },
      { status: 500 }
    );
  }

  if (!sk.startsWith("sk_test_")) {
    return NextResponse.json(
      { error: "Only test-mode keys (sk_test_...) are allowed on this endpoint" },
      { status: 403 }
    );
  }

  try {
    const { amountCents } = await request.json();
    const amount = Math.max(50, Math.round(Number(amountCents) || 2000));

    const Stripe = (await import("stripe")).default;
    const stripe = Stripe(sk);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "cad",
      description: "Black Business Support — test payment",
      metadata: {
        source: "stripe-test-page",
        demo: "true",
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to create PaymentIntent" },
      { status: 500 }
    );
  }
}
