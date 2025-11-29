import { useState } from "react"

interface StepProfileProps {
    onNext: (data: { name: string; location: string }) => void
    onBack: () => void
    initialData?: { name: string; location: string }
}

export function StepProfile({ onNext, onBack, initialData }: StepProfileProps) {
    const [name, setName] = useState(initialData?.name || "")
    const [location, setLocation] = useState(initialData?.location || "")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (name && location) {
            onNext({ name, location })
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Almost there!</h2>
                <p className="text-muted-foreground">Let's finish setting up your profile.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-[#3C3434] p-6 rounded-xl shadow-sm border border-terracotta/10 space-y-5">
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium leading-none text-white">What is your name?</label>
                        <input
                            id="name"
                            placeholder="Your Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="flex h-11 w-full rounded-xl border border-terracotta/20 bg-[#4A4042] px-4 py-3 text-sm shadow-sm transition-all text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/50 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="location" className="text-sm font-medium leading-none text-white">Where are you located?</label>
                        <input
                            id="location"
                            placeholder="City, State, or Zip"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            required
                            className="flex h-11 w-full rounded-xl border border-terracotta/20 bg-[#4A4042] px-4 py-3 text-sm shadow-sm transition-all text-white placeholder:text-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/50 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <p className="text-xs text-white/50">This helps us find local support near you.</p>
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
                        disabled={!name || !location}
                        className="w-full bg-terracotta text-white hover:bg-terracotta/90 h-11 px-8 rounded-md font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-terracotta/20"
                    >
                        Continue
                    </button>
                </div>
            </form>
        </div>
    )
}
