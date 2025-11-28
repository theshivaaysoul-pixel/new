"use client";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export default function DiagnosticPage() {
    const [results, setResults] = useState("");
    const [loading, setLoading] = useState(false);

    const checkDatabase = async () => {
        setLoading(true);
        let output = "=== DATABASE DIAGNOSTIC ===\n\n";

        try {
            // Check sellers
            const sellersSnapshot = await getDocs(collection(db, "sellers"));
            output += `Sellers Found: ${sellersSnapshot.size}\n`;
            sellersSnapshot.forEach(doc => {
                const data = doc.data();
                output += `  - ${data.businessName} (ID: ${doc.id}, Username: ${data.username})\n`;
            });

            // Check products
            output += `\nProducts Found: `;
            const productsSnapshot = await getDocs(collection(db, "products"));
            output += `${productsSnapshot.size}\n`;

            // Group products by seller
            const productsBySeller = {};
            productsSnapshot.forEach(doc => {
                const data = doc.data();
                const sellerId = data.sellerId;
                if (!productsBySeller[sellerId]) {
                    productsBySeller[sellerId] = [];
                }
                productsBySeller[sellerId].push({ id: doc.id, name: data.name, price: data.price });
            });

            // Display products by seller
            for (const [sellerId, products] of Object.entries(productsBySeller)) {
                output += `\n  Seller ID: ${sellerId} (${products.length} products)\n`;
                products.forEach(p => {
                    output += `    - ${p.name} (₹${p.price})\n`;
                });
            }

            // Test query for a specific seller
            if (sellersSnapshot.size > 0) {
                const firstSeller = sellersSnapshot.docs[0];
                output += `\n\n=== TEST QUERY ===\n`;
                output += `Testing products for: ${firstSeller.data().businessName} (${firstSeller.id})\n`;
                const testQuery = query(collection(db, "products"), where("sellerId", "==", firstSeller.id));
                const testSnapshot = await getDocs(testQuery);
                output += `Products found by query: ${testSnapshot.size}\n`;
                testSnapshot.forEach(doc => {
                    output += `  - ${doc.data().name}\n`;
                });
            }

        } catch (error) {
            output += `\nERROR: ${error.message}\n`;
            console.error(error);
        }

        setResults(output);
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-10">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Database Diagnostic</h1>
                <p className="text-gray-600 mb-6">Check what's actually in the Firestore database</p>

                <button
                    onClick={checkDatabase}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? "Checking..." : "Run Diagnostic"}
                </button>

                {results && (
                    <div className="mt-6 p-4 bg-gray-900 rounded-lg">
                        <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">{results}</pre>
                    </div>
                )}
            </div>
        </div>
    );
}
