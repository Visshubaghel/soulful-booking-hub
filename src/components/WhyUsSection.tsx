import { motion } from "framer-motion";
import { Award, Cpu, UserCheck, IndianRupee } from "lucide-react";

const reasons = [
  {
    icon: Award,
    title: "Expertise",
    description: "Backed by highly skilled and experienced dermatologists with international training.",
  },
  {
    icon: Cpu,
    title: "Advanced Technology",
    description: "Cutting-edge diagnostic tools and modern solutions for all skin and body concerns.",
  },
  {
    icon: UserCheck,
    title: "Personalized Care",
    description: "Tailored treatment plans designed for your unique skin type and individual needs.",
  },
  {
    icon: IndianRupee,
    title: "Cost Effective",
    description: "Premium treatments at accessible prices without compromising on quality or results.",
  },
];

const WhyUsSection = () => {
  return (
    <section className="section-padding gradient-rose-subtle">
      <div className="container mx-auto">
        <div className="text-center mb-14">
          <span className="section-label">Why Us</span>
          <h2 className="section-heading mt-3">Why Choose Radiance Clinic?</h2>
          <p className="section-subheading mx-auto mt-4">
            The most advanced and highly renowned dermatological clinic with a focus on results and patient satisfaction.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="bg-card rounded-xl p-6 border border-border text-center hover:shadow-lg transition-shadow"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <item.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-lg text-foreground mb-2">{item.title}</h3>
              <p className="text-sm font-body text-muted-foreground">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyUsSection;
