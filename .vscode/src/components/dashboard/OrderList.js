"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { ShoppingBag, Clock, CheckCircle, Truck, ChefHat } from "lucide-react";

export default function OrderList({ sellerId }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!sellerId) return;

        // Mock orders for demo if none exist
        // In real app, we'd just listen. 
        // For prototype, I'll seed some dummy orders if empty? 
        // Or just rely on real data. Let's stick to real data listener, 
        // but maybe I should add a button to "Simulate Order" for testing.

        const q = query(collection(db, "orders"), where("sellerId", "==", sellerId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setOrders(ords);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [sellerId]);

    const updateStatus = async (orderId, newStatus) => {
        await updateDoc(doc(db, "orders", orderId), {
            status: newStatus,
            updatedAt: new Date()
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "pending": return "bg-yellow-100 text-yellow-800";
            case "accepted": return "bg-blue-100 text-blue-800";
            case "preparing": return "bg-purple-100 text-purple-800";
            case "ready": return "bg-orange-100 text-orange-800";
            case "completed": return "bg-green-100 text-green-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "pending": return <Clock size={16} />;
            case "accepted": return <CheckCircle size={16} />;
            case "preparing": return <ChefHat size={16} />;
            case "ready": return <ShoppingBag size={16} />;
            case "completed": return <CheckCircle size={16} />;
            default: return <Clock size={16} />;
        }
    };

    // Function to create a dummy order for testing
    const createDummyOrder = async () => {
        const { addDoc } = await import("firebase/firestore");
        await addDoc(collection(db, "orders"), {
            sellerId,
            customerId: "CUST_DEMO",
            items: [
                { name: "Mango Pickle", price: 250, quantity: 1 },
                { name: "Papad", price: 100, quantity: 2 }
            ],
            totalAmount: 450,
            status: "pending",
            createdAt: new Date()
        });
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading orders...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Recent Orders ({orders.length})</h2>
                <button
                    onClick={createDummyOrder}
                    className="text-sm text-pink-600 hover:underline"
                >
                    + Simulate New Order
                </button>
            </div>

            {orders.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                        <ShoppingBag size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">No orders yet</h3>
                    <p className="text-gray-500">New orders will appear here.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div key={order.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-gray-800">Order #{order.id.slice(0, 6)}</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(order.status)}`}>
                                            {getStatusIcon(order.status)}
                                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : "Just now"}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-lg text-gray-900">₹{order.totalAmount}</p>
                                    <p className="text-xs text-gray-500">{order.items.length} items</p>
                                </div>
                            </div>

                            <div className="border-t border-b border-gray-50 py-3 mb-4 space-y-2">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm text-gray-700">
                                        <span>{item.quantity}x {item.name}</span>
                                        <span>₹{item.price * item.quantity}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {["pending", "accepted", "preparing", "ready", "completed"].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => updateStatus(order.id, status)}
                                        disabled={order.status === status}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${order.status === status
                                                ? "bg-gray-800 text-white"
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`}
                                    >
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
