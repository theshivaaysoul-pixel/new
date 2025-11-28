"use client";
import { useState } from "react";
import { X } from "lucide-react";

export default function TermsModal({ isOpen, onClose, onAccept }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Terms & Conditions</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto text-gray-600 text-sm space-y-4">
                    <p>Welcome to Her Side Hustle. By proceeding, you agree to the following terms:</p>

                    <h3 className="font-semibold text-gray-800">1. Platform Usage</h3>
                    <p>This platform is designed to empower rural women entrepreneurs. You agree to use it for legitimate business purposes only.</p>

                    <h3 className="font-semibold text-gray-800">2. Product Listings</h3>
                    <p>All products listed must be authentic and accurately described. The sale of illegal or prohibited items is strictly forbidden.</p>

                    <h3 className="font-semibold text-gray-800">3. Privacy</h3>
                    <p>We respect your privacy and will handle your personal data in accordance with our Privacy Policy.</p>

                    <h3 className="font-semibold text-gray-800">4. Payments</h3>
                    <p>Payments are processed securely. We are not responsible for disputes arising from off-platform transactions.</p>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                    >
                        Decline
                    </button>
                    <button
                        onClick={onAccept}
                        className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium shadow-lg shadow-pink-200"
                    >
                        I Agree
                    </button>
                </div>
            </div>
        </div>
    );
}
