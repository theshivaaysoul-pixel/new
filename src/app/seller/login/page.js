"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import TermsModal from "@/components/TermsModal";
import { Store, ArrowRight, Lock } from "lucide-react";
import Link from "next/link";

export default function SellerLogin() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showTerms, setShowTerms] = useState(false);
    const [loginResult, setLoginResult] = useState(null);
    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        const result = await login(username, password);
        if (result) {
            // Login successful, show terms
            // Store the result (businessType) to use after terms acceptance if needed
            // For now, we'll just redirect after terms
            // But wait, the terms modal is shown BEFORE redirect.
            // We should probably store the businessType in state to use it in handleTermsAccepted
            setLoginResult(result);
            setShowTerms(true);
        } else {
            setError("Invalid credentials. Try seller / 1234");
        }
    };

    const handleTermsAccepted = () => {
        setShowTerms(false);
        // Redirect based on business type
        if (loginResult === "service") {
            router.push("/service/dashboard");
        } else {
            router.push("/seller/dashboard");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col md:flex-row">

                {/* Login Form */}
                <div className="w-full p-8 md:p-10">
                    <div className="flex items-center gap-2 mb-8 text-pink-600">
                        <Store size={28} />
                        <h1 className="text-2xl font-bold tracking-tight">Her Side Hustle</h1>
                    </div>

                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Seller Login</h2>
                    <p className="text-gray-500 text-sm mb-6">Enter your credentials to access your dashboard.</p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all text-gray-900"
                                placeholder="e.g. seller"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all text-gray-900"
                                    placeholder="••••••••"
                                />
                                <Lock className="absolute right-3 top-2.5 text-gray-400" size={18} />
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm bg-red-50 p-2 rounded border border-red-100">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-pink-600 hover:bg-pink-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-pink-200"
                        >
                            Login
                            <ArrowRight size={18} />
                        </button>
                    </form>



                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{" "}
                            <Link href="/seller/onboarding" className="text-pink-600 font-medium hover:underline">
                                Create one
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            <TermsModal
                isOpen={showTerms}
                onClose={() => setShowTerms(false)}
                onAccept={handleTermsAccepted}
            />
        </div>
    );
}
