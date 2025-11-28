import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { Clock, Calendar, Save, Trash2, X, User, MessageCircle, MoreHorizontal, Coffee } from "lucide-react";

export default function SlotGenerator({ sellerId }) {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);

    // Generator State
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("17:00");
    const [duration, setDuration] = useState("60"); // minutes

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedSlotIndex, setSelectedSlotIndex] = useState(null);
    const [actionType, setActionType] = useState(null); // 'booked' | 'busy'
    const [bookingSource, setBookingSource] = useState("in-person");
    const [customSource, setCustomSource] = useState("");

    useEffect(() => {
        if (!sellerId || !date) return;

        const unsubscribe = onSnapshot(doc(db, "sellers", sellerId, "availability", date), (doc) => {
            if (doc.exists()) {
                setSlots(doc.data().slots || []);
            } else {
                setSlots([]);
            }
        });

        return () => unsubscribe();
    }, [sellerId, date]);

    const generateSlots = () => {
        if (!startTime || !endTime || !duration) return;

        const newSlots = [];
        let current = new Date(`2000-01-01T${startTime}`);
        const end = new Date(`2000-01-01T${endTime}`);
        const durationMin = parseInt(duration);

        while (current < end) {
            const slotStart = current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            current.setMinutes(current.getMinutes() + durationMin);
            const slotEnd = current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

            if (current <= end) {
                newSlots.push({
                    id: Date.now() + Math.random(),
                    start: slotStart,
                    end: slotEnd,
                    status: 'available'
                });
            }
        }

        setSlots(newSlots);
    };

    const handleSlotClick = (index) => {
        const slot = slots[index];
        if (slot.status === 'available') {
            setSelectedSlotIndex(index);
            setModalOpen(true);
            setActionType(null); // Reset action
            setBookingSource("in-person");
            setCustomSource("");
        } else {
            // If already booked/busy, allow making it available again
            if (confirm("Mark this slot as Available?")) {
                const updatedSlots = [...slots];
                updatedSlots[index] = { ...updatedSlots[index], status: 'available', source: null };
                setSlots(updatedSlots);
            }
        }
    };

    const confirmStatusUpdate = () => {
        if (selectedSlotIndex === null) return;

        const updatedSlots = [...slots];
        const slot = updatedSlots[selectedSlotIndex];

        if (actionType === 'busy') {
            slot.status = 'busy';
            slot.source = null;
        } else if (actionType === 'booked') {
            slot.status = 'booked';
            slot.source = bookingSource === 'other' ? `Other: ${customSource}` : bookingSource;
        }

        setSlots(updatedSlots);
        setModalOpen(false);
        setSelectedSlotIndex(null);
    };

    const deleteSlot = (index, e) => {
        e.stopPropagation(); // Prevent opening modal
        const updatedSlots = slots.filter((_, i) => i !== index);
        setSlots(updatedSlots);
    };

    const saveAvailability = async () => {
        setLoading(true);
        try {
            await setDoc(doc(db, "sellers", sellerId, "availability", date), {
                slots,
                updatedAt: new Date()
            });
            alert("Availability saved!");
        } catch (error) {
            console.error("Error saving slots:", error);
            alert("Failed to save slots");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Date Picker */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="bg-pink-100 p-2 rounded-lg text-pink-600">
                    <Calendar size={24} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Select Date</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="font-bold text-gray-800 outline-none bg-transparent"
                    />
                </div>
            </div>

            {/* Generator Controls */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-pink-500" />
                    Auto-Generate Slots
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                        <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">End Time</label>
                        <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Duration</label>
                        <select
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        >
                            <option value="30">30 Mins</option>
                            <option value="45">45 Mins</option>
                            <option value="60">1 Hour</option>
                            <option value="90">1.5 Hours</option>
                            <option value="120">2 Hours</option>
                        </select>
                    </div>
                    <button
                        onClick={generateSlots}
                        className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                    >
                        Generate
                    </button>
                </div>
            </div>

            {/* Slots Display */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800">Available Slots ({slots.length})</h3>
                    <button
                        onClick={saveAvailability}
                        disabled={loading}
                        className="bg-pink-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-pink-700 transition-colors flex items-center gap-2 shadow-lg shadow-pink-200"
                    >
                        <Save size={18} />
                        {loading ? "Saving..." : "Save Availability"}
                    </button>
                </div>

                {slots.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        No slots generated for this date.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {slots.map((slot, index) => (
                            <div
                                key={index}
                                onClick={() => handleSlotClick(index)}
                                className={`p-3 rounded-xl border transition-all relative group cursor-pointer ${slot.status === 'available'
                                        ? 'bg-white border-green-200 hover:border-green-400 hover:shadow-md'
                                        : slot.status === 'busy'
                                            ? 'bg-gray-100 border-gray-200 opacity-75'
                                            : 'bg-pink-50 border-pink-200'
                                    }`}
                            >
                                <div className="text-center mb-2">
                                    <p className="font-bold text-gray-800">{slot.start} - {slot.end}</p>
                                </div>
                                <div className={`text-center text-xs font-bold py-1.5 rounded-lg ${slot.status === 'available'
                                        ? 'bg-green-100 text-green-700'
                                        : slot.status === 'busy'
                                            ? 'bg-gray-200 text-gray-600'
                                            : 'bg-pink-100 text-pink-700'
                                    }`}>
                                    {slot.status === 'available' && 'Available'}
                                    {slot.status === 'busy' && 'Busy'}
                                    {slot.status === 'booked' && (
                                        <span className="flex items-center justify-center gap-1">
                                            {slot.source?.includes('whatsapp') ? <MessageCircle size={12} /> :
                                                slot.source?.includes('person') ? <User size={12} /> :
                                                    <MoreHorizontal size={12} />}
                                            Booked
                                        </span>
                                    )}
                                </div>
                                {slot.status === 'booked' && slot.source && (
                                    <p className="text-[10px] text-center text-gray-500 mt-1 truncate px-1">
                                        {slot.source}
                                    </p>
                                )}
                                <button
                                    onClick={(e) => deleteSlot(index, e)}
                                    className="absolute -top-2 -right-2 bg-white text-red-500 p-1 rounded-full shadow-sm border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Action Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900">Update Slot Status</h3>
                            <button onClick={() => setModalOpen(false)}><X size={20} /></button>
                        </div>
                        <div className="p-6">
                            {!actionType ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setActionType('booked')}
                                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-pink-100 bg-pink-50 text-pink-700 hover:bg-pink-100 transition-colors"
                                    >
                                        <User size={24} />
                                        <span className="font-bold">Mark Booked</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActionType('busy');
                                            // confirm immediately for busy
                                            const updatedSlots = [...slots];
                                            updatedSlots[selectedSlotIndex].status = 'busy';
                                            updatedSlots[selectedSlotIndex].source = null;
                                            setSlots(updatedSlots);
                                            setModalOpen(false);
                                            setSelectedSlotIndex(null);
                                        }}
                                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
                                    >
                                        <Coffee size={24} />
                                        <span className="font-bold">Mark Busy</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <h4 className="font-bold text-gray-700">Booking Source</h4>
                                    <div className="space-y-2">
                                        {[
                                            { id: 'in-person', label: 'Customer in person', icon: User },
                                            { id: 'whatsapp', label: 'Whatsapp', icon: MessageCircle },
                                            { id: 'other', label: 'Others (please specify)', icon: MoreHorizontal },
                                        ].map((option) => (
                                            <label
                                                key={option.id}
                                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${bookingSource === option.id
                                                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                                                        : 'border-gray-200 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="bookingSource"
                                                    value={option.id}
                                                    checked={bookingSource === option.id}
                                                    onChange={(e) => setBookingSource(e.target.value)}
                                                    className="hidden"
                                                />
                                                <option.icon size={18} />
                                                <span className="text-sm font-medium">{option.label}</span>
                                            </label>
                                        ))}
                                    </div>

                                    {bookingSource === 'other' && (
                                        <input
                                            type="text"
                                            value={customSource}
                                            onChange={(e) => setCustomSource(e.target.value)}
                                            placeholder="Specify source..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-pink-500"
                                            autoFocus
                                        />
                                    )}

                                    <div className="flex gap-2 mt-6">
                                        <button
                                            onClick={() => setActionType(null)}
                                            className="flex-1 px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={confirmStatusUpdate}
                                            className="flex-1 px-4 py-2 bg-pink-600 text-white font-bold rounded-lg hover:bg-pink-700"
                                        >
                                            Confirm
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
