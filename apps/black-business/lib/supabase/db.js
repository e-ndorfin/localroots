import { createClient } from "./server";

export async function getVaultTotal() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_vault_total");
  if (error) throw error;
  return data ?? 0;
}

export async function getLenderBalance(userId) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_lender_balance", {
    p_user_id: userId,
  });
  if (error) throw error;
  return data ?? 0;
}

export async function recordDeposit(userId, amountCents) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("vault_deposits")
    .insert({ lender_user_id: userId, amount_cents: amountCents, type: "deposit" });
  if (error) throw error;
}

export async function recordWithdrawal(userId, amountCents) {
  const balance = await getLenderBalance(userId);
  if (amountCents > balance) {
    throw new Error(
      `Insufficient balance: requested ${amountCents} but lender has ${balance}`
    );
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("vault_deposits")
    .insert({ lender_user_id: userId, amount_cents: amountCents, type: "withdrawal" });
  if (error) throw error;
}
