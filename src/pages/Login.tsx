import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion } from "framer-motion";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const payload = isLogin ? { email, password } : { name, email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      toast.success(data.message);
      
      // Store user strictly locally for UI toggles, Vercel HttpOnly cookie holds real safety
      localStorage.setItem("userMeta", JSON.stringify(data.user));
      setUser(data.user);

      if (data.user.role === 'admin') {
        window.location.href = "/admin";
      } else {
        window.location.href = "/";
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to authenticate");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 pt-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 bg-background border border-border rounded-2xl shadow-xl"
      >
        <h2 className="text-2xl font-bold font-heading mb-6 text-center">
          {isLogin ? "Welcome Back" : "Create an Account"}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <Input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          
          <Button type="submit" disabled={isLoading} className="w-full gradient-rose py-6 text-white font-semibold">
            {isLoading ? "Please wait..." : (isLogin ? "Sign In" : "Sign Up")}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-semibold hover:underline">
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
