import { useTheme } from '../hooks/useTheme';
import Features from '../components/landing/Features';
import Footer from '../components/landing/Footer';
import Header from '../components/landing/Header';
import Hero from '../components/landing/Hero';
import MockNotesPreview from '../components/landing/MockNotesPreview';

function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="landing-app d-flex flex-column min-vh-100">
      <Header theme={theme} toggleTheme={toggleTheme} />
      <main className="flex-grow-1">
        <Hero />
        <MockNotesPreview />
        <Features />
      </main>
      <Footer />
    </div>
  );
}

export default LandingPage;

