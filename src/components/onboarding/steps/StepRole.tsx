import { useState } from "react"
import { cn } from "@/lib/utils"

interface StepRoleProps {
    onNext: (role: string) => void
    initialRole?: string
}

export function StepRole({ onNext, initialRole }: StepRoleProps) {
    const [role, setRole] = useState<string>(initialRole || "")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (role) {
            onNext(role)
        }
    }

    const options = [
        { id: "caretaker", value: "Caretaker", label: "I am a Caretaker" },
        { id: "family", value: "Family Member", label: "I am a Family Member" },
        { id: "recipient", value: "Care Recipient", label: "I am a Care Recipient" },
        { id: "supporter", value: "Supporter", label: "I am a Supporter/Friend" },
    ]

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Welcome to HugLoom</h2>
                <p className="text-muted-foreground">To get started, tell us a bit about yourself.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-[#3C3434] p-6 rounded-xl shadow-sm border border-terracotta/10">
                    <div className="space-y-4">
                        <label className="text-base font-semibold block text-white">Are you a caretaker or family of a caretaker?</label>
                        <div className="grid gap-3 pt-2">
                            {options.map((option) => (
                                <div
                                    key={option.id}
                                    onClick={() => setRole(option.value)}
                                    className={cn(
                                        "flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-all duration-200",
                                        role === option.value
                                            ? "bg-terracotta/10 border-terracotta ring-1 ring-terracotta"
                                            : "bg-[#4A4042] hover:bg-[#5A5052] border-white/5"
                                    )}
                                >
                                    <div className={cn(
                                        "h-4 w-4 rounded-full border flex items-center justify-center",
                                        role === option.value ? "bg-terracotta border-terracotta" : "border-white/30 bg-transparent"
                                    )}>
                                        {role === option.value && <div className="h-2 w-2 rounded-full bg-white" />}
                                    </div>
                                    <span className="flex-1 font-medium text-white">{option.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={!role}
                    className="w-full bg-terracotta text-white hover:bg-terracotta/90 h-11 px-8 rounded-md font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-terracotta/20"
                >
                    Continue
                </button>
            </form>
        </div>
    )
}
