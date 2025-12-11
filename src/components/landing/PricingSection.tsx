import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

export function PricingSection() {
    return (
        <section className="py-24 bg-card border-t border-border/50">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto bg-background rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-terracotta/20 relative overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-terracotta/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-sage/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

                    <div className="relative z-10 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-sage/10 text-sage rounded-full text-sm font-semibold mb-6">
                            <ShieldCheck className="w-4 h-4" />
                            Verified & Secure Community
                        </div>

                        <h2 className="text-3xl md:text-5xl font-heading font-bold mb-4 text-foreground">
                            Join the HugLoom Community
                        </h2>
                        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                            Ensure a safe, positive, and spam-free experience.
                        </p>

                        <div className="grid md:grid-cols-2 gap-12 text-left items-center mb-12">
                            <div className="space-y-4">
                                <h3 className="font-bold text-lg text-foreground mb-4">Why we charge a membership fee:</h3>

                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-6 h-6 text-terracotta shrink-0" />
                                        <span className="text-foreground font-medium">The World's Only Social Network for Caregivers</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-6 h-6 text-terracotta shrink-0" />
                                        <span className="text-foreground font-medium">Premium Care Tools (Worth the subscription alone!)</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-6 h-6 text-terracotta shrink-0" />
                                        <span className="text-foreground font-medium">Bonus: Full Access to our Supportive Community</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-6 h-6 text-sage shrink-0" />
                                        <span className="text-muted-foreground">Verified Community Members Only</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-6 h-6 text-sage shrink-0" />
                                        <span className="text-muted-foreground">Ad-Free & Spam-Free Environment</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="w-6 h-6 text-sage shrink-0" />
                                        <span className="text-muted-foreground">Contribute to Platform Growth</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-card border border-border rounded-3xl p-8 text-center relative">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-terracotta text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
                                    Best Value
                                </div>

                                <div className="text-5xl font-bold text-foreground mb-2">
                                    $5<span className="text-lg text-muted-foreground font-medium">/mo</span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-6">Cancel anytime. No hidden fees.</p>

                                <Link href="/signup" className="block w-full">
                                    <Button className="w-full h-12 text-lg font-bold bg-terracotta hover:bg-terracotta/90 text-white shadow-lg hover:shadow-xl transition-all rounded-xl">
                                        Get Started Now
                                    </Button>
                                </Link>

                                <p className="mt-6 text-sm text-muted-foreground italic">
                                    "We only want Caretakers who truly Care on this app."
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
