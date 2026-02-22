export default function BoostVisibilityForm() {
  return (
    <form className="card space-y-3" onSubmit={(e) => e.preventDefault()}>
      <h3 className="text-lg font-semibold">Boost Visibility</h3>
      <select className="input"><option>Featured for 7 days - $60</option><option>Featured for 14 days - $100</option></select>
      <button className="button-primary" type="submit">Purchase Boost</button>
    </form>
  );
}
