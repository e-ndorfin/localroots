# Hackathon Notes & Gotchas

Lessons learned during development that are critical for setup, demos, and troubleshooting.

---

## XRPL: `tecPATH_DRY` on RLUSD Payments Between Platform Accounts

**Symptom**: Any RLUSD `Payment` between two non-issuer accounts (e.g. Platform Master -> Vault for a lender deposit, or Vault -> Borrower for a loan disbursement) fails with `tecPATH_DRY`, even though both accounts have RLUSD trustlines and balances.

**Root cause**: The RLUSD test issuer account was missing the `DefaultRipple` flag. On XRPL, token payments between non-issuer accounts must "ripple" through the issuer. Without `DefaultRipple`, every trustline is created with `NoRipple` on the issuer's side, which blocks the payment path entirely.

**Fix** (already applied to `scripts/setup-trustlines.js`):

1. **Enable `DefaultRipple` on the RLUSD issuer** — must be done *before* creating trustlines, or existing trustlines will have stale `NoRipple` flags:
   ```js
   await client.submitAndWait({
     TransactionType: "AccountSet",
     Account: issuerWallet.address,
     SetFlag: xrpl.AccountSetAsfFlags.asfDefaultRipple,
   }, { autofill: true, wallet: issuerWallet });
   ```

2. **Platform accounts create trustlines** (normal `TrustSet`).

3. **Issuer clears `NoRipple` on its side of each existing trustline** — required if trustlines were created before `DefaultRipple` was enabled:
   ```js
   await client.submitAndWait({
     TransactionType: "TrustSet",
     Account: issuerWallet.address,
     LimitAmount: {
       currency: RLUSD_HEX,
       issuer: counterpartyAddress, // e.g. Platform Master, Vault
       value: "0",
     },
     Flags: xrpl.TrustSetFlags.tfClearNoRipple,
   }, { autofill: true, wallet: issuerWallet });
   ```

**How to verify**: After setup, check the `RippleState` ledger entries via `account_objects` — `lsfLowNoRipple` (0x00100000) on the issuer's side must be `false`.

**If you regenerate wallets**: Just run the scripts in order and this is handled automatically:
```bash
node scripts/init-platform.js      # generate wallets
node scripts/setup-trustlines.js   # trustlines + DefaultRipple + ClearNoRipple
node scripts/create-loyalty-mpt.js # BBS loyalty token
node scripts/mint-rlusd.js         # fund accounts with test RLUSD
```

---

## Demo: XRPL Activity Log

A real-time activity log is available at `/demo/activity` — it queries `account_tx` for all platform accounts (Platform Master, Vault, Rewards Pool) and displays RLUSD payments, MPT mints/transfers, credential issuances, and trustline setups with links to the Devnet explorer. Auto-refreshes every 8 seconds. Use the category filters to focus on specific transaction types during a demo.
