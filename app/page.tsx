import { Hero } from "@/components/Hero";
import { Intro } from "@/components/Intro";
import { Invitation } from "@/components/Invitation";
import { TwelveDoors } from "@/components/TwelveDoors";
import { RabbitHole } from "@/components/RabbitHole";
import { Dates } from "@/components/Dates";
import { AboutMaria } from "@/components/AboutMaria";
import { Pricing } from "@/components/Pricing";
import { FinalCTA } from "@/components/FinalCTA";
import { Footer } from "@/components/Footer";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { HereAndNow } from "@/components/HereAndNow";
import { serializeEventData } from "@/lib/seo/eventData";
export default function Home() {
  return (
    <>
      <main id="main">
        <Hero />
        <Intro />
        <Invitation />
        <TwelveDoors />
        <RabbitHole />
        <Dates />
        <HereAndNow />
        <AboutMaria />
        <Pricing />
        <FinalCTA />
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeEventData() }} />
      <Footer />
      <ChatWidget />
    </>
  );
}
