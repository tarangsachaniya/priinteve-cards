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
import { Contact } from "@/components/sections/contact";
import { ClosingCta } from "@/components/sections/closing-cta";
import { Footer } from "@/components/sections/footer";
import { getActivePlans } from "@/lib/plans";
import {
  getFaqItems,
  getHomepageHero,
  getHomepageLogos,
  getHomepageTemplates,
  getHomepageTestimonials,
  getHomepageVideo,
  getHowItWorksSteps,
} from "@/lib/site-content";

export const revalidate = 300;

export default async function Home() {
  const [hero, logos, templates, steps, testimonials, video, faqs, plans] = await Promise.all([
    getHomepageHero(),
    getHomepageLogos(),
    getHomepageTemplates(),
    getHowItWorksSteps(),
    getHomepageTestimonials(),
    getHomepageVideo(),
    getFaqItems(),
    getActivePlans(),
  ]);

  return (
    <>
      <Navbar />
      <main>
        <Hero hero={hero} />
        <LogoMarquee logos={logos} />
        <Templates templates={templates} />
        <FeaturesTabs />
        <CardPreview />
        <HowItWorks steps={steps} />
        <Testimonial testimonials={testimonials} />
        <VideoDemo video={video} />
        <Comparison />
        <Pricing plans={plans} />
        <Faq items={faqs} />
        <Contact />
        <ClosingCta />
      </main>
      <Footer />
    </>
  );
}
