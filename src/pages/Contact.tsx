import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    concern: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: import.meta.env.VITE_WEB3FORMS_ACCESS_KEY || "YOUR_WEB3FORMS_ACCESS_KEY_HERE",
          subject: `New Appointment Enquiry from ${formData.name}`,
          from_name: "Soulful Booking Hub",
          ...formData,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("Thank you! We'll get back to you shortly.");
        setFormData({ name: "", email: "", phone: "", concern: "", message: "" });
      } else {
        toast.error(result.message || "Something went wrong. Please try again.");
      }
    } catch (error) {
      toast.error("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-20">
        <section className="section-padding gradient-rose-subtle">
          <div className="container mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
              <span className="section-label">Contact Us</span>
              <h1 className="section-heading mt-3 mb-6">Get In Touch</h1>
              <p className="section-subheading mx-auto">
                Book a consultation or reach out with any questions. We're here to help.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="section-padding bg-background">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Info */}
              <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <h2 className="text-2xl font-heading font-bold text-foreground mb-8">Contact Information</h2>
                <div className="space-y-6">
                  {[
                    { icon: MapPin, label: "Address", value: "123 Skin Care Road, New Delhi, India - 110001" },
                    { icon: Phone, label: "Phone", value: "+91 123 456 7890" },
                    { icon: Mail, label: "Email", value: "info@radianceclinic.com" },
                    { icon: Clock, label: "Hours", value: "Monday - Saturday, 10:30 AM - 7:00 PM" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl gradient-rose-subtle flex items-center justify-center shrink-0">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-body font-semibold text-foreground">{item.label}</p>
                        <p className="font-body text-muted-foreground text-sm">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Map placeholder */}
                <div className="mt-8 rounded-xl overflow-hidden border border-border h-64 bg-muted flex items-center justify-center">
                  <p className="font-body text-muted-foreground">Map will be embedded here</p>
                </div>
              </motion.div>

              {/* Contact Form */}
              <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <h2 className="text-2xl font-heading font-bold text-foreground mb-8">Book Your Consultation</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-body font-medium text-foreground mb-1.5 block">Full Name</label>
                      <Input
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Your name"
                        className="font-body"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-body font-medium text-foreground mb-1.5 block">Phone Number</label>
                      <Input
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 XXXXX XXXXX"
                        className="font-body"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-body font-medium text-foreground mb-1.5 block">Email Address</label>
                    <Input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your@email.com"
                      className="font-body"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-body font-medium text-foreground mb-1.5 block">Concern</label>
                    <select
                      value={formData.concern}
                      onChange={(e) => setFormData({ ...formData, concern: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-body ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Select your concern</option>
                      <option value="skin">Skin Care</option>
                      <option value="hair">Hair Care</option>
                      <option value="body">Body Care</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-body font-medium text-foreground mb-1.5 block">Message</label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell us about your concerns..."
                      rows={4}
                      className="font-body"
                    />
                  </div>
                  <Button type="submit" size="lg" disabled={isSubmitting} className="w-full gradient-rose text-primary-foreground font-body font-semibold py-6">
                    <Send className="w-4 h-4 mr-2" />
                    {isSubmitting ? "Submitting..." : "Submit Enquiry"}
                  </Button>
                </form>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Contact;
