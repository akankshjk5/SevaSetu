"use client";

import { useState } from "react";
import Link from "next/link";

type ServiceOption = {
  id: string;
  name: string;
  type: "monthly" | "visit";
  basePrice: number;
  icon: string;
};

const SERVICES: ServiceOption[] = [
  { id: "cleaner", name: "House Cleaning", type: "monthly", basePrice: 4200, icon: "🧹" },
  { id: "cook", name: "Home Cook", type: "monthly", basePrice: 5500, icon: "🍲" },
  { id: "carpenter", name: "Carpenter & Furniture", type: "visit", basePrice: 450, icon: "🪚" },
  { id: "plumber", name: "Plumber & Pipe Mechanic", type: "visit", basePrice: 450, icon: "🔧" },
  { id: "electrician", name: "Electrician & Appliances", type: "visit", basePrice: 500, icon: "⚡" },
  { id: "mason", name: "Civil Mason (Rajgir)", type: "visit", basePrice: 850, icon: "🧱" },
  { id: "helper", name: "Civil Site Helper", type: "visit", basePrice: 550, icon: "👷" },
];

export function InteractiveWageCalculator() {
  const [selectedServiceId, setSelectedServiceId] = useState("cleaner");
  const [shifts, setShifts] = useState(1); // 1 shift (morning) or 2 shifts (morning + evening)

  const selected = SERVICES.find((s) => s.id === selectedServiceId) || SERVICES[0];

  const totalPrice = selected.type === "monthly" ? selected.basePrice * shifts : selected.basePrice;
  const workerShare = Math.round(totalPrice * 0.88);
  const platformFee = totalPrice - workerShare;

  return (
    <div className="card border-amber-900/10 bg-white p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <span className="pill bg-teal-50 text-teal-800 text-[11px] font-bold ring-1 ring-teal-200">
            100% Transparent Pricing
          </span>
          <h3 className="mt-1 text-base font-black text-slate-900">
            Interactive Price & Safety Breakdown
          </h3>
        </div>
        <span className="text-xs text-slate-500">Government Minimum Wage Aligned</span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        {/* Service Selector */}
        <div className="space-y-3 lg:col-span-7">
          <label className="block text-xs font-bold text-slate-700">Choose Service:</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {SERVICES.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedServiceId(s.id)}
                className={`flex items-center gap-2 rounded-xl p-2.5 text-left text-xs font-bold transition cursor-pointer ${
                  selectedServiceId === s.id
                    ? "bg-teal-700 text-white shadow-xs ring-1 ring-teal-800"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span className="text-base">{s.icon}</span>
                <span className="truncate">{s.name}</span>
              </button>
            ))}
          </div>

          {selected.type === "monthly" && (
            <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 p-2.5 text-xs">
              <span className="font-semibold text-slate-700">Shifts per day:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShifts(1)}
                  className={`rounded-lg px-2.5 py-1 font-bold transition cursor-pointer ${
                    shifts === 1 ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                  }`}
                >
                  1 Shift (Daily)
                </button>
                <button
                  onClick={() => setShifts(2)}
                  className={`rounded-lg px-2.5 py-1 font-bold transition cursor-pointer ${
                    shifts === 2 ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                  }`}
                >
                  2 Shifts (Morning + Eve)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Breakdown Output */}
        <div className="rounded-xl border border-amber-200/60 bg-gradient-to-br from-amber-50/50 to-teal-50/30 p-3.5 text-xs lg:col-span-5 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Total Household Cost:</span>
              <span className="text-lg font-black text-slate-900">
                ₹{totalPrice.toLocaleString("en-IN")}
                <span className="text-[10px] font-normal text-slate-500">
                  {selected.type === "monthly" ? " /month" : " /visit"}
                </span>
              </span>
            </div>

            <div className="border-t border-slate-200/80 pt-2 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-emerald-800 font-bold">
                <span>✓ Worker Take-Home (88%):</span>
                <span>₹{workerShare.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Platform & Insurance (12%):</span>
                <span>₹{platformFee.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="rounded-lg bg-white/80 p-2 text-[10px] text-slate-600 space-y-0.5">
              <p className="font-bold text-teal-900">Included at ₹0 extra:</p>
              <p>• ₹2,00,000 Accidental Insurance</p>
              <p>• Free worker replacement if absent</p>
              <p>• 4-Step Police & Skill Verification</p>
            </div>
          </div>

          <Link
            href={`/login?role=household&next=${encodeURIComponent(
              `/household/post?category=${selected.id}`
            )}`}
            data-tap
            className="mt-3 block w-full rounded-xl bg-teal-700 py-2 text-center text-xs font-bold text-white shadow-2xs transition hover:bg-teal-800"
          >
            Book {selected.name} →
          </Link>
        </div>
      </div>
    </div>
  );
}
