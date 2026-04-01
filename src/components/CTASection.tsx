import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

const CTASection = () => {
  return (
    <section className="section-padding gradient-rose text-primary-foreground">
      <div className="container mx-auto text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-4">
          Need Any Help?
        </h2>
        <p className="text-lg font-body text-primary-foreground/85 mb-8 max-w-xl mx-auto">
          Request a consultation and price estimate. Our experts are ready to help you achieve your beauty goals.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/contact">
            <Button size="lg" variant="secondary" className="font-body font-semibold px-8 py-6 text-base">
              Book Now
            </Button>
          </Link>
          <a href="tel:+911234567890">
            <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-body px-8 py-6 text-base">
              <Phone className="w-5 h-5 mr-2" />
              Call Now
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
