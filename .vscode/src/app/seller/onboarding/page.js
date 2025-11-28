"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, setDoc, writeBatch } from "firebase/firestore";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";

import StepPersonal from "@/components/onboarding/StepPersonal";
import StepBusiness from "@/components/onboarding/StepBusiness";
import StepProducts from "@/components/onboarding/StepProducts";
import StepProfile from "@/components/onboarding/StepProfile";
import StepLocation from "@/components/onboarding/StepLocation";

export default function OnboardingPage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        // Step 1
        name: "",
        whatsapp: "",
        username: "",
        password: "",
        // Step 2
        businessName: "",
        businessType: "", // seller or service
        category: "",
        // Step 3
        products: [],
        // Step 4
        displayName: "",
        address: "",
        phone: "",
        description: "",
        // Step 5
        location: null,
    });

    const { user, setIsOnboarded } = useAuth();
    const router = useRouter();

    const updateData = (newData) => {
        setFormData((prev) => ({ ...prev, ...newData }));
    };

    const nextStep = () => setStep((prev) => Math.min(prev + 1, 5));
    const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const sellerId = `SELLER_${Date.now()}`;

            // 1. Save Seller Profile
            // Destructure products out of formData to avoid saving it to the seller doc
            // and to avoid sending 'undefined' if we tried to set it to undefined
            const { products, ...sellerProfile } = formData;

            await setDoc(doc(db, "sellers", sellerId), {
                ...sellerProfile,
                sellerId,
                createdAt: new Date(),
                storeStatus: "live", // Default to live
            });

            // 2. Save Products
            const batch = writeBatch(db);
            const productsList = formData.products || [];
            productsList.forEach((prod) => {
                const prodRef = doc(collection(db, "products"));
                batch.set(prodRef, {
                    ...prod,
                    sellerId,
                    createdAt: new Date(),
                });
            });
            await batch.commit();

            // 3. Update Local Auth State
            setIsOnboarded(true);

            // 4. Redirect
            if (formData.businessType === "service") {
                router.push("/service/dashboard");
            } else {
                router.push("/seller/dashboard");
            }
        } catch (error) {
            console.error("Error saving data:", error);
            alert("Failed to save data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1: return <StepPersonal data={formData} updateData={updateData} />;
            case 2: return <StepBusiness data={formData} updateData={updateData} />;
            case 3: return <StepProducts data={formData} updateData={updateData} />;
            case 4: return <StepProfile data={formData} updateData={updateData} />;
            case 5: return <StepLocation data={formData} updateData={updateData} />;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h1 className="font-bold text-lg text-gray-800">Seller Onboarding</h1>
                <div className="text-sm text-gray-500">Step {step} of 5</div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-gray-200 w-full">
                <div
                    className="h-full bg-pink-600 transition-all duration-300"
                    style={{ width: `${(step / 5) * 100}%` }}
                />
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center p-6">
                <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-20">
                    {renderStep()}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-between items-center z-10">
                <button
                    onClick={prevStep}
                    disabled={step === 1}
                    className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${step === 1
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-gray-600 hover:bg-gray-100"
                        }`}
                >
                    Back
                </button>

                {step < 5 ? (
                    <button
                        onClick={nextStep}
                        className="px-6 py-2.5 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition-colors flex items-center gap-2 shadow-lg shadow-pink-200"
                    >
                        Next Step
                        <ChevronRight size={18} />
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-8 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2 shadow-lg shadow-green-200"
                    >
                        {loading ? "Saving..." : "Complete Setup"}
                        {!loading && <Check size={18} />}
                    </button>
                )}
            </div>
        </div>
    );
}
