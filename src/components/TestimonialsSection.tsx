import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Ananya R.",
    treatment: "Skin Rejuvenation",
    text: "The results were beyond my expectations! My skin looks 10 years younger. The team at Radiance made me feel comfortable throughout the entire process.",
    rating: 5,
  },
  {
    name: "Vikram S.",
    treatment: "Hair Transplant",
    text: "After years of hair loss, Dr. Mehta's hair transplant procedure gave me back my confidence. The results are incredibly natural looking.",
    rating: 5,
  },
  {
    name: "Meera K.",
    treatment: "Laser Treatment",
    text: "I had terrible acne scars and was skeptical about laser treatments. But the team here was professional and the results speak for themselves!",
    rating: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-14">
          <span className="section-label">Testimonials</span>
          <h2 className="section-heading mt-3">Patient Stories</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="bg-card rounded-xl p-6 border border-border relative"
            >
              <Quote className="w-8 h-8 text-primary/20 absolute top-4 right-4" />
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="font-body text-muted-foreground text-sm leading-relaxed mb-4">
                "{t.text}"
              </p>
              <div>
                <p className="font-body font-semibold text-foreground">{t.name}</p>
                <p className="text-xs font-body text-primary">{t.treatment}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
