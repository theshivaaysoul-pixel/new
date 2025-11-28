"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Calendar, CreditCard, CheckCircle } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc, addDoc, collection } from "firebase/firestore";
import Link from "next/link";

export default function BookingPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const serviceId = searchParams.get("serviceId");

    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookingStep, setBookingStep] = useState(1); // 1: Details, 2: Payment, 3: Success
    const [formData, setFormData] = useState({
        date: "",
        time: "",
        address: "",
        paymentMethod: "upi",
    });

    useEffect(() => {
        if (serviceId) {
            fetchService();
        }
    }, [serviceId]);

    const fetchService = async () => {
        try {
            const docRef = doc(db, "products", serviceId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setService({ id: docSnap.id, ...docSnap.data() });
            }
        } catch (error) {
            console.error("Error fetching service:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleBooking = async () => {
        if (!formData.date || !formData.time || !formData.address) {
            alert("Please fill in all details");
            return;
        }

        setBookingStep(2); // Move to payment
    };

    const confirmPayment = async () => {
        try {
            // Create Order in Firestore
            await addDoc(collection(db, "orders"), {
                customerId: "GUEST_USER", // Replace with actual user ID if auth is implemented
                sellerId: service.sellerId,
                serviceId: service.id,
                serviceName: service.name,
                // Seller Dashboard expects 'items' array and 'totalAmount'
                items: [
                    {
                        name: service.name,
                        price: parseInt(service.price),
                        quantity: 1
                    }
                ],
                totalAmount: parseInt(service.price) + (parseInt(service.price) > 500 ? 0 : 40), // Including delivery fee only if < 500
                price: service.price, // Keeping for backward compatibility if needed
                status: "Pending",
                address: formData.address,
                date: formData.date,
                time: formData.time,
                paymentMethod: formData.paymentMethod,
                timestamp: new Date(),
            });

            // Notify Seller
            await addDoc(collection(db, `sellers/${service.sellerId}/notifications`), {
                type: "new_booking",
                message: `New booking from ${localStorage.getItem("customerName") || "Guest"}`,
                customerName: localStorage.getItem("customerName") || "Guest",
                serviceName: service.name,
                date: formData.date,
                time: formData.time,
                timestamp: new Date(),
                read: false
            });

            setBookingStep(3); // Success
        } catch (error) {
            console.error("Error creating order:", error);
            alert("Booking failed. Please try again.");
        }
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (!service) return <div className="p-10 text-center">Service not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <header className="bg-white p-4 shadow-sm flex items-center gap-4 sticky top-0 z-10">
                <Link href={`/customer/service/${serviceId}`} className="text-gray-600">
                    <ArrowLeft size={24} />
                </Link>
                <h1 className="font-bold text-lg text-gray-800">
                    {bookingStep === 1 ? "Book Service" : bookingStep === 2 ? "Payment" : "Booking Confirmed"}
                </h1>
            </header>

            <main className="p-4 max-w-lg mx-auto">
                {bookingStep === 1 && (
                    <div className="space-y-6">
                        {/* Service Summary */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
                            <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                                {service.image && <img src={service.image} alt={service.name} className="w-full h-full object-cover" />}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">{service.name}</h3>
                                <p className="text-pink-600 font-bold">₹{service.price}</p>
                            </div>
                        </div>

                        {/* Date & Time */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Calendar size={18} className="text-pink-600" /> Date & Time
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-pink-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Time</label>
                                    <input
                                        type="time"
                                        value={formData.time}
                                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-pink-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Address */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <MapPin size={18} className="text-pink-600" /> Delivery Address
                            </h3>
                            <textarea
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                placeholder="Enter full address..."
                                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-pink-500 h-24 resize-none"
                            ></textarea>
                        </div>
                    </div>
                )}

                {bookingStep === 2 && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-4">Payment Method</h3>
                            <div className="space-y-3">
                                {["UPI", "Cash on Delivery", "Card"].map((method) => (
                                    <label
                                        key={method}
                                        className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${formData.paymentMethod === method.toLowerCase()
                                            ? "border-pink-600 bg-pink-50"
                                            : "border-gray-200 hover:bg-gray-50"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="payment"
                                            value={method.toLowerCase()}
                                            checked={formData.paymentMethod === method.toLowerCase()}
                                            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                            className="text-pink-600 focus:ring-pink-500"
                                        />
                                        <span className="font-medium text-gray-700">{method}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-4">Order Summary</h3>
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                                <span>Item Total</span>
                                <span>₹{service.price}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600 mb-4">
                                <span>Delivery Fee</span>
                                <span>₹40</span>
                            </div>
                            <div className="border-t border-gray-200 pt-4 flex justify-between font-bold text-gray-900">
                                <span>Total Amount</span>
                                <span>₹{parseInt(service.price) + 40}</span>
                            </div>
                        </div>
                    </div>
                )}

                {bookingStep === 3 && (
                    <div className="text-center py-10">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-6 animate-bounce">
                            <CheckCircle size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
                        <p className="text-gray-500 mb-8">Your order has been placed successfully.</p>
                        <Link
                            href="/customer/dashboard"
                            className="inline-block px-8 py-3 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition-colors shadow-lg shadow-pink-200"
                        >
                            Go to Dashboard
                        </Link>
                    </div>
                )}
            </main>

            {/* Footer Button */}
            {bookingStep < 3 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-20">
                    <button
                        onClick={bookingStep === 1 ? handleBooking : confirmPayment}
                        className="w-full py-3 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition-colors shadow-lg shadow-pink-200"
                    >
                        {bookingStep === 1 ? "Proceed to Payment" : `Pay ₹${parseInt(service.price) + 40}`}
                    </button>
                </div>
            )}
        </div>
    );
}
