"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { ShoppingBag, Clock, CheckCircle, Truck, ChefHat, ChevronDown, ChevronUp, User, Phone, MapPin, Package } from "lucide-react";

export default function OrderList({ sellerId }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState(null);

    useEffect(() => {
        if (!sellerId) return;

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

    const toggleExpand = (orderId) => {
        setExpandedOrder(expandedOrder === orderId ? null : orderId);
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading orders...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Recent Orders ({orders.length})</h2>
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
                        <div key={order.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                            {/* Order Header - Clickable */}
                            <div
                                onClick={() => toggleExpand(order.id)}
                                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-gray-800">Order #{order.id.slice(0, 8)}</span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(order.status)}`}>
                                                {getStatusIcon(order.status)}
                                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : "Just now"}
                                        </p>
                                        <p className="text-sm text-gray-700 mt-1 flex items-center gap-1">
                                            <User size={14} />
                                            {order.customerName || "Customer"}
                                        </p>
                                    </div>
                                    <div className="text-right flex items-start gap-3">
                                        <div>
                                            <p className="font-bold text-lg text-gray-900">₹{order.totalAmount}</p>
                                            <p className="text-xs text-gray-500">{order.items.length} items</p>
                                        </div>
                                        <div className="text-gray-400 mt-1">
                                            {expandedOrder === order.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </div>
                                    </div>
                                </div>

                                {/* Collapsed View - Item Summary */}
                                {expandedOrder !== order.id && (
                                    <div className="flex gap-2 flex-wrap mt-2">
                                        {order.items.slice(0, 3).map((item, idx) => (
                                            <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                {item.quantity}x {item.name}
                                            </span>
                                        ))}
                                        {order.items.length > 3 && (
                                            <span className="text-xs text-gray-500">+{order.items.length - 3} more</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Expanded View - Full Details */}
                            {expandedOrder === order.id && (
                                <div className="border-t border-gray-100 p-6 bg-gray-50">
                                    {/* Customer Details */}
                                    <div className="mb-6">
                                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                            <User size={18} />
                                            Customer Information
                                        </h3>
                                        <div className="bg-white p-4 rounded-lg space-y-2">
                                            <p className="text-sm text-gray-700">
                                                <span className="font-medium">Name:</span> {order.customerName || "Not provided"}
                                            </p>
                                            <p className="text-sm text-gray-700 flex items-center gap-1">
                                                <Package size={14} />
                                                <span className="font-medium">Order ID:</span> {order.id}
                                            </p>
                                            <p className="text-sm text-gray-700">
                                                <span className="font-medium">Payment:</span> {order.paymentMethod || "COD"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Items List with Details */}
                                    <div className="mb-6">
                                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                            <ShoppingBag size={18} />
                                            Order Items
                                        </h3>
                                        <div className="space-y-3">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="bg-white p-4 rounded-lg flex gap-4">
                                                    {/* Item Image */}
                                                    <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                                                        {item.image ? (
                                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                                                No Image
                                                            </div>
                                                        )}
                                                    </div>
                                                    {/* Item Details */}
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-gray-800">{item.name}</h4>
                                                        {item.description && (
                                                            <p className="text-xs text-gray-500 line-clamp-2 mt-1">{item.description}</p>
                                                        )}
                                                        {item.category && (
                                                            <span className="inline-block text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded mt-2">
                                                                {item.category}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {/* Pricing */}
                                                    <div className="text-right">
                                                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                                                        <p className="text-sm text-gray-600">₹{item.price} each</p>
                                                        <p className="font-bold text-gray-900 mt-1">₹{item.price * item.quantity}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Pricing Summary */}
                                    <div className="mb-6">
                                        <div className="bg-white p-4 rounded-lg">
                                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                                                <span>Subtotal</span>
                                                <span>₹{order.totalAmount}</span>
                                            </div>
                                            <div className="border-t pt-2 flex justify-between font-bold text-gray-900">
                                                <span>Total Amount</span>
                                                <span>₹{order.totalAmount}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Update Buttons */}
                                    <div>
                                        <h3 className="font-semibold text-gray-800 mb-3">Update Order Status</h3>
                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                            {["pending", "accepted", "preparing", "ready", "completed"].map((status) => (
                                                <button
                                                    key={status}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        updateStatus(order.id, status);
                                                    }}
                                                    disabled={order.status === status}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${order.status === status
                                                        ? "bg-gray-800 text-white"
                                                        : "bg-white text-gray-600 hover:bg-gray-200 border border-gray-300"
                                                        }`}
                                                >
                                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
