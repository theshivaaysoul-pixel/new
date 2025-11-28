"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, orderBy, addDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { Store, MapPin, Phone, Star, MessageCircle, ArrowLeft, Briefcase, ShoppingBag, X, Loader } from "lucide-react";
import Link from "next/link";
import ReviewForm from "@/components/shop/ReviewForm";
import ChatWindow from "@/components/dashboard/ChatWindow";

export default function ShopPage() {
    const params = useParams();
    const sellerId = params.id;

    const [seller, setSeller] = useState(null);
    const [products, setProducts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);

    // New states for services and booking
    const [services, setServices] = useState([]);
    const [bookingModalOpen, setBookingModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [bookingLoading, setBookingLoading] = useState(false);

    // Simulated customer for prototype
    const [customerName, setCustomerName] = useState("");
    const [isCustomerSet, setIsCustomerSet] = useState(false);

    useEffect(() => {
        if (params.id) {
            setLoading(true);
            Promise.all([
                fetchSeller(),
                fetchProducts(),
                fetchServices(),
                fetchReviews()
            ]).finally(() => setLoading(false));
        }
    }, [params.id]);

    const fetchSeller = async () => {
        try {
            const docRef = doc(db, "sellers", params.id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setSeller({ id: docSnap.id, ...docSnap.data() });
            }
        } catch (error) {
            console.error("Error fetching seller:", error);
        }
    };

    const fetchProducts = async () => {
        try {
            const q = query(collection(db, "products"), where("sellerId", "==", params.id));
            const querySnapshot = await getDocs(q);
            setProducts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    const fetchServices = async () => {
        try {
            const q = query(collection(db, "sellers", params.id, "services"));
            const querySnapshot = await getDocs(q);
            setServices(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching services:", error);
        }
    };

    const fetchReviews = async () => {
        try {
            const q = query(collection(db, "reviews"), where("sellerId", "==", params.id));
            const querySnapshot = await getDocs(q);
            const reviewsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Client-side sort
            reviewsData.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
            setReviews(reviewsData);
        } catch (error) {
            console.error("Error fetching reviews:", error);
        }
    };

    // Booking Logic
    useEffect(() => {
        if (bookingModalOpen && bookingDate && params.id) {
            const fetchSlots = async () => {
                const docRef = doc(db, "sellers", params.id, "availability", bookingDate);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setAvailableSlots(docSnap.data().slots || []);
                } else {
                    setAvailableSlots([]);
                }
            };
            fetchSlots();
        }
    }, [bookingModalOpen, bookingDate, params.id]);

    const handleBookService = (service) => {
        setSelectedService(service);
        setBookingModalOpen(true);
        setSelectedSlot(null);
    };

    const confirmBooking = async () => {
        if (!customerName.trim()) {
            alert("Please enter your name to book.");
            return;
        }
        if (!selectedSlot) {
            alert("Please select a time slot.");
            return;
        }

        setBookingLoading(true);
        try {
            // 1. Create Booking Record
            await addDoc(collection(db, "bookings"), {
                sellerId: params.id,
                serviceId: selectedService.id,
                serviceName: selectedService.name,
                customerName: customerName,
                date: bookingDate,
                slotStart: selectedSlot.start,
                slotEnd: selectedSlot.end,
                price: selectedService.price,
                status: "confirmed",
                createdAt: new Date()
            });

            // 2. Update Slot Status to 'booked'
            const slotIndex = availableSlots.findIndex(s => s.id === selectedSlot.id);
            if (slotIndex !== -1) {
                const updatedSlots = [...availableSlots];
                updatedSlots[slotIndex].status = "booked";

                await updateDoc(doc(db, "sellers", params.id, "availability", bookingDate), {
                    slots: updatedSlots
                });
            }

            alert("Booking Confirmed!");
            setBookingModalOpen(false);
            // Refresh slots
            const docRef = doc(db, "sellers", params.id, "availability", bookingDate);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setAvailableSlots(docSnap.data().slots || []);
            }

        } catch (error) {
            console.error("Error booking:", error);
            alert("Booking failed. Please try again.");
        } finally {
            setBookingLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin text-pink-600" /></div>;
    if (!seller) return <div className="min-h-screen flex items-center justify-center">Shop not found</div>;

    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : "New";

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header / Cover */}
            <div className="bg-white shadow-sm">
                <div className="h-48 bg-gradient-to-r from-pink-400 to-purple-500 relative">
                    <Link href="/" className="absolute top-6 left-6 text-white hover:bg-white/20 p-2 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <div className="absolute -bottom-12 left-6">
                        <div className="h-24 w-24 bg-white rounded-full p-1 shadow-lg">
                            {seller.logo ? (
                                <img src={seller.logo} alt="Logo" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-gray-400 font-bold text-2xl">
                                    {seller.businessName?.[0]}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="pt-14 px-6 pb-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{seller.businessName}</h1>
                            <p className="text-gray-500 flex items-center gap-1 mt-1">
                                <MapPin size={16} /> {seller.address || "Location not set"}
                            </p>
                            <p className="text-gray-600 mt-2 max-w-2xl">{seller.description}</p>
                        </div>
                        <div className="flex gap-2">
                            {/* Customer Identity for Prototype */}
                            {!isCustomerSet ? (
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <p className="text-sm text-blue-800 mb-2 font-medium">Viewing as Guest. Enter your name to interact:</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Your Name"
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            className="px-3 py-2 rounded-lg border border-blue-200 text-sm flex-1"
                                        />
                                        <button
                                            onClick={() => customerName && setIsCustomerSet(true)}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                                        >
                                            Set Name
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setChatOpen(true)}
                                    className="bg-pink-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-pink-700 transition-colors flex items-center gap-2"
                                >
                                    <MessageCircle size={18} />
                                    Chat
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 mt-8 grid md:grid-cols-3 gap-8">
                {/* Left Column: Products & Services */}
                <div className="md:col-span-2 space-y-8">

                    {/* Services Section */}
                    {services.length > 0 && (
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Briefcase className="text-pink-600" />
                                Services
                            </h2>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {services.map(service => (
                                    <div key={service.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-gray-900">{service.name}</h3>
                                            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                                                ₹{service.price}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{service.description}</p>
                                        <button
                                            onClick={() => handleBookService(service)}
                                            className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                                        >
                                            Book Now
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Products Section */}
                    {products.length > 0 && (
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <ShoppingBag className="text-pink-600" />
                                Products
                            </h2>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {products.map(product => (
                                    <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                                        <div className="h-48 bg-gray-100 relative">
                                            {product.image ? (
                                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <ShoppingBag size={32} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="font-bold text-gray-900">{product.name}</h3>
                                                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                                                    ₹{product.price}
                                                </span>
                                            </div>
                                            {product.caption && (
                                                <p className="text-xs text-gray-400 italic mb-2">{product.caption}</p>
                                            )}
                                            <p className="text-sm text-gray-500 line-clamp-2 mb-3">{product.description}</p>

                                            {/* Variants / Sub-menu */}
                                            {product.variants && product.variants.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-gray-50">
                                                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Options</p>
                                                    <div className="space-y-2">
                                                        {product.variants.map((variant, idx) => (
                                                            <div key={idx} className="flex justify-between text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                                                <span>{variant.name}</span>
                                                                <span className="font-medium">+₹{variant.price}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Reviews */}
                <div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Reviews</h2>
                            <button
                                onClick={() => setReviewModalOpen(true)}
                                className="text-pink-600 text-sm font-medium hover:underline"
                            >
                                Write a Review
                            </button>
                        </div>

                        <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                            {reviews.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">No reviews yet.</p>
                            ) : (
                                reviews.map(review => (
                                    <div key={review.id} className="border-b border-gray-50 last:border-0 pb-4 last:pb-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-gray-800 text-sm">{review.customerName}</span>
                                            <span className="text-xs text-gray-400">
                                                {review.createdAt?.seconds ? new Date(review.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                            </span>
                                        </div>
                                        <div className="flex text-yellow-400 mb-2">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "" : "text-gray-300"} />
                                            ))}
                                        </div>
                                        <p className="text-sm text-gray-600">{review.comment}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Window */}
            {chatOpen && (
                <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10">
                    <div className="bg-pink-600 p-4 flex justify-between items-center text-white">
                        <h3 className="font-bold">Chat with {seller.businessName}</h3>
                        <button onClick={() => setChatOpen(false)}><X size={20} /></button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <ChatWindow
                            chatId={null} // New chat
                            sellerId={seller.id}
                            customerName={customerName}
                            onClose={() => setChatOpen(false)}
                        />
                    </div>
                </div>
            )}

            {/* Review Modal */}
            {reviewModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900">Write a Review</h3>
                            <button onClick={() => setReviewModalOpen(false)}><X size={20} /></button>
                        </div>
                        <div className="p-4">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-pink-500"
                                    placeholder="Enter your name"
                                />
                            </div>
                            <ReviewForm
                                sellerId={seller.id}
                                customerName={customerName}
                                onReviewSubmitted={() => {
                                    setReviewModalOpen(false);
                                    fetchReviews();
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Booking Modal */}
            {bookingModalOpen && selectedService && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h3 className="font-bold text-gray-900">Book Service</h3>
                            <button onClick={() => setBookingModalOpen(false)}><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="bg-pink-50 p-4 rounded-xl">
                                <h4 className="font-bold text-gray-900">{selectedService.name}</h4>
                                <p className="text-sm text-gray-600 mt-1">{selectedService.description}</p>
                                <p className="text-pink-600 font-bold mt-2">₹{selectedService.price}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                                <input
                                    type="date"
                                    value={bookingDate}
                                    onChange={(e) => setBookingDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-pink-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Time Slot</label>
                                {availableSlots.length === 0 ? (
                                    <p className="text-sm text-gray-500 italic">No slots available for this date.</p>
                                ) : (
                                    <div className="grid grid-cols-3 gap-2">
                                        {availableSlots.map((slot, idx) => (
                                            <button
                                                key={idx}
                                                disabled={slot.status === 'booked'}
                                                onClick={() => setSelectedSlot(slot)}
                                                className={`px-2 py-2 rounded-lg text-xs font-bold border transition-all ${slot.status === 'booked'
                                                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                        : selectedSlot?.id === slot.id
                                                            ? 'bg-pink-600 text-white border-pink-600 shadow-md'
                                                            : 'bg-white text-gray-700 border-gray-200 hover:border-pink-300 hover:bg-pink-50'
                                                    }`}
                                            >
                                                {slot.start}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-pink-500"
                                    placeholder="Enter your name to book"
                                />
                            </div>

                            <button
                                onClick={confirmBooking}
                                disabled={bookingLoading || !selectedSlot || !customerName}
                                className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {bookingLoading ? "Confirming..." : "Confirm Booking"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
