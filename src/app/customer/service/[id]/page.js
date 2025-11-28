"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star, MapPin, MessageCircle, Clock, ShieldCheck, Truck, ShoppingBag, Heart } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc, addDoc, collection, updateDoc, arrayUnion, arrayRemove, getDocs, query, where, serverTimestamp } from "firebase/firestore";

export default function ServiceDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;

    const [service, setService] = useState(null);
    const [seller, setSeller] = useState(null);
    const [loading, setLoading] = useState(true);

    const [wishlist, setWishlist] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        if (id) {
            fetchDetails();
            fetchReviews();
        }
        const customerId = localStorage.getItem("customerId");
        if (customerId) {
            fetchWishlist(customerId);
        }
    }, [id]);

    const handleMessageSeller = async () => {
        const customerId = localStorage.getItem("customerId");
        const customerName = localStorage.getItem("customerName");

        if (!customerId) {
            alert("Please login to message the seller");
            router.push("/customer");
            return;
        }

        if (!service?.sellerId) {
            alert("Seller information not available");
            return;
        }

        try {
            // Check if chat already exists
            const q = query(
                collection(db, "chats"),
                where("participants", "array-contains", customerId)
            );

            const querySnapshot = await getDocs(q);
            let existingChat = null;

            // Filter client-side for the specific pair because Firestore array-contains is limited to one value
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.participants.includes(service.sellerId)) {
                    existingChat = { id: doc.id, ...data };
                }
            });

            if (existingChat) {
                router.push(`/customer/dashboard?tab=messages&chatId=${existingChat.id}`);
            } else {
                // Create new chat
                const chatData = {
                    participants: [customerId, service.sellerId],
                    participantNames: [customerName || "Customer", seller?.name || "Seller"],
                    customerName: customerName || "Customer", // Legacy support
                    sellerName: seller?.name || "Seller", // Legacy support
                    lastMessage: "",
                    lastMessageTime: serverTimestamp(),
                    createdAt: serverTimestamp()
                };

                const docRef = await addDoc(collection(db, "chats"), chatData);
                router.push(`/customer/dashboard?tab=messages&chatId=${docRef.id}`);
            }
        } catch (error) {
            console.error("Error initiating chat:", error);
            alert("Failed to start chat");
        }
    };

    const fetchWishlist = async (uid) => {
        try {
            const docRef = doc(db, "customers", uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setWishlist(docSnap.data().wishlist || []);
            }
        } catch (error) {
            console.error("Error fetching wishlist:", error);
        }
    };

    const toggleWishlist = async () => {
        const customerId = localStorage.getItem("customerId");
        if (!customerId) {
            alert("Please login to add to wishlist");
            return;
        }

        if (!service) return;

        const isLiked = wishlist.some(item => item.id === service.id);
        const docRef = doc(db, "customers", customerId);

        try {
            if (isLiked) {
                await updateDoc(docRef, {
                    wishlist: arrayRemove(service)
                });
                setWishlist(wishlist.filter(item => item.id !== service.id));
            } else {
                await updateDoc(docRef, {
                    wishlist: arrayUnion(service)
                });
                setWishlist([...wishlist, service]);
            }
        } catch (error) {
            console.error("Error updating wishlist:", error);
        }
    };

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const serviceRef = doc(db, "products", id);
            const serviceSnap = await getDoc(serviceRef);

            if (serviceSnap.exists()) {
                const serviceData = serviceSnap.data();
                setService({ id: serviceSnap.id, ...serviceData });

                if (serviceData.sellerId) {
                    const sellerRef = doc(db, "sellers", serviceData.sellerId);
                    const sellerSnap = await getDoc(sellerRef);
                    if (sellerSnap.exists()) {
                        setSeller(sellerSnap.data());
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching details:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchReviews = async () => {
        try {
            const q = query(
                collection(db, "reviews"),
                where("productId", "==", id)
            );
            const querySnapshot = await getDocs(q);
            const reviewsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
            setReviews(reviewsData);
        } catch (error) {
            console.error("Error fetching reviews:", error);
        }
    };

    const submitReview = async () => {
        const customerId = localStorage.getItem("customerId");
        const customerName = localStorage.getItem("customerName");

        if (!customerId) {
            alert("Please login to submit a review");
            return;
        }

        if (!newReview.comment.trim()) {
            alert("Please write a comment");
            return;
        }

        setSubmittingReview(true);
        try {
            await addDoc(collection(db, "reviews"), {
                productId: id,
                sellerId: service.sellerId,
                customerId: customerId,
                customerName: customerName || "Anonymous",
                rating: newReview.rating,
                comment: newReview.comment,
                createdAt: new Date()
            });

            setNewReview({ rating: 5, comment: "" });
            alert("Review submitted successfully!");
            fetchReviews();
        } catch (error) {
            console.error("Error submitting review:", error);
            alert("Failed to submit review");
        } finally {
            setSubmittingReview(false);
        }
    };

    const addToCart = async () => {
        const customerId = localStorage.getItem("customerId");
        if (!customerId) {
            alert("Please login to add items to cart");
            router.push("/customer");
            return;
        }

        try {
            const cartRef = collection(db, `carts/${customerId}/items`);
            const q = query(cartRef, where("id", "==", service.id));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const existingDoc = querySnapshot.docs[0];
                const currentQty = existingDoc.data().quantity || 1;
                await updateDoc(doc(db, `carts/${customerId}/items`, existingDoc.id), {
                    quantity: currentQty + 1
                });
                alert("Item quantity updated in cart!");
            } else {
                await addDoc(collection(db, `carts/${customerId}/items`), {
                    ...service,
                    quantity: 1,
                    addedAt: new Date()
                });
                alert("Item added to cart!");
            }
        } catch (error) {
            console.error("Error adding to cart:", error);
            alert("Failed to add to cart");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
            </div>
        );
    }

    if (!service) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Service Not Found</h2>
                <Link href="/customer/explore" className="text-pink-600 font-medium">
                    Back to Explore
                </Link>
                <button
                    onClick={toggleWishlist}
                    className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-800 shadow-sm hover:bg-white transition-colors"
                >
                    <Heart
                        size={20}
                        className={service && wishlist.some(item => item.id === service.id) ? "fill-red-500 text-red-500" : "text-gray-500"}
                    />
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header Image */}
            <div className="relative h-64 bg-gray-200">
                {service.image ? (
                    <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image Available
                    </div>
                )}
                <Link
                    href="/customer/explore"
                    className="absolute top-4 left-4 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-800 shadow-sm hover:bg-white transition-colors"
                >
                    <ArrowLeft size={20} />
                </Link>
            </div>

            <div className="px-4 -mt-6 relative z-10">
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                        <h1 className="text-2xl font-bold text-gray-900">{service.name}</h1>
                        <div className="flex items-center gap-1 text-yellow-500 font-bold bg-yellow-50 px-2 py-1 rounded-lg">
                            <Star size={16} fill="currentColor" />
                            4.8
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-pink-600 mb-4">₹{service.price}</p>
                    <p className="text-gray-600 leading-relaxed mb-6">{service.description}</p>

                    {/* Seller Info */}
                    {seller && (
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 mb-6">
                            <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold text-lg">
                                {seller.name?.[0] || "S"}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-800">{seller.businessName || seller.name}</h3>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <MapPin size={12} /> {seller.address || "Mumbai, India"}
                                </p>
                            </div>
                            <button
                                onClick={handleMessageSeller}
                                className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-pink-600 hover:bg-pink-50 transition-colors"
                            >
                                <MessageCircle size={20} />
                            </button>
                        </div>
                    )}

                    {/* Delivery Modes */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="flex flex-col items-center gap-2 p-3 bg-blue-50 rounded-xl text-blue-700">
                            <Truck size={20} />
                            <span className="text-xs font-medium">Delivery</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 p-3 bg-orange-50 rounded-xl text-orange-700">
                            <MapPin size={20} />
                            <span className="text-xs font-medium">Pickup</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 p-3 bg-green-50 rounded-xl text-green-700">
                            <Clock size={20} />
                            <span className="text-xs font-medium">On-Site</span>
                        </div>
                    </div>

                    {/* Safety Badge */}
                    <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        <ShieldCheck size={18} className="text-green-600" />
                        <span>Verified Seller & Secure Payment</span>
                    </div>
                </div>

                {/* Reviews Section */}
                <div className="bg-white rounded-xl p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Customer Reviews</h2>

                    {/* Review Submission Form */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold text-gray-800 mb-3">Write a Review</h3>
                        <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                    <button
                                        key={rating}
                                        onClick={() => setNewReview({ ...newReview, rating })}
                                        className="focus:outline-none"
                                    >
                                        <Star
                                            size={24}
                                            fill={rating <= newReview.rating ? "#fbbf24" : "none"}
                                            className={rating <= newReview.rating ? "text-yellow-400" : "text-gray-300"}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                            <textarea
                                value={newReview.comment}
                                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                                rows="3"
                                placeholder="Share your experience..."
                            />
                        </div>
                        <button
                            onClick={submitReview}
                            disabled={submittingReview}
                            className="px-6 py-2 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition-colors disabled:opacity-50"
                        >
                            {submittingReview ? "Submitting..." : "Submit Review"}
                        </button>
                    </div>

                    {/* Reviews List */}
                    {reviews.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review!</p>
                    ) : (
                        <div className="space-y-4">
                            {reviews.map((review) => (
                                <div key={review.id} className="border-b border-gray-100 pb-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-semibold text-gray-800">{review.customerName}</h4>
                                            <div className="flex items-center gap-1 text-yellow-400 mt-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={14}
                                                        fill={i < review.rating ? "currentColor" : "none"}
                                                        className={i < review.rating ? "" : "text-gray-300"}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-400">
                                            {review.createdAt?.toDate?.().toLocaleDateString() || "Recent"}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 text-sm">{review.comment}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex items-center gap-4 z-20">
                <div className="flex-1">
                    <p className="text-xs text-gray-500">Total Price</p>
                    <p className="text-xl font-bold text-gray-900">₹{service.price}</p>
                </div>
                <button
                    onClick={addToCart}
                    className="flex-1 bg-white border border-pink-600 text-pink-600 py-3 rounded-xl font-bold text-center hover:bg-pink-50 transition-colors flex items-center justify-center gap-2"
                >
                    <ShoppingBag size={20} />
                    Add to Cart
                </button>
                <Link
                    href={`/customer/booking?serviceId=${service.id}`}
                    className="flex-1 bg-pink-600 text-white py-3 rounded-xl font-bold text-center hover:bg-pink-700 transition-colors shadow-lg shadow-pink-200"
                >
                    Book Now
                </Link>
            </div>
        </div>
    );
}
