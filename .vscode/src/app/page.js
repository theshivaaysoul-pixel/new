import Link from "next/link";
import { ArrowRight, ShoppingBag, Star, Users, Store } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white transition-colors duration-300">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center text-white font-bold">
            H
          </div>
          <span className="font-bold text-xl text-gray-900">Her Side Hustle</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/seller/login"
            className="text-gray-600 hover:text-pink-600 font-medium transition-colors"
          >
            Login
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Empowering Rural Women <br />
          <span className="text-pink-600">Entrepreneurs</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mb-12">
          A marketplace for homemade snacks, handicrafts, beauty services, and more.
          Connect with local sellers or start your own business today.
        </p>

        <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl">
          {/* Seller Card */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-pink-100 hover:border-pink-300 transition-all group">
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6 text-pink-600 group-hover:scale-110 transition-transform">
              <Store size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">I am a Seller</h2>
            <p className="text-gray-500 mb-6">
              Register your shop, list products, and manage orders.
            </p>
            <Link
              href="/seller/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-xl font-medium hover:bg-pink-700 transition-colors shadow-lg shadow-pink-200"
            >
              Start Selling <ArrowRight size={18} />
            </Link>
          </div>

          {/* Customer Card */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full">
              COMING SOON
            </div>
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 text-purple-600">
              <ShoppingBag size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">I am a Customer</h2>
            <p className="text-gray-500 mb-6">
              Browse products, find nearby sellers, and place orders.
            </p>
            <button
              disabled
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-400 rounded-xl font-medium cursor-not-allowed"
            >
              Browse Shop <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </main>

      <footer className="p-6 text-center text-gray-400 text-sm">
        © {new Date().getFullYear()} Her Side Hustle. All rights reserved.
      </footer>
    </div>
  );
}
