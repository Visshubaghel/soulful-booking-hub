import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import { motion } from "framer-motion";
import {
  Calendar,
  Users,
  LogOut,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Shield,
  UserPlus,
  Edit,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// ───────────────────────── Types ─────────────────────────
interface SlotData {
  _id?: string;
  date: string;
  time: string;
  isBlocked: boolean;
  maxPatients: number;
  currentBookings: number;
}

interface AppointmentData {
  _id: string;
  patientName: string;
  patientEmail: string;
  patientPhone?: string;
  date: string;
  time: string;
  service: string;
  notes?: string;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
}

interface StatsData {
  totalAppointments: number;
  todayAppointments: number;
  totalUsers: number;
  availableSlotsToday: number;
  blockedSlotsToday: number;
}

// ───────────────────────── Helpers ─────────────────────────
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

// All 30-min time slots from 10:30 AM to 7:00 PM
const timeSlotOptions: string[] = (() => {
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
})();

// ───────────────────────── Component ─────────────────────────
const AdminDashboard = () => {
  const { user, logout, getAuthHeaders } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState<"slots" | "appointments" | "create">("slots");

  // Slot management
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Appointments
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Stats
  const [stats, setStats] = useState<StatsData | null>(null);

  // Create appointment form
  const [newAppt, setNewAppt] = useState({
    patientName: "",
    patientEmail: "",
    patientPhone: "",
    date: getToday(),
    time: "10:30 AM",
    service: "General Consultation",
    notes: "",
  });

  // Loading for individual slot toggles
  const [togglingSlot, setTogglingSlot] = useState<string | null>(null);

  // Edit Appointment Modal
  const [editingAppt, setEditingAppt] = useState<AppointmentData | null>(null);
  const [editApptLoading, setEditApptLoading] = useState(false);

  // ─── Auth guard ───
  useEffect(() => {
    if (!user || user.role !== "admin") {
      window.location.href = "/login";
    }
  }, [user]);

  // ─── Fetch helpers ───
  const headers = useCallback(
    () => ({
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    }),
    [getAuthHeaders]
  );

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats", {
        headers: headers(),
        credentials: "include",
      });
      if (res.ok) {
        setStats(await res.json());
      }
    } catch {
      /* silent */
    }
  }, [headers]);

  const fetchSlots = useCallback(
    async (date: string) => {
      setSlotsLoading(true);
      try {
        const res = await fetch(`/api/admin/slots?date=${date}`, {
          headers: headers(),
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setSlots(data.slots || []);
        } else {
          toast.error("Failed to load slots");
        }
      } catch {
        toast.error("Network error loading slots");
      } finally {
        setSlotsLoading(false);
      }
    },
    [headers]
  );

  const fetchAppointments = useCallback(async () => {
    setAppointmentsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterDate) params.set("date", filterDate);
      if (filterStatus) params.set("status", filterStatus);
      const res = await fetch(`/api/admin/appointments?${params}`, {
        headers: headers(),
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments || []);
      }
    } catch {
      toast.error("Failed to load appointments");
    } finally {
      setAppointmentsLoading(false);
    }
  }, [headers, filterDate, filterStatus]);

  // ─── Initial load ───
  useEffect(() => {
    if (user?.role === "admin") {
      fetchStats();
      fetchSlots(selectedDate);
    }
  }, [user, selectedDate, fetchStats, fetchSlots]);

  useEffect(() => {
    if (user?.role === "admin" && activeTab === "appointments") {
      fetchAppointments();
    }
  }, [user, activeTab, fetchAppointments]);

  // ─── Slot toggle ───
  const toggleSlot = async (slot: SlotData) => {
    const key = `${slot.date}-${slot.time}`;
    setTogglingSlot(key);
    try {
      const res = await fetch("/api/admin/slots", {
        method: "POST",
        headers: headers(),
        credentials: "include",
        body: JSON.stringify({
          date: slot.date,
          time: slot.time,
          isBlocked: !slot.isBlocked,
          maxPatients: slot.maxPatients,
        }),
      });
      if (res.ok) {
        toast.success(`${slot.time} ${slot.isBlocked ? "unblocked" : "blocked"}`);
        fetchSlots(selectedDate);
        fetchStats();
      } else {
        toast.error("Failed to update slot");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setTogglingSlot(null);
    }
  };

  // ─── Update appointment status or reschedule ───
  const updateAppointment = async (id: string, updates: any) => {
    try {
      const res = await fetch("/api/admin/appointments", {
        method: "PATCH",
        headers: headers(),
        credentials: "include",
        body: JSON.stringify({ id, ...updates }),
      });
      if (res.ok) {
        toast.success(`Appointment updated successfully`);
        fetchAppointments();
        fetchStats();
      } else {
        toast.error("Failed to update appointment");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppt) return;
    setEditApptLoading(true);
    await updateAppointment(editingAppt._id, {
      status: editingAppt.status,
      date: editingAppt.date,
      time: editingAppt.time
    });
    setEditApptLoading(false);
    setEditingAppt(null); // close modal
  };

  // ─── Create appointment ───
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/appointments", {
        method: "POST",
        headers: headers(),
        credentials: "include",
        body: JSON.stringify(newAppt),
      });
      if (res.ok) {
        toast.success("Appointment created!");
        setNewAppt({
          patientName: "",
          patientEmail: "",
          patientPhone: "",
          date: getToday(),
          time: "10:30 AM",
          service: "General Consultation",
          notes: "",
        });
        fetchStats();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to create appointment");
      }
    } catch {
      toast.error("Network error");
    }
  };

  if (!user || user.role !== "admin")
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );

  // ─── Slot card color ───
  const getSlotStyle = (slot: SlotData) => {
    if (slot.isBlocked)
      return "border-red-500/30 bg-red-500/5 ring-1 ring-red-500/20";
    if (slot.currentBookings >= slot.maxPatients)
      return "border-amber-500/30 bg-amber-500/5 ring-1 ring-amber-500/20";
    return "border-emerald-500/30 bg-emerald-500/5 ring-1 ring-emerald-500/20";
  };

  const getSlotIcon = (slot: SlotData) => {
    if (slot.isBlocked) return <XCircle className="w-4 h-4 text-red-500" />;
    if (slot.currentBookings >= slot.maxPatients)
      return <AlertCircle className="w-4 h-4 text-amber-500" />;
    return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    }
  };

  // Time slot options for the create form
  const timeSlotOptions: string[] = [];
  for (let m = 10 * 60 + 30; m < 19 * 60; m += 30) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    const suffix = h >= 12 ? "PM" : "AM";
    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
    timeSlotOptions.push(`${displayH}:${min.toString().padStart(2, "0")} ${suffix}`);
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-20 pt-24">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* ═══════════ Header ═══════════ */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-background p-6 rounded-2xl shadow-sm border border-border mb-6 gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Welcome, {user.name} · {formatDateDisplay(getToday())}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              window.location.href = "/";
            }}
            className="flex items-center gap-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all px-4 py-2 rounded-lg font-medium text-sm"
          >
            <LogOut size={16} /> Logout
          </button>
        </motion.div>

        {/* ═══════════ Stats Cards ═══════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Total Appointments",
              value: stats?.totalAppointments ?? "—",
              icon: <Calendar className="w-5 h-5" />,
              color: "text-primary bg-primary/10",
            },
            {
              label: "Today's Bookings",
              value: stats?.todayAppointments ?? "—",
              icon: <Clock className="w-5 h-5" />,
              color: "text-blue-500 bg-blue-500/10",
            },
            {
              label: "Available Slots Today",
              value: stats?.availableSlotsToday ?? "—",
              icon: <CheckCircle2 className="w-5 h-5" />,
              color: "text-emerald-500 bg-emerald-500/10",
            },
            {
              label: "Registered Users",
              value: stats?.totalUsers ?? "—",
              icon: <Users className="w-5 h-5" />,
              color: "text-violet-500 bg-violet-500/10",
            },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-background p-5 rounded-2xl shadow-sm border border-border"
            >
              <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-3`}>
                {card.icon}
              </div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{card.label}</p>
              <h2 className="text-2xl font-bold font-heading mt-1">{card.value}</h2>
            </motion.div>
          ))}
        </div>

        {/* ═══════════ Tab Navigation ═══════════ */}
        <div className="flex gap-1 bg-background p-1.5 rounded-xl border border-border mb-6 w-fit">
          {[
            { key: "slots" as const, label: "Slot Management", icon: <Clock className="w-4 h-4" /> },
            { key: "appointments" as const, label: "Appointments", icon: <Calendar className="w-4 h-4" /> },
            { key: "create" as const, label: "Create Booking", icon: <UserPlus className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ═══════════ SLOT MANAGEMENT TAB ═══════════ */}
        {activeTab === "slots" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-background rounded-2xl shadow-sm border border-border overflow-hidden"
          >
            {/* Date picker bar */}
            <div className="p-5 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold font-heading">Manage Time Slots</h3>
                <p className="text-muted-foreground text-sm mt-0.5">
                  Block or unblock slots. Blocked slots won't appear for patients.
                </p>
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
                  onClick={() => {
                    fetchSlots(selectedDate);
                    fetchStats();
                  }}
                  className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${slotsLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Date label */}
            <div className="px-5 py-3 bg-muted/30 border-b border-border">
              <p className="text-sm font-semibold">{formatDateDisplay(selectedDate)}</p>
            </div>

            {/* Slots grid */}
            <div className="p-5">
              {slotsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No slots data for this date.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {slots.map((slot) => {
                    const key = `${slot.date}-${slot.time}`;
                    const isToggling = togglingSlot === key;
                    return (
                      <div
                        key={key}
                        className={`rounded-xl border p-4 transition-all ${getSlotStyle(slot)}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {getSlotIcon(slot)}
                            <span className="font-semibold text-sm">{slot.time}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {slot.currentBookings}/{slot.maxPatients}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">
                            {slot.isBlocked
                              ? "Blocked"
                              : slot.currentBookings >= slot.maxPatients
                              ? "Fully Booked"
                              : "Available"}
                          </span>

                          {/* Toggle button */}
                          <button
                            onClick={() => toggleSlot(slot)}
                            disabled={isToggling}
                            className={`relative w-11 h-6 rounded-full transition-colors ${
                              slot.isBlocked ? "bg-red-500" : "bg-emerald-500"
                            } ${isToggling ? "opacity-50" : ""}`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                slot.isBlocked ? "translate-x-0" : "translate-x-5"
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="px-5 py-3 bg-muted/30 border-t border-border flex flex-wrap gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500" /> Available
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500" /> Blocked
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500" /> Fully Booked
              </span>
            </div>
          </motion.div>
        )}

        {/* ═══════════ APPOINTMENTS TAB ═══════════ */}
        {activeTab === "appointments" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-background rounded-2xl shadow-sm border border-border overflow-hidden"
          >
            {/* Filter bar */}
            <div className="p-5 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold font-heading">All Appointments</h3>
                <p className="text-muted-foreground text-sm mt-0.5">
                  {appointments.length} appointment{appointments.length !== 1 ? "s" : ""} found
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  placeholder="Filter by date"
                  className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  onClick={() => {
                    setFilterDate("");
                    setFilterStatus("");
                  }}
                  className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
                <button
                  onClick={fetchAppointments}
                  className="w-9 h-9 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${appointmentsLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Table */}
            {appointmentsLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No appointments found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Patient</th>
                      <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Date & Time</th>
                      <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Service</th>
                      <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Status</th>
                      <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appt) => (
                      <tr key={appt._id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-semibold">{appt.patientName}</p>
                            <p className="text-muted-foreground text-xs">{appt.patientEmail}</p>
                            {appt.patientPhone && (
                              <p className="text-muted-foreground text-xs">{appt.patientPhone}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium">{appt.date}</p>
                          <p className="text-muted-foreground text-xs">{appt.time}</p>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">{appt.service}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(
                              appt.status
                            )}`}
                          >
                            {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <select
                              value={appt.status}
                              onChange={(e) => updateAppointment(appt._id, { status: e.target.value })}
                              className="px-2 py-1.5 rounded-lg border border-border bg-background text-xs font-medium"
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            <button
                              onClick={() => setEditingAppt(appt)}
                              className="p-1.5 rounded-lg border border-border bg-background text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                              title="Edit Appointment"
                            >
                              <Edit className="w-4 h-4" />
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
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-background rounded-2xl shadow-sm border border-border overflow-hidden"
          >
            <div className="p-5 border-b border-border">
              <h3 className="text-lg font-bold font-heading">Create New Appointment</h3>
              <p className="text-muted-foreground text-sm mt-0.5">Manually add a patient appointment</p>
            </div>

            <form onSubmit={handleCreateAppointment} className="p-5 space-y-5 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Patient Name *</label>
                  <Input
                    required
                    value={newAppt.patientName}
                    onChange={(e) => setNewAppt({ ...newAppt, patientName: e.target.value })}
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Email *</label>
                  <Input
                    required
                    type="email"
                    value={newAppt.patientEmail}
                    onChange={(e) => setNewAppt({ ...newAppt, patientEmail: e.target.value })}
                    placeholder="patient@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Phone</label>
                  <Input
                    value={newAppt.patientPhone}
                    onChange={(e) => setNewAppt({ ...newAppt, patientPhone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Service</label>
                  <select
                    value={newAppt.service}
                    onChange={(e) => setNewAppt({ ...newAppt, service: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  >
                    <option>General Consultation</option>
                    <option>Skin Treatment</option>
                    <option>Hair Treatment</option>
                    <option>Laser Therapy</option>
                    <option>Acne Treatment</option>
                    <option>Anti-Aging</option>
                    <option>Chemical Peel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Date *</label>
                  <input
                    type="date"
                    required
                    value={newAppt.date}
                    onChange={(e) => setNewAppt({ ...newAppt, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Time Slot *</label>
                  <select
                    required
                    value={newAppt.time}
                    onChange={(e) => setNewAppt({ ...newAppt, time: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  >
                    {timeSlotOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Notes</label>
                <textarea
                  value={newAppt.notes}
                  onChange={(e) => setNewAppt({ ...newAppt, notes: e.target.value })}
                  rows={3}
                  placeholder="Optional notes..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none"
                />
              </div>

              <Button type="submit" className="gradient-rose text-white font-semibold px-8 py-5">
                <UserPlus className="w-4 h-4 mr-2" /> Create Appointment
              </Button>
            </form>
          </motion.div>
        )}
      </div>

      {/* ═══════════ EDIT APPOINTMENT MODAL ═══════════ */}
      {editingAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-background border border-border rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col"
          >
            <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/30">
              <h3 className="text-xl font-heading font-bold">Reschedule</h3>
              <button 
                onClick={() => setEditingAppt(null)}
                className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form id="edit-appt-form" onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Patient</label>
                  <p className="px-3 py-2 bg-muted/50 rounded-lg text-sm border border-border opacity-50">
                    {editingAppt.patientName}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Date</label>
                  <input
                    type="date"
                    required
                    value={editingAppt.date}
                    onChange={(e) => setEditingAppt({ ...editingAppt, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Time Slot</label>
                  <select
                    required
                    value={editingAppt.time}
                    onChange={(e) => setEditingAppt({ ...editingAppt, time: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  >
                    {timeSlotOptions.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Status</label>
                  <select
                    value={editingAppt.status}
                    onChange={(e) => setEditingAppt({ ...editingAppt, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </form>
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
    </div>
  );
};

export default AdminDashboard;
