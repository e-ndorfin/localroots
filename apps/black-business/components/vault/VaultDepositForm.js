export default function VaultDepositForm() {
  return <form className="card space-y-3" onSubmit={(e) => e.preventDefault()}><h3 className="text-lg font-semibold">Deposit RLUSD</h3><input className="input" type="number" placeholder="Amount" /><button className="button-primary" type="submit">Connect Wallet & Sign</button></form>;
}
