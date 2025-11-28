"use client";
import { MapPin, Phone, FileText, Image as ImageIcon } from "lucide-react";

export default function StepProfile({ data, updateData }) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Complete your profile</h2>
                <p className="text-gray-500">Help customers find you easily.</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shop Display Name</label>
                    <input
                        type="text"
                        value={data.displayName || data.businessName || ""}
                        onChange={(e) => updateData({ displayName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none text-gray-900"
                        placeholder="Name shown to customers"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                    <div className="relative">
                        <textarea
                            value={data.address || ""}
                            onChange={(e) => updateData({ address: e.target.value })}
                            className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none min-h-[100px] text-gray-900"
                            placeholder="Street, Area, City, Pincode"
                        />
                        <MapPin className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                    <div className="relative">
                        <input
                            type="tel"
                            value={data.phone || ""}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                updateData({ phone: val });
                            }}
                            className={`w-full px-4 py-3 pl-10 border ${data.phone && data.phone.length !== 10 ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-pink-500'} rounded-xl focus:ring-2 outline-none`}
                            placeholder="For customer calls"
                        />
                        <Phone className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    </div>
                    {data.phone && data.phone.length !== 10 && (
                        <p className="text-xs text-red-500 mt-1">Phone number must be exactly 10 digits</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                    <div className="relative">
                        <textarea
                            value={data.description || ""}
                            onChange={(e) => updateData({ description: e.target.value })}
                            className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none"
                            placeholder="Tell customers about your business..."
                        />
                        <FileText className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shop Logo</label>
                    <div className="relative">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        updateData({ logo: reader.result });
                                    };
                                    reader.readAsDataURL(file);
                                }
                            }}
                            className="hidden"
                            id="logo-upload"
                        />
                        <label
                            htmlFor="logo-upload"
                            className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                            {data.logo ? (
                                <img src={data.logo} alt="Shop Logo" className="h-24 w-24 object-cover rounded-lg mb-2" />
                            ) : (
                                <ImageIcon size={32} className="mb-2" />
                            )}
                            <span className="text-sm">{data.logo ? "Click to change logo" : "Click to upload logo"}</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}
