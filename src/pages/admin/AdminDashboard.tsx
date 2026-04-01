import { useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { motion } from "framer-motion";
import { Users, Calendar, LogOut } from "lucide-react";

const AdminDashboard = () => {
  const { user, logout } = useAuth();

  useEffect(() => {
    // If a user gets here without being an admin, kick them out
    if (!user || user.role !== "admin") {
      window.location.href = "/";
    }
  }, [user]);

  if (!user || user.role !== "admin") return <div className="min-h-screen">Loading...</div>;

  return (
    <div className="min-h-screen bg-muted/20 pb-20 pt-28">
      <div className="container mx-auto px-4">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-background p-6 rounded-2xl shadow-sm border border-border mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1 text-sm">Welcome back, {user.name} ({user.email})</p>
          </div>
          <button 
            onClick={() => { logout(); window.location.href="/"; }}
            className="flex items-center gap-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-colors px-4 py-2 rounded-lg font-medium text-sm"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-background p-6 rounded-2xl shadow-sm border border-border flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Total Appointments</p>
              <h2 className="text-3xl font-bold font-heading">0</h2>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-background p-6 rounded-2xl shadow-sm border border-border flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Registered Patients</p>
              <h2 className="text-3xl font-bold font-heading">0</h2>
            </div>
          </motion.div>
        </div>

        {/* Table placeholder */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-background rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="text-xl font-bold font-heading">Upcoming Appointments</h3>
          </div>
          <div className="p-12 text-center text-muted-foreground">
            <Calendar size={48} className="mx-auto mb-4 opacity-20" />
            <p>No appointments built yet.</p>
            <p className="text-sm mt-2 opacity-70">Next phase will hook this up to the MongoDB database.</p>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default AdminDashboard;
