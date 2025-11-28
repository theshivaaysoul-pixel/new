"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check local storage for persisted session
        const storedUser = localStorage.getItem("seller_user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        // 1. Check hardcoded demo
        if (username === "seller" && password === "1234") {
            const userData = { username, role: "seller", isOnboarded: false };
            setUser(userData);
            localStorage.setItem("seller_user", JSON.stringify(userData));

            // Redirect based on role/type (Mock logic)
            // Since we don't have businessType in the mock user, we'll default to seller dashboard
            // In a real app, we'd check the user's profile
            return true;
        }

        // 2. Check Firestore for real users
        try {
            // Query by username only to avoid needing a composite index in Firestore
            const q = query(collection(db, "sellers"), where("username", "==", username));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const sellerDoc = querySnapshot.docs[0];
                const docData = sellerDoc.data();
                // Verify password in memory
                if (docData.password === password) {
                    const userData = {
                        ...docData,
                        id: sellerDoc.id,  // CRITICAL: Include the Firestore document ID as sellerId
                        role: "seller",
                        isOnboarded: true
                    };
                    setUser(userData);
                    localStorage.setItem("seller_user", JSON.stringify(userData));
                    return userData.businessType; // Return business type for redirect logic
                }
            }
        } catch (error) {
            console.error("Login error:", error);
        }

        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("seller_user");
        router.push("/seller/login");
    };

    const setIsOnboarded = (status) => {
        // Reload user data from localStorage to get the updated seller info
        const storedUser = localStorage.getItem("seller_user");
        if (storedUser) {
            const userData = JSON.parse(storedUser);
            userData.isOnboarded = status;
            setUser(userData);
            localStorage.setItem("seller_user", JSON.stringify(userData));
        } else if (user) {
            // Fallback if localStorage is not available
            const updatedUser = { ...user, isOnboarded: status };
            setUser(updatedUser);
            localStorage.setItem("seller_user", JSON.stringify(updatedUser));
        }
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, setIsOnboarded }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
