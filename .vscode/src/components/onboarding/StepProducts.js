"use client";
import { useState } from "react";
import { Plus, Trash2, Image as ImageIcon } from "lucide-react";

export default function StepProducts({ data, updateData }) {
    const products = data.products || [];

    const addProduct = () => {
        updateData({
            products: [
                ...products,
                { id: Date.now(), name: "", price: "", description: "", image: null },
            ],
        });
    };

    const removeProduct = (id) => {
        updateData({
            products: products.filter((p) => p.id !== id),
        });
    };

    const updateProduct = (id, field, value) => {
        updateData({
            products: products.map((p) =>
                p.id === id ? { ...p, [field]: value } : p
            ),
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Add your first products</h2>
                <p className="text-gray-500">What would you like to sell?</p>
            </div>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                {products.map((product, index) => (
                    <div key={product.id} className="p-4 border border-gray-200 rounded-xl bg-gray-50 relative group">
                        <button
                            onClick={() => removeProduct(product.id)}
                            className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors p-1"
                        >
                            <Trash2 size={18} />
                        </button>

                        <h3 className="text-sm font-medium text-gray-500 mb-3">Product #{index + 1}</h3>

                        <div className="space-y-3">
                            <div>
                                <input
                                    type="text"
                                    value={product.name}
                                    onChange={(e) => updateProduct(product.id, "name", e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                                    placeholder="Product Name (e.g. Mango Pickle)"
                                />
                            </div>

                            <div className="flex gap-3">
                                <div className="w-1/3">
                                    <input
                                        type="number"
                                        value={product.price}
                                        onChange={(e) => updateProduct(product.id, "price", e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                                        placeholder="Price (₹)"
                                    />
                                </div>
                                <div className="w-2/3">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={product.description}
                                            onChange={(e) => updateProduct(product.id, "description", e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                                            placeholder="Short Description (Optional)"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Image Placeholder */}
                            <div className="flex items-center gap-2 text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg p-2 cursor-pointer hover:bg-gray-100 transition-colors">
                                <ImageIcon size={16} />
                                <span>Upload Image (Optional)</span>
                            </div>
                        </div>
                    </div>
                ))}

                {products.length === 0 && (
                    <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                        No products added yet.
                    </div>
                )}
            </div>

            <button
                onClick={addProduct}
                className="w-full py-3 border-2 border-dashed border-pink-300 text-pink-600 rounded-xl hover:bg-pink-50 transition-colors flex items-center justify-center gap-2 font-medium"
            >
                <Plus size={20} />
                Add Product
            </button>
        </div>
    );
}
