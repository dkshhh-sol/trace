import { SiteHeader } from "@/components/marketing/site-header";
import { Hero } from "@/components/marketing/hero";
import { LogoStrip } from "@/components/marketing/logo-strip";
import { Features } from "@/components/marketing/features";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Roadmaps } from "@/components/marketing/roadmaps";
import { CTA } from "@/components/marketing/cta";
import { SiteFooter } from "@/components/marketing/site-footer";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <LogoStrip />
        <Features />
        <HowItWorks />
        <Roadmaps />
        <CTA />
      </main>
      <SiteFooter />
    </>
  );
}
