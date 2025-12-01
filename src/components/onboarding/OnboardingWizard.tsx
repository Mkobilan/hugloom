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

interface OnboardingWizardProps {
    initialStep?: number
}

export function OnboardingWizard({ initialStep = 1 }: OnboardingWizardProps) {
    const [step, setStep] = useState(initialStep)
    const [data, setData] = useState<OnboardingData>({})
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const saveData = async (currentData: OnboardingData) => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            await supabase
                .from('profiles')
                .update({
                    role: currentData.role,
                    location: currentData.location,
                    full_name: currentData.name,
                    interests: currentData.needs,
                })
                .eq('id', user.id)
        } catch (error) {
            console.error('Error saving progress:', error)
        }
    }

    const handleNext = async (stepData: Partial<OnboardingData>) => {
        const newData = { ...data, ...stepData }
        setData(newData)

        // If moving to Paywall (Step 4), save data first
        if (step === 3) {
            await saveData(newData)
        }

        setStep(prev => prev + 1)
    }

    const handleBack = () => {
        setStep(prev => prev - 1)
    }

    const handleComplete = async () => {
        // This might not be called if redirected to Stripe, but keeping as fallback
        setIsLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No user found')

            const { error } = await supabase
                .from('profiles')
                .update({
                    onboarding_completed: true
                })
                .eq('id', user.id)

            if (error) throw error

            router.refresh()
            router.push('/')

        } catch (error) {
            console.error('Error completing onboarding:', error)
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
