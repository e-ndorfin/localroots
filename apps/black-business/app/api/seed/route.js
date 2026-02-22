import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/supabase/auth";
import { generateStorefrontImage } from "@/lib/openai/generateStorefrontImage";

const SEED_BUSINESSES = [
  {
    name: "The Heartbreak Chef",
    category: "Restaurant",
    location: "170 Baldwin St",
    description: "Bold, soulful comfort food in the heart of Kensington Market.",
    is_boosted: true,
    lat: 43.6545,
    lng: -79.4006,
    products: [
      { id: "hbc-1", name: "Dutty Sandwich", price: 14.0, description: "Signature loaded sandwich" },
      { id: "hbc-2", name: "Big Ass Sandwich", price: 14.0, description: "Oversized and overloaded" },
      { id: "hbc-3", name: "Mac and Cheese with Fried Chicken", price: 17.0, description: "Creamy mac topped with crispy fried chicken" },
    ],
  },
  {
    name: "The Hive by Honey Soul Food",
    category: "Restaurant",
    location: "907 Dundas St W",
    description: "Southern-inspired soul food made with love.",
    is_boosted: false,
    lat: 43.6508,
    lng: -79.4115,
    products: [
      { id: "hive-1", name: "Jack'D Up Chicken Sandwich", price: 15.99, description: "Spicy fried chicken sandwich" },
      { id: "hive-2", name: "Jumbo Shrimp Po' Boy", price: 16.99, description: "Crispy jumbo shrimp on a hoagie roll" },
      { id: "hive-3", name: "Famous Cornbread", price: 5.99, description: "Sweet, buttery cornbread" },
    ],
  },
  {
    name: "Blaque Wellness",
    category: "Health & Beauty",
    location: "210 Augusta Ave",
    description: "Natural wellness products crafted for melanin-rich skin and hair.",
    is_boosted: true,
    lat: 43.6548,
    lng: -79.4016,
    products: [
      { id: "bw-1", name: "Midnight Repair Oil", price: 28.0, description: "Overnight restorative hair and skin oil" },
      { id: "bw-2", name: "Peppermint & Rosemary Hair Oil", price: 22.0, description: "Stimulating scalp treatment oil" },
      { id: "bw-3", name: "Golden Balance Menopause Oil", price: 32.0, description: "Hormone-balancing body oil" },
    ],
  },
  {
    name: "Pure Souls Barbershop",
    category: "Services",
    location: "424 Dundas St W",
    description: "Premium grooming experience in downtown Toronto.",
    is_boosted: false,
    lat: 43.6526,
    lng: -79.3982,
    products: [
      { id: "ps-1", name: "Haircut", price: 50.0, description: "Precision cut and style" },
      { id: "ps-2", name: "Beard Trim & Line", price: 40.0, description: "Clean beard shape-up" },
      { id: "ps-3", name: "Cut & Beard Combo", price: 65.0, description: "Full haircut with beard trim" },
    ],
  },
  {
    name: "Patois Toronto",
    category: "Restaurant",
    location: "794 Dundas St W",
    description: "Caribbean-Asian fusion in a vibrant Dundas West setting.",
    is_boosted: false,
    lat: 43.6507,
    lng: -79.4083,
    products: [
      { id: "pat-1", name: "Jerk Pork Belly Yakisoba", price: 29.0, description: "Jerk pork belly with stir-fried noodles" },
      { id: "pat-2", name: "O.G. Fried Chicken", price: 19.0, description: "Crispy fried chicken with house sauce" },
      { id: "pat-3", name: "Curry Goat Doubles", price: 13.0, description: "Trinidadian doubles with curry goat" },
    ],
  },
  {
    name: "Rap's Barber Shop",
    category: "Services",
    location: "543 Queen St W",
    description: "Classic cuts and fades on Queen West since day one.",
    is_boosted: false,
    lat: 43.6478,
    lng: -79.4027,
    products: [
      { id: "rap-1", name: "Classic Fade", price: 35.0, description: "Clean skin fade" },
      { id: "rap-2", name: "Line-Up", price: 20.0, description: "Crisp hairline touch-up" },
      { id: "rap-3", name: "Hot Towel Shave", price: 30.0, description: "Traditional straight razor shave" },
    ],
  },
  {
    name: "Island Foods",
    category: "Grocery",
    location: "1440 Bathurst St",
    description: "Caribbean and West Indian grocery essentials.",
    is_boosted: false,
    lat: 43.6801,
    lng: -79.4225,
    products: [
      { id: "if-1", name: "Scotch Bonnet Pepper Sauce", price: 6.99, description: "Fiery homemade hot sauce" },
      { id: "if-2", name: "Jamaican Jerk Seasoning", price: 8.49, description: "Authentic dry jerk rub" },
      { id: "if-3", name: "Coconut Milk (400ml)", price: 3.49, description: "Rich coconut milk for cooking" },
    ],
  },
  {
    name: "Tkaronto Beauty Supply",
    category: "Health & Beauty",
    location: "338 Spadina Ave",
    description: "Curated beauty products celebrating natural hair and skin.",
    is_boosted: false,
    lat: 43.6528,
    lng: -79.3969,
    products: [
      { id: "tbs-1", name: "Shea Moisture Curl Cream", price: 15.99, description: "Defining cream for curls and coils" },
      { id: "tbs-2", name: "Edge Control Gel", price: 9.99, description: "Strong hold edge tamer" },
      { id: "tbs-3", name: "Satin Bonnet", price: 12.99, description: "Protective satin sleeping bonnet" },
    ],
  },
  {
    name: "Kensington Jerk House",
    category: "Restaurant",
    location: "172 Baldwin St",
    description: "Smoky jerk and island plates in Kensington Market.",
    is_boosted: false,
    lat: 43.6546,
    lng: -79.4008,
    products: [
      { id: "kjh-1", name: "Jerk Chicken Plate", price: 14.99, description: "Quarter jerk chicken with rice and peas" },
      { id: "kjh-2", name: "Oxtail Stew", price: 18.99, description: "Slow-braised oxtail with butter beans" },
      { id: "kjh-3", name: "Festival (Fried Dumplings)", price: 4.99, description: "Sweet fried dough side" },
    ],
  },
  {
    name: "Afro-Caribbean Hair Studio",
    category: "Services",
    location: "1210 Bloor St W",
    description: "Expert braiding, locs, and natural hair styling.",
    is_boosted: false,
    lat: 43.6601,
    lng: -79.4308,
    products: [
      { id: "ach-1", name: "Box Braids", price: 180.0, description: "Full head box braids" },
      { id: "ach-2", name: "Locs Retwist", price: 85.0, description: "Loc maintenance and retwist" },
      { id: "ach-3", name: "Silk Press", price: 75.0, description: "Sleek silk press blowout" },
    ],
  },
];

export async function POST() {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    // Get existing business names to deduplicate
    const { data: existing, error: fetchErr } = await supabase
      .from("businesses")
      .select("name");
    if (fetchErr) throw fetchErr;

    const existingNames = new Set((existing || []).map((b) => b.name));
    const toInsert = SEED_BUSINESSES.filter((b) => !existingNames.has(b.name));

    if (toInsert.length === 0) {
      return NextResponse.json({ message: "All seed businesses already exist", inserted: 0 });
    }

    const rows = toInsert.map((b) => ({
      name: b.name,
      category: b.category,
      location: b.location,
      description: b.description,
      owner_user_id: user.id,
      is_boosted: b.is_boosted,
      lat: b.lat,
      lng: b.lng,
      products: b.products,
    }));

    const { data: inserted, error: insertErr } = await supabase
      .from("businesses")
      .insert(rows)
      .select("id, name, category, location");
    if (insertErr) throw insertErr;

    // Generate storefront images in batches of 3 (non-fatal)
    let imagesGenerated = 0;
    const BATCH_SIZE = 3;
    for (let i = 0; i < inserted.length; i += BATCH_SIZE) {
      const batch = inserted.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((b) =>
          generateStorefrontImage({
            businessId: b.id,
            name: b.name,
            category: b.category,
            location: b.location,
          })
        )
      );
      imagesGenerated += results.filter(
        (r) => r.status === "fulfilled" && r.value
      ).length;
    }

    return NextResponse.json({
      message: `Seeded ${toInsert.length} businesses`,
      inserted: toInsert.length,
      imagesGenerated,
      names: toInsert.map((b) => b.name),
    });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Internal server error" }, { status });
  }
}
