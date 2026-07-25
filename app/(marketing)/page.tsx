import { getSession } from "@/lib/auth/guards";
import { Hero } from "@/components/marketing/hero";
import { WhyTrace } from "@/components/marketing/why-trace";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { CTA } from "@/components/marketing/cta";
import { SiteFooter } from "@/components/marketing/site-footer";

export default async function Home() {
  const session = await getSession();
  const isAuthed = Boolean(session?.user);

  return (
    <>
      <main>
        <Hero isAuthed={isAuthed} />
        <WhyTrace />
        <HowItWorks />
        <CTA />
      </main>
      <SiteFooter />
    </>
  );
}
