import Hero from "./components/Hero";
import ProjectGrid from "./components/ProjectGrid";
import HowItWorks from "./components/HowItWorks";
import ImpactDashboard from "./components/ImpactDashboard";
import DonationSection from "./components/DonationSection";
import Footer from "./components/Footer";

// Page renders immediately with fallback data.
// Components fetch live Supabase data client-side after load.
export default function Home() {
  return (
    <main>
      <Hero totalKg={47823} />
      <ProjectGrid projects={[]} />
      <HowItWorks />
      <ImpactDashboard metrics={null} activities={[]} />
      <DonationSection id="donate" projects={[]} />
      <Footer />
    </main>
  );
}
