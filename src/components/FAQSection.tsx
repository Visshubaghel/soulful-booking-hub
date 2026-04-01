import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Can a dermatologist help with wrinkles and scars?",
    a: "Yes, we have specialized dermatological treatments such as hyaluronic fillers, micro-needling, and laser resurfacing to reduce wrinkles, scars, and restore your skin's clarity and confidence.",
  },
  {
    q: "Is laser hair removal effective?",
    a: "Laser hair treatments are an effective, painless procedure that delays hair growth for a long period. While it may not stop growth permanently, it removes unwanted hairs effectively. Maintenance sessions help manage regrowth.",
  },
  {
    q: "Are anti-ageing treatments cost-effective?",
    a: "Yes, our anti-ageing treatments like V Carbon Peel and HIFU are highly cost-effective. Many clients see instant results in reducing major signs of ageing.",
  },
  {
    q: "What are the best hair loss treatments?",
    a: "Non-surgical hair replacement, QR 678 Neo hair growth, Hairgen Booster, and Hair Transplant are our most successful treatments for hair loss with proven results.",
  },
];

const FAQSection = () => {
  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-14">
          <span className="section-label">FAQ</span>
          <h2 className="section-heading mt-3">Frequently Asked Questions</h2>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <AccordionItem value={`faq-${i}`} className="bg-card rounded-xl border border-border px-6">
                <AccordionTrigger className="font-heading text-left font-semibold text-foreground hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="font-body text-muted-foreground leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
