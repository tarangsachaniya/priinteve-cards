import { Navbar } from "@/components/sections/navbar";
import { Hero } from "@/components/sections/hero";
import { LogoMarquee } from "@/components/sections/logo-marquee";
import { Templates } from "@/components/sections/templates";
import { FeaturesTabs } from "@/components/sections/features-tabs";
import { CardPreview } from "@/components/sections/card-preview";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Testimonial } from "@/components/sections/testimonial";
import { VideoDemo } from "@/components/sections/video-demo";
import { Comparison } from "@/components/sections/comparison";
import { Pricing } from "@/components/sections/pricing";
import { Faq } from "@/components/sections/faq";
import { ClosingCta } from "@/components/sections/closing-cta";
import { Footer } from "@/components/sections/footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <LogoMarquee />
        <Templates />
        <FeaturesTabs />
        <CardPreview />
        <HowItWorks />
        <Testimonial />
        <VideoDemo />
        <Comparison />
        <Pricing />
        <Faq />
        <ClosingCta />
      </main>
      <Footer />
    </>
  );
}
