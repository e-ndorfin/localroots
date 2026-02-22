import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";
import { getVaultTotal, getLenderBalance, recordDeposit } from "@/lib/supabase/db";

const xrpl = require("xrpl");
const { getClient } = require("@/lib/xrpl/client");
const { submitTx } = require("@/lib/xrpl/helpers");
const { RLUSD_CURRENCY_HEX, RLUSD_ISSUER, VAULT_ADDRESS } = require("@/lib/constants");

export async function POST(request) {
  try {
    const user = await requireAuth();
    const { amountCents } = await request.json();

    if (!amountCents || amountCents <= 0) {
      return NextResponse.json({ error: "positive amountCents required" }, { status: 400 });
    }

    await recordDeposit(user.id, amountCents);

    // Non-fatal XRPL on-chain mirror: send RLUSD from platform master → vault
    try {
      if (process.env.PLATFORM_MASTER_SEED && RLUSD_ISSUER && VAULT_ADDRESS) {
        const client = await getClient();
        const platformWallet = xrpl.Wallet.fromSeed(process.env.PLATFORM_MASTER_SEED);
        const amountRLUSD = (amountCents / 100).toFixed(2);

        await submitTx(
          {
            TransactionType: "Payment",
            Account: platformWallet.address,
            Destination: VAULT_ADDRESS,
            Amount: {
              currency: RLUSD_CURRENCY_HEX,
              issuer: RLUSD_ISSUER,
              value: amountRLUSD,
            },
          },
          client,
          platformWallet,
          `vault deposit(${amountRLUSD} RLUSD -> vault)`
        );
      }
    } catch (xrplErr) {
      console.error("Vault deposit XRPL mirror failed (non-fatal):", xrplErr.message);
    }

    return NextResponse.json({
      totalCents: await getVaultTotal(),
      lenderBalanceCents: await getLenderBalance(user.id),
    });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status });
  }
}
