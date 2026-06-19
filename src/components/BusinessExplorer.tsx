import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Rocket, TrendingUp, ShoppingBag, Landmark,
  BookOpen, Utensils, Cpu, Heart, Zap, Globe, Car,
  Gamepad2, Film, Plane, Pill, Factory, Shirt,
} from "lucide-react";

type Category = {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  iconBg: string;
  companies: string[];
};

const CATEGORIES: Category[] = [
  // ── GLOBAL ──────────────────────────────────────────────────────
  {
    id: "global-giants",
    label: "Global Giants",
    icon: Globe,
    color: "text-indigo-700",
    iconBg: "bg-indigo-50 border-indigo-100",
    companies: [
      "Apple", "Microsoft", "Amazon", "Alphabet (Google)", "Meta",
      "Tesla", "NVIDIA", "Samsung", "TSMC", "Berkshire Hathaway",
      "JPMorgan Chase", "Johnson & Johnson", "Exxon Mobil", "Visa",
      "Walmart", "Procter & Gamble", "Mastercard", "UnitedHealth Group",
      "LVMH", "Nestlé", "Toyota", "Shell", "Novartis", "ASML",
      "SAP", "Siemens", "Alibaba", "Tencent", "ICBC",
    ],
  },
  {
    id: "us-tech",
    label: "US Tech",
    icon: Cpu,
    color: "text-blue-700",
    iconBg: "bg-blue-50 border-blue-100",
    companies: [
      "Apple", "Microsoft", "Alphabet", "Meta", "NVIDIA", "Amazon",
      "Netflix", "Salesforce", "Adobe", "Intel", "Qualcomm", "AMD",
      "Broadcom", "Texas Instruments", "Cisco", "Oracle", "IBM",
      "Palantir", "Snowflake", "Datadog", "CrowdStrike", "Splunk",
      "ServiceNow", "Workday", "Zoom", "Slack", "Dropbox",
      "Airbnb", "Uber", "Lyft", "DoorDash", "Instacart",
      "Stripe", "Square", "PayPal", "Robinhood", "Coinbase",
    ],
  },
  {
    id: "china-tech",
    label: "China & Asia",
    icon: TrendingUp,
    color: "text-red-700",
    iconBg: "bg-red-50 border-red-100",
    companies: [
      "Alibaba", "Tencent", "ByteDance (TikTok)", "Baidu", "JD.com",
      "Meituan", "Pinduoduo", "Xiaomi", "Huawei", "DJI",
      "BYD", "CATL", "Ant Group", "DiDi", "Kuaishou",
      "NetEase", "Bilibili", "iQIYI", "Grab", "Gojek",
      "Sea Limited", "Shopee", "Lazada", "Tokopedia", "Bukalapak",
      "SoftBank", "Sony", "Honda", "Panasonic", "Rakuten",
      "Line", "Kakao", "Coupang", "SK Telecom", "POSCO",
    ],
  },
  {
    id: "european",
    label: "European",
    icon: Building2,
    color: "text-violet-700",
    iconBg: "bg-violet-50 border-violet-100",
    companies: [
      "LVMH", "Nestlé", "Novartis", "Roche", "ASML", "SAP",
      "Siemens", "Volkswagen", "BMW", "Mercedes-Benz", "Airbus",
      "TotalEnergies", "BNP Paribas", "AXA", "Allianz", "HSBC",
      "Shell", "BP", "Unilever", "Diageo", "GSK", "AstraZeneca",
      "Spotify", "Klarna", "Revolut", "Adyen", "Booking.com",
      "IKEA", "H&M", "Zara (Inditex)", "Aldi", "Lidl",
      "Heineken", "Philips", "ABB", "Ericsson", "Nokia",
    ],
  },
  // ── INDIA ───────────────────────────────────────────────────────
  {
    id: "india-large",
    label: "India Large Cap",
    icon: Landmark,
    color: "text-orange-700",
    iconBg: "bg-orange-50 border-orange-100",
    companies: [
      "Reliance Industries", "Tata Motors", "Infosys", "HDFC Bank",
      "Wipro", "Mahindra & Mahindra", "Bajaj Auto", "Larsen & Toubro",
      "Hindustan Unilever", "ITC", "Asian Paints", "Maruti Suzuki",
      "HCL Technologies", "Sun Pharma", "Titan Company", "Nestle India",
      "Tata Steel", "Ultratech Cement", "Kotak Mahindra Bank",
      "Axis Bank", "State Bank of India", "ONGC", "Coal India",
      "NTPC", "Power Grid", "Bharti Airtel", "Adani Ports",
    ],
  },
  {
    id: "india-unicorns",
    label: "India Unicorns",
    icon: Rocket,
    color: "text-amber-700",
    iconBg: "bg-amber-50 border-amber-100",
    companies: [
      "Zerodha", "PhonePe", "Razorpay", "CRED", "Groww", "Ola",
      "Paytm", "Byju's", "Dream11", "ShareChat", "Meesho", "Nykaa",
      "Zomato", "Swiggy", "BharatPe", "upGrad", "Unacademy",
      "Oyo Rooms", "Delhivery", "Lenskart", "Mamaearth", "boAt",
      "CoinSwitch", "Spinny", "Vedantu", "Slice", "Jupiter",
      "Rapido", "BluSmart", "Dunzo", "Urban Company",
    ],
  },
  {
    id: "india-startups",
    label: "India Startups",
    icon: Zap,
    color: "text-teal-700",
    iconBg: "bg-teal-50 border-teal-100",
    companies: [
      "Jar", "Fi Money", "Niyo", "OneCard", "Juspay", "Setu",
      "Cashkaro", "Open Financial", "Navi Technologies", "Smallcase",
      "Wint Wealth", "Grip Invest", "Stashfin", "Kreditbee",
      "MoneyTap", "EarlySalary", "Yulu", "Ather Energy", "Simple Energy",
      "Okinawa Scooters", "Hero Electric", "Bounce Infinity",
      "Zepto", "Blinkit", "Country Delight", "Licious", "FreshToHome",
      "Rebel Foods", "Faasos", "Box8", "Biryani By Kilo",
      "Chai Point", "Third Wave Coffee", "Sleepy Owl", "Blue Tokai",
    ],
  },
  {
    id: "india-d2c",
    label: "India D2C",
    icon: Shirt,
    color: "text-pink-700",
    iconBg: "bg-pink-50 border-pink-100",
    companies: [
      "boAt", "Mamaearth", "Sugar Cosmetics", "WOW Skin Science",
      "mCaffeine", "Minimalist", "The Man Company", "Bella Vita",
      "Bombay Shaving", "Beardo", "Wakefit", "The Sleep Company",
      "Duroflex", "Atomberg", "Noise", "Fire-Boltt", "Pebble",
      "Crossbeats", "Campus Shoes", "Manyavar", "FabIndia",
      "Biba", "W for Woman", "House of Anita Dongre",
      "Nykaa Fashion", "Myntra Private Labels",
    ],
  },
  // ── GLOBAL SECTORS ──────────────────────────────────────────────
  {
    id: "fintech",
    label: "Fintech",
    icon: Landmark,
    color: "text-emerald-700",
    iconBg: "bg-emerald-50 border-emerald-100",
    companies: [
      "Stripe", "Square (Block)", "PayPal", "Revolut", "Klarna",
      "Adyen", "Robinhood", "Coinbase", "Chime", "Nubank",
      "Wise", "N26", "Monzo", "Starling Bank", "Plaid",
      "Brex", "Ramp", "Affirm", "Afterpay", "Sezzle",
      "Zerodha", "Groww", "Razorpay", "PhonePe", "CRED",
      "Paytm", "BharatPe", "Jupiter", "Fi Money", "Slice",
      "Ant Group", "WeBank", "MYbank", "Kakao Bank",
    ],
  },
  {
    id: "ecommerce",
    label: "E-Commerce",
    icon: ShoppingBag,
    color: "text-blue-700",
    iconBg: "bg-blue-50 border-blue-100",
    companies: [
      "Amazon", "Alibaba", "JD.com", "Shopify", "eBay",
      "Etsy", "Pinduoduo", "Mercado Libre", "Rakuten", "Lazada",
      "Shopee", "Tokopedia", "Flipkart", "Meesho", "Nykaa",
      "Myntra", "IndiaMART", "Ajio", "Tata CLiQ", "Snapdeal",
      "Pepperfry", "Urban Ladder", "FirstCry", "Purplle",
      "Zalando", "ASOS", "Farfetch", "Vinted", "OfferUp",
    ],
  },
  {
    id: "food",
    label: "Food & Delivery",
    icon: Utensils,
    color: "text-red-600",
    iconBg: "bg-red-50 border-red-100",
    companies: [
      "DoorDash", "Uber Eats", "Grubhub", "Instacart", "GoPuff",
      "Deliveroo", "Just Eat", "HelloFresh", "Blue Apron",
      "Swiggy", "Zomato", "BigBasket", "Blinkit", "Zepto",
      "Dunzo", "Rebel Foods", "Faasos", "Biryani By Kilo",
      "Grab Food", "Gojek Food", "Foodpanda", "Rappi",
      "iFood", "Meituan", "Ele.me", "Caviar",
    ],
  },
  {
    id: "edtech",
    label: "EdTech",
    icon: BookOpen,
    color: "text-amber-600",
    iconBg: "bg-amber-50 border-amber-100",
    companies: [
      "Coursera", "edX", "Udemy", "Duolingo", "Khan Academy",
      "Chegg", "2U", "Pluralsight", "LinkedIn Learning",
      "Byju's", "Unacademy", "Vedantu", "upGrad", "Toppr",
      "Simplilearn", "Great Learning", "Scaler", "Newton School",
      "WhiteHatJr", "Coding Ninjas", "Masai School",
      "VIPKid", "Yuanfudao", "Zuoyebang", "Netdragon",
      "Kahoot", "Quizlet", "Brainly", "Photomath",
    ],
  },
  {
    id: "mobility",
    label: "Mobility & EV",
    icon: Car,
    color: "text-cyan-700",
    iconBg: "bg-cyan-50 border-cyan-100",
    companies: [
      "Tesla", "BYD", "Rivian", "Lucid Motors", "NIO",
      "XPeng", "Li Auto", "Volkswagen EV", "BMW i", "Hyundai EV",
      "Ola Electric", "Ather Energy", "Revolt Motors", "Simple Energy",
      "Okinawa Scooters", "Hero Electric", "Yulu", "BluSmart",
      "Uber", "Lyft", "Ola Cabs", "DiDi", "Grab",
      "Lime", "Bird", "Spin", "Tier", "Voi",
      "Waymo", "Cruise", "Aurora", "Motional",
    ],
  },
  {
    id: "gaming",
    label: "Gaming & Media",
    icon: Gamepad2,
    color: "text-purple-700",
    iconBg: "bg-purple-50 border-purple-100",
    companies: [
      "Microsoft (Xbox)", "Sony (PlayStation)", "Nintendo",
      "Activision Blizzard", "Electronic Arts", "Take-Two Interactive",
      "Roblox", "Epic Games", "Riot Games", "Supercell",
      "King (Candy Crush)", "Zynga", "NetEase Games", "MiHoYo",
      "Nazara Technologies", "Mobile Premier League", "WinZO",
      "Dream11", "Games24x7", "Paytm First Games",
      "Netflix", "Disney+", "Amazon Prime", "HBO Max",
      "Spotify", "Apple Music", "YouTube", "Twitch",
    ],
  },
  {
    id: "health",
    label: "Healthcare",
    icon: Pill,
    color: "text-green-700",
    iconBg: "bg-green-50 border-green-100",
    companies: [
      "Johnson & Johnson", "Pfizer", "Roche", "Novartis", "Merck",
      "AstraZeneca", "Abbott", "Medtronic", "Becton Dickinson",
      "UnitedHealth Group", "CVS Health", "Cigna", "Humana",
      "Teladoc", "Doximity", "Health Catalyst", "Veeva Systems",
      "Sun Pharma", "Dr. Reddy's", "Cipla", "Biocon",
      "Divi's Laboratories", "Aurobindo Pharma", "Lupin",
      "Practo", "1mg", "PharmEasy", "Netmeds", "MediBuddy",
    ],
  },
  {
    id: "entertainment",
    label: "Entertainment",
    icon: Film,
    color: "text-rose-700",
    iconBg: "bg-rose-50 border-rose-100",
    companies: [
      "Netflix", "Disney", "Warner Bros", "Universal", "Paramount",
      "Sony Pictures", "Amazon Studios", "Apple TV+", "HBO",
      "Spotify", "Apple Music", "SoundCloud", "Deezer",
      "Hotstar (Disney+)", "Amazon Prime Video", "JioCinema",
      "ZEE5", "SonyLIV", "ALTBalaji", "Eros Now", "MX Player",
      "YouTube", "Twitch", "TikTok", "Instagram", "Snapchat",
    ],
  },
  {
    id: "aviation",
    label: "Aviation & Travel",
    icon: Plane,
    color: "text-sky-700",
    iconBg: "bg-sky-50 border-sky-100",
    companies: [
      "American Airlines", "United Airlines", "Delta Air Lines",
      "Emirates", "Singapore Airlines", "Lufthansa", "Air France",
      "British Airways", "Qatar Airways", "Turkish Airlines",
      "IndiGo", "Air India", "SpiceJet", "Vistara", "GoAir",
      "Airbnb", "Booking.com", "Expedia", "TripAdvisor",
      "MakeMyTrip", "Cleartrip", "Yatra", "ixigo",
      "Oyo Rooms", "Treebo", "FabHotels",
      "Boeing", "Airbus", "Lockheed Martin",
    ],
  },
  {
    id: "manufacturing",
    label: "Manufacturing",
    icon: Factory,
    color: "text-stone-700",
    iconBg: "bg-stone-50 border-stone-100",
    companies: [
      "Tata Steel", "ArcelorMittal", "Nucor", "POSCO", "Baowu Group",
      "Caterpillar", "John Deere", "3M", "Honeywell", "Emerson",
      "ABB", "Siemens", "Schneider Electric", "Rockwell Automation",
      "Larsen & Toubro", "Bharat Forge", "Tata Power", "BHEL",
      "Voltas", "Havells", "Crompton", "Finolex", "Polycab",
      "Asian Paints", "Berger Paints", "Kansai Nerolac",
      "Pidilite", "Astral", "Supreme Industries",
    ],
  },
];

const SHOW_FIRST = 18;

export function BusinessExplorer({ onSelect }: { onSelect: (name: string) => void }) {
  const [activeId, setActiveId] = useState<string>(CATEGORIES[0].id);
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  const active = CATEGORIES.find((c) => c.id === activeId) ?? CATEGORIES[0];

  const filtered = useMemo(() =>
    search.trim()
      ? CATEGORIES.flatMap((c) => c.companies).filter((name) =>
          name.toLowerCase().includes(search.toLowerCase())
        )
      : active.companies,
    [search, active]
  );

  const visibleCompanies = showAll ? filtered : filtered.slice(0, SHOW_FIRST);
  const hasMore = filtered.length > SHOW_FIRST;

  const isSearching = search.trim().length > 0;

  return (
    <div className="mt-6 w-full">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Explore by Category
        </p>
        <span className="text-xs text-muted-foreground">
          {CATEGORIES.reduce((a, c) => a + c.companies.length, 0).toLocaleString()}+ businesses worldwide
        </span>
      </div>

      {/* ── Search within explorer ───────────────────────────────── */}
      <div className="relative mb-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search any company by name…"
          className="w-full px-4 py-2.5 text-sm rounded-xl border border-border bg-white focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/60"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {!isSearching && (
        /* ── Category tabs ─────────────────────────────────────── */
        <div className="relative mb-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = cat.id === activeId;
              return (
                <button
                  key={cat.id}
                  onClick={() => { setActiveId(cat.id); setShowAll(false); }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 border transition-all duration-150 ${
                    isActive
                      ? `${cat.iconBg} ${cat.color} shadow-sm`
                      : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 bg-card"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {cat.label}
                </button>
              );
            })}
          </div>
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent" />
        </div>
      )}

      {/* ── Company chips ─────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={isSearching ? `search-${search}` : activeId}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.16 }}
        >
          {filtered.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              No matches for "{search}" — try analyzing it directly ↑
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {visibleCompanies.map((name) => (
                  <button
                    key={name}
                    onClick={() => { setSearch(""); onSelect(name); }}
                    className="inline-flex items-center text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-white
                      hover:bg-primary/5 hover:border-primary/40 hover:text-primary
                      text-foreground transition-all duration-150 hover:shadow-sm whitespace-nowrap active:scale-95"
                  >
                    {name}
                  </button>
                ))}
              </div>

              {/* Show more / collapse */}
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {isSearching
                    ? `${filtered.length} matches · click any to analyze`
                    : `${showAll ? filtered.length : Math.min(SHOW_FIRST, filtered.length)} of ${filtered.length} companies shown`}
                </p>
                {hasMore && (
                  <button
                    onClick={() => setShowAll((v) => !v)}
                    className="text-xs font-semibold text-primary hover:underline shrink-0 ml-3"
                  >
                    {showAll ? "Show less ↑" : `+ ${filtered.length - SHOW_FIRST} more`}
                  </button>
                )}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
