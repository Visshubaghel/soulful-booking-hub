import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-charcoal text-primary-foreground">
      <div className="container mx-auto section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-heading font-bold text-primary mb-4">Radiance</h3>
            <p className="text-sm text-primary-foreground/70 font-body leading-relaxed">
              Where science meets beauty. Advanced dermatological treatments with personalized care for your skin, hair, and body.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-heading font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { label: "Home", to: "/" },
                { label: "About Us", to: "/about" },
                { label: "Our Services", to: "/services" },
                { label: "Blog", to: "/blog" },
                { label: "Contact Us", to: "/contact" },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm font-body text-primary-foreground/70 hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-heading font-semibold mb-4">Our Services</h4>
            <ul className="space-y-2">
              {["Cosmetic Dermatology", "Aesthetic Procedures", "Hair Restoration", "Body Sculpting", "Laser Treatments"].map((s) => (
                <li key={s}>
                  <Link to="/services" className="text-sm font-body text-primary-foreground/70 hover:text-primary transition-colors">
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-heading font-semibold mb-4">Contact Info</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm font-body text-primary-foreground/70">
                <MapPin className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                123 Skin Care Road, New Delhi, India - 110001
              </li>
              <li className="flex items-center gap-3 text-sm font-body text-primary-foreground/70">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                +91 123 456 7890
              </li>
              <li className="flex items-center gap-3 text-sm font-body text-primary-foreground/70">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                info@radianceclinic.com
              </li>
              <li className="flex items-center gap-3 text-sm font-body text-primary-foreground/70">
                <Clock className="w-4 h-4 text-primary shrink-0" />
                10:30 AM - 7:00 PM
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/10 text-center">
          <p className="text-sm font-body text-primary-foreground/50">
            © {new Date().getFullYear()} Vishwas Skin Clinic. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
