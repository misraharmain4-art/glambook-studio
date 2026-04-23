import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { WhySection } from "@/components/WhySection";
import { ArtistsSection } from "@/components/ArtistsSection";
import { ServicesSection } from "@/components/ServicesSection";
import { ReviewsSection } from "@/components/ReviewsSection";
import { Footer } from "@/components/Footer";
import { LoadingScreen } from "@/components/LoadingScreen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GlamBook — Book Trusted Makeup & Mehndi Artists Instantly" },
      { name: "description", content: "Find and book India's top-rated, verified makeup and mehndi artists. Premium service, transparent pricing, secure payments." },
      { property: "og:title", content: "GlamBook — Premium Beauty Booking" },
      { property: "og:description", content: "Find top-rated beauty artists near you." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <LoadingScreen />
      <Navbar />
      <main>
        <Hero />
        <WhySection />
        <ArtistsSection />
        <ServicesSection />
        <ReviewsSection />
      </main>
      <Footer />
    </>
  );
}
