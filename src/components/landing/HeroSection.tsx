import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function HeroSection() {
    return (
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-dusty-rose/20 via-background to-sage/10 -z-10" />

            <div className="container mx-auto px-4 text-center">
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
                        The <span className="text-terracotta">only</span> social media app<br />
                        designed by a caregiver<br />
                        for caregivers.
                    </h1>

                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                        Find support, coordinate care, and connect with a community that truly understands your journey.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/signup">
                            <Button size="lg" className="h-14 px-8 text-lg font-bold bg-terracotta hover:bg-terracotta/90 text-white shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all rounded-full group">
                                Join the Community
                                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        <Link href="/login">
                            <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-medium border-2 hover:bg-accent/10 rounded-full">
                                I already have an account
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
