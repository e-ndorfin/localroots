export default function VaultWithdrawForm() {
  return <form className="card space-y-3" onSubmit={(e) => e.preventDefault()}><h3 className="text-lg font-semibold">Withdraw RLUSD</h3><input className="input" type="number" placeholder="Amount" /><button className="button-outline" type="submit">Request Withdrawal</button></form>;
}
