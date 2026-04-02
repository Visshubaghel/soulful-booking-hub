import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { motion } from "framer-motion";
import { Users, Heart, Shield, Building2, Award, Target } from "lucide-react";
import clinicImage from "@/assets/clinic-interior.jpg";
import doctor1 from "@/assets/doctor-1.jpg";
import doctor2 from "@/assets/doctor-2.jpg";

const About = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="section-padding gradient-rose-subtle">
          <div className="container mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="section-label">About Us</span>
              <h1 className="section-heading mt-3 mb-6">Our Story & Mission</h1>
              <p className="section-subheading mx-auto">
                Vishwas Skin Clinic is where cutting-edge dermatological science meets compassionate, personalized care.
              </p>
            </motion.div>
          </div>
        </section>

        {/* About Content */}
        <section className="section-padding bg-background">
          <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-6">India's Premier Dermatology Clinic</h2>
              <p className="font-body text-muted-foreground leading-relaxed mb-4">
                Vishwas Skin Clinic combines advanced technology with highly renowned doctors performing dermatological treatments for all bodily concerns proficiently. We have cutting-edge techniques for laser and all aesthetic treatments.
              </p>
              <p className="font-body text-muted-foreground leading-relaxed mb-4">
                Our team of internationally trained doctors have remarkable skills and experience in dermatology that allows them to deal with various skin types and hair types. We aim to give you flawless, beautiful-looking skin, hair, and the body you desire.
              </p>
              <p className="font-body text-muted-foreground leading-relaxed">
                With over 15 years of excellence, we've helped thousands of patients regain their confidence through personalized treatment plans and state-of-the-art technology.
              </p>
            </motion.div>
            <motion.img
              src={clinicImage}
              alt="Radiance Clinic Interior"
              className="rounded-2xl shadow-xl w-full object-cover h-96"
              loading="lazy"
              width={1200}
              height={800}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            />
          </div>
        </section>

        {/* Values */}
        <section className="section-padding bg-secondary">
          <div className="container mx-auto">
            <h2 className="section-heading text-center mb-12">Our Core Values</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Users, title: "Expert Team", desc: "Internationally trained dermatologists with decades of combined experience." },
                { icon: Heart, title: "Patient First", desc: "Every treatment plan is tailored to your unique needs and concerns." },
                { icon: Shield, title: "Safety Standards", desc: "Rigorous safety protocols and certified medical equipment." },
                { icon: Building2, title: "World-Class Facility", desc: "State-of-the-art infrastructure for comfortable treatments." },
                { icon: Award, title: "Proven Results", desc: "Thousands of successful treatments with documented outcomes." },
                { icon: Target, title: "Transparency", desc: "Clear communication about procedures, costs, and expected outcomes." },
              ].map((v, i) => (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card rounded-xl p-6 border border-border"
                >
                  <v.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-heading font-semibold text-lg text-foreground mb-2">{v.title}</h3>
                  <p className="text-sm font-body text-muted-foreground">{v.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Doctors */}
        <section className="section-padding bg-background">
          <div className="container mx-auto">
            <h2 className="section-heading text-center mb-12">Our Doctors</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {[
                { name: "Dr. Priya Sharma", title: "Facial Aesthetic Specialist", bio: "18+ years of expertise in facial aesthetics with international fellowship. Specializes in body shaping, laser toning, fillers, and advanced dermatological treatments.", image: doctor1 },
                { name: "Dr. Arjun Mehta", title: "MBBS & MD (Dermatology)", bio: "Renowned dermatologist specializing in laser treatments, clinical dermatology, chemical peels, and dermato-surgeries with proven track record.", image: doctor2 },
              ].map((doc, i) => (
                <motion.div
                  key={doc.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="bg-card rounded-2xl overflow-hidden border border-border"
                >
                  <img src={doc.image} alt={doc.name} className="w-full h-72 object-cover object-top" loading="lazy" width={600} height={800} />
                  <div className="p-6">
                    <h3 className="text-xl font-heading font-bold text-foreground">{doc.name}</h3>
                    <p className="text-sm font-body text-primary font-medium mb-3">{doc.title}</p>
                    <p className="text-sm font-body text-muted-foreground">{doc.bio}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default About;
