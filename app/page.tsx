import { Suspense } from "react";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Navbar, type NavbarUser } from "@/components/sections/navbar";
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
import { PurchaseCelebration } from "@/components/home/purchase-celebration";
import { getActivePlans } from "@/lib/plans";
import {
  getFaqItems,
  getHomepageCardPreview,
  getHomepageClosingCta,
  getHomepageComparisonRows,
  getHomepageContact,
  getHomepageFeatures,
  getHomepageFooter,
  getHomepageHero,
  getHomepageLogos,
  getHomepageNavbar,
  getHomepageTemplates,
  getHomepageTestimonials,
  getHomepageVideo,
  getHowItWorksSteps,
} from "@/lib/site-content";

export const revalidate = 300;

export default async function Home() {
  const [
    session,
    hero,
    logos,
    templates,
    steps,
    testimonials,
    video,
    faqs,
    plans,
    features,
    cardPreview,
    comparisonRows,
    contact,
    closingCta,
    footer,
    navbar,
  ] = await Promise.all([
    getServerSession(authOptions),
    getHomepageHero(),
    getHomepageLogos(),
    getHomepageTemplates(),
    getHowItWorksSteps(),
    getHomepageTestimonials(),
    getHomepageVideo(),
    getFaqItems(),
    getActivePlans(),
    getHomepageFeatures(),
    getHomepageCardPreview(),
    getHomepageComparisonRows(),
    getHomepageContact(),
    getHomepageClosingCta(),
    getHomepageFooter(),
    getHomepageNavbar(),
  ]);

  const user = session?.user?.id
    ? await db.user.findUnique({
        where: { id: session.user.id },
        select: { slug: true, cardPublished: true, name: true, email: true },
      })
    : null;

  const navUser: NavbarUser | null = session?.user
    ? {
        role: session.user.role,
        cardPublished: user?.cardPublished ?? false,
        slug: user?.slug ?? null,
        name: user?.name,
        email: user?.email,
      }
    : null;

  const primaryCtaHref = !session ? "/signup" : !user?.cardPublished ? "/setup" : "/dashboard";

  return (
    <>
      <Navbar content={navbar} user={navUser} />
      <Suspense fallback={null}>
        <PurchaseCelebration />
      </Suspense>
      <main>
        <Hero hero={hero} ctaHref={primaryCtaHref} />
        <LogoMarquee logos={logos} />
        <Templates templates={templates} />
        <FeaturesTabs features={features} />
        <CardPreview content={cardPreview} />
        <HowItWorks steps={steps} />
        <Testimonial testimonials={testimonials} />
        <VideoDemo video={video} />
        <Comparison rows={comparisonRows} />
        <Pricing plans={plans} ctaHref={primaryCtaHref} />
        <Faq items={faqs} contactEmail={contact.email} />
        <Contact content={contact} />
        <ClosingCta content={closingCta} ctaHref={primaryCtaHref} />
      </main>
      <Footer content={footer} />
    </>
  );
}
