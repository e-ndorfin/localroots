const { NextResponse } = require("next/server");
const { getDb, persist } = require("../../../../lib/db");
const { POINTS_PER_DOLLAR } = require("../../../../lib/constants");

async function POST(request) {
  try {
    const rawBody = await request.text();
    const sig = request.headers.get("stripe-signature");

    let event;

    if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET) {
      const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
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
      const { businessId, customerPseudonym } = paymentIntent.metadata;
      const amount = paymentIntent.amount;

      const db = await getDb();

      // Credit business balance
      db.run(
        "UPDATE businesses SET balance_cents = balance_cents + ?, updated_at = datetime('now') WHERE id = ?",
        [amount, businessId]
      );

      // Calculate and award loyalty points
      const points = Math.floor((amount / 100) * POINTS_PER_DOLLAR);

      if (points > 0) {
        db.run(
          "INSERT INTO points_ledger (customer_pseudonym, business_id, type, points, description) VALUES (?, ?, 'earn', ?, ?)",
          [
            customerPseudonym,
            businessId,
            points,
            `Purchase of $${(amount / 100).toFixed(2)}`,
          ]
        );
      }

      persist(db);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("POST /api/payments/webhook error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

module.exports = { POST };
