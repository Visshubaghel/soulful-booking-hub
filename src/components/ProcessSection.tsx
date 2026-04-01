import { motion } from "framer-motion";
import { Search, ClipboardList, Stethoscope } from "lucide-react";

const steps = [
  {
    icon: Search,
    step: "01",
    title: "Analysis",
    description: "Our doctors meticulously analyze your skin or body using advanced dermoscopy devices to diagnose underlying problems.",
  },
  {
    icon: ClipboardList,
    step: "02",
    title: "Our Process",
    description: "We educate you about the techniques, procedures, and estimated cost of treatment transparently.",
  },
  {
    icon: Stethoscope,
    step: "03",
    title: "Transformation",
    description: "Our skillful, highly qualified doctors work on you with precision. Your true beauty unlocks and confidence returns.",
  },
];

const ProcessSection = () => {
  return (
    <section className="section-padding bg-charcoal text-primary-foreground">
      <div className="container mx-auto">
        <div className="text-center mb-14">
          <span className="section-label text-primary">Our Process</span>
          <h2 className="section-heading text-primary-foreground mt-3">How We Work</h2>
          <p className="section-subheading mx-auto mt-4 text-primary-foreground/70">
            We believe every client is unique, so we perform proper case studies to ensure personalized treatment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-primary/40 flex items-center justify-center">
                <item.icon className="w-8 h-8 text-primary" />
              </div>
              <div className="text-4xl font-heading font-bold text-primary/30 mb-2">{item.step}</div>
              <h3 className="text-xl font-heading font-semibold text-primary-foreground mb-3">{item.title}</h3>
              <p className="text-sm font-body text-primary-foreground/70">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
