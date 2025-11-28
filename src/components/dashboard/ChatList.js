"use client";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, onSnapshot } from "firebase/firestore";
import { MessageSquare, User } from "lucide-react";

export default function ChatList({ userId, onSelectChat }) {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;

        const q = query(
            collection(db, "chats"),
            where("participants", "array-contains", userId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const chatsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).sort((a, b) => b.lastMessageTime?.seconds - a.lastMessageTime?.seconds);
            setChats(chatsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    if (loading) {
        return <div className="text-center py-10 text-gray-500">Loading chats...</div>;
    }

    if (chats.length === 0) {
        return (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                <MessageSquare className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-800">No messages yet</h3>
                <p className="text-gray-500">Your conversations will appear here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {chats.map((chat) => {
                // Determine the other participant's name
                // If the current user is the seller, show customer name.
                // If current user is customer, show seller name (which we might need to store or fetch)
                // For now, let's assume chat object has both names or we derive it.
                // Actually, the chat object structure isn't fully defined yet for both sides.
                // Existing code used chat.customerName.
                // Let's try to be smart about display name.

                const displayName = chat.participants[0] === userId ? chat.participantNames?.[1] : chat.participantNames?.[0] || chat.customerName || "User";

                return (
                    <button
                        key={chat.id}
                        onClick={() => onSelectChat(chat)}
                        className="w-full text-left bg-white p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors flex items-center gap-4"
                    >
                        <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold shrink-0">
                            {displayName?.[0] || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                                <h4 className="font-medium text-gray-900 truncate">{displayName}</h4>
                                <span className="text-xs text-gray-400">
                                    {chat.lastMessageTime?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
