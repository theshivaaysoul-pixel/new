"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import ProductForm from "./ProductForm";

export default function ProductList({ sellerId }) {
    const [products, setProducts] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!sellerId) return;

        const q = query(collection(db, "products"), where("sellerId", "==", sellerId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const prods = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setProducts(prods);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [sellerId]);

    const handleDelete = async (id) => {
        if (!id || typeof id !== "string") {
            console.error("Invalid product ID for deletion:", id);
            alert("Error: Cannot delete product with invalid ID.");
            return;
        }
        if (confirm("Are you sure you want to delete this product?")) {
            try {
                await deleteDoc(doc(db, "products", id));
            } catch (error) {
                console.error("Error deleting product:", error);
                alert("Failed to delete product.");
            }
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingProduct(null);
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading products...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Your Products ({products.length})</h2>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg shadow-pink-200"
                >
                    <Plus size={18} />
                    Add Product
                </button>
            </div>

            {products.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                    <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4 text-pink-300">
                        <Package size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">No products yet</h3>
                    <p className="text-gray-500 mb-6">Start adding products to your shop.</p>
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="text-pink-600 font-medium hover:underline"
                    >
                        Add your first product
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                        <div key={product.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
                            <div className="h-40 bg-gray-100 flex items-center justify-center text-gray-400">
                                {product.image ? (
                                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Package size={40} className="opacity-20" />
                                )}
                            </div>
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-semibold text-gray-800 truncate pr-2">{product.name}</h3>
                                    <span className="font-bold text-pink-600">₹{product.price}</span>
                                </div>
                                {product.caption && (
                                    <p className="text-xs text-gray-400 italic mb-2">{product.caption}</p>
                                )}
                                <p className="text-sm text-gray-500 line-clamp-2 mb-3 h-10">{product.description || "No description"}</p>

                                {/* Variants / Sub-menu Preview */}
                                {product.variants && product.variants.length > 0 && (
                                    <div className="mb-3 bg-gray-50 p-2 rounded-lg">
                                        <p className="text-xs font-semibold text-gray-500 mb-1">Options:</p>
                                        <div className="space-y-1">
                                            {product.variants.slice(0, 2).map((variant, idx) => (
                                                <div key={idx} className="flex justify-between text-xs text-gray-600">
                                                    <span>{variant.name}</span>
                                                    <span>+₹{variant.price}</span>
                                                </div>
                                            ))}
                                            {product.variants.length > 2 && (
                                                <p className="text-xs text-pink-500 font-medium">+{product.variants.length - 2} more</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2 pt-2 border-t border-gray-50">
                                    <button
                                        onClick={() => handleEdit(product)}
                                        className="flex-1 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Pencil size={16} />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        className="flex-1 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isFormOpen && (
                <ProductForm
                    isOpen={isFormOpen}
                    onClose={handleCloseForm}
                    productToEdit={editingProduct}
                    sellerId={sellerId}
                />
            )}
        </div>
    );
}
