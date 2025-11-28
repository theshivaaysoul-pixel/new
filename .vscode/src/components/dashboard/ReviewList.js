"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Star, User } from "lucide-react";

export default function ReviewList({ sellerId }) {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            if (!sellerId) return;

            try {
                const q = query(
                    collection(db, "reviews"),
                    where("sellerId", "==", sellerId)
                );

                const querySnapshot = await getDocs(q);
                const reviewsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })).sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);

                setReviews(reviewsData);
            } catch (error) {
                console.error("Error fetching reviews:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, [sellerId]);

    if (loading) {
        return <div className="text-center py-10 text-gray-500">Loading reviews...</div>;
    }

    if (reviews.length === 0) {
        return (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                <Star className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-800">No reviews yet</h3>
                <p className="text-gray-500">Reviews from your customers will appear here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {reviews.map((review) => (
                <div key={review.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                                <User size={20} />
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">{review.customerName || "Anonymous"}</h4>
                                <div className="flex items-center gap-1 text-yellow-400">
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
                        </div>
                        <span className="text-xs text-gray-400">
                            {review.createdAt?.toDate().toLocaleDateString()}
                        </span>
                    </div>
                    <p className="text-gray-600 mt-2">{review.comment}</p>
                </div>
            ))}
        </div>
    );
}
