'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { StepRole } from './steps/StepRole'
import { StepNeeds } from './steps/StepNeeds'
import { StepProfile } from './steps/StepProfile'
import { StepPaywall } from './steps/StepPaywall'

type OnboardingData = {
    role?: string
    needs?: string[]
    name?: string
    location?: string
}

export function OnboardingWizard() {
    const [step, setStep] = useState(1)
    const [data, setData] = useState<OnboardingData>({})
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleNext = (stepData: Partial<OnboardingData>) => {
        setData(prev => ({ ...prev, ...stepData }))
        setStep(prev => prev + 1)
    }

    const handleBack = () => {
        setStep(prev => prev - 1)
    }

    const handleComplete = async () => {
        setIsLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) throw new Error('No user found')

            const { error } = await supabase
                .from('profiles')
                .update({
                    role: data.role,
                    location: data.location,
                    full_name: data.name, // Update name if they changed it
                    interests: data.needs, // Store needs as interests JSONB
                    onboarding_completed: true
                })
                .eq('id', user.id)

            if (error) throw error

            router.refresh()
            router.push('/')

        } catch (error) {
            console.error('Error saving onboarding data:', error)
            alert("Something went wrong. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-md mx-auto w-full py-10 px-4">
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: `${(step / 4) * 100}%` }}
                    />
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground font-medium">
                    <span className={step >= 1 ? "text-primary" : ""}>Role</span>
                    <span className={step >= 2 ? "text-primary" : ""}>Needs</span>
                    <span className={step >= 3 ? "text-primary" : ""}>Profile</span>
                    <span className={step >= 4 ? "text-primary" : ""}>Join</span>
                </div>
            </div>

            {step === 1 && (
                <StepRole
                    onNext={(role) => handleNext({ role })}
                    initialRole={data.role}
                />
            )}

            {step === 2 && (
                <StepNeeds
                    onNext={(needs) => handleNext({ needs })}
                    onBack={handleBack}
                    initialNeeds={data.needs}
                />
            )}

            {step === 3 && (
                <StepProfile
                    onNext={(profileData) => handleNext(profileData)}
                    onBack={handleBack}
                    initialData={data.name && data.location ? { name: data.name, location: data.location } : undefined}
                />
            )}

            {step === 4 && (
                <StepPaywall
                    onComplete={handleComplete}
                    onBack={handleBack}
                    isLoading={isLoading}
                />
            )}
        </div>
    )
}
