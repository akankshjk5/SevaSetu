"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

type Mode = "dukaan" | "minutes" | "runner";

type LocalShop = {
  id: string;
  name: string;
  category: "chicken" | "medicine" | "kirana" | "hardware" | "sabzi";
  locality: string;
  distanceKm: number;
  etaMins: number;
  highlight: string;
  verifiedShop: boolean;
};

const LOCAL_SHOPS: LocalShop[] = [
  // Malviya Nagar
  { id: "s1", name: "Al-Noor Fresh Poultry & Meat", category: "chicken", locality: "Malviya Nagar", distanceKm: 0.8, etaMins: 14, highlight: "Fresh daily cut, washed & hygienically packed", verifiedShop: true },
  { id: "s2", name: "Sharma Medicos & 24/7 Chemist", category: "medicine", locality: "Malviya Nagar", distanceKm: 0.4, etaMins: 10, highlight: "All prescription medicines & baby care in stock", verifiedShop: true },
  { id: "s3", name: "Goyal Kirana & Provision Store", category: "kirana", locality: "Malviya Nagar", distanceKm: 0.3, etaMins: 11, highlight: "Fresh chakki atta, pulses, dairy & spices", verifiedShop: true },
  { id: "s4", name: "Jaipur Hardware & Sanitary Mart", category: "hardware", locality: "Malviya Nagar", distanceKm: 0.6, etaMins: 13, highlight: "Taps, pipes, MCB, wires & adhesives", verifiedShop: true },
  { id: "s5", name: "Sector 4 Fresh Sabzi Mandi Cart", category: "sabzi", locality: "Malviya Nagar", distanceKm: 0.2, etaMins: 9, highlight: "Farm fresh vegetables & seasonal fruits", verifiedShop: true },

  // Mansarovar
  { id: "s6", name: "Rawat Fresh Chicken Center", category: "chicken", locality: "Mansarovar", distanceKm: 1.1, etaMins: 16, highlight: "Curry cut, boneless & fresh eggs", verifiedShop: true },
  { id: "s7", name: "Sanjeevani Healthcare Pharmacy", category: "medicine", locality: "Mansarovar", distanceKm: 0.5, etaMins: 11, highlight: "Genuine medicines, glucose & emergency supplies", verifiedShop: true },
  { id: "s8", name: "Aggarwal Brothers Super Store", category: "kirana", locality: "Mansarovar", distanceKm: 0.4, etaMins: 12, highlight: "Wholesale colony grocery rates", verifiedShop: true },
  { id: "s9", name: "Shree Ram Electricals & Hardware", category: "hardware", locality: "Mansarovar", distanceKm: 0.7, etaMins: 15, highlight: "Fan capacitors, LED lights, plumbing fittings", verifiedShop: true },

  // Vaishali Nagar
  { id: "s10", name: "Delight Fresh Chicken & Eggs", category: "chicken", locality: "Vaishali Nagar", distanceKm: 0.9, etaMins: 15, highlight: "Cleaned and vacuum packed cuts", verifiedShop: true },
  { id: "s11", name: "Apex Chemist & Surgical", category: "medicine", locality: "Vaishali Nagar", distanceKm: 0.6, etaMins: 12, highlight: "Full prescription inventory & first-aid", verifiedShop: true },
  { id: "s12", name: "Kanha Daily Essentials & Dairy", category: "kirana", locality: "Vaishali Nagar", distanceKm: 0.5, etaMins: 12, highlight: "Organic flours, dry fruits & fresh milk", verifiedShop: true },

  // C-Scheme
  { id: "s13", name: "Ashok Nagar Fresh Poultry", category: "chicken", locality: "C-Scheme", distanceKm: 1.0, etaMins: 15, highlight: "Daily fresh chicken & mutton", verifiedShop: true },
  { id: "s14", name: "Jaipur Central Drug Store", category: "medicine", locality: "C-Scheme", distanceKm: 0.3, etaMins: 9, highlight: "Emergency injections, oxygen & medicines", verifiedShop: true },
  { id: "s15", name: "Kothari General Merchant", category: "kirana", locality: "C-Scheme", distanceKm: 0.4, etaMins: 11, highlight: "Gourmet spices, premium rice & oil", verifiedShop: true },
];

export function RapidServicesHub({ city }: { city: string }) {
  const [activeMode, setActiveMode] = useState<Mode>("dukaan");

  // Dukaan state
  const [selectedLocality, setSelectedLocality] = useState("Malviya Nagar");
  const [shopCategory, setShopCategory] = useState<"chicken" | "medicine" | "kirana" | "hardware" | "sabzi">("chicken");
  const [selectedShopId, setSelectedShopId] = useState<string>("s1");
  const [customShopName, setCustomShopName] = useState("");
  const [itemNotes, setItemNotes] = useState("");
  const [isOrdered, setIsOrdered] = useState(false);

  // Minutes state
  const [urgentTrade, setUrgentTrade] = useState<"plumber" | "electrician" | "carpenter">("plumber");

  // Runner state
  const [distanceKm, setDistanceKm] = useState(3);

  // Filtered shops
  const availableShops = useMemo(() => {
    const list = LOCAL_SHOPS.filter(
      (s) => s.locality === selectedLocality && s.category === shopCategory
    );
    if (list.length > 0) return list;
    return LOCAL_SHOPS.filter((s) => s.category === shopCategory);
  }, [selectedLocality, shopCategory]);

  const activeShop = useMemo(() => {
    return availableShops.find((s) => s.id === selectedShopId) || availableShops[0];
  }, [availableShops, selectedShopId]);

  // Calculations
  const runnerFare = 35 + distanceKm * 10;
  const runnerEta = 8 + distanceKm * 2;
  const minutesEta = urgentTrade === "plumber" ? 14 : urgentTrade === "electrician" ? 12 : 18;

  return (
    <div className="card overflow-hidden border-2 border-teal-600/30 bg-white shadow-xs">
      {/* Top Header Banner with Anti-Dark Store Tag */}
      <div className="bg-gradient-to-r from-slate-950 via-teal-950 to-slate-900 p-4 sm:p-5 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-300 ring-1 ring-emerald-500/40">
                🚫 Zero Corporate Dark Stores
              </span>
              <span className="text-[10px] font-bold text-amber-300">
                🏪 100% Direct From Your Local Dukaan
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black tracking-tight">
              Hyperlocal Quick Delivery: Chicken, Medicines, Kirana & Emergency Fixes
            </h3>
            <p className="text-xs text-slate-300 max-w-xl">
              Buy from your favourite neighbourhood shops fast. Support local businesses, pay zero inflated platform markups, and empower local delivery youth.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 rounded-xl bg-white/10 p-1 backdrop-blur-md self-start sm:self-auto shrink-0">
            {[
              { id: "dukaan" as Mode, label: "🏪 Local Dukaan Direct", icon: "🏪" },
              { id: "minutes" as Mode, label: "⚡ 15-Min Fixes", icon: "⚡" },
              { id: "runner" as Mode, label: "🛵 Rapid Runner", icon: "🛵" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveMode(tab.id);
                  setIsOrdered(false);
                }}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                  activeMode === tab.id
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-white/80 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MODE 1: LOCAL DUKAAN DIRECT (Chicken, Medicine, Kirana, Hardware, Sabzi) */}
      {activeMode === "dukaan" && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Locality & Category Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {[
                { id: "chicken" as const, label: "Fresh Chicken / Meat", icon: "🍗" },
                { id: "medicine" as const, label: "Chemist & Medicines", icon: "💊" },
                { id: "kirana" as const, label: "Local Kirana Store", icon: "🌾" },
                { id: "hardware" as const, label: "Hardware & Sanitary", icon: "🔧" },
                { id: "sabzi" as const, label: "Sabzi & Fruits", icon: "🥬" },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setShopCategory(c.id);
                    setIsOrdered(false);
                  }}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                    shopCategory === c.id
                      ? "bg-teal-700 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <span>{c.icon}</span>
                  <span>{c.label}</span>
                </button>
              ))}
            </div>

            {/* Area Filter */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs">
              <span className="text-slate-500 text-[11px] font-medium">Your Area:</span>
              <select
                value={selectedLocality}
                onChange={(e) => setSelectedLocality(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-bold text-slate-800 focus:border-teal-600 focus:outline-none"
              >
                <option value="Malviya Nagar">Malviya Nagar</option>
                <option value="Mansarovar">Mansarovar</option>
                <option value="Vaishali Nagar">Vaishali Nagar</option>
                <option value="C-Scheme">C-Scheme</option>
              </select>
            </div>
          </div>

          {/* Shop Selection & Order Form */}
          <div className="grid gap-4 lg:grid-cols-12">
            {/* Left: Nearby Shops & Custom Shop Choice */}
            <div className="space-y-3 lg:col-span-7">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-800">
                  Select Trusted Shop in {selectedLocality}:
                </p>
                <span className="text-[11px] text-teal-800 font-bold">
                  {availableShops.length} shops ready
                </span>
              </div>

              {/* Shop List Cards */}
              <div className="space-y-2">
                {availableShops.map((shop) => (
                  <div
                    key={shop.id}
                    onClick={() => {
                      setSelectedShopId(shop.id);
                      setCustomShopName("");
                    }}
                    className={`flex items-center justify-between rounded-xl border p-2.5 transition cursor-pointer ${
                      selectedShopId === shop.id && !customShopName
                        ? "border-teal-600 bg-teal-50/60 ring-1 ring-teal-500 shadow-2xs"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-xs text-slate-900 truncate">{shop.name}</p>
                        {shop.verifiedShop && (
                          <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800 shrink-0">
                            ✓ Verified Local Shop
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">{shop.highlight}</p>
                    </div>

                    <div className="text-right shrink-0 pl-3">
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-black text-slate-800 block">
                        ~{shop.etaMins} mins
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">{shop.distanceKm} km away</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Custom Shop Choice Option */}
              <div className="pt-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Or specify your own favourite shop name in {selectedLocality}:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pappu Chicken Corner / City Medicos Sector 3..."
                  value={customShopName}
                  onChange={(e) => setCustomShopName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-600 focus:outline-none"
                />
              </div>

              {/* Item List / Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700">
                  What items do you need? (Write items or upload prescription note):
                </label>
                <textarea
                  rows={2}
                  placeholder={
                    shopCategory === "chicken"
                      ? "e.g. 1 kg fresh chicken curry cut, washed, no skin..."
                      : shopCategory === "medicine"
                      ? "e.g. Paracetamol 650 1 strip, ORS 2 packets, Volini spray..."
                      : shopCategory === "hardware"
                      ? "e.g. 2x 16A modular switch, 1 roll Teflon tape, 1 tap washer..."
                      : "e.g. 5kg Aashirvaad Atta, 1L Amul Gold Milk, 500g Toor Dal..."
                  }
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-teal-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Right: Transparent Local Order Box */}
            <div className="lg:col-span-5 rounded-xl border border-teal-200/80 bg-gradient-to-br from-teal-50/50 via-white to-amber-50/40 p-4 text-xs flex flex-col justify-between space-y-3">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Target Shop:</span>
                  <span className="font-black text-xs text-teal-900 truncate max-w-[180px]">
                    {customShopName.trim() ? customShopName : activeShop?.name}
                  </span>
                </div>

                <div className="rounded-lg bg-white p-2.5 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600">Goods Price:</span>
                    <span className="font-bold text-slate-900">Original Shop Bill (MRP)</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600">Hyperlocal Delivery Fee:</span>
                    <span className="font-bold text-teal-800">₹35 only</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                    <span className="text-slate-600">Estimated Delivery:</span>
                    <span className="font-black text-emerald-700">~{activeShop ? activeShop.etaMins : 15} mins</span>
                  </div>
                </div>

                {/* Anti-Dark Store Community Benefit Box */}
                <div className="rounded-lg bg-amber-50 p-2.5 border border-amber-200 text-[10px] text-amber-950 space-y-1">
                  <p className="font-black">🤝 Why this beats corporate dark stores:</p>
                  <p>• Shopkeeper gets 100% of the sale (0% commission).</p>
                  <p>• ₹35 delivery fee goes 100% to local rider.</p>
                  <p>• You get genuine fresh items from your trusted shop.</p>
                </div>
              </div>

              {isOrdered ? (
                <div className="rounded-xl bg-emerald-600 p-3 text-center text-white">
                  <p className="text-sm font-bold">✓ Order Broadcast to Local Runner!</p>
                  <p className="text-[10px] text-emerald-100 mt-0.5">
                    Runner assigned in {selectedLocality}. Heading to {customShopName || activeShop?.name}.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsOrdered(true)}
                  className="w-full rounded-xl bg-teal-700 py-2.5 text-center text-xs font-bold text-white shadow-2xs transition hover:bg-teal-800 active:scale-95 cursor-pointer"
                >
                  Send Runner to {customShopName ? "My Shop" : "Shop"} (₹35 Delivery) →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: 15-MINUTE EMERGENCY DISPATCH */}
      {activeMode === "minutes" && (
        <div className="p-4 sm:p-5 space-y-4">
          <div className="grid gap-4 lg:grid-cols-12 items-center">
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-900">
                  ⚡ 15-MINUTE GUARANTEE
                </span>
                <span className="text-xs text-slate-500">Live nearest helper dispatch</span>
              </div>
              <h4 className="text-sm sm:text-base font-black text-slate-900">
                Instant Emergency Technician at Your Doorstep
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Water pipe burst? Main fuse blown? Locked out of your flat? Nearest verified helper arrives in ~15 minutes with essential emergency replacement parts.
              </p>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "plumber" as const, name: "Pipe / Tap Burst", icon: "🚰", eta: "14 mins" },
                  { id: "electrician" as const, name: "Power / MCB Trip", icon: "⚡", eta: "12 mins" },
                  { id: "carpenter" as const, name: "Lock / Door Jam", icon: "🚪", eta: "18 mins" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setUrgentTrade(item.id)}
                    className={`rounded-xl p-2.5 text-left border transition cursor-pointer ${
                      urgentTrade === item.id
                        ? "border-teal-600 bg-teal-50/50 shadow-2xs"
                        : "border-slate-200 bg-slate-50 hover:bg-white"
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <p className="font-bold text-xs text-slate-900 mt-1">{item.name}</p>
                    <span className="text-[10px] font-semibold text-emerald-700">~{item.eta}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 rounded-xl border border-teal-200/80 bg-gradient-to-br from-teal-50/60 to-emerald-50/40 p-4 text-xs flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Estimated Arrival:</span>
                  <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 font-black text-white text-xs animate-pulse">
                    ~{minutesEta} Mins
                  </span>
                </div>
                <div className="rounded-lg bg-white/90 p-2.5 border border-teal-100 space-y-1 text-[11px]">
                  <p className="font-bold text-slate-900 flex items-center justify-between">
                    <span>Emergency Callout Visit:</span>
                    <span>₹299</span>
                  </p>
                  <p className="text-slate-500 text-[10px]">
                    Includes inspection + minor fixes. Free ₹2L insurance covered.
                  </p>
                </div>
              </div>

              <Link
                href={`/login?role=household&next=${encodeURIComponent(
                  `/household/matches?category=${urgentTrade}`
                )}`}
                data-tap
                className="w-full rounded-xl bg-teal-700 py-2.5 text-center text-xs font-bold text-white shadow-2xs transition hover:bg-teal-800 active:scale-95"
              >
                Dispatch Express {urgentTrade === "plumber" ? "Plumber" : urgentTrade === "electrician" ? "Electrician" : "Carpenter"} Now →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: RAPID PARCEL & ERRAND RUNNER (Rapido & Genie Style) */}
      {activeMode === "runner" && (
        <div className="p-4 sm:p-5 space-y-4">
          <div className="grid gap-4 lg:grid-cols-12 items-center">
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-900">
                  🛵 RAPID RUNNER & GENIE
                </span>
                <span className="text-xs text-slate-500">Pick up & drop anything across {city}</span>
              </div>
              <h4 className="text-sm sm:text-base font-black text-slate-900">
                Send Packages, Keys, Documents or Run Quick Errands
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Need to send lunchbox to office, pick up prescription from chemist, or deliver documents? A verified local bike partner picks it up in minutes.
              </p>

              <div className="space-y-1.5 rounded-xl bg-slate-50 p-3 border border-slate-200">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>Trip Distance: {distanceKm} km</span>
                  <span className="text-teal-700 font-extrabold">₹{runnerFare} only</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={15}
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(Number(e.target.value))}
                  className="w-full accent-teal-700 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>1 km (Local)</span>
                  <span>7 km (Mid)</span>
                  <span>15 km (Across City)</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/60 to-orange-50/40 p-4 text-xs flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Estimated Delivery:</span>
                  <span className="rounded-full bg-slate-900 px-2.5 py-0.5 font-bold text-white text-xs">
                    ~{runnerEta} Mins
                  </span>
                </div>

                <div className="rounded-lg bg-white/90 p-2.5 border border-amber-100 space-y-1 text-[11px]">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>Runner Fare:</span>
                    <span>₹{runnerFare}</span>
                  </div>
                  <p className="text-[10px] text-emerald-800 font-semibold">
                    ✓ 90% goes straight to the rider's bank account
                  </p>
                </div>
              </div>

              <Link
                href="/login?role=household&next=/household/post?category=mover"
                data-tap
                className="w-full rounded-xl bg-slate-900 py-2.5 text-center text-xs font-bold text-white shadow-2xs transition hover:bg-slate-800 active:scale-95"
              >
                Book Errand / Parcel Runner (₹{runnerFare}) →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
