const { NextResponse } = require("next/server");

async function POST(request) {
  try {
    const { businessId, amountCents, customerPseudonym } = await request.json();

    if (!businessId || !amountCents || !customerPseudonym) {
      return NextResponse.json(
        { error: "Missing required fields: businessId, amountCents, customerPseudonym" },
        { status: 400 }
      );
    }

    // Dev fallback — no Stripe key means return a mock client secret
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({
        clientSecret: `cs_test_mock_${Date.now()}_${businessId}`,
      });
    }

    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "cad",
      metadata: { businessId: String(businessId), customerPseudonym },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("POST /api/payments/checkout error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

module.exports = { POST };
