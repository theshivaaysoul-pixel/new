"use client";
import { AuthProvider } from "@/context/AuthContext";

export default function SellerLayout({ children }) {
    return <AuthProvider>{children}</AuthProvider>;
}
