import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Users, LogOut, Clock, CheckCircle2, XCircle, AlertCircle,
  RefreshCw, Shield, UserPlus, Edit, X, Search, Printer, Upload,
  ChevronLeft, ChevronRight, FileText, ImageIcon, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// ─────────────────── Types ───────────────────
interface SlotData {
  _id?: string; date: string; time: string;
  isBlocked: boolean; maxPatients: number; currentBookings: number;
}

interface AppointmentData {
  _id: string; patientId?: any; patientName: string; patientEmail: string;
  patientPhone?: string; age?: number; gender?: string; symptoms?: string;
  date: string; time: string; service: string; notes?: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  nextVisitDate?: string; prescriptionData?: string; createdAt: string;
}

interface PatientData {
  _id: string; patientId: string; name: string; age: number;
  gender: string; phone: string; email?: string; nextVisitDate?: string; createdAt: string;
}

interface StatsData {
  totalAppointments: number; todayAppointments: number;
  totalUsers: number; availableSlotsToday: number; blockedSlotsToday: number;
}

// ─────────────────── Helpers ───────────────────
function getToday() { return new Date().toISOString().split("T")[0]; }
function formatDateDisplay(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}
function shiftDate(dateStr: string, days: number) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
const timeSlotOptions: string[] = (() => {
  const slots: string[] = [];
  for (let m = 10 * 60 + 30; m < 19 * 60; m += 30) {
    const h = Math.floor(m / 60), min = m % 60;
    slots.push(`${h > 12 ? h - 12 : h}:${min.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`);
  }
  return slots;
})();

// ─────────────────── Component ───────────────────
const AdminDashboard = () => {
  const { user, logout, getAuthHeaders } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"slots" | "appointments" | "create" | "patients">("slots");

  // Slot management
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [togglingSlot, setTogglingSlot] = useState<string | null>(null);

  // Appointments
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Stats
  const [stats, setStats] = useState<StatsData | null>(null);

  // Create appointment
  const [newAppt, setNewAppt] = useState({
    patientName: "", patientEmail: "", patientPhone: "",
    age: "", gender: "Male", symptoms: "",
    date: getToday(), time: "10:30 AM", service: "General Consultation", notes: "",
  });
  const [isCreating, setIsCreating] = useState(false);

  // Edit/manage modal
  const [editingAppt, setEditingAppt] = useState<AppointmentData | null>(null);
  const [editApptLoading, setEditApptLoading] = useState(false);
  const [prescriptionFile, setPrescriptionFile] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Patient Records
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
  const [patientAppointments, setPatientAppointments] = useState<AppointmentData[]>([]);
  const [patientDetailLoading, setPatientDetailLoading] = useState(false);
  const [nextVisitInput, setNextVisitInput] = useState("");
  const [savingNextVisit, setSavingNextVisit] = useState(false);

  // ─── Auth guard ───
  useEffect(() => {
    if (!user || user.role !== "admin") navigate("/login");
  }, [user, navigate]);

  // ─── Headers helper ───
  const headers = useCallback(() => ({
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  }), [getAuthHeaders]);

  // ─── Fetch helpers ───
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats", { headers: headers(), credentials: "include" });
      if (res.ok) setStats(await res.json());
    } catch { /* silent */ }
  }, [headers]);

  const fetchSlots = useCallback(async (date: string) => {
    setSlotsLoading(true);
    try {
      const res = await fetch(`/api/admin/slots?date=${date}`, { headers: headers(), credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSlots(data.slots || []);
      } else {
        toast.error(`Failed to load slots (${res.status})`);
      }
    } catch (e: any) {
      toast.error(`Network error: ${e?.message}`);
    } finally { setSlotsLoading(false); }
  }, [headers]);

  const fetchAppointments = useCallback(async () => {
    setAppointmentsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterDate) params.set("date", filterDate);
      if (filterStatus) params.set("status", filterStatus);
      const res = await fetch(`/api/admin/appointments?${params}`, { headers: headers(), credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments || []);
      }
    } catch { toast.error("Failed to load appointments"); }
    finally { setAppointmentsLoading(false); }
  }, [headers, filterDate, filterStatus]);

  const fetchPatients = useCallback(async (search = "") => {
    setPatientsLoading(true);
    try {
      const res = await fetch(`/api/patients${search ? `?search=${encodeURIComponent(search)}` : ""}`, {
        headers: headers(), credentials: "include",
      });
      if (res.ok) setPatients(await res.json());
    } catch { toast.error("Failed to load patients"); }
    finally { setPatientsLoading(false); }
  }, [headers]);

  const fetchPatientDetail = async (patient: PatientData) => {
    setSelectedPatient(patient);
    setNextVisitInput(patient.nextVisitDate || "");
    setPatientDetailLoading(true);
    try {
      const res = await fetch(`/api/patients/${patient._id}`, { headers: headers(), credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setPatientAppointments(data.appointments || []);
      }
    } catch { toast.error("Failed to load patient details"); }
    finally { setPatientDetailLoading(false); }
  };

  // ─── Initial load ───
  useEffect(() => {
    if (user?.role === "admin") { fetchStats(); fetchSlots(selectedDate); }
  }, [user, selectedDate, fetchStats, fetchSlots]);

  useEffect(() => {
    if (user?.role === "admin" && activeTab === "appointments") fetchAppointments();
    if (user?.role === "admin" && activeTab === "patients") fetchPatients();
  }, [user, activeTab, fetchAppointments, fetchPatients]);

  // ─── Slot toggle ───
  const toggleSlot = async (slot: SlotData) => {
    const key = `${slot.date}-${slot.time}`;
    setTogglingSlot(key);
    try {
      const res = await fetch("/api/admin/slots", {
        method: "POST", headers: headers(), credentials: "include",
        body: JSON.stringify({ date: slot.date, time: slot.time, isBlocked: !slot.isBlocked, maxPatients: slot.maxPatients }),
      });
      if (res.ok) { toast.success(`${slot.time} ${slot.isBlocked ? "unblocked" : "blocked"}`); fetchSlots(selectedDate); fetchStats(); }
      else toast.error("Failed to update slot");
    } catch { toast.error("Network error"); }
    finally { setTogglingSlot(null); }
  };

  // ─── Update appointment (status/reschedule) ───
  const updateAppointment = async (id: string, updates: any) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PUT", headers: headers(), credentials: "include",
        body: JSON.stringify(updates),
      });
      if (res.ok) { toast.success("Appointment updated"); fetchAppointments(); fetchStats(); return true; }
      else { toast.error("Failed to update"); return false; }
    } catch { toast.error("Network error"); return false; }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppt) return;
    setEditApptLoading(true);
    const updates: any = { status: editingAppt.status, date: editingAppt.date, time: editingAppt.time };
    if (editingAppt.nextVisitDate !== undefined) updates.nextVisitDate = editingAppt.nextVisitDate;
    const ok = await updateAppointment(editingAppt._id, updates);
    if (ok) setEditingAppt(null);
    setEditApptLoading(false);
  };

  // ─── Prescription upload ───
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("File must be under 5MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setPrescriptionFile(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const uploadPrescription = async () => {
    if (!prescriptionFile || !editingAppt) return;
    setIsUploading(true);
    const ok = await updateAppointment(editingAppt._id, { prescriptionData: prescriptionFile });
    if (ok) {
      toast.success("Prescription uploaded!");
      setPrescriptionFile(null);
      setEditingAppt({ ...editingAppt, prescriptionData: prescriptionFile });
    }
    setIsUploading(false);
  };

  // ─── Create appointment ───
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await fetch("/api/appointments/create", {
        method: "POST", headers: headers(), credentials: "include",
        body: JSON.stringify({ ...newAppt, age: parseInt(newAppt.age, 10) }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Appointment created! Patient ID: ${data.patient?.patientId || "N/A"}`);
        setNewAppt({ patientName: "", patientEmail: "", patientPhone: "", age: "", gender: "Male", symptoms: "", date: getToday(), time: "10:30 AM", service: "General Consultation", notes: "" });
        fetchStats();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to create appointment");
      }
    } catch { toast.error("Network error"); }
    finally { setIsCreating(false); }
  };

  // ─── Save next visit date ───
  const saveNextVisit = async () => {
    if (!selectedPatient) return;
    setSavingNextVisit(true);
    try {
      const res = await fetch(`/api/patients/${selectedPatient._id}`, {
        method: "PUT", headers: headers(), credentials: "include",
        body: JSON.stringify({ nextVisitDate: nextVisitInput }),
      });
      if (res.ok) {
        toast.success("Next visit date saved!");
        setSelectedPatient({ ...selectedPatient, nextVisitDate: nextVisitInput });
        fetchPatients(patientSearch);
      } else toast.error("Failed to save");
    } catch { toast.error("Network error"); }
    finally { setSavingNextVisit(false); }
  };

  // ─── Guards ───
  if (!user || user.role !== "admin")
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  // ─── Slot card style helpers ───
  const getSlotStyle = (slot: SlotData) => {
    if (slot.isBlocked) return "border-red-500/30 bg-red-500/5 ring-1 ring-red-500/20";
    if (slot.currentBookings >= slot.maxPatients) return "border-amber-500/30 bg-amber-500/5 ring-1 ring-amber-500/20";
    return "border-emerald-500/30 bg-emerald-500/5 ring-1 ring-emerald-500/20";
  };
  const getSlotIcon = (slot: SlotData) => {
    if (slot.isBlocked) return <XCircle className="w-4 h-4 text-red-500" />;
    if (slot.currentBookings >= slot.maxPatients) return <AlertCircle className="w-4 h-4 text-amber-500" />;
    return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  };
  const getStatusBadge = (status: string) => {
    if (status === "confirmed") return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    if (status === "completed") return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    if (status === "cancelled") return "bg-red-500/10 text-red-500 border-red-500/20";
    return "bg-amber-500/10 text-amber-600 border-amber-500/20";
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-20 pt-24">
      <div className="container mx-auto px-4 max-w-7xl">

        {/* ═══ Header ═══ */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-background p-6 rounded-2xl shadow-sm border border-border mb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Welcome, {user.name} · {formatDateDisplay(getToday())}</p>
            </div>
          </div>
          <button onClick={() => { logout(); navigate("/"); }}
            className="flex items-center gap-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all px-4 py-2 rounded-lg font-medium text-sm">
            <LogOut size={16} /> Logout
          </button>
        </motion.div>

        {/* ═══ Stats Cards ═══ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Appointments", value: stats?.totalAppointments ?? "—", icon: <Calendar className="w-5 h-5" />, color: "text-primary bg-primary/10" },
            { label: "Today's Bookings", value: stats?.todayAppointments ?? "—", icon: <Clock className="w-5 h-5" />, color: "text-blue-500 bg-blue-500/10" },
            { label: "Available Slots Today", value: stats?.availableSlotsToday ?? "—", icon: <CheckCircle2 className="w-5 h-5" />, color: "text-emerald-500 bg-emerald-500/10" },
            { label: "Registered Users", value: stats?.totalUsers ?? "—", icon: <Users className="w-5 h-5" />, color: "text-violet-500 bg-violet-500/10" },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-background p-5 rounded-2xl shadow-sm border border-border">
              <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-3`}>{card.icon}</div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{card.label}</p>
              <h2 className="text-2xl font-bold font-heading mt-1">{card.value}</h2>
            </motion.div>
          ))}
        </div>

        {/* ═══ Tab Navigation ═══ */}
        <div className="flex flex-wrap gap-1 bg-background p-1.5 rounded-xl border border-border mb-6 w-fit">
          {[
            { key: "slots" as const, label: "Slot Management", icon: <Clock className="w-4 h-4" /> },
            { key: "appointments" as const, label: "Appointments", icon: <Calendar className="w-4 h-4" /> },
            { key: "create" as const, label: "Create Booking", icon: <UserPlus className="w-4 h-4" /> },
            { key: "patients" as const, label: "Patient Records", icon: <Users className="w-4 h-4" /> },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
              {tab.icon}<span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ═══════════ SLOT MANAGEMENT TAB ═══════════ */}
        {activeTab === "slots" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-background rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="p-5 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold font-heading">Manage Time Slots</h3>
                <p className="text-muted-foreground text-sm mt-0.5">Block or unblock slots. Blocked slots won't appear for patients.</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedDate(shiftDate(selectedDate, -1))} className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium" />
                <button onClick={() => setSelectedDate(shiftDate(selectedDate, 1))} className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"><ChevronRight className="w-4 h-4" /></button>
                <button onClick={() => { fetchSlots(selectedDate); fetchStats(); }} className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors" title="Refresh">
                  <RefreshCw className={`w-4 h-4 ${slotsLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
            <div className="px-5 py-3 bg-muted/30 border-b border-border">
              <p className="text-sm font-semibold">{formatDateDisplay(selectedDate)}</p>
            </div>
            <div className="p-5">
              {slotsLoading ? <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
                : slots.length === 0 ? <div className="text-center py-16 text-muted-foreground"><Clock className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>No slots data for this date.</p></div>
                  : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {slots.map((slot) => {
                        const key = `${slot.date}-${slot.time}`;
                        return (
                          <div key={key} className={`rounded-xl border p-4 transition-all ${getSlotStyle(slot)}`}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">{getSlotIcon(slot)}<span className="font-semibold text-sm">{slot.time}</span></div>
                              <span className="text-xs text-muted-foreground">{slot.currentBookings}/{slot.maxPatients}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium">{slot.isBlocked ? "Blocked" : slot.currentBookings >= slot.maxPatients ? "Fully Booked" : "Available"}</span>
                              <button onClick={() => toggleSlot(slot)} disabled={togglingSlot === key}
                                className={`relative w-11 h-6 rounded-full transition-colors ${slot.isBlocked ? "bg-red-500" : "bg-emerald-500"} ${togglingSlot === key ? "opacity-50" : ""}`}>
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${slot.isBlocked ? "translate-x-0" : "translate-x-5"}`} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
            </div>
            <div className="px-5 py-3 bg-muted/30 border-t border-border flex flex-wrap gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" /> Available</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500" /> Blocked</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500" /> Fully Booked</span>
            </div>
          </motion.div>
        )}

        {/* ═══════════ APPOINTMENTS TAB ═══════════ */}
        {activeTab === "appointments" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-background rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="p-5 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold font-heading">All Appointments</h3>
                <p className="text-muted-foreground text-sm mt-0.5">{appointments.length} appointment{appointments.length !== 1 ? "s" : ""} found</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="px-3 py-2 rounded-lg border border-border bg-background text-sm" />
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-lg border border-border bg-background text-sm">
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button onClick={() => { setFilterDate(""); setFilterStatus(""); }} className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground">Clear</button>
                <button onClick={fetchAppointments} className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors" title="Refresh">
                  <RefreshCw className={`w-4 h-4 ${appointmentsLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
            {appointmentsLoading ? <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
              : appointments.length === 0 ? <div className="text-center py-16 text-muted-foreground"><Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>No appointments found.</p></div>
                : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Patient</th>
                          <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Date & Time</th>
                          <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Symptoms</th>
                          <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Status</th>
                          <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointments.map((appt) => (
                          <tr key={appt._id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                            <td className="px-5 py-4">
                              <p className="font-semibold">{appt.patientName}</p>
                              <p className="text-muted-foreground text-xs">{appt.age && `${appt.age}y`} {appt.gender && `· ${appt.gender}`}</p>
                              <p className="text-muted-foreground text-xs">{appt.patientPhone}</p>
                            </td>
                            <td className="px-5 py-4">
                              <p className="font-medium">{appt.date}</p>
                              <p className="text-muted-foreground text-xs">{appt.time}</p>
                              {appt.nextVisitDate && <p className="text-xs text-blue-500 mt-0.5">Next: {appt.nextVisitDate}</p>}
                            </td>
                            <td className="px-5 py-4 max-w-[180px]">
                              <p className="text-xs text-muted-foreground truncate">{appt.symptoms || appt.notes || "—"}</p>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(appt.status)}`}>
                                {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                              </span>
                              {appt.prescriptionData && <span className="ml-1 text-xs text-emerald-600 font-medium">· Rx ✓</span>}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <select value={appt.status} onChange={(e) => updateAppointment(appt._id, { status: e.target.value })}
                                  className="px-2 py-1.5 rounded-lg border border-border bg-background text-xs font-medium">
                                  <option value="pending">Pending</option>
                                  <option value="confirmed">Confirmed</option>
                                  <option value="completed">Completed</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                                <button onClick={() => { setEditingAppt(appt); setPrescriptionFile(null); }}
                                  className="p-1.5 rounded-lg border border-border bg-background text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors" title="Manage">
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => navigate(`/admin/print/${appt._id}`)}
                                  className="p-1.5 rounded-lg border border-border bg-background text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Print Prescription">
                                  <Printer className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
          </motion.div>
        )}

        {/* ═══════════ CREATE APPOINTMENT TAB ═══════════ */}
        {activeTab === "create" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-background rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="text-lg font-bold font-heading">Create New Appointment</h3>
              <p className="text-muted-foreground text-sm mt-0.5">Manually add a patient appointment. A unique Patient ID will be auto-generated.</p>
            </div>
            <form onSubmit={handleCreateAppointment} className="p-5 space-y-5 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Patient Name *</label>
                  <Input required value={newAppt.patientName} onChange={(e) => setNewAppt({ ...newAppt, patientName: e.target.value })} placeholder="Full name" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Phone *</label>
                  <Input required value={newAppt.patientPhone} onChange={(e) => setNewAppt({ ...newAppt, patientPhone: e.target.value })} placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Email</label>
                  <Input type="email" value={newAppt.patientEmail} onChange={(e) => setNewAppt({ ...newAppt, patientEmail: e.target.value })} placeholder="patient@email.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Age *</label>
                  <Input required type="number" min="1" max="120" value={newAppt.age} onChange={(e) => setNewAppt({ ...newAppt, age: e.target.value })} placeholder="e.g. 35" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Gender *</label>
                  <select required value={newAppt.gender} onChange={(e) => setNewAppt({ ...newAppt, gender: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Service</label>
                  <select value={newAppt.service} onChange={(e) => setNewAppt({ ...newAppt, service: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
                    <option>General Consultation</option><option>Skin Treatment</option><option>Hair Treatment</option>
                    <option>Laser Therapy</option><option>Acne Treatment</option><option>Anti-Aging</option><option>Chemical Peel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Date *</label>
                  <input type="date" required value={newAppt.date} onChange={(e) => setNewAppt({ ...newAppt, date: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Time Slot *</label>
                  <select required value={newAppt.time} onChange={(e) => setNewAppt({ ...newAppt, time: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
                    {timeSlotOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Symptoms / Reason for Visit *</label>
                <Textarea required value={newAppt.symptoms} onChange={(e) => setNewAppt({ ...newAppt, symptoms: e.target.value })} rows={2} placeholder="Chief complaint or reason for visit..." className="resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Additional Notes</label>
                <Textarea value={newAppt.notes} onChange={(e) => setNewAppt({ ...newAppt, notes: e.target.value })} rows={2} placeholder="Optional internal notes..." className="resize-none" />
              </div>
              <Button type="submit" disabled={isCreating} className="gradient-rose text-white font-semibold px-8 py-5">
                <UserPlus className="w-4 h-4 mr-2" /> {isCreating ? "Creating..." : "Create Appointment"}
              </Button>
            </form>
          </motion.div>
        )}

        {/* ═══════════ PATIENT RECORDS TAB ═══════════ */}
        {activeTab === "patients" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Search Panel */}
            <div className="bg-background rounded-2xl shadow-sm border border-border overflow-hidden">
              <div className="p-5 border-b border-border">
                <h3 className="text-lg font-bold font-heading">Patient Records</h3>
                <p className="text-muted-foreground text-sm mt-0.5">Search and manage all registered patients.</p>
              </div>
              <div className="p-5">
                <div className="flex gap-3 mb-5">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text" value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && fetchPatients(patientSearch)}
                      placeholder="Search by name, Patient ID, or phone..."
                      className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <Button onClick={() => fetchPatients(patientSearch)} variant="outline" className="gap-2">
                    <Search className="w-4 h-4" /> Search
                  </Button>
                  <button onClick={() => { setPatientSearch(""); fetchPatients(""); }} className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground">Clear</button>
                </div>

                {patientsLoading ? <div className="flex items-center justify-center py-10"><div className="w-6 h-6 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
                  : patients.length === 0 ? <div className="text-center py-10 text-muted-foreground"><Users className="w-10 h-10 mx-auto mb-2 opacity-20" /><p>No patients found.</p></div>
                    : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border bg-muted/30">
                              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Patient ID</th>
                              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Name</th>
                              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Age / Gender</th>
                              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Contact</th>
                              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Next Visit</th>
                              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {patients.map((pt) => (
                              <tr key={pt._id} className={`border-b border-border/50 transition-colors cursor-pointer ${selectedPatient?._id === pt._id ? "bg-primary/5" : "hover:bg-muted/20"}`}
                                onClick={() => fetchPatientDetail(pt)}>
                                <td className="px-4 py-3"><span className="font-mono text-xs bg-muted px-2 py-1 rounded-md font-semibold">{pt.patientId}</span></td>
                                <td className="px-4 py-3 font-semibold">{pt.name}</td>
                                <td className="px-4 py-3 text-muted-foreground">{pt.age}y · {pt.gender}</td>
                                <td className="px-4 py-3 text-muted-foreground text-xs">{pt.phone}</td>
                                <td className="px-4 py-3">
                                  {pt.nextVisitDate
                                    ? <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-full">{pt.nextVisitDate}</span>
                                    : <span className="text-xs text-muted-foreground">—</span>}
                                </td>
                                <td className="px-4 py-3">
                                  <button className="text-xs text-primary hover:underline font-medium" onClick={(e) => { e.stopPropagation(); fetchPatientDetail(pt); }}>
                                    View Records
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
              </div>
            </div>

            {/* Patient Detail Panel */}
            <AnimatePresence>
              {selectedPatient && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="bg-background rounded-2xl shadow-sm border border-border overflow-hidden">
                  <div className="p-5 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{selectedPatient.name}</h3>
                        <p className="text-muted-foreground text-xs font-mono">{selectedPatient.patientId} · {selectedPatient.age}y · {selectedPatient.gender} · {selectedPatient.phone}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedPatient(null)} className="p-2 hover:bg-muted rounded-lg text-muted-foreground"><X className="w-4 h-4" /></button>
                  </div>

                  {/* Next Visit Scheduler */}
                  <div className="p-5 border-b border-border bg-blue-50/50">
                    <p className="text-sm font-semibold mb-3 flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-500" /> Schedule Next Visit</p>
                    <div className="flex gap-3 items-center">
                      <input type="date" value={nextVisitInput} onChange={(e) => setNextVisitInput(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-border bg-background text-sm" />
                      <Button onClick={saveNextVisit} disabled={savingNextVisit} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                        {savingNextVisit ? "Saving..." : "Save Date"}
                      </Button>
                      {selectedPatient.nextVisitDate && (
                        <span className="text-sm text-blue-600 font-medium">Current: {selectedPatient.nextVisitDate}</span>
                      )}
                    </div>
                  </div>

                  {/* Appointment History */}
                  <div className="p-5">
                    <h4 className="font-semibold mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Appointment History</h4>
                    {patientDetailLoading ? <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
                      : patientAppointments.length === 0 ? <p className="text-muted-foreground text-sm text-center py-6">No appointment history found.</p>
                        : (
                          <div className="space-y-4">
                            {patientAppointments.map((appt) => (
                              <div key={appt._id} className="rounded-xl border border-border p-4 hover:bg-muted/10 transition-colors">
                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                  <div>
                                    <p className="font-semibold">{appt.date} at {appt.time}</p>
                                    <p className="text-sm text-muted-foreground mt-0.5">{appt.service}</p>
                                    {appt.symptoms && <p className="text-xs text-muted-foreground mt-1 italic">"{appt.symptoms}"</p>}
                                    {appt.nextVisitDate && <p className="text-xs text-blue-600 mt-1">Next Visit: {appt.nextVisitDate}</p>}
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(appt.status)}`}>
                                      {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                                    </span>
                                    <button onClick={() => navigate(`/admin/print/${appt._id}`)}
                                      className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 transition-colors" title="Print Prescription Sheet">
                                      <Printer className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                                {/* Prescription */}
                                {appt.prescriptionData ? (
                                  <div className="mt-3 pt-3 border-t border-border">
                                    <p className="text-xs font-semibold text-emerald-600 mb-2 flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" /> Prescription Uploaded</p>
                                    <div className="flex items-center gap-2">
                                      <img src={appt.prescriptionData} alt="Prescription" className="w-24 h-24 object-cover rounded-lg border border-border cursor-pointer" onClick={() => window.open(appt.prescriptionData, "_blank")} />
                                      <a href={appt.prescriptionData} download={`prescription-${appt._id}.jpg`}
                                        className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium">
                                        <Download className="w-3.5 h-3.5" /> Download
                                      </a>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-3 pt-3 border-t border-border">
                                    <p className="text-xs text-muted-foreground mb-2">No prescription uploaded yet.</p>
                                    <label className="flex items-center gap-2 text-xs cursor-pointer text-primary hover:underline font-medium w-fit">
                                      <Upload className="w-3.5 h-3.5" /> Upload Prescription Photo
                                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        if (file.size > 5 * 1024 * 1024) { toast.error("File must be under 5MB"); return; }
                                        const reader = new FileReader();
                                        reader.onload = async (ev) => {
                                          const base64 = ev.target?.result as string;
                                          const res = await fetch(`/api/appointments/${appt._id}`, {
                                            method: "PUT", headers: headers(), credentials: "include",
                                            body: JSON.stringify({ prescriptionData: base64 }),
                                          });
                                          if (res.ok) { toast.success("Prescription uploaded!"); fetchPatientDetail(selectedPatient); }
                                          else toast.error("Upload failed");
                                        };
                                        reader.readAsDataURL(file);
                                      }} />
                                    </label>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* ═══════════ MANAGE APPOINTMENT MODAL ═══════════ */}
      <AnimatePresence>
        {editingAppt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-background border border-border rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/30">
                <div>
                  <h3 className="text-xl font-heading font-bold">Manage Appointment</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{editingAppt.patientName} · {editingAppt.date} at {editingAppt.time}</p>
                </div>
                <button onClick={() => setEditingAppt(null)} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5">
                <form id="edit-appt-form" onSubmit={handleEditSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Date</label>
                      <input type="date" required value={editingAppt.date} onChange={(e) => setEditingAppt({ ...editingAppt, date: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Time Slot</label>
                      <select required value={editingAppt.time} onChange={(e) => setEditingAppt({ ...editingAppt, time: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
                        {timeSlotOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Status</label>
                      <select value={editingAppt.status} onChange={(e) => setEditingAppt({ ...editingAppt, status: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">Next Visit Date</label>
                      <input type="date" value={editingAppt.nextVisitDate || ""} onChange={(e) => setEditingAppt({ ...editingAppt, nextVisitDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
                    </div>
                  </div>
                </form>

                {/* Prescription Upload */}
                <div className="border-t border-border pt-5">
                  <p className="text-sm font-semibold mb-3 flex items-center gap-2"><ImageIcon className="w-4 h-4 text-primary" /> Prescription Photo</p>
                  {editingAppt.prescriptionData ? (
                    <div className="space-y-2">
                      <img src={editingAppt.prescriptionData} alt="Prescription" className="w-full max-h-48 object-contain rounded-xl border border-border bg-muted/20" />
                      <p className="text-xs text-emerald-600 font-medium text-center">Prescription uploaded ✓</p>
                      <button onClick={() => {
                        if (fileInputRef.current) fileInputRef.current.click();
                      }} className="w-full text-xs text-muted-foreground hover:text-primary border border-dashed border-border rounded-lg py-2 transition-colors">
                        Replace Photo
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-border rounded-xl py-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all">
                      <Upload className="w-6 h-6" />
                      <p className="text-sm font-medium">Click to upload prescription photo</p>
                      <p className="text-xs">JPG, PNG up to 5MB</p>
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  {prescriptionFile && !editingAppt.prescriptionData && (
                    <div className="mt-3 space-y-2">
                      <img src={prescriptionFile} alt="Preview" className="w-full max-h-36 object-contain rounded-xl border border-border bg-muted/20" />
                      <Button onClick={uploadPrescription} disabled={isUploading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                        <Upload className="w-4 h-4 mr-2" /> {isUploading ? "Uploading..." : "Save Prescription"}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => navigate(`/admin/print/${editingAppt._id}`)}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary border border-border rounded-lg px-3 py-2 transition-colors">
                    <Printer className="w-4 h-4" /> Print Sheet
                  </button>
                </div>
              </div>

              <div className="px-6 py-4 border-t bg-muted/10 flex items-center justify-end gap-3">
                <Button variant="outline" onClick={() => setEditingAppt(null)}>Cancel</Button>
                <Button type="submit" form="edit-appt-form" disabled={editApptLoading} className="bg-primary text-white">
                  {editApptLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
