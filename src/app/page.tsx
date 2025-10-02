import { Footer } from '@/components/footer';
import { Navigation } from '@/components/navigation';
import { AboutSection } from '@/components/sections/about-section';
import { ContactSection } from '@/components/sections/contact-section';
import { ExperienceSection } from '@/components/sections/experience-section';
import { HeroSection } from '@/components/sections/hero-section';
import { ProjectsSection } from '@/components/sections/projects-section';

export default function Home() {
  return (
    <div className="relative flex flex-col">
      <Navigation />
      <main className="flex flex-col gap-24 pb-24">
        <HeroSection />
        <ExperienceSection />
        <ProjectsSection />
        <AboutSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
