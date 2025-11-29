import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'

export default async function OnboardingPage() {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        redirect('/login')
    }

    // Check if already onboarded
    const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', session.user.id)
        .single()

    if (profile?.onboarding_completed) {
        redirect('/')
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <OnboardingWizard />
        </div>
    )
}
