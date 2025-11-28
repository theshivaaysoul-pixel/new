"use client";
import { User, Phone, Lock, AtSign } from "lucide-react";

export default function StepPersonal({ data, updateData }) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Tell us about yourself</h2>
                <p className="text-gray-500">We'd love to know who you are.</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={data.name || ""}
                            onChange={(e) => updateData({ name: e.target.value })}
                            className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all text-gray-900"
                            placeholder="e.g. Sunita Devi"
                        />
                        <User className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                    <div className="relative">
                        <input
                            type="tel"
                            value={data.whatsapp || ""}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                updateData({ whatsapp: val });
                            }}
                            className={`w-full px-4 py-3 pl-10 border ${data.whatsapp && data.whatsapp.length !== 10 ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-pink-500'} rounded-xl focus:ring-2 outline-none transition-all text-gray-900`}
                            placeholder="e.g. 9876543210"
                        />
                        <Phone className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    </div>
                    {data.whatsapp && data.whatsapp.length !== 10 && (
                        <p className="text-xs text-red-500 mt-1">Phone number must be exactly 10 digits</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">We'll use this for important updates.</p>
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Login Credentials</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={data.username || ""}
                                    onChange={(e) => updateData({ username: e.target.value })}
                                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Choose a username"
                                />
                                <AtSign className="absolute left-3 top-3.5 text-gray-400" size={20} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={data.password || ""}
                                    onChange={(e) => updateData({ password: e.target.value })}
                                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Choose a password"
                                />
                                <Lock className="absolute left-3 top-3.5 text-gray-400" size={20} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
