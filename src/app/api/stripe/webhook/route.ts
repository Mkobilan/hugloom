import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin client to bypass RLS for webhook updates
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get('Stripe-Signature') as string;

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const session = event.data.object as any;

    if (event.type === 'checkout.session.completed') {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

        if (!session?.metadata?.userId) {
            return new NextResponse('User id is required', { status: 400 });
        }

        await supabaseAdmin
            .from('profiles')
            .update({
                is_subscribed: true,
                stripe_subscription_id: subscription.id,
                stripe_customer_id: subscription.customer as string,
                onboarding_completed: true,
            })
            .eq('id', session.metadata.userId);
    }

    if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object as any;

        // Find user by subscription ID
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('stripe_subscription_id', subscription.id)
            .single();

        if (profile) {
            await supabaseAdmin
                .from('profiles')
                .update({
                    is_subscribed: false,
                })
                .eq('id', profile.id);
        }
    }

    return new NextResponse(null, { status: 200 });
}
