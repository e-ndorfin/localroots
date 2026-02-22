/**
 * Mock data for frontend development.
 * These 7 Toronto-based businesses match Jamie's map pins and storefront pages.
 * Will be replaced by real API data as endpoints are wired up.
 */

const businesses = [
  {
    id: "1",
    name: "Patois Toronto",
    category: "Restaurant",
    location: "794 Dundas St W, Toronto",
    description: "Caribbean-inspired fine dining with a modern twist. Jerk chicken, oxtail, and craft cocktails.",
    rating: 4.8,
    reviews: 124,
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop",
    lat: 43.6532,
    lng: -79.4112,
    hours: "Tue-Sun 5pm-11pm",
    phone: "(416) 555-0101",
    badge: "Featured",
  },
  {
    id: "2",
    name: "Kensington Natural",
    category: "Health & Wellness",
    location: "45 Kensington Ave, Toronto",
    description: "Organic health foods, supplements, and natural beauty products sourced from Black-owned suppliers.",
    rating: 4.6,
    reviews: 87,
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop",
    lat: 43.6547,
    lng: -79.4006,
    hours: "Mon-Sat 9am-7pm",
    phone: "(416) 555-0102",
  },
  {
    id: "3",
    name: "Crown & Glory Barbershop",
    category: "Beauty & Barber",
    location: "1122 Queen St W, Toronto",
    description: "Premium barbershop specializing in fades, lineups, and beard sculpting. Walk-ins welcome.",
    rating: 4.9,
    reviews: 203,
    image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&h=400&fit=crop",
    lat: 43.6426,
    lng: -79.4291,
    hours: "Mon-Sat 9am-8pm",
    phone: "(416) 555-0103",
    badge: "Top Rated",
  },
  {
    id: "4",
    name: "Afro-Bookshop",
    category: "Retail",
    location: "308 Bloor St W, Toronto",
    description: "Curated collection of books by Black authors. Fiction, non-fiction, children's books, and rare finds.",
    rating: 4.7,
    reviews: 156,
    image: "https://images.unsplash.com/photo-1526243741027-444d633d7365?w=600&h=400&fit=crop",
    lat: 43.6677,
    lng: -79.4056,
    hours: "Mon-Sun 10am-9pm",
    phone: "(416) 555-0104",
  },
  {
    id: "5",
    name: "Ubuntu Tech Hub",
    category: "Technology",
    location: "220 King St E, Toronto",
    description: "Co-working space and tech incubator for Black entrepreneurs. Mentorship, workshops, and networking.",
    rating: 4.5,
    reviews: 64,
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop",
    lat: 43.6510,
    lng: -79.3660,
    hours: "Mon-Fri 8am-10pm",
    phone: "(416) 555-0105",
  },
  {
    id: "6",
    name: "Mama Fifi's Kitchen",
    category: "Restaurant",
    location: "95 Danforth Ave, Toronto",
    description: "Authentic West African cuisine. Jollof rice, suya, egusi soup, and fresh-baked chin chin.",
    rating: 4.8,
    reviews: 178,
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop",
    lat: 43.6763,
    lng: -79.3492,
    hours: "Wed-Mon 11am-10pm",
    phone: "(416) 555-0106",
    badge: "Community Pick",
  },
  {
    id: "7",
    name: "Heritage Dance Studio",
    category: "Arts & Entertainment",
    location: "560 College St, Toronto",
    description: "Afrobeats, dancehall, and contemporary dance classes for all skill levels. Private lessons available.",
    rating: 4.7,
    reviews: 92,
    image: "https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=600&h=400&fit=crop",
    lat: 43.6564,
    lng: -79.4163,
    hours: "Mon-Sat 10am-9pm",
    phone: "(416) 555-0107",
  },
];

const storefrontProfiles = {
  "1": {
    products: [
      { id: "p1", name: "Jerk Chicken Plate", price: 18.99, description: "Signature dish with rice & peas" },
      { id: "p2", name: "Oxtail Stew", price: 24.99, description: "Slow-braised with butter beans" },
      { id: "p3", name: "Rum Punch", price: 12.99, description: "House-made with Caribbean rums" },
      { id: "p4", name: "Plantain Chips", price: 6.99, description: "Crispy with scotch bonnet dip" },
    ],
  },
  "2": {
    products: [
      { id: "p5", name: "Shea Butter (Raw)", price: 14.99, description: "Unrefined, ethically sourced from Ghana" },
      { id: "p6", name: "Moringa Powder", price: 19.99, description: "Organic superfood supplement" },
      { id: "p7", name: "Black Soap Bar", price: 8.99, description: "Traditional African black soap" },
      { id: "p8", name: "Sea Moss Gel", price: 24.99, description: "Wildcrafted from St. Lucia" },
    ],
  },
  "3": {
    products: [
      { id: "p9", name: "Classic Fade", price: 25.0, description: "Precision fade with lineup" },
      { id: "p10", name: "Beard Sculpt", price: 15.0, description: "Shape and trim with hot towel" },
      { id: "p11", name: "Full Service", price: 45.0, description: "Fade + beard + hot towel treatment" },
      { id: "p12", name: "Kids Cut", price: 18.0, description: "Ages 12 and under" },
    ],
  },
  "4": {
    products: [
      { id: "p13", name: "Monthly Book Box", price: 34.99, description: "Curated selection of 2 books" },
      { id: "p14", name: "Gift Card", price: 25.0, description: "Redeemable in-store and online" },
      { id: "p15", name: "Reading Journal", price: 16.99, description: "Track your reading journey" },
      { id: "p16", name: "Author Event Pass", price: 10.0, description: "Access to monthly author talks" },
    ],
  },
  "5": {
    products: [
      { id: "p17", name: "Hot Desk (Day)", price: 25.0, description: "Flexible workspace for a day" },
      { id: "p18", name: "Dedicated Desk (Month)", price: 350.0, description: "Your own desk, 24/7 access" },
      { id: "p19", name: "Workshop Pass", price: 45.0, description: "Access to one workshop session" },
      { id: "p20", name: "Mentorship Session", price: 0.0, description: "Free 1-on-1 with a tech mentor" },
    ],
  },
  "6": {
    products: [
      { id: "p21", name: "Jollof Rice Plate", price: 15.99, description: "Nigerian-style with fried plantain" },
      { id: "p22", name: "Suya Skewers", price: 12.99, description: "Spiced grilled beef (3 sticks)" },
      { id: "p23", name: "Egusi Soup & Fufu", price: 17.99, description: "Rich melon seed soup" },
      { id: "p24", name: "Chin Chin Bag", price: 7.99, description: "Crunchy fried dough snack" },
    ],
  },
  "7": {
    products: [
      { id: "p25", name: "Drop-In Class", price: 20.0, description: "Single class, any style" },
      { id: "p26", name: "10-Class Pass", price: 150.0, description: "Valid for 3 months" },
      { id: "p27", name: "Monthly Unlimited", price: 99.0, description: "All classes, unlimited access" },
      { id: "p28", name: "Private Lesson", price: 75.0, description: "1-on-1 session, 60 minutes" },
    ],
  },
};

const circles = [
  {
    id: "c1",
    name: "Queen West Collective",
    members: 5,
    maxMembers: 6,
    status: "active",
    totalFunded: 4500,
    activeLoan: { borrower: "Crown & Glory", amount: 1000, repaid: 400 },
  },
  {
    id: "c2",
    name: "Kensington Market Circle",
    members: 4,
    maxMembers: 6,
    status: "forming",
    totalFunded: 0,
    activeLoan: null,
  },
  {
    id: "c3",
    name: "Danforth Entrepreneurs",
    members: 6,
    maxMembers: 6,
    status: "active",
    totalFunded: 8200,
    activeLoan: { borrower: "Mama Fifi's Kitchen", amount: 3000, repaid: 2100 },
  },
];

const rewardHistory = [
  { id: "r1", type: "earn", points: 190, description: "Purchase at Patois Toronto", date: "2025-02-18" },
  { id: "r2", type: "earn", points: 150, description: "Purchase at Kensington Natural", date: "2025-02-15" },
  { id: "r3", type: "redeem", points: -500, description: "Redeemed at Crown & Glory", date: "2025-02-12" },
  { id: "r4", type: "earn", points: 250, description: "Purchase at Mama Fifi's Kitchen", date: "2025-02-10" },
  { id: "r5", type: "earn", points: 100, description: "Purchase at Afro-Bookshop", date: "2025-02-08" },
  { id: "r6", type: "earn", points: 200, description: "Purchase at Heritage Dance Studio", date: "2025-02-05" },
  { id: "r7", type: "redeem", points: -350, description: "Redeemed at Ubuntu Tech Hub", date: "2025-02-01" },
];

module.exports = { businesses, storefrontProfiles, circles, rewardHistory };
