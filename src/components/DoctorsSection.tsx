import { motion } from "framer-motion";
import doctor1 from "@/assets/doctor-1.jpg";
import doctor2 from "@/assets/doctor-2.jpg";

const doctors = [
  {
    name: "Dr. Priya Sharma",
    title: "Facial Aesthetic Specialist",
    bio: "An eminent facial aesthetic specialist with international fellowship and 18+ years of expertise in dermatology treatments including body shaping, laser toning, fillers, and more.",
    image: doctor1,
    experience: "18+",
  },
  {
    name: "Dr. Arjun Mehta",
    title: "MBBS & MD (Dermatology)",
    bio: "A renowned specialist in dermatology with expertise in modern techniques, laser treatments, clinical dermatology, chemical peels, and dermato-surgeries.",
    image: doctor2,
    experience: "12+",
  },
];

const DoctorsSection = () => {
  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-14">
          <span className="section-label">Doctors</span>
          <h2 className="section-heading mt-3">Meet Our Dermatologists</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {doctors.map((doc, i) => (
            <motion.div
              key={doc.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="bg-card rounded-2xl overflow-hidden border border-border hover:shadow-xl transition-shadow group"
            >
              <div className="relative overflow-hidden">
                <img
                  src={doc.image}
                  alt={doc.name}
                  className="w-full h-80 object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  width={600}
                  height={800}
                />
                <div className="absolute bottom-4 right-4 bg-primary text-primary-foreground rounded-lg px-3 py-2 text-center">
                  <div className="text-xl font-heading font-bold">{doc.experience}</div>
                  <div className="text-xs font-body">Years Exp.</div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-heading font-bold text-foreground">{doc.name}</h3>
                <p className="text-sm font-body text-primary font-medium mb-3">{doc.title}</p>
                <p className="text-sm font-body text-muted-foreground leading-relaxed">{doc.bio}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DoctorsSection;
