import { motion } from "framer-motion";
import { Sparkles, Scissors, Dumbbell, Syringe, Zap } from "lucide-react";

const services = [
  {
    icon: Sparkles,
    title: "Cosmetic Dermatology",
    description: "Aesthetic treatments for ageing and skin rejuvenation",
  },
  {
    icon: Syringe,
    title: "Aesthetic Procedures",
    description: "Non-invasive anti-ageing and skin rejuvenation procedures",
  },
  {
    icon: Scissors,
    title: "Hair Restoration",
    description: "Rejuvenating hair growth and health with advanced techniques",
  },
  {
    icon: Dumbbell,
    title: "Body Sculpting",
    description: "Targeting excess fat and body toning treatments",
  },
  {
    icon: Zap,
    title: "Laser Treatments",
    description: "Advanced laser technology for skin and hair concerns",
  },
];

const ServicesSection = () => {
  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-14">
          <span className="section-label">Our Expertise</span>
          <h2 className="section-heading mt-3">Comprehensive Skin & Hair Care</h2>
          <p className="section-subheading mx-auto mt-4">
            From rejuvenating skincare routines to advanced hair restoration, we're dedicated to helping you look and feel your best.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="group bg-card rounded-xl p-6 text-center border border-border hover:shadow-xl hover:border-primary/30 transition-all duration-300"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-full gradient-rose-subtle flex items-center justify-center group-hover:scale-110 transition-transform">
                <service.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-foreground mb-2">{service.title}</h3>
              <p className="text-sm font-body text-muted-foreground">{service.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
