"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, where } from "firebase/firestore";
import { Plus, Trash2, Briefcase, Check } from "lucide-react";

const SERVICE_PRESETS = [
    "Mehndi Artist",
    "Home Tutor",
    "Yoga Trainer",
    "Cooking Classes",
    "Tailoring / Stitching",
    "Babysitting",
    "Beauty Services"
];

export default function ServiceManager({ sellerId }) {
    const [services, setServices] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form State
    const [selectedPreset, setSelectedPreset] = useState("");
    const [customName, setCustomName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");

    useEffect(() => {
        if (!sellerId) return;

        const q = query(collection(db, "sellers", sellerId, "services"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [sellerId]);

    const handleAddService = async (e) => {
        e.preventDefault();
        const name = selectedPreset === "Custom" ? customName : selectedPreset;

        if (!name || !price) return;

        try {
            await addDoc(collection(db, "sellers", sellerId, "services"), {
                name,
                description,
                price: Number(price),
                createdAt: new Date()
            });
            setIsAdding(false);
            resetForm();
        } catch (error) {
            console.error("Error adding service:", error);
            alert("Failed to add service");
        }
    };

    const handleDelete = async (id) => {
        if (confirm("Delete this service?")) {
            try {
                await deleteDoc(doc(db, "sellers", sellerId, "services", id));
            } catch (error) {
                console.error("Error deleting service:", error);
            }
        }
    };

    const resetForm = () => {
        setSelectedPreset("");
        setCustomName("");
        setDescription("");
        setPrice("");
    };

    if (loading) return <div className="text-center py-8 text-gray-500">Loading services...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">My Services</h2>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-pink-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-pink-700 transition-colors"
                >
                    <Plus size={18} />
                    Add Service
                </button>
            </div>

            {isAdding && (
                <div className="bg-white p-6 rounded-xl border border-pink-100 shadow-lg animate-in fade-in slide-in-from-top-4">
                    <h3 className="font-bold text-gray-800 mb-4">Add New Service</h3>
                    <form onSubmit={handleAddService} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                            <select
                                value={selectedPreset}
                                onChange={(e) => setSelectedPreset(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-pink-500"
                                required
                            >
                                <option value="">Select a service...</option>
                                {SERVICE_PRESETS.map(s => <option key={s} value={s}>{s}</option>)}
                                <option value="Custom">Add Custom Service</option>
                            </select>
                        </div>

                        {selectedPreset === "Custom" && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                                <input
                                    type="text"
                                    value={customName}
                                    onChange={(e) => setCustomName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-pink-500"
                                    placeholder="e.g. Advanced Math Tutoring"
                                    required
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Charges (₹)</label>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-pink-500"
                                placeholder="e.g. 500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-pink-500 min-h-[80px]"
                                placeholder="Briefly describe what you offer..."
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                className="flex-1 bg-pink-600 text-white py-2 rounded-lg font-medium hover:bg-pink-700"
                            >
                                Save Service
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg font-medium hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
                {services.map((service) => (
                    <div key={service.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-start group hover:border-pink-200 transition-colors">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Briefcase size={16} className="text-pink-500" />
                                <h4 className="font-bold text-gray-800">{service.name}</h4>
                            </div>
                            <p className="text-sm text-gray-500 mb-2">{service.description || "No description"}</p>
                            <span className="bg-green-50 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                                ₹{service.price}
                            </span>
                        </div>
                        <button
                            onClick={() => handleDelete(service.id)}
                            className="text-gray-300 hover:text-red-500 transition-colors p-1"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}

                {services.length === 0 && !isAdding && (
                    <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-gray-500">No services added yet.</p>
                        <button onClick={() => setIsAdding(true)} className="text-pink-600 font-medium hover:underline mt-2">
                            Add your first service
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
