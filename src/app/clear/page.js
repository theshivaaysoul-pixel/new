"use client";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

export default function ClearPage() {
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    const clearAllData = async () => {
        if (!confirm("This will DELETE ALL sellers and products. Are you sure?")) return;

        setLoading(true);
        setStatus("Starting cleanup...");

        try {
            // Delete all sellers
            const sellersSnapshot = await getDocs(collection(db, "sellers"));
            setStatus(`Deleting ${sellersSnapshot.size} sellers...`);
            for (const docSnapshot of sellersSnapshot.docs) {
                await deleteDoc(doc(db, "sellers", docSnapshot.id));
            }

            // Delete all products
            const productsSnapshot = await getDocs(collection(db, "products"));
            setStatus(`Deleting ${productsSnapshot.size} products...`);
            for (const docSnapshot of productsSnapshot.docs) {
                await deleteDoc(doc(db, "products", docSnapshot.id));
            }

            setStatus("✅ All data cleared! Now run /setup to create fresh data.");
        } catch (error) {
            setStatus(`❌ Error: ${error.message}`);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-red-50 p-10">
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 border-2 border-red-200">
                <h1 className="text-3xl font-bold text-red-900 mb-4">⚠️ Clear Database</h1>
                <p className="text-gray-700 mb-6">
                    This will permanently delete ALL sellers and products from the database.
                    Use this to fix duplicate data issues.
                </p>

                <button
                    onClick={clearAllData}
                    disabled={loading}
                    className="w-full py-4 bg-red-600 text-white rounded-xl font-bold text-lg hover:bg-red-700 transition-all disabled:opacity-50 shadow-lg"
                >
                    {loading ? "Clearing..." : "Clear All Data"}
                </button>

                {status && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h3 className="font-semibold text-gray-700 mb-2">Status:</h3>
                        <p className="text-sm text-gray-600 font-mono whitespace-pre-wrap">{status}</p>
                    </div>
                )}

                <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h3 className="font-semibold text-yellow-900 mb-2">⚡ After Clearing</h3>
                    <p className="text-sm text-yellow-800">
                        Go to <a href="/setup" className="underline font-bold">/setup</a> to create fresh data
                    </p>
                </div>
            </div>
        </div>
    );
}
