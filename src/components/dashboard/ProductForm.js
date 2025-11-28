"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { X, Save, Loader } from "lucide-react";

export default function ProductForm({ isOpen, onClose, productToEdit, sellerId }) {
    const [formData, setFormData] = useState({
        name: "",
        price: "",
        category: "Others",
        description: "",
        image: null,
        caption: "",
        variants: [] // Array of { name: "", price: "" }
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (productToEdit) {
            setFormData({
                ...productToEdit,
                category: productToEdit.category || "Others",
                variants: productToEdit.variants || []
            });
        } else {
            setFormData({ name: "", price: "", category: "Others", description: "", image: null, caption: "", variants: [] });
        }
    }, [productToEdit]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, image: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddVariant = () => {
        setFormData({
            ...formData,
            variants: [...formData.variants, { name: "", price: "" }]
        });
    };

    const handleVariantChange = (index, field, value) => {
        const newVariants = [...formData.variants];
        newVariants[index][field] = value;
        setFormData({ ...formData, variants: newVariants });
    };

    const handleRemoveVariant = (index) => {
        const newVariants = formData.variants.filter((_, i) => i !== index);
        setFormData({ ...formData, variants: newVariants });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (productToEdit) {
                await updateDoc(doc(db, "products", productToEdit.id), {
                    ...formData,
                    updatedAt: new Date()
                });
            } else {
                await addDoc(collection(db, "products"), {
                    ...formData,
                    sellerId,
                    createdAt: new Date()
                });
            }
            onClose();
        } catch (error) {
            console.error("Error saving product:", error);
            alert("Failed to save product.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-900">
                        {productToEdit ? "Edit Product" : "Add New Product"}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors relative">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            {formData.image ? (
                                <img src={formData.image} alt="Preview" className="h-32 w-full object-contain mx-auto rounded-lg" />
                            ) : (
                                <div className="text-gray-400">
                                    <p>Click to upload image</p>
                                    <p className="text-xs">(Max 1MB recommended)</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Caption */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Image Caption</label>
                        <input
                            type="text"
                            value={formData.caption}
                            onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                            placeholder="e.g. Freshly baked this morning"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                            placeholder="e.g. Handmade Bag"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none bg-white"
                        >
                            {["Beauty Services", "Homemade Food", "Tailoring", "Small Shops", "Handicrafts", "Others"].map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                        <input
                            type="number"
                            required
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                            placeholder="e.g. 500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none min-h-[100px]"
                            placeholder="Describe your product..."
                        />
                    </div>

                    {/* Sub-menu / Variants */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">Sub-menu (Optional)</label>
                            <button
                                type="button"
                                onClick={handleAddVariant}
                                className="text-xs text-pink-600 font-bold hover:underline"
                            >
                                + Add Item
                            </button>
                        </div>
                        <div className="space-y-2">
                            {formData.variants.map((variant, index) => (
                                <div key={index} className="flex gap-2 items-center">
                                    <input
                                        type="text"
                                        placeholder="Item Name (e.g. Extra Cheese)"
                                        value={variant.name}
                                        onChange={(e) => handleVariantChange(index, "name", e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-pink-500 outline-none"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Price"
                                        value={variant.price}
                                        onChange={(e) => handleVariantChange(index, "price", e.target.value)}
                                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-pink-500 outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveVariant(index)}
                                        className="text-red-400 hover:text-red-600"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ))}
                            {formData.variants.length === 0 && (
                                <p className="text-xs text-gray-400 italic">No sub-items added.</p>
                            )}
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-pink-600 hover:bg-pink-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-pink-200"
                        >
                            {loading ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
                            {productToEdit ? "Update Product" : "Save Product"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
