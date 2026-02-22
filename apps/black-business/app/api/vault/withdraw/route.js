import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";
import { getVaultTotal, getLenderBalance, recordWithdrawal } from "@/lib/supabase/db";

const xrpl = require("xrpl");
const { getClient } = require("@/lib/xrpl/client");
const { submitTx } = require("@/lib/xrpl/helpers");
const { RLUSD_CURRENCY_HEX, RLUSD_ISSUER, PLATFORM_MASTER_ADDRESS } = require("@/lib/constants");

export async function POST(request) {
  try {
    const user = await requireAuth();
    const { amountCents } = await request.json();

    if (!amountCents || amountCents <= 0) {
      return NextResponse.json({ error: "positive amountCents required" }, { status: 400 });
    }

    await recordWithdrawal(user.id, amountCents);

    // Non-fatal XRPL on-chain mirror: send RLUSD from vault → platform master
    try {
      if (process.env.VAULT_ACCOUNT_SEED && RLUSD_ISSUER && PLATFORM_MASTER_ADDRESS) {
        const client = await getClient();
        const vaultWallet = xrpl.Wallet.fromSeed(process.env.VAULT_ACCOUNT_SEED);
        const amountRLUSD = (amountCents / 100).toFixed(2);

        await submitTx(
          {
            TransactionType: "Payment",
            Account: vaultWallet.address,
            Destination: PLATFORM_MASTER_ADDRESS,
            Amount: {
              currency: RLUSD_CURRENCY_HEX,
              issuer: RLUSD_ISSUER,
              value: amountRLUSD,
            },
          },
          client,
          vaultWallet,
          `vault withdraw(${amountRLUSD} RLUSD -> platform)`
        );
      }
    } catch (xrplErr) {
      console.error("Vault withdraw XRPL mirror failed (non-fatal):", xrplErr.message);
    }

    return NextResponse.json({
      totalCents: await getVaultTotal(),
      lenderBalanceCents: await getLenderBalance(user.id),
    });
  } catch (err) {
    if (err.message?.includes("Insufficient balance")) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status });
  }
}
