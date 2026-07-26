import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Link,
  Hr,
} from "@react-email/components";

/**
 * Welcome email — the only email Trace currently sends. Built with React
 * Email (no raw HTML), dark and minimal to match Trace's brand.
 */

const BRAND = "#8b7cff";
const BG = "#08080b";
const CARD = "#0d0d12";
const BORDER = "rgba(255,255,255,0.08)";
const TEXT = "#f4f4f5";
const MUTED = "#9a9aa5";

export function WelcomeEmail({
  name,
  dashboardUrl,
}: {
  name?: string | null;
  dashboardUrl: string;
}) {
  const firstName = name?.split(" ")[0] || "there";

  return (
    <Html>
      <Head />
      <Preview>Welcome to Trace — your workspace for Striver&rsquo;s A2Z Sheet</Preview>
      <Body style={{ backgroundColor: BG, fontFamily: "Helvetica, Arial, sans-serif" }}>
        <Container
          style={{
            backgroundColor: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: 16,
            margin: "40px auto",
            padding: "32px 36px",
            maxWidth: 480,
          }}
        >
          <Text style={{ color: BRAND, fontSize: 13, fontWeight: 600, letterSpacing: 1, margin: 0 }}>
            TRACE
          </Text>

          <Heading style={{ color: TEXT, fontSize: 22, fontWeight: 600, margin: "16px 0 8px" }}>
            Welcome to Trace, {firstName}.
          </Heading>

          <Text style={{ color: MUTED, fontSize: 14, lineHeight: "22px", margin: "0 0 16px" }}>
            I&rsquo;m Daksh, the founder of Trace. Thanks for signing up. Trace is a
            focused workspace built to help you master Striver&rsquo;s A2Z Sheet
            without juggling a dozen tabs.
          </Text>

          <Text style={{ color: MUTED, fontSize: 14, lineHeight: "22px", margin: "0 0 8px" }}>
            Here&rsquo;s what you get:
          </Text>

          <Section style={{ margin: "0 0 16px" }}>
            {[
              "Striver A2Z Roadmap, mapped lecture by lecture",
              "Progress Tracker across every problem and topic",
              "Dynamic Goals that fit how you like to study",
              "Code Files: your personal code library inside Trace",
              "An integrated Code Editor for C, C++, Java and Python",
              "One-click GitHub Commit, straight from the editor",
              "An Achievement system that rewards consistency",
              "A Support center for questions and feature requests",
            ].map((line) => (
              <Text
                key={line}
                style={{ color: TEXT, fontSize: 13, lineHeight: "20px", margin: "0 0 4px" }}
              >
                {line}
              </Text>
            ))}
          </Section>

          <Link
            href={dashboardUrl}
            style={{
              display: "inline-block",
              backgroundColor: BRAND,
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              borderRadius: 10,
              padding: "10px 20px",
            }}
          >
            Open Dashboard
          </Link>

          <Hr style={{ borderColor: BORDER, margin: "28px 0 16px" }} />

          <Text style={{ color: MUTED, fontSize: 13, lineHeight: "20px", margin: 0 }}>
            See you inside Trace.
          </Text>
          <Text style={{ color: TEXT, fontSize: 13, lineHeight: "20px", margin: "4px 0 0" }}>
            Daksh Mehta
          </Text>
          <Text style={{ color: MUTED, fontSize: 12, lineHeight: "18px", margin: 0 }}>
            Founder, Trace
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default WelcomeEmail;
