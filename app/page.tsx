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
import { ClosingCta } from "@/components/sections/closing-cta";
import { Footer } from "@/components/sections/footer";
import { PurchaseCelebration } from "@/components/home/purchase-celebration";

export default async function Home() {
  const session = await getServerSession(authOptions);
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
      <Navbar user={navUser} />
      <Suspense fallback={null}>
        <PurchaseCelebration />
      </Suspense>
      <main>
        <Hero ctaHref={primaryCtaHref} />
        <LogoMarquee />
        <Templates />
        <FeaturesTabs />
        <CardPreview />
        <HowItWorks />
        <Testimonial />
        <VideoDemo />
        <Comparison />
        <Pricing ctaHref={primaryCtaHref} />
        <Faq />
        <ClosingCta ctaHref={primaryCtaHref} />
      </main>
      <Footer />
    </>
  );
}
