import Link from "next/link";

export default function BusinessCard({ business }) {
  return (
    <article className="biz-card">
      <div className="card-image-wrap">
        {business.featured ? <span className="biz-badge">Featured</span> : null}
        <Link href={`/directory/${business.id}`}>
          <img src={business.image} alt={business.name} />
        </Link>
      </div>
      <div className="card-body">
        <h2>{business.name}</h2>
        <p>{business.description}</p>
        <p className="rating">{`? ${business.rating} (${business.reviews} reviews)`}</p>
      </div>
    </article>
  );
}
