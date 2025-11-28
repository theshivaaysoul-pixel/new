"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, MapPin, Star, ShieldCheck, ArrowRight, User, X, ShoppingBag, Package, Home, ShoppingCart, ChevronDown, ChevronUp, Briefcase } from "lucide-react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, collectionGroup, limit, doc, getDoc, setDoc } from "firebase/firestore";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

export default function CustomerLandingPage() {
    const router = useRouter();
    const [showModal, setShowModal] = useState(false);
    const [isSignup, setIsSignup] = useState(false);
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        name: "",
        phone: ""
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [customerName, setCustomerName] = useState("");
    const [topEntrepreneurs, setTopEntrepreneurs] = useState([]);
    const [trendingProducts, setTrendingProducts] = useState([]);
    const [trendingServices, setTrendingServices] = useState([]);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

    // Phone Authentication states
    const [phoneNumber, setPhoneNumber] = useState("");
    const [otp, setOtp] = useState("");
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [phoneVerified, setPhoneVerified] = useState(false);
    const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);
    const [otpSent, setOtpSent] = useState(false);
    const [phoneAuthMessage, setPhoneAuthMessage] = useState("");

    // Check if user is already logged in
    useEffect(() => {
        const customerId = localStorage.getItem("customerId");
        const storedName = localStorage.getItem("customerName");
        if (customerId) {
            setIsLoggedIn(true);
            setCustomerName(storedName || "User");
        }
        fetchTopEntrepreneurs();
        fetchTrendingData();
    }, []);

    // Initialize RecaptchaVerifier when modal opens for signup
    useEffect(() => {
        if (showModal && isSignup && !recaptchaVerifier) {
            try {
                const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                    'size': 'invisible',
                    'callback': (response) => {
                        // reCAPTCHA solved
                    },
                    'expired-callback': () => {
                        // Response expired. Ask user to solve reCAPTCHA again.
                        setPhoneAuthMessage("reCAPTCHA expired. Please try again.");
                    }
                });
                setRecaptchaVerifier(verifier);
            } catch (error) {
                console.error("Error initializing RecaptchaVerifier:", error);
            }
        }

        // Cleanup function
        return () => {
            if (recaptchaVerifier) {
                recaptchaVerifier.clear();
            }
        };
    }, [showModal, isSignup]);

    const fetchTopEntrepreneurs = async () => {
        try {
            // Fetch all sellers
            const sellersSnapshot = await getDocs(collection(db, "sellers"));
            const sellers = [];
            sellersSnapshot.forEach((doc) => {
                sellers.push({ id: doc.id, ...doc.data() });
            });

            // Fetch all reviews
            const reviewsSnapshot = await getDocs(collection(db, "reviews"));
            const reviews = [];
            reviewsSnapshot.forEach((doc) => {
                reviews.push({ id: doc.id, ...doc.data() });
            });

            // Calculate average rating for each seller
            const sellersWithRatings = sellers.map(seller => {
                const sellerReviews = reviews.filter(review => review.sellerId === seller.id);
                const avgRating = sellerReviews.length > 0
                    ? sellerReviews.reduce((sum, review) => sum + (review.rating || 0), 0) / sellerReviews.length
                    : 0;

                return {
                    ...seller,
                    rating: avgRating,
                    reviewCount: sellerReviews.length
                };
            });

            // Filter out sellers with no reviews and sort by rating (descending)
            const topRated = sellersWithRatings
                .filter(seller => seller.rating > 0)
                .sort((a, b) => b.rating - a.rating)
                .slice(0, 5); // Top 5

            setTopEntrepreneurs(topRated);
        } catch (error) {
            console.error("Error fetching top entrepreneurs:", error);
        }
    };

    const fetchTrendingData = async () => {
        try {
            // Fetch Trending Products (limit 5)
            const productsQuery = query(collection(db, "products"), limit(5));
            const productsSnapshot = await getDocs(productsQuery);
            const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTrendingProducts(products);

            // Fetch Trending Services (collectionGroup 'services', limit 5)
            const servicesQuery = query(collectionGroup(db, "services"), limit(5));
            const servicesSnapshot = await getDocs(servicesQuery);
            const services = servicesSnapshot.docs.map(doc => {
                const data = doc.data();
                // If sellerId is missing in data, try to get it from the parent document (seller)
                // structure: sellers/{sellerId}/services/{serviceId}
                const sellerId = data.sellerId || doc.ref.parent.parent?.id;
                return { id: doc.id, ...data, sellerId };
            });
            setTrendingServices(services);

        } catch (error) {
            console.error("Error fetching trending data:", error);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // Check if customer exists
            const q = query(
                collection(db, "customers"),
                where("username", "==", formData.username),
                where("password", "==", formData.password)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Customer exists, log them in
                const customerData = querySnapshot.docs[0].data();
                localStorage.setItem("customerId", querySnapshot.docs[0].id);
                localStorage.setItem("customerName", customerData.name);
                alert(`Welcome back, ${customerData.name}!`);
                router.push("/customer/dashboard");
            } else {
                setError("Invalid username or password");
            }
        } catch (err) {
            console.error("Login error:", err);
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Send OTP function
    const sendOTP = async () => {
        if (!phoneNumber || phoneNumber.length < 10) {
            setPhoneAuthMessage("Please enter a valid phone number with country code (e.g., +919876543210)");
            return;
        }

        setPhoneAuthMessage("");
        setLoading(true);

        try {
            if (!recaptchaVerifier) {
                const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                    'size': 'invisible'
                });
                setRecaptchaVerifier(verifier);

                const confirmation = await signInWithPhoneNumber(auth, phoneNumber, verifier);
                setConfirmationResult(confirmation);
                setOtpSent(true);
                setPhoneAuthMessage("OTP sent successfully! Check your phone.");
            } else {
                const confirmation = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
                setConfirmationResult(confirmation);
                setOtpSent(true);
                setPhoneAuthMessage("OTP sent successfully! Check your phone.");
            }
        } catch (error) {
            console.error("Error sending OTP:", error);
            if (error.code === 'auth/invalid-phone-number') {
                setPhoneAuthMessage("Invalid phone number format. Use country code (e.g., +919876543210)");
            } else if (error.code === 'auth/too-many-requests') {
                setPhoneAuthMessage("Too many requests. Please try again later.");
            } else {
                setPhoneAuthMessage("Error sending OTP. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    // Verify OTP function
    const verifyOTP = async () => {
        if (!otp || otp.length !== 6) {
            setPhoneAuthMessage("Please enter a valid 6-digit OTP");
            return;
        }

        setPhoneAuthMessage("");
        setLoading(true);

        try {
            await confirmationResult.confirm(otp);
            setPhoneVerified(true);
            setPhoneAuthMessage("✓ Phone Verified Successfully!");
        } catch (error) {
            console.error("Error verifying OTP:", error);
            setPhoneAuthMessage("Invalid OTP, try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        // Validate password length
        if (formData.password.length < 8) {
            setError("Password should be at least 8 characters");
            setLoading(false);
            return;
        }

        // Validate phone number
        if (formData.phone.length !== 10 || !/^\d{10}$/.test(formData.phone)) {
            setError("Please enter a valid 10-digit phone number");
            setLoading(false);
            return;
        }

        try {
            // Check if username already exists
            const q = query(
                collection(db, "customers"),
                where("username", "==", formData.username)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                setError("Username already exists. Please choose a different one.");
                setLoading(false);
                return;
            }

            // Create new customer account
            const docRef = await addDoc(collection(db, "customers"), {
                username: formData.username,
                password: formData.password,
                name: formData.name,
                phone: formData.phone,
                phoneVerified: phoneVerified,
                createdAt: new Date()
            });

            localStorage.setItem("customerId", docRef.id);
            localStorage.setItem("customerName", formData.name);
            alert(`Account created successfully! Welcome, ${formData.name}!`);
            router.push("/customer/dashboard");
        } catch (err) {
            console.error("Signup error:", err);
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const categories = [
        { name: "Beauty Services", icon: "💄", color: "bg-pink-100" },
        { name: "Homemade Food", icon: "🍲", color: "bg-orange-100" },
        { name: "Tailoring", icon: "🧵", color: "bg-blue-100" },
        { name: "Small Shops", icon: "🏪", color: "bg-green-100" },
        { name: "Handicrafts", icon: "🎨", color: "bg-purple-100" },
        { name: "Others", icon: "📦", color: "bg-gray-100" },
    ];

    const [selectedService, setSelectedService] = useState(null);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [bookingDate, setBookingDate] = useState("");
    const [bookingTime, setBookingTime] = useState("");
    const [availableSlots, setAvailableSlots] = useState([]);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [availabilityMessage, setAvailabilityMessage] = useState("");

    const handleBookNow = async (service) => {
        setSelectedService(service);
        setIsBookingModalOpen(true);
        setBookingDate("");
        setBookingTime("");
        setAvailableSlots([]);
        setAvailabilityMessage("");
    };

    // Fetch availability when date changes
    const handleDateChange = async (selectedDate) => {
        setBookingDate(selectedDate);
        setBookingTime(""); // Reset time selection
        setAvailableSlots([]);
        setAvailabilityMessage("");

        if (!selectedDate || !selectedService?.sellerId) return;

        setBookingLoading(true);
        try {
            // Fetch availability document for this seller and date
            const availabilityRef = doc(db, "sellers", selectedService.sellerId, "availability", selectedDate);
            const availabilityDoc = await getDoc(availabilityRef);

            if (availabilityDoc.exists()) {
                const availabilityData = availabilityDoc.data();
                const slots = availabilityData.slots || [];

                // Filter only available slots
                const availableOnly = slots.filter(slot => slot.status === 'available');

                if (availableOnly.length > 0) {
                    setAvailableSlots(availableOnly);
                    setAvailabilityMessage("");
                } else {
                    setAvailableSlots([]);
                    setAvailabilityMessage("No available slots for this date. All slots are booked or marked as busy.");
                }
            } else {
                setAvailableSlots([]);
                setAvailabilityMessage("No availability set for this date. Please try another date.");
            }
        } catch (error) {
            console.error("Error fetching availability:", error);
            setAvailableSlots([]);
            setAvailabilityMessage("Error loading availability. Please try again.");
        } finally {
            setBookingLoading(false);
        }
    };

    const confirmBooking = async () => {
        if (!bookingDate || !bookingTime) {
            alert("Please select both date and time.");
            return;
        }

        if (!isLoggedIn) {
            alert("Please login to book a service.");
            setShowModal(true);
            return;
        }

        setBookingLoading(true);
        try {
            // 1. Create booking record
            await addDoc(collection(db, "bookings"), {
                customerId: localStorage.getItem("customerId"),
                customerName: customerName,
                serviceId: selectedService.id,
                serviceName: selectedService.name,
                sellerId: selectedService.sellerId,
                price: selectedService.price,
                date: bookingDate,
                time: bookingTime,
                status: "pending",
                createdAt: new Date()
            });

            // 2. Update the slot status in seller's availability
            const availabilityRef = doc(db, "sellers", selectedService.sellerId, "availability", bookingDate);
            const availabilityDoc = await getDoc(availabilityRef);

            if (availabilityDoc.exists()) {
                const availabilityData = availabilityDoc.data();
                const slots = availabilityData.slots || [];

                // Find and update the booked slot
                const updatedSlots = slots.map(slot => {
                    const slotTime = `${slot.start} - ${slot.end}`;
                    if (slotTime === bookingTime && slot.status === 'available') {
                        return {
                            ...slot,
                            status: 'booked',
                            source: 'online-booking'
                        };
                    }
                    return slot;
                });

                // Save updated availability
                await setDoc(availabilityRef, {
                    ...availabilityData,
                    slots: updatedSlots,
                    updatedAt: new Date()
                });
            }

            alert("BOOKED");
            setIsBookingModalOpen(false);
            setBookingDate("");
            setBookingTime("");
            setSelectedService(null);
        } catch (error) {
            console.error("Error creating booking:", error);
            alert("Failed to book service. Please try again.");
        } finally {
            setBookingLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white p-4 shadow-sm sticky top-0 z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden">
                            <Image
                                src="/logo.png"
                                alt="Her Side Hustle Logo"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <span className="font-bold text-xl text-gray-900">Her Side Hustle</span>
                    </div>
                    {isLoggedIn ? (
                        <Link
                            href="/customer/dashboard"
                            className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition-colors"
                        >
                            <User size={18} />
                            {customerName}
                        </Link>
                    ) : (
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition-colors"
                        >
                            <User size={18} />
                            Login
                        </button>
                    )}
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search for services, food, or products..."
                        className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl border-none focus:ring-2 focus:ring-pink-500 outline-none"
                    />
                    <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
                </div>
            </header>

            <main className="p-4 space-y-8">
                {/* Categories Dropdown */}
                <section>
                    <div className="relative">
                        <button
                            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl shadow-sm border border-gray-100 font-medium text-gray-800"
                        >
                            <span className="flex items-center gap-2">
                                <Package size={20} className="text-pink-600" />
                                Browse Categories
                            </span>
                            {isCategoryDropdownOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>

                        {isCategoryDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden animate-in fade-in zoom-in duration-200">
                                <div className="grid grid-cols-2 gap-2 p-2">
                                    {categories.map((cat) => (
                                        <Link
                                            href={`/customer/explore?category=${cat.name}`}
                                            key={cat.name}
                                            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                                            onClick={() => setIsCategoryDropdownOpen(false)}
                                        >
                                            <div className={`w-8 h-8 ${cat.color} rounded-lg flex items-center justify-center text-sm`}>
                                                {cat.icon}
                                            </div>
                                            <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                                        </Link>
                                    ))}
                                </div>
                                <div className="bg-gray-50 p-2 text-center border-t border-gray-100">
                                    <Link href="/customer/explore" className="text-pink-600 text-xs font-bold hover:underline">
                                        View All Categories
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Top Trending Products */}
                {trendingProducts.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-lg text-gray-800">Top Trending Products</h2>
                            <Link href="/customer/explore?type=products" className="text-pink-600 text-sm font-medium">
                                See All
                            </Link>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                            {trendingProducts.map((product) => (
                                <div key={product.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 min-w-[160px] w-[160px] group">
                                    <div className="h-32 bg-gray-100 rounded-lg mb-3 overflow-hidden relative">
                                        {product.image ? (
                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                <Package size={32} />
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-gray-800 text-sm truncate">{product.name}</h3>
                                    <p className="text-pink-600 font-bold text-sm">₹{product.price}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Top Trending Services */}
                {trendingServices.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-lg text-gray-800">Top Trending Services</h2>
                            <Link href="/customer/explore?type=services" className="text-pink-600 text-sm font-medium">
                                See All
                            </Link>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                            {trendingServices.map((service) => (
                                <div key={service.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 min-w-[200px] flex flex-col justify-between">
                                    <div>
                                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-3">
                                            <Briefcase size={20} />
                                        </div>
                                        <h3 className="font-bold text-gray-800 text-sm mb-1">{service.name}</h3>
                                        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{service.description || "No description available"}</p>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="bg-green-50 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                                            ₹{service.price}
                                        </span>
                                        <button
                                            onClick={() => handleBookNow(service)}
                                            className="text-pink-600 text-xs font-bold hover:underline"
                                        >
                                            Book Now
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Top Rated Entrepreneurs */}
                <section>
                    <h2 className="font-bold text-lg text-gray-800 mb-4">Top Rated Women Entrepreneurs</h2>
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                        {topEntrepreneurs.length > 0 ? topEntrepreneurs.map((entrepreneur) => (
                            <div key={entrepreneur.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 min-w-[200px] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full shrink-0 flex items-center justify-center text-white font-bold">
                                        {entrepreneur.businessName?.charAt(0) || entrepreneur.name?.charAt(0) || "?"}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">{entrepreneur.businessName || entrepreneur.name || "Unknown"}</h3>
                                        <p className="text-xs text-gray-500">{entrepreneur.category || "General"}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-yellow-500 text-sm font-medium">
                                    <Star size={14} fill="currentColor" />
                                    {entrepreneur.rating.toFixed(1)}
                                </div>
                            </div>
                        )) : (
                            <div className="text-center w-full py-4 text-gray-500 text-sm">
                                No reviews yet. Be the first to review!
                            </div>
                        )}
                    </div>
                </section>

                {/* Safety Badges */}
                <section className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 shrink-0">
                        <ShieldCheck size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-sm">Verified & Safe</h3>
                        <p className="text-xs text-gray-600">All entrepreneurs are verified for your safety.</p>
                    </div>
                </section>
            </main>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-3 z-20">
                <Link href="/customer" className="flex flex-col items-center gap-1 text-pink-600">
                    <Home size={24} />
                    <span className="text-[10px] font-medium">Home</span>
                </Link>
                <Link href="/customer/explore" className="flex flex-col items-center gap-1 text-gray-400 hover:text-pink-600">
                    <Search size={24} />
                    <span className="text-[10px] font-medium">Explore</span>
                </Link>
                <Link href="/customer/cart" className="flex flex-col items-center gap-1 text-gray-400 hover:text-pink-600">
                    <ShoppingCart size={24} />
                    <span className="text-[10px] font-medium">Cart</span>
                </Link>
                <Link href="/customer/dashboard" className="flex flex-col items-center gap-1 text-gray-400 hover:text-pink-600">
                    <Package size={24} />
                    <span className="text-[10px] font-medium">Orders</span>
                </Link>
                <Link href="/customer/dashboard" className="flex flex-col items-center gap-1 text-gray-400 hover:text-pink-600">
                    <User size={24} />
                    <span className="text-[10px] font-medium">Account</span>
                </Link>
            </div>

            {/* Login/Signup Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {isSignup ? "Create Account" : "Login"}
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        setIsSignup(false);
                                        setError("");
                                        setFormData({ username: "", password: "", name: "", phone: "" });
                                        setPhoneNumber("");
                                        setOtp("");
                                        setOtpSent(false);
                                        setPhoneVerified(false);
                                        setPhoneAuthMessage("");
                                        if (recaptchaVerifier) {
                                            recaptchaVerifier.clear();
                                            setRecaptchaVerifier(null);
                                        }
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={isSignup ? handleSignup : handleLogin} className="space-y-4">
                                {isSignup && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none"
                                                placeholder="Enter your full name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                required
                                                maxLength={10}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none"
                                                placeholder="9876543210"
                                            />
                                        </div>

                                        {/* Firebase Phone Authentication Section */}
                                        <div className="border-t pt-4">
                                            <h3 className="text-sm font-semibold text-gray-800 mb-3">Verify Your Phone (Optional)</h3>

                                            {/* Phone Number for Firebase Auth */}
                                            <div className="mb-3">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number with Country Code</label>
                                                <input
                                                    type="tel"
                                                    value={phoneNumber}
                                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none"
                                                    placeholder="+919876543210"
                                                    disabled={otpSent}
                                                />
                                            </div>

                                            {/* Send OTP Button */}
                                            {!otpSent && (
                                                <button
                                                    type="button"
                                                    onClick={sendOTP}
                                                    disabled={loading || !phoneNumber}
                                                    className="w-full py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 mb-3"
                                                >
                                                    {loading ? "Sending..." : "Send OTP"}
                                                </button>
                                            )}

                                            {/* OTP Input and Verify Button */}
                                            {otpSent && !phoneVerified && (
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
                                                        <input
                                                            type="text"
                                                            value={otp}
                                                            onChange={(e) => setOtp(e.target.value)}
                                                            maxLength={6}
                                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none"
                                                            placeholder="123456"
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={verifyOTP}
                                                        disabled={loading || !otp}
                                                        className="w-full py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                                                    >
                                                        {loading ? "Verifying..." : "Verify OTP"}
                                                    </button>
                                                </div>
                                            )}

                                            {/* Phone Auth Messages */}
                                            {phoneAuthMessage && (
                                                <div className={`mt-3 p-3 rounded-lg text-sm ${phoneVerified
                                                    ? 'bg-green-50 border border-green-200 text-green-700'
                                                    : phoneAuthMessage.includes('successfully') || phoneAuthMessage.includes('sent')
                                                        ? 'bg-blue-50 border border-blue-200 text-blue-700'
                                                        : 'bg-red-50 border border-red-200 text-red-700'
                                                    }`}>
                                                    {phoneAuthMessage}
                                                </div>
                                            )}

                                            {/* Recaptcha Container */}
                                            <div id="recaptcha-container"></div>
                                        </div>
                                    </>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none"
                                        placeholder="Enter username"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none"
                                        placeholder="Enter password"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition-colors shadow-lg shadow-pink-200 disabled:opacity-50"
                                >
                                    {loading ? "Please wait..." : isSignup ? "Create Account" : "Login"}
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <button
                                    onClick={() => {
                                        setIsSignup(!isSignup);
                                        setError("");
                                        setFormData({ username: "", password: "", name: "", phone: "" });
                                        setPhoneNumber("");
                                        setOtp("");
                                        setOtpSent(false);
                                        setPhoneVerified(false);
                                        setPhoneAuthMessage("");
                                        if (recaptchaVerifier) {
                                            recaptchaVerifier.clear();
                                            setRecaptchaVerifier(null);
                                        }
                                    }}
                                    className="text-pink-600 font-medium hover:underline"
                                >
                                    {isSignup ? "Already have an account? Login" : "Create a new account"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Booking Modal */}
            {isBookingModalOpen && selectedService && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-200">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Book Service</h2>
                                <button
                                    onClick={() => setIsBookingModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="mb-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                                        <Briefcase size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">{selectedService.name}</h3>
                                        <p className="text-pink-600 font-bold">₹{selectedService.price}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                                    {selectedService.description || "No description available."}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                                    <input
                                        type="date"
                                        value={bookingDate}
                                        onChange={(e) => handleDateChange(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Time Slot</label>
                                    {bookingLoading ? (
                                        <div className="text-sm text-gray-500 text-center py-4">Loading slots...</div>
                                    ) : availabilityMessage ? (
                                        <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                                            {availabilityMessage}
                                        </div>
                                    ) : availableSlots.length > 0 ? (
                                        <div className="grid grid-cols-3 gap-2">
                                            {availableSlots.map((slot, index) => {
                                                const slotTime = `${slot.start} - ${slot.end}`;
                                                return (
                                                    <button
                                                        key={index}
                                                        onClick={() => setBookingTime(slotTime)}
                                                        className={`py-2 px-1 text-xs font-medium rounded-lg border transition-colors ${bookingTime === slotTime
                                                            ? "bg-pink-600 text-white border-pink-600"
                                                            : "bg-white text-gray-600 border-gray-200 hover:border-pink-300"
                                                            }`}
                                                    >
                                                        {slot.start}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : bookingDate ? (
                                        <div className="text-sm text-gray-500 text-center py-4">
                                            Please select a date first
                                        </div>
                                    ) : null}
                                </div>

                                <button
                                    onClick={confirmBooking}
                                    disabled={bookingLoading || !bookingDate || !bookingTime}
                                    className="w-full py-3 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition-colors shadow-lg shadow-pink-200 disabled:opacity-50 mt-4"
                                >
                                    {bookingLoading ? "Processing..." : "Confirm Booking"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
