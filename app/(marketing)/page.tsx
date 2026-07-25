import { SiteHeader } from "@/components/marketing/site-header";
import { Hero } from "@/components/marketing/hero";
import { WhyTrace } from "@/components/marketing/why-trace";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { CTA } from "@/components/marketing/cta";
import { SiteFooter } from "@/components/marketing/site-footer";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <WhyTrace />
        <HowItWorks />
        <CTA />
      </main>
      <SiteFooter />
    </>
  );
}
