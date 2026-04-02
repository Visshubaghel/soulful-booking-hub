import { motion } from "framer-motion";
import { Users, Heart, Shield, Building2 } from "lucide-react";
import clinicImage from "@/assets/clinic-interior.jpg";

const highlights = [
  { icon: Users, label: "Expert Team" },
  { icon: Heart, label: "Personal Attention" },
  { icon: Shield, label: "Safety & Technology" },
  { icon: Building2, label: "World Class Infrastructure" },
];

const AboutSection = () => {
  return (
    <section className="section-padding gradient-rose-subtle">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="section-label">About Us</span>
            <h2 className="section-heading mt-3 mb-6">Vishwas Skin Clinic</h2>
            <p className="font-body text-muted-foreground leading-relaxed mb-4">
              Vishwas Skin Clinic combines advanced technology with highly renowned doctors performing dermatological treatments for all concerns proficiently. We have cutting-edge techniques for laser and all aesthetic treatments.
            </p>
            <p className="font-body text-muted-foreground leading-relaxed mb-8">
              Our team of internationally trained doctors have remarkable skills and experience, allowing them to deal with various skin and hair types. We aim to give you flawless, beautiful-looking skin, hair, and a shaped body.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {highlights.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm font-body font-medium text-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <img
              src={clinicImage}
              alt="Vishwas Skin Clinic Interior"
              className="rounded-2xl shadow-2xl w-full object-cover"
              loading="lazy"
              width={1200}
              height={800}
            />
            <div className="absolute -bottom-6 -left-6 bg-card rounded-xl p-5 shadow-xl border border-border">
              <div className="text-3xl font-heading font-bold text-primary">15+</div>
              <div className="text-sm font-body text-muted-foreground">Years of Excellence</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
