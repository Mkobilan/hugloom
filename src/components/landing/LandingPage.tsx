import { LandingHeader } from './LandingHeader';
import { HeroSection } from './HeroSection';
import { FeaturesSection } from './FeaturesSection';
import { PricingSection } from './PricingSection';
import { LandingFooter } from './LandingFooter';

export function LandingPage() {
    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-terracotta/20 selection:text-terracotta overflow-x-hidden">
            <LandingHeader />
            <main>
                <HeroSection />
                <FeaturesSection />
                <PricingSection />
            </main>
            <LandingFooter />
        </div>
    );
}
