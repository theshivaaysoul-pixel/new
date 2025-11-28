"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Star, MessageSquare, User, Package } from "lucide-react";

export default function ReviewsList({ sellerId }) {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, average: 0, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });

    useEffect(() => {
        if (!sellerId) return;

        const q = query(
            collection(db, "reviews"),
            where("sellerId", "==", sellerId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reviewsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Sort client-side by createdAt descending
            reviewsData.sort((a, b) => {
                const aTime = a.createdAt?.toDate?.() || new Date(0);
                const bTime = b.createdAt?.toDate?.() || new Date(0);
                return bTime - aTime;
            });

            setReviews(reviewsData);
            calculateStats(reviewsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [sellerId]);

    const calculateStats = (reviewsData) => {
        if (reviewsData.length === 0) {
            setStats({ total: 0, average: 0, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });
            return;
        }

        const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        let totalRating = 0;

        reviewsData.forEach(review => {
            const rating = review.rating || 5;
            breakdown[rating]++;
            totalRating += rating;
        });

        setStats({
            total: reviewsData.length,
            average: (totalRating / reviewsData.length).toFixed(1),
            breakdown
        });
    };

    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <Star
                key={i}
                size={16}
                className={i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
            />
        ));
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading reviews...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Customer Reviews ({stats.total})</h2>
            </div>

            {/* Rating Summary */}
            {reviews.length > 0 && (
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm mb-6">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Average Rating */}
                        <div className="flex flex-col items-center justify-center md:border-r border-gray-200 md:pr-6">
                            <div className="text-5xl font-bold text-gray-900">{stats.average}</div>
                            <div className="flex gap-1 my-2">
                                {renderStars(Math.round(parseFloat(stats.average)))}
                            </div>
                            <p className="text-sm text-gray-500">{stats.total} reviews</p>
                        </div>

                        {/* Rating Breakdown */}
                        <div className="flex-1 space-y-2">
                            {[5, 4, 3, 2, 1].map((star) => {
                                const count = stats.breakdown[star];
                                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                                return (
                                    <div key={star} className="flex items-center gap-3">
                                        <div className="flex items-center gap-1 w-16">
                                            <span className="text-sm font-medium text-gray-700">{star}</span>
                                            <Star size={14} className="fill-yellow-400 text-yellow-400" />
                                        </div>
                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-yellow-400 h-2 rounded-full transition-all"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                        <MessageSquare size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">No reviews yet</h3>
                    <p className="text-gray-500">Customer reviews will appear here after they rate your products.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <div key={review.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                            {/* Review Header */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-start gap-4">
                                    {/* Customer Avatar */}
                                    <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
                                        {review.customerName?.[0] || "C"}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-gray-900">{review.customerName || "Anonymous"}</h4>
                                            <div className="flex gap-0.5">
                                                {renderStars(review.rating || 5)}
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {review.createdAt?.toDate ? review.createdAt.toDate().toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            }) : "Recent"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Review Content */}
                            <div className="mb-4">
                                <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                            </div>

                            {/* Product Info (if available) */}
                            {review.productId && (
                                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                                    <Package size={16} />
                                    <span>Product ID: {review.productId.slice(0, 8)}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
