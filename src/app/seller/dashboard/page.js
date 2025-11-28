"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { Store, Package, ShoppingBag, MapPin, LogOut, ChevronDown, Circle, MessageSquare, Star } from "lucide-react";
import ProductList from "@/components/dashboard/ProductList";
import OrderList from "@/components/dashboard/OrderList";
import ChatList from "@/components/dashboard/ChatList";
import ChatWindow from "@/components/dashboard/ChatWindow";
import ReviewsList from "@/components/dashboard/ReviewsList";

export default function SellerDashboard() {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState("products");
    const [sellerData, setSellerData] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [storeStatus, setStoreStatus] = useState("live");
    const [selectedChat, setSelectedChat] = useState(null);

    useEffect(() => {
        // Use the logged-in user's data directly - user already has id and all seller data
        if (user?.id) {
            setSellerData(user);
            setStoreStatus(user.storeStatus || "live");
        }
    }, [user]);

    const toggleStoreStatus = async () => {
        const newStatus = storeStatus === "live" ? "offline" : "live";
        setStoreStatus(newStatus);
        if (sellerData?.id) {
            await updateDoc(doc(db, "sellers", sellerData.id), {
                storeStatus: newStatus
            });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 transition-colors duration-300">
            <nav className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center sticky top-0 z-20 transition-colors duration-300">
                <div className="flex items-center gap-2 text-pink-600">
                    <Store size={24} />
                    <span className="font-bold text-lg hidden md:block">Her Side Hustle</span>
                </div>

                <div className="flex items-center gap-4">
                    {sellerData?.id && (
                        <a
                            href={`/shop/${sellerData.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-pink-600 hover:text-pink-700 hover:underline"
                        >
                            View Shop
                        </a>
                    )}

                    <div className="relative">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors"
                        >
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-medium text-gray-800">{sellerData?.displayName || "Seller"}</p>
                                <p className="text-xs text-gray-500">{sellerData?.businessName}</p>
                            </div>
                            <div className="h-10 w-10 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold border border-pink-200">
                                {sellerData?.displayName?.[0] || "S"}
                            </div>
                            <ChevronDown size={16} className="text-gray-400" />
                        </button>

                        {isMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-in fade-in zoom-in duration-200 z-30">
                                <div className="px-4 py-2 border-b border-gray-50">
                                    <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider mb-2">Store Status</p>
                                    <button
                                        onClick={toggleStoreStatus}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${storeStatus === "live"
                                            ? "bg-green-50 text-green-700 hover:bg-green-100"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <Circle size={10} fill="currentColor" />
                                            {storeStatus === "live" ? "Online" : "Offline"}
                                        </span>
                                        <span className="text-xs opacity-75">Change</span>
                                    </button>
                                </div>

                                <div className="py-1">
                                    <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                        <LogOut size={16} />
                                        Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto p-6">
                <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
                    <button
                        onClick={() => setActiveTab("products")}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === "products"
                            ? "bg-pink-600 text-white shadow-lg shadow-pink-200"
                            : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                            }`}
                    >
                        <Package size={20} />
                        My Products
                    </button>
                    <button
                        onClick={() => setActiveTab("orders")}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === "orders"
                            ? "bg-pink-600 text-white shadow-lg shadow-pink-200"
                            : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                            }`}
                    >
                        <ShoppingBag size={20} />
                        Orders
                    </button>
                    <button
                        onClick={() => setActiveTab("messages")}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === "messages"
                            ? "bg-pink-600 text-white shadow-lg shadow-pink-200"
                            : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                            }`}
                    >
                        <MessageSquare size={20} />
                        Messages
                    </button>
                    <button
                        onClick={() => setActiveTab("reviews")}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${activeTab === "reviews"
                            ? "bg-pink-600 text-white shadow-lg shadow-pink-200"
                            : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                            }`}
                    >
                        <Star size={20} />
                        Reviews
                    </button>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {activeTab === "products" && <ProductList sellerId={sellerData?.id} />}
                    {activeTab === "orders" && <OrderList sellerId={sellerData?.id} />}
                    {activeTab === "reviews" && <ReviewsList sellerId={sellerData?.id} />}
                    {activeTab === "messages" && (
                        <div className="grid md:grid-cols-3 gap-6 h-[600px]">
                            <div className="md:col-span-1 overflow-y-auto border-r border-gray-100 pr-4">
                                <ChatList userId={sellerData?.id} onSelectChat={setSelectedChat} />
                            </div>
                            <div className="md:col-span-2">
                                {selectedChat ? (
                                    <ChatWindow
                                        chatId={selectedChat.id}
                                        currentUserId={sellerData?.id}
                                        recipientName={selectedChat.customerName}
                                        onClose={() => setSelectedChat(null)}
                                    />
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-2xl border border-gray-100">
                                        <MessageSquare size={48} className="mb-4 opacity-20" />
                                        <p>Select a conversation to start chatting</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
