/**
 * Demo Activity Log — fetches real XRPL transaction history from all platform accounts.
 *
 * Queries account_tx for Platform Master, Vault, and Rewards Pool to surface
 * RLUSD payments, MPT mints/transfers, credential issuances, and trustline setups.
 *
 * GET /api/demo/activity?limit=50&marker=...
 */

const xrpl = require("xrpl");
const { getClient } = require("@/lib/xrpl/client");
const {
  PLATFORM_MASTER_ADDRESS,
  VAULT_ADDRESS,
  REWARDS_POOL_ADDRESS,
  RLUSD_CURRENCY_HEX,
  LOYALTY_MPT_ID,
} = require("@/lib/constants");

// Human-friendly labels for known addresses
function labelAddress(addr) {
  if (addr === PLATFORM_MASTER_ADDRESS) return "Platform Master";
  if (addr === VAULT_ADDRESS) return "Vault";
  if (addr === REWARDS_POOL_ADDRESS) return "Rewards Pool";
  return addr ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : "Unknown";
}

// Parse a single tx into a human-readable activity entry
function parseTx(tx, meta, account) {
  const txType = tx.TransactionType;
  const hash = tx.hash || meta?.hash;
  const date = tx.date
    ? new Date((tx.date + 946684800) * 1000).toISOString()
    : null;
  const result = meta?.TransactionResult || "unknown";
  const sender = tx.Account;
  const destination = tx.Destination || null;

  const base = {
    hash,
    txType,
    date,
    result,
    sender,
    senderLabel: labelAddress(sender),
    destination,
    destinationLabel: labelAddress(destination),
    ledgerIndex: meta?.ledger_index || tx.ledger_index,
  };

  // --- Payment ---
  if (txType === "Payment") {
    // tx_json format uses DeliverMax instead of Amount
    const amt = tx.DeliverMax || tx.Amount;

    // MPT payment (loyalty points)
    if (amt && typeof amt === "object" && amt.mpt_issuance_id) {
      const isMint = sender === PLATFORM_MASTER_ADDRESS;
      const isRedeem = destination === PLATFORM_MASTER_ADDRESS;
      return {
        ...base,
        category: "MPT",
        description: isMint
          ? `Minted ${amt.value} BBS points to ${labelAddress(destination)}`
          : isRedeem
            ? `Redeemed ${amt.value} BBS points from ${labelAddress(sender)}`
            : `Transferred ${amt.value} BBS points`,
        currency: "BBS (MPT)",
        value: amt.value,
        mptIssuanceId: amt.mpt_issuance_id,
      };
    }

    // RLUSD payment
    if (amt && typeof amt === "object" && amt.currency === RLUSD_CURRENCY_HEX) {
      const isDisburse = sender === VAULT_ADDRESS;
      const isRepay = destination === VAULT_ADDRESS;
      return {
        ...base,
        category: "RLUSD",
        description: isDisburse
          ? `Disbursed $${amt.value} RLUSD to ${labelAddress(destination)}`
          : isRepay
            ? `Repaid $${amt.value} RLUSD to Vault from ${labelAddress(sender)}`
            : `Sent $${amt.value} RLUSD`,
        currency: "RLUSD",
        value: amt.value,
      };
    }

    // XRP payment (funding etc)
    if (typeof amt === "string") {
      const xrpValue = (parseInt(amt, 10) / 1_000_000).toFixed(2);
      return {
        ...base,
        category: "XRP",
        description: `Sent ${xrpValue} XRP to ${labelAddress(destination)}`,
        currency: "XRP",
        value: xrpValue,
      };
    }
  }

  // --- MPTokenAuthorize ---
  if (txType === "MPTokenAuthorize") {
    return {
      ...base,
      category: "MPT",
      description: `${labelAddress(sender)} authorized for MPT ${tx.MPTokenIssuanceID?.slice(0, 12)}...`,
      currency: null,
      value: null,
    };
  }

  // --- TrustSet ---
  if (txType === "TrustSet") {
    const curr = tx.LimitAmount?.currency === RLUSD_CURRENCY_HEX ? "RLUSD" : tx.LimitAmount?.currency;
    return {
      ...base,
      category: "Trustline",
      description: `${labelAddress(sender)} set ${curr} trustline (limit: ${tx.LimitAmount?.value})`,
      currency: curr,
      value: tx.LimitAmount?.value,
    };
  }

  // --- CredentialCreate ---
  if (txType === "CredentialCreate") {
    const credType = tx.CredentialType
      ? Buffer.from(tx.CredentialType, "hex").toString("utf8")
      : "Unknown";
    return {
      ...base,
      category: "Credential",
      description: `Issued ${credType} credential to ${labelAddress(tx.Subject)}`,
      currency: null,
      value: null,
    };
  }

  // --- CredentialAccept ---
  if (txType === "CredentialAccept") {
    const credType = tx.CredentialType
      ? Buffer.from(tx.CredentialType, "hex").toString("utf8")
      : "Unknown";
    return {
      ...base,
      category: "Credential",
      description: `${labelAddress(sender)} accepted ${credType} credential`,
      currency: null,
      value: null,
    };
  }

  // --- MPTokenIssuanceCreate ---
  if (txType === "MPTokenIssuanceCreate") {
    return {
      ...base,
      category: "MPT",
      description: `Created MPT issuance (BBS loyalty token)`,
      currency: null,
      value: null,
    };
  }

  // --- Fallback ---
  return {
    ...base,
    category: "Other",
    description: `${txType} by ${labelAddress(sender)}`,
    currency: null,
    value: null,
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);

    const client = await getClient();

    // Fetch tx history from all platform accounts in parallel
    const accounts = [
      { address: PLATFORM_MASTER_ADDRESS, label: "Platform Master" },
      { address: VAULT_ADDRESS, label: "Vault" },
      { address: REWARDS_POOL_ADDRESS, label: "Rewards Pool" },
    ].filter((a) => a.address); // skip if env var not set

    const results = await Promise.allSettled(
      accounts.map(async ({ address, label }) => {
        const response = await client.request({
          command: "account_tx",
          account: address,
          ledger_index_min: -1,
          ledger_index_max: -1,
          limit,
        });
        return {
          account: label,
          address,
          transactions: (response.result.transactions || []).map((entry) => {
            const tx = entry.tx_json || entry.tx || {};
            const meta = entry.meta || {};
            return parseTx(
              { ...tx, hash: entry.hash || tx.hash },
              { ...meta, TransactionResult: meta.TransactionResult, ledger_index: entry.ledger_index },
              address
            );
          }),
        };
      })
    );

    // Merge all transactions, deduplicate by hash, sort by date desc
    const allTxs = [];
    const seen = new Set();
    const accountSummaries = [];

    for (const r of results) {
      if (r.status === "fulfilled") {
        accountSummaries.push({
          account: r.value.account,
          address: r.value.address,
          txCount: r.value.transactions.length,
        });
        for (const tx of r.value.transactions) {
          if (!seen.has(tx.hash)) {
            seen.add(tx.hash);
            allTxs.push(tx);
          }
        }
      } else {
        console.error("account_tx failed:", r.reason?.message);
      }
    }

    // Sort newest first
    allTxs.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date) - new Date(a.date);
    });

    // Category summary
    const categoryCounts = {};
    for (const tx of allTxs) {
      categoryCounts[tx.category] = (categoryCounts[tx.category] || 0) + 1;
    }

    return Response.json({
      transactions: allTxs,
      accounts: accountSummaries,
      categoryCounts,
      totalTransactions: allTxs.length,
    });
  } catch (err) {
    console.error("Demo activity log error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
