import { Check } from "lucide-react"

interface StepPaywallProps {
    onComplete: () => void
    onBack: () => void
    isLoading?: boolean
}

export function StepPaywall({ onComplete, onBack, isLoading }: StepPaywallProps) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Join the HugLoom Community</h2>
                <p className="text-muted-foreground">Ensure a safe, positive, and spam-free experience.</p>
            </div>

            <div className="bg-[#3C3434] border border-terracotta/10 rounded-xl p-8 shadow-sm">
                <div className="text-center mb-8">
                    <div className="text-4xl font-bold text-terracotta mb-2">$5<span className="text-lg font-normal text-white/70">/month</span></div>
                    <p className="text-sm text-white/50">Cancel anytime. No hidden fees.</p>
                </div>

                <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="h-6 w-6 rounded-full bg-terracotta/10 flex items-center justify-center text-terracotta shrink-0">
                            <Check className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-white">Verified Community Members Only</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-6 w-6 rounded-full bg-terracotta/10 flex items-center justify-center text-terracotta shrink-0">
                            <Check className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-white">Ad-Free & Spam-Free Environment</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-6 w-6 rounded-full bg-terracotta/10 flex items-center justify-center text-terracotta shrink-0">
                            <Check className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-white">Full Access to Care Tools & Support</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-6 w-6 rounded-full bg-terracotta/10 flex items-center justify-center text-terracotta shrink-0">
                            <Check className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-white">Contribute to Platform Growth</span>
                    </div>
                </div>

                <button
                    onClick={onComplete}
                    disabled={isLoading}
                    className="w-full bg-terracotta text-white hover:bg-terracotta/90 h-12 px-8 rounded-md text-lg font-semibold shadow-lg shadow-terracotta/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
                >
                    {isLoading ? "Setting up..." : "Join Now"}
                </button>
                <p className="text-xs text-center text-white/30 mt-4">
                    By joining, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>

            <div className="text-center">
                <button
                    onClick={onBack}
                    disabled={isLoading}
                    className="text-muted-foreground hover:text-foreground text-sm font-medium px-4 py-2 rounded-md hover:bg-slate-100 transition-colors"
                >
                    Back
                </button>
            </div>
        </div>
    )
}
