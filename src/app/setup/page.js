"use client";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function SetupPage() {
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    const setupData = async () => {
        setLoading(true);
        setStatus("Starting data setup...");

        try {
            // Define sellers for each category
            const sellers = [
                {
                    businessName: "Glamour Studio", name: "Priya Sharma", username: "glamourstudio", password: "password",
                    email: "priya@glamourstudio.com", phone: "9876543210", category: "Beauty Services", whatsapp: "9876543210",
                    businessType: "seller", storeStatus: "live", description: "Professional beauty and makeup services",
                    timings: ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM"], displayName: "Glamour Studio by Priya"
                },
                {
                    businessName: "Mom's Kitchen", name: "Sunita Devi", username: "momskitchen", password: "password",
                    email: "sunita@momskitchen.com", phone: "9876543211", category: "Homemade Food", whatsapp: "9876543211",
                    businessType: "seller", storeStatus: "live", description: "Delicious homemade food prepared with love",
                    timings: ["08:00 AM", "09:00 AM", "12:00 PM", "06:00 PM", "07:00 PM"], displayName: "Mom's Kitchen"
                },
                {
                    businessName: "Stitch Perfect", name: "Anjali Gupta", username: "stitchperfect", password: "password",
                    email: "anjali@stitchperfect.com", phone: "9876543212", category: "Tailoring", whatsapp: "9876543212",
                    businessType: "seller", storeStatus: "live", description: "Custom tailoring and alterations",
                    timings: ["10:00 AM", "11:00 AM", "03:00 PM", "04:00 PM", "05:00 PM"], displayName: "Stitch Perfect Tailoring"
                },
                {
                    businessName: "Corner Store", name: "Meena Rao", username: "cornerstore", password: "password",
                    email: "meena@cornerstore.com", phone: "9876543213", category: "Small Shops", whatsapp: "9876543213",
                    businessType: "seller", storeStatus: "live", description: "Your neighborhood essentials store",
                    timings: ["08:00 AM", "10:00 AM", "12:00 PM", "04:00 PM", "06:00 PM"], displayName: "Corner Store"
                },
                {
                    businessName: "Artisan Crafts", name: "Kavita Singh", username: "artisancrafts", password: "password",
                    email: "kavita@artisancrafts.com", phone: "9876543214", category: "Handicrafts", whatsapp: "9876543214",
                    businessType: "seller", storeStatus: "live", description: "Handmade crafts and decorative items",
                    timings: ["09:00 AM", "11:00 AM", "02:00 PM", "04:00 PM"], displayName: "Artisan Crafts by Kavita"
                },
                {
                    businessName: "Multi Services", name: "Rekha Patel", username: "multiservices", password: "password",
                    email: "rekha@multiservices.com", phone: "9876543215", category: "Others", whatsapp: "9876543215",
                    businessType: "seller", storeStatus: "live", description: "Various services for your daily needs",
                    timings: ["09:00 AM", "12:00 PM", "03:00 PM", "05:00 PM"], displayName: "Multi Services"
                }
            ];

            // Create sellers
            setStatus("Creating seller accounts...");
            const sellerIds = [];
            for (const seller of sellers) {
                const sellerRef = await addDoc(collection(db, "sellers"), { ...seller, createdAt: new Date() });
                sellerIds.push({ id: sellerRef.id, category: seller.category });
                setStatus(`Created ${seller.businessName}`);
            }

            // Define all products by category
            const productsData = {
                "Beauty Services": [
                    { name: "Lakme Absolute Foundation", description: "Lightweight foundation with SPF 8 for natural finish", price: 799, category: "Makeup", image: "https://images.unsplash.com/photo-1631214524020-7e18db9a8f92?w=500", caption: "Perfect foundation" },
                    { name: "Maybelline Colossal Kajal", description: "Intense black kajal, lasts 12 hours, waterproof", price: 199, category: "Makeup", image: "https://images.unsplash.com/photo-15124960158 51-a90fb38ba796?w=500", caption: "Bold eyes" },
                    { name: "Apple Cider Vinegar Shampoo", description: "Clarifying shampoo for all hair types", price: 549, category: "Hair Care", image: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=500", caption: "Healthy hair" },
                    { name: "Plum Green Tea Face Wash", description: "Deep cleansing with green tea extract", price: 345, category: "Skincare", image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500", caption: "Gentle cleansing" },
                    { name: "Biotique Moisturizer", description: "Honey-based 24-hour hydration", price: 299, category: "Skincare", image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500", caption: "Natural moisture" }
                ],
                "Homemade Food": [
                    { name: "Aloo Paratha (Pack of 4)", description: "Fresh stuffed parathas with spicy potato filling", price: 120, category: "Breakfast", image: "https://images.unsplash.com/photo-1630383249896-424e482df921?w=500", caption: "Fresh homemade" },
                    { name: "Mixed Veg Pulao (500g)", description: "Aromatic basmati rice with fresh vegetables", price: 180, category: "Main Course", image: "https://images.unsplash.com/photo-1596560548464-f010549b84d7?w=500", caption: "Flavorful" },
                    { name: "Paneer Tikka (250g)", description: "Marinated cottage cheese grilled to perfection", price: 250, category: "Snacks", image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500", caption: "Restaurant quality" },
                    { name: "Dal Makhani (500ml)", description: "Slow-cooked black lentils in creamy gravy", price: 150, category: "Dal/Curry", image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500", caption: "Rich dal" },
                    { name: "Gulab Jamun (Pack of 6)", description: "Soft milk dumplings in rose-flavored syrup", price: 100, category: "Dessert", image: "https://images.unsplash.com/photo-1589301773859-bb024d3a6cab?w=500", caption: "Sweet" }
                ],
                "Tailoring": [
                    { name: "Custom Kurti Stitching", description: "Perfect fitting kurti with beautiful finishing", price: 300, category: "Women's Wear", image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500", caption: "Perfect fit" },
                    { name: "Lehenga Alteration", description: "Professional size adjustment with fall and pico", price: 500, category: "Alteration", image: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=500", caption: "Expert work" },
                    { name: "Salwar Suit Complete", description: "Complete stitching with intricate detailing", price: 600, category: "Women's Wear", image: "https://images.unsplash.com/photo-1610030469420-32d3e8763e3f?w=500", caption: "Traditional" },
                    { name: "Men's Shirt Stitching", description: "Custom formal or casual shirt with collar options", price: 350, category: "Men's Wear", image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500", caption: "Tailored" },
                    { name: "Designer Blouse", description: "Various neck and back designs for sarees", price: 400, category: "Women's Wear", image: "https://images.unsplash.com/photo-1617019114583-affb34d1b3cd?w=500", caption: "Designer" }
                ],
                "Small Shops": [
                    { name: "Amul Taaza Milk (1L)", description: "Fresh homogenized toned milk, rich in calcium", price: 56, category: "Dairy", image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500", caption: "Fresh daily" },
                    { name: "Britannia Bread (400g)", description: "Soft fresh whole wheat bread for breakfast", price: 40, category: "Bakery", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500", caption: "Fresh bread" },
                    { name: "Parle-G Biscuits (1kg)", description: "India's favorite glucose biscuits with tea", price: 80, category: "Snacks", image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500", caption: "Classic" },
                    { name: "Tata Tea Gold (1kg)", description: "Premium blend for rich flavor and aroma", price: 480, category: "Beverages", image: "https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=500", caption: "Premium tea" },
                    { name: "Fortune Soyabean Oil (1L)", description: "Cholesterol-free oil for healthy cooking", price: 140, category: "Groceries", image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500", caption: "Healthy oil" }
                ],
                "Handicrafts": [
                    { name: "Terracotta Pots Set", description: "Hand-painted decorative pots, set of 3", price: 450, category: "Home Decor", image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=500", caption: "Artistic" },
                    { name: "Macrame Wall Hanging", description: "Handcrafted bohemian style wall art", price: 800, category: "Wall Art", image: "https://images.unsplash.com/photo-1604762524889-9545ad8d1f32?w=500", caption: "Handwoven" },
                    { name: "Jute Table Runners", description: "Eco-friendly with embroidered borders, pack of 2", price: 350, category: "Table Linen", image: "https://images.unsplash.com/photo-1558317374-067523e89200?w=500", caption: "Natural" },
                    { name: "Dream Catcher", description: "Traditional with feathers and beads", price: 250, category: "Decorative", image: "https://images.unsplash.com/photo-1616694547566-38e4bbbb988c?w=500", caption: "Spiritual" },
                    { name: "Wooden Key Holder", description: "Handcrafted with 6 hooks for organization", price: 400, category: "Organizer", image: "https://images.unsplash.com/photo-1565183928294-7d26e96c6589?w=500", caption: "Functional" }
                ],
                "Others": [
                    { name: "Appliance Repair Service", description: "Expert repair for home appliances", price: 300, category: "Home Services", image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500", caption: "Professional" },
                    { name: "House Cleaning (2BHK)", description: "Deep cleaning including kitchen and bathrooms", price: 1500, category: "Cleaning", image: "https://images.unsplash.com/photo-1581578949510-fa7315c4c350?w=500", caption: "Spotless" },
                    { name: "Plumbing Service", description: "Leak repairs, installation, maintenance", price: 400, category: "Home Services", image: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=500", caption: "Quick fix" },
                    { name: "Electrical Wiring Check", description: "Complete safety inspection with minor repairs", price: 500, category: "Electrical", image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=500", caption: "Safe" },
                    { name: "Monthly Gardening", description: "Garden maintenance with watering and pruning", price: 800, category: "Garden", image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500", caption: "Green" }
                ]
            };

            // Add products for all sellers
            setStatus("Adding products...");
            for (const sellerInfo of sellerIds) {
                const products = productsData[sellerInfo.category];
                if (products) {
                    for (const product of products) {
                        await addDoc(collection(db, "products"), {
                            ...product, variants: [], sellerId: sellerInfo.id,
                            createdAt: new Date(), updatedAt: new Date()
                        });
                    }
                    setStatus(`Added products for ${sellerInfo.category}`);
                }
            }

            setStatus("✅ Setup Complete! 6 sellers and 30 products created.");
        } catch (error) {
            console.error("Error:", error);
            setStatus(`❌ Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-10">
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Database Setup</h1>
                <p className="text-gray-600 mb-8">
                    Create 6 sellers (one per category) and 30 products (5 per category) with images.
                </p>

                <button
                    onClick={setupData}
                    disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-pink-700 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg"
                >
                    {loading ? "Setting up..." : "Start Setup"}
                </button>

                {status && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h3 className="font-semibold text-gray-700 mb-2">Status:</h3>
                        <p className="text-sm text-gray-600 font-mono whitespace-pre-wrap">{status}</p>
                    </div>
                )}

                <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Login Credentials</h3>
                    <p className="text-sm text-blue-800">All sellers: password <strong>password</strong></p>
                    <ul className="mt-2 text-sm text-blue-700 space-y-1">
                        <li>• glamourstudio / password</li>
                        <li>• momskitchen / password</li>
                        <li>• stitchperfect / password</li>
                        <li>• cornerstore / password</li>
                        <li>• artisancrafts / password</li>
                        <li>• multiservices / password</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
