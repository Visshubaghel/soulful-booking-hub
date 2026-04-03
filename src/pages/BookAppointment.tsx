import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, CheckCircle2, XCircle, ChevronLeft, ChevronRight, RefreshCw, X, User, Phone, Mail, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";

interface AvailableSlot {
  time: string;
  currentBookings: number;
  maxPatients: number;
  spotsLeft: number;
}

interface BlockedSlot {
  time: string;
  isBlocked: boolean;
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function formatDateDisplay(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function shiftDate(dateStr: string, days: number) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// Generate all time slots template
function generateAllTimeSlots() {
  const slots: string[] = [];
  const start = 10 * 60 + 30;
  const end = 19 * 60;
  for (let m = start; m < end; m += 30) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const suffix = h >= 12 ? "PM" : "AM";
    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
    slots.push(`${displayH}:${min.toString().padStart(2, "0")} ${suffix}`);
  }
  return slots;
}

const BookAppointment = () => {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  
  // Booking Form State
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    age: "",
    gender: "Male",
    symptoms: "",
    service: "General Consultation",
    notes: ""
  });

  const allTimeSlots = generateAllTimeSlots();

  const fetchSlots = async (date: string) => {
    setLoading(true);
    setSelectedSlot(null);
    try {
      const res = await fetch(`/api/slots/available?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableSlots(data.availableSlots || []);
      }
    } catch {
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots(selectedDate);
  }, [selectedDate]);

  // Build a map of available slots for quick lookup
  const availableMap = new Map(availableSlots.map((s) => [s.time, s]));

  const handleBookSlot = (time: string) => {
    setSelectedSlot(time);
    setShowModal(true);
  };

  const submitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;
    
    setIsSubmitting(true);
    try {
      // 1. Post to live MongoDB API
      const dbRes = await fetch('/api/appointments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: formData.name,
          patientEmail: formData.email,
          patientPhone: formData.phone,
          age: parseInt(formData.age, 10),
          gender: formData.gender,
          symptoms: formData.symptoms,
          date: selectedDate,
          time: selectedSlot,
          service: formData.service,
          notes: formData.notes
        })
      });
      
      const dbData = await dbRes.json();
      
      if (!dbRes.ok) {
        throw new Error(dbData.message || 'Failed to book slot on server.');
      }

      // 2. Post to Web3Forms Backup (as requested for email notifications)
      await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: "2fadd96e-67e3-4aa9-8b6a-8daf18765074",
          subject: `New Appointment Booking: ${formData.name}`,
          from_name: "Vishwas Skin Clinic",
          message: `Booking for ${formData.name} on ${selectedDate} at ${selectedSlot}. Service: ${formData.service}. Notes: ${formData.notes}. Phone: ${formData.phone}`,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        }),
      }).catch(() => { /* ignore web3forms non-critical errors */ });

      toast.success("Appointment Booked Successfully!");
      
      // Cleanup UI
      setShowModal(false);
      setFormData({ name: "", email: "", phone: "", age: "", gender: "Male", symptoms: "", service: "General Consultation", notes: "" });
      
      // Refresh available slots
      fetchSlots(selectedDate);
      
    } catch (error: any) {
      toast.error(error.message || "Failed to book appointment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPastDate = selectedDate < getToday();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-28 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h1 className="text-3xl md:text-4xl font-heading font-bold mb-3">
              Book Your Appointment
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Select a date to see available time slots. Green slots are available for booking.
            </p>
          </motion.div>

          {/* Date Picker */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-background border border-border rounded-2xl p-5 shadow-sm mb-6"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="font-semibold">Select Date</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}
                  className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  min={getToday()}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium"
                />
                <button
                  onClick={() => setSelectedDate(shiftDate(selectedDate, 1))}
                  className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => fetchSlots(selectedDate)}
                  className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-sm font-semibold text-muted-foreground">
                {formatDateDisplay(selectedDate)}
                {!isPastDate && (
                  <span className="ml-2 text-emerald-500">
                    · {availableSlots.length} slots available
                  </span>
                )}
              </p>
            </div>
          </motion.div>

          {/* Time Slots Grid */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-background border border-border rounded-2xl shadow-sm overflow-hidden"
          >
            <div className="p-5 border-b border-border">
              <h2 className="text-lg font-bold font-heading flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Time Slots
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Clinic hours: 10:30 AM – 7:00 PM
              </p>
            </div>

            <div className="p-5">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : isPastDate ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Cannot book slots for a past date.</p>
                  <p className="text-sm mt-1">Please select today or a future date.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {allTimeSlots.map((time) => {
                    const slot = availableMap.get(time);
                    const isAvailable = !!slot;

                    return (
                      <motion.button
                        key={time}
                        whileHover={isAvailable ? { scale: 1.02 } : {}}
                        whileTap={isAvailable ? { scale: 0.98 } : {}}
                        onClick={() => isAvailable && handleBookSlot(time)}
                        disabled={!isAvailable}
                        className={`rounded-xl border p-4 text-left transition-all ${
                          isAvailable
                            ? "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/50 cursor-pointer ring-1 ring-emerald-500/10"
                            : "border-border bg-muted/40 cursor-not-allowed opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          {isAvailable ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-muted-foreground/50" />
                          )}
                          <span className="font-semibold text-sm">{time}</span>
                        </div>
                        <p className="text-xs">
                          {isAvailable ? (
                            <span className="text-emerald-600 font-medium">
                              Available · {slot!.spotsLeft} spots
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Slot Full</span>
                          )}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="px-5 py-3 bg-muted/30 border-t border-border flex flex-wrap gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500" /> Available – Click to book
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-muted-foreground/30" /> Slot Full / Blocked
              </span>
            </div>
          </motion.div>

          {/* Booking Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 bg-primary/5 border border-primary/20 rounded-2xl p-5 text-center"
          >
            <p className="text-sm text-muted-foreground">
              Click on an available slot to book via WhatsApp. Our team will confirm your appointment shortly.
            </p>
          </motion.div>
        </div>
      </div>

      <Footer />

      {/* Booking Form Dialog System */}
      <AnimatePresence>
        {showModal && selectedSlot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-background border border-border rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/30">
                <div>
                  <h3 className="text-xl font-heading font-bold">Confirm Booking</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {formatDateDisplay(selectedDate)} at {selectedSlot}
                  </p>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <form id="booking-form" onSubmit={submitBooking} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" /> Full Name *
                    </label>
                    <Input 
                      required 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                      placeholder="e.g. Jane Doe" 
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-primary" /> Email *
                      </label>
                      <Input 
                        type="email" 
                        required 
                        value={formData.email} 
                        onChange={(e) => setFormData({...formData, email: e.target.value})} 
                        placeholder="jane@example.com" 
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-primary" /> Phone *
                      </label>
                      <Input 
                        required 
                        value={formData.phone} 
                        onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                        placeholder="+91 XXXXX XXXXX" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 flex items-center gap-2">
                        Age *
                      </label>
                      <Input 
                        type="number" 
                        required 
                        min="1"
                        max="120"
                        value={formData.age} 
                        onChange={(e) => setFormData({...formData, age: e.target.value})} 
                        placeholder="e.g. 28" 
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 flex items-center gap-2">
                        Gender *
                      </label>
                      <select
                        required
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Service</label>
                    <select
                      value={formData.service}
                      onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option>General Consultation</option>
                      <option>Skin Treatment</option>
                      <option>Hair Treatment</option>
                      <option>Laser Therapy</option>
                      <option>Acne Treatment</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" /> Symptoms / Reason for Visit *
                    </label>
                    <Textarea 
                      required
                      value={formData.symptoms} 
                      onChange={(e) => setFormData({...formData, symptoms: e.target.value})} 
                      placeholder="Describe your symptoms or reason for visit..." 
                      rows={2} 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" /> Additional Notes
                    </label>
                    <Textarea 
                      value={formData.notes} 
                      onChange={(e) => setFormData({...formData, notes: e.target.value})} 
                      placeholder="Any specific concerns..." 
                      rows={3} 
                    />
                  </div>
                </form>
              </div>

              <div className="px-6 py-4 border-t bg-muted/10 flex items-center justify-end gap-3">
                <Button variant="outline" onClick={() => setShowModal(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" form="booking-form" disabled={isSubmitting} className="gradient-rose text-white">
                  {isSubmitting ? "Confirming..." : "Confirm Booking"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookAppointment;
