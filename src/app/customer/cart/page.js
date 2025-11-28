"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, ShoppingBag, CreditCard, Home, Search, Package, User, ShoppingCart } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc, addDoc, updateDoc } from "firebase/firestore";

export default function CartPage() {
    const router = useRouter();
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalAmount, setTotalAmount] = useState(0);
    const [customerId, setCustomerId] = useState(null);
    const [customerName, setCustomerName] = useState("");
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [deliveryCharges, setDeliveryCharges] = useState(40);

    useEffect(() => {
        const storedCustomerId = localStorage.getItem("customerId");
        if (!storedCustomerId) {
            router.push("/customer"); // Redirect to login if not logged in
            return;
        }
        setCustomerId(storedCustomerId);
        setCustomerName(localStorage.getItem("customerName") || "Customer");
        fetchCartItems(storedCustomerId);
    }, []);

    const fetchCartItems = async (uid) => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, `carts/${uid}/items`));
            const items = [];
            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                // Use Firestore document ID as cartItemId to ensure uniqueness
                items.push({
                    cartItemId: docSnap.id, // Unique Firestore document ID
                    ...data // This contains the product data including product id
                });
            });
            setCartItems(items);
            // Select all by default initially
            if (selectedItems.size === 0 && items.length > 0) {
                const allIds = new Set(items.map(i => i.cartItemId));
                setSelectedItems(allIds);
            }
        } catch (error) {
            console.error("Error fetching cart items:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        calculateTotal();
    }, [cartItems, selectedItems]);

    const calculateTotal = () => {
        let subtotal = 0;
        cartItems.forEach(item => {
            if (selectedItems.has(item.cartItemId)) {
                subtotal += parseInt(item.price) * (item.quantity || 1);
            }
        });

        // Calculate delivery charges based on subtotal (10-100 range)
        let delivery = 40;
        if (subtotal < 200) {
            delivery = 60;
        } else if (subtotal < 500) {
            delivery = 40;
        } else {
            delivery = 40; // Will be free but still show the amount
        }

        setDeliveryCharges(delivery);

        // Add delivery to total only if subtotal <= 500
        const finalTotal = subtotal > 500 ? subtotal : subtotal + delivery;
        setTotalAmount(finalTotal);
    };

    const updateQuantity = async (cartItemId, currentQty, change) => {
        const newQty = (currentQty || 1) + change;
        if (newQty < 1) return;

        try {
            // Optimistic update
            const updatedItems = cartItems.map(item =>
                item.cartItemId === cartItemId ? { ...item, quantity: newQty } : item
            );
            setCartItems(updatedItems);

            await updateDoc(doc(db, `carts/${customerId}/items`, cartItemId), {
                quantity: newQty
            });
        } catch (error) {
            console.error("Error updating quantity:", error);
            fetchCartItems(customerId); // Revert on error
        }
    };

    const toggleSelection = (cartItemId) => {
        const newSelection = new Set(selectedItems);
        if (newSelection.has(cartItemId)) {
            newSelection.delete(cartItemId);
        } else {
            newSelection.add(cartItemId);
        }
        setSelectedItems(newSelection);
    };

    const removeFromCart = async (cartItemId) => {
        if (!confirm("Are you sure you want to remove this item?")) return;
        try {
            await deleteDoc(doc(db, `carts/${customerId}/items`, cartItemId));
            fetchCartItems(customerId); // Refresh cart
        } catch (error) {
            console.error("Error removing item:", error);
        }
    };

    const handleCheckout = async () => {
        if (selectedItems.size === 0) {
            alert("Please select items to checkout");
            return;
        }

        const itemsToCheckout = cartItems.filter(item => selectedItems.has(item.cartItemId));

        try {
            // Group items by seller
            const itemsBySeller = itemsToCheckout.reduce((acc, item) => {
                if (!acc[item.sellerId]) acc[item.sellerId] = [];
                acc[item.sellerId].push(item);
                return acc;
            }, {});

            for (const sellerId of Object.keys(itemsBySeller)) {
                const sellerItems = itemsBySeller[sellerId];
                const sellerTotal = sellerItems.reduce((sum, item) => sum + (parseInt(item.price) * (item.quantity || 1)), 0);

                await addDoc(collection(db, "orders"), {
                    customerId: customerId,
                    customerName: customerName,
                    sellerId: sellerId,
                    items: sellerItems,
                    totalAmount: sellerTotal,
                    status: "Pending",
                    createdAt: new Date(),
                    timestamp: new Date(),
                    paymentMethod: "COD" // Default for now
                });

                // Notify Seller
                await addDoc(collection(db, `sellers/${sellerId}/notifications`), {
                    type: "new_order",
                    message: `New order from ${customerName}`,
                    customerName: customerName,
                    orderTotal: sellerTotal,
                    timestamp: new Date(),
                    read: false
                });
            }

            // Clear checked out items from cart
            for (const item of itemsToCheckout) {
                await deleteDoc(doc(db, `carts/${customerId}/items`, item.cartItemId));
            }

            // Update local state
            setCartItems(cartItems.filter(item => !selectedItems.has(item.cartItemId)));
            setSelectedItems(new Set());

            alert("Order placed successfully!");
            router.push("/customer/dashboard");
        } catch (error) {
            console.error("Error placing order:", error);
            alert("Checkout failed. Please try again.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <header className="bg-white p-4 shadow-sm flex items-center gap-4 sticky top-0 z-10">
                <Link href="/customer/explore" className="text-gray-600">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="font-bold text-lg text-gray-800">My Cart</h1>
            </header>

            <main className="p-4">
                {cartItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                        <ShoppingBag size={48} className="mb-4 text-gray-300" />
                        <p>Your cart is empty</p>
                        <Link href="/customer/explore" className="mt-4 text-pink-600 font-medium">
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {cartItems.map((item) => (
                            <div key={item.cartItemId} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-center">
                                <input
                                    type="checkbox"
                                    checked={selectedItems.has(item.cartItemId)}
                                    onChange={() => toggleSelection(item.cartItemId)}
                                    className="w-5 h-5 accent-pink-600 rounded"
                                />
                                <Link
                                    href={`/customer/service/${item.id}`}
                                    className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden shrink-0 hover:opacity-80 transition-opacity"
                                >
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
                                    )}
                                </Link>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <Link
                                            href={`/customer/service/${item.id}`}
                                            className="font-bold text-gray-800 line-clamp-1 hover:text-pink-600 transition-colors"
                                        >
                                            {item.name}
                                        </Link>
                                        <button onClick={() => removeFromCart(item.cartItemId)} className="text-red-500 p-1">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <p className="text-pink-600 font-bold">₹{item.price}</p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <button
                                            onClick={() => updateQuantity(item.cartItemId, item.quantity, -1)}
                                            className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
                                        >
                                            -
                                        </button>
                                        <span className="text-sm font-medium w-4 text-center">{item.quantity || 1}</span>
                                        <button
                                            onClick={() => updateQuantity(item.cartItemId, item.quantity, 1)}
                                            className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mt-6 mb-20">
                            <div className="flex justify-between mb-2 text-gray-600">
                                <span>Subtotal ({selectedItems.size} items)</span>
                                <span>₹{totalAmount - (totalAmount > 500 ? 0 : deliveryCharges)}</span>
                            </div>
                            <div className="flex justify-between mb-4 text-gray-600">
                                <span>Delivery Fee</span>
                                {totalAmount - (totalAmount > 500 ? 0 : deliveryCharges) > 500 ? (
                                    <span className="text-green-600">
                                        <span className="line-through text-gray-400 mr-2">₹{deliveryCharges}</span>
                                        FREE
                                    </span>
                                ) : (
                                    <span>₹{deliveryCharges}</span>
                                )}
                            </div>
                            <div className="border-t pt-4 flex justify-between font-bold text-lg text-gray-900">
                                <span>Total</span>
                                <span>₹{totalAmount}</span>
                            </div>
                            <button
                                onClick={handleCheckout}
                                disabled={selectedItems.size === 0}
                                className="w-full mt-4 py-3 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition-colors shadow-lg shadow-pink-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <CreditCard size={20} />
                                Buy Selected (₹{totalAmount})
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-3 z-20">
                <Link href="/customer" className="flex flex-col items-center gap-1 text-gray-400 hover:text-pink-600">
                    <Home size={24} />
                    <span className="text-[10px] font-medium">Home</span>
                </Link>
                <Link href="/customer/explore" className="flex flex-col items-center gap-1 text-gray-400 hover:text-pink-600">
                    <Search size={24} />
                    <span className="text-[10px] font-medium">Explore</span>
                </Link>
                <Link href="/customer/cart" className="flex flex-col items-center gap-1 text-pink-600">
                    <ShoppingCart size={24} />
                    <span className="text-[10px] font-medium">Cart</span>
                </Link>
                <Link href="/customer/dashboard" className="flex flex-col items-center gap-1 text-gray-400 hover:text-pink-600">
                    <Package size={24} />
                    <span className="text-[10px] font-medium">Orders</span>
                </Link>
                <Link href="/customer/dashboard" className="flex flex-col items-center gap-1 text-gray-400 hover:text-pink-600">
                    <User size={24} />
                    <span className="text-[10px] font-medium">Account</span>
                </Link>
            </div>
        </div>
    );
}
