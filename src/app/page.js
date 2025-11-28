import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShoppingBag, Star, Users, Store } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-200/30 blur-[100px]" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-pink-200/30 blur-[100px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-indigo-200/30 blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-lg shadow-pink-200">
            <Image
              src="/logo.jpeg"
              alt="Her Side Hustle Logo"
              fill
              className="object-cover"
            />
          </div>
          <span className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
            Her Side Hustle
          </span>
        </div>
        <div className="flex items-center gap-4">
        </div>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center mt-10 md:mt-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-sm border border-white/20 shadow-sm mb-8 animate-fade-in-up">
          <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
          <span className="text-sm font-medium text-gray-600">Empowering Local Communities</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-8 tracking-tight leading-tight">
          Empowering Rural Women <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600">
            Entrepreneurs
          </span>
        </h1>

        <p className="text-xl text-gray-600 max-w-2xl mb-16 leading-relaxed">
          A vibrant marketplace for homemade snacks, handicrafts, beauty services, and more.
          Connect with local sellers or start your own business today.
        </p>

        <div className="grid md:grid-cols-2 gap-8 w-full max-w-5xl px-4">
          {/* Seller Card */}
          <div className="group relative bg-white/60 backdrop-blur-xl p-10 rounded-3xl shadow-xl border border-white/50 hover:border-pink-200 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-50/50 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-pink-50 rounded-2xl flex items-center justify-center mx-auto mb-8 text-pink-600 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm">
                <Store size={40} />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">I am a Seller</h2>
              <p className="text-gray-600 mb-8 text-lg">
                Register your shop, list products, and manage orders with ease.
              </p>
              <Link
                href="/seller/login"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-pink-200 transition-all duration-300 hover:scale-105"
              >
                Start Selling <ArrowRight size={20} />
              </Link>
            </div>
          </div>

          {/* Customer Card */}
          <div className="group relative bg-white/60 backdrop-blur-xl p-10 rounded-3xl shadow-xl border border-white/50 hover:border-purple-200 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-8 text-purple-600 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 shadow-sm">
                <ShoppingBag size={40} />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">I am a Customer</h2>
              <p className="text-gray-600 mb-8 text-lg">
                Browse unique products, find nearby sellers, and place orders.
              </p>
              <Link
                href="/customer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-purple-200 transition-all duration-300 hover:scale-105"
              >
                Browse Shop <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 p-8 text-center text-gray-500 text-sm mt-12">
        <p>© {new Date().getFullYear()} Her Side Hustle. All rights reserved.</p>
      </footer>
    </div>
  );
}
