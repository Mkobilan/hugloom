import { useState } from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface StepNeedsProps {
    onNext: (needs: string[]) => void
    onBack: () => void
    initialNeeds?: string[]
}

export function StepNeeds({ onNext, onBack, initialNeeds }: StepNeedsProps) {
    const [needs, setNeeds] = useState<string[]>(initialNeeds || [])

    const toggleNeed = (need: string) => {
        setNeeds(current =>
            current.includes(need)
                ? current.filter(n => n !== need)
                : [...current, need]
        )
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onNext(needs)
    }

    const options = [
        { id: "meds", label: "I need med task reminders" },
        { id: "circle", label: "I need a Care Circle" },
        { id: "breather", label: "I need a breather (Relaxation)" },
        { id: "support", label: "I need local support" },
    ]

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-foreground">How can we help you?</h2>
                <p className="text-muted-foreground">Select all that apply so we can tailor your experience.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-[#3C3434] p-6 rounded-xl shadow-sm border border-terracotta/10">
                    <div className="grid gap-3">
                        {options.map((option) => {
                            const isChecked = needs.includes(option.label)
                            return (
                                <div
                                    key={option.id}
                                    onClick={() => toggleNeed(option.label)}
                                    className={cn(
                                        "flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-all duration-200",
                                        isChecked
                                            ? "bg-terracotta/10 border-terracotta ring-1 ring-terracotta"
                                            : "bg-[#4A4042] hover:bg-[#5A5052] border-white/5"
                                    )}
                                >
                                    <div className={cn(
                                        "h-5 w-5 rounded border flex items-center justify-center transition-colors",
                                        isChecked ? "bg-terracotta border-terracotta text-white" : "border-white/30 bg-white"
                                    )}>
                                        {isChecked && <Check className="h-3.5 w-3.5" />}
                                    </div>
                                    <span className="flex-1 font-medium text-white">{option.label}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={onBack}
                        className="w-full bg-[#4A4042] border border-white/10 text-white hover:bg-[#5A5052] h-11 px-8 rounded-md font-medium transition-colors"
                    >
                        Back
                    </button>
                    <button
                        type="submit"
                        className="w-full bg-terracotta text-white hover:bg-terracotta/90 h-11 px-8 rounded-md font-medium transition-colors shadow-lg shadow-terracotta/20"
                    >
                        Continue
                    </button>
                </div>
            </form>
        </div>
    )
}
