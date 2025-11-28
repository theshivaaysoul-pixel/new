"use client";
import { Store, Briefcase, ShoppingBag } from "lucide-react";

export default function StepBusiness({ data, updateData }) {
    const categories = [
        { id: "beauty", label: "Beauty (Makeup, Salon, Mehendi)", icon: "💄" },
        { id: "food", label: "Food (Cloud Kitchen, Tiffin, Pickles)", icon: "🥘" },
        { id: "shops", label: "Small Shops (Papad, Crafts)", icon: "🛍️" },
        { id: "others", label: "Others", icon: "✨" },
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Your Business</h2>
                <p className="text-gray-500">What kind of side hustle do you run?</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={data.businessName || ""}
                            onChange={(e) => updateData({ businessName: e.target.value })}
                            className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all text-gray-900"
                            placeholder="e.g. Sunita's Kitchen"
                        />
                        <Store className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <div className="space-y-2">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => updateData({ category: cat.id })}
                                className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${data.category === cat.id
                                    ? "border-pink-500 bg-pink-50 ring-1 ring-pink-500"
                                    : "border-gray-200 hover:bg-gray-50"
                                    }`}
                            >
                                <span className="text-xl">{cat.icon}</span>
                                <span className={`font-medium ${data.category === cat.id ? "text-pink-700" : "text-gray-700"}`}>
                                    {cat.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">What describes you best?</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => updateData({ businessType: "seller" })}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${data.businessType === "seller"
                                ? "border-pink-500 bg-pink-50 text-pink-700"
                                : "border-gray-200 hover:border-pink-200 text-gray-600"
                                }`}
                        >
                            <ShoppingBag size={24} />
                            <span className="font-medium">Seller</span>
                            <span className="text-xs opacity-70 text-center">selling and listing item like acchar papad etc</span>
                        </button>
                        <button
                            onClick={() => updateData({ businessType: "service" })}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${data.businessType === "service"
                                ? "border-pink-500 bg-pink-50 text-pink-700"
                                : "border-gray-200 hover:border-pink-200 text-gray-600"
                                }`}
                        >
                            <Briefcase size={24} />
                            <span className="font-medium">Service</span>
                            <span className="text-xs opacity-70 text-center">offering services like home tutor and mehndi or mini sallon</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
