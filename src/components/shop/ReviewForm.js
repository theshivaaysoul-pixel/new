"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { Star, X } from "lucide-react";

export default function ReviewForm({ sellerId, customerName, onClose, onReviewSubmitted }) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [hoveredRating, setHoveredRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [existingReviewId, setExistingReviewId] = useState(null);

    useEffect(() => {
        // Check for existing review
        const checkExistingReview = async () => {
            if (!sellerId || !customerName) return;

            const q = query(
                collection(db, "reviews"),
                where("sellerId", "==", sellerId),
                where("customerName", "==", customerName)
            );

            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const review = snapshot.docs[0].data();
                setExistingReviewId(snapshot.docs[0].id);
                setRating(review.rating);
                setComment(review.comment);
            }
        };

        checkExistingReview();
    }, [sellerId, customerName]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) return;

        setIsSubmitting(true);
        try {
            if (existingReviewId) {
                // Update existing review
                await updateDoc(doc(db, "reviews", existingReviewId), {
                    rating,
                    comment,
                    updatedAt: serverTimestamp()
                });
            } else {
                // Create new review
                await addDoc(collection(db, "reviews"), {
                    sellerId,
                    customerName,
                    rating,
                    comment,
                    createdAt: serverTimestamp()
                });
            }
            onReviewSubmitted();
            onClose();
        } catch (error) {
            console.error("Error submitting review:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <X size={24} />
                </button>

                <h3 className="text-xl font-bold text-gray-900 mb-6">
                    {existingReviewId ? "Edit Your Review" : "Write a Review"}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Rate your experience</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    className="transition-transform hover:scale-110 focus:outline-none"
                                >
                                    <Star
                                        size={32}
                                        fill={(hoveredRating || rating) >= star ? "#fbbf24" : "none"}
                                        className={(hoveredRating || rating) >= star ? "text-yellow-400" : "text-gray-300"}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Your Comment
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                            placeholder="Tell us about your experience..."
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none resize-none"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || rating === 0}
                        className="w-full py-3 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSubmitting ? "Submitting..." : (existingReviewId ? "Update Review" : "Submit Review")}
                    </button>
                </form>
            </div>
        </div>
    );
}
