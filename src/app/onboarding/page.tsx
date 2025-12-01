import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'

export default async function OnboardingPage() {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        redirect('/login')
    }

    // Check profile status
    const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, is_subscribed')
        .eq('id', session.user.id)
        .single()

    // If subscribed, they are done (regardless of onboarding_completed flag, though webhook sets it)
    if (profile?.is_subscribed) {
        redirect('/')
    }

    // If not subscribed but onboarding completed (e.g. cancelled sub), show Paywall directly
    const initialStep = profile?.onboarding_completed ? 4 : 1

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <OnboardingWizard initialStep={initialStep} />
        </div>
    )
}
