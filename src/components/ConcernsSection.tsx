import { motion } from "framer-motion";

const conditions = [
  "Acne & Acne Scars",
  "Dark Circles & Eye Bags",
  "Stretch Marks & Scars",
  "Pigmentation & Dark Spots",
  "Hair Loss & Alopecia",
  "Dry & Dull Skin",
  "Ageing, Wrinkles & Fine Lines",
];

const ConcernsSection = () => {
  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-14">
          <span className="section-label">Concerns</span>
          <h2 className="section-heading mt-3">Conditions We Treat</h2>
          <p className="section-subheading mx-auto mt-4">
            Discover the perfect treatment for your unique skin type. From acne to ageing, we offer tailored solutions for all your concerns.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          {conditions.map((c, i) => (
            <motion.div
              key={c}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="px-6 py-3 rounded-full bg-card border border-border font-body text-sm font-medium text-foreground hover:border-primary hover:text-primary hover:bg-rose-gold-light transition-colors cursor-pointer"
            >
              {c}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ConcernsSection;
