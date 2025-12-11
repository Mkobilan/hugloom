import {
    Users,
    Calendar,
    Pill,
    ShoppingBag,
    HandHeart,
    Smile,
    LucideIcon
} from 'lucide-react';

interface FeatureProps {
    icon: LucideIcon;
    title: string;
    description: string;
    id: string;
    color: string;
}

const features: FeatureProps[] = [
    {
        id: "community",
        icon: Users,
        title: "The #1 Caregiver Support App",
        description: "HugLoom is the ultimate family caregiver app designed to simplify elder care support. Join our caregiver support group to connect with others who understand your journey.",
        color: "text-terracotta"
    },
    {
        id: "calendar",
        icon: Calendar,
        title: "Care Calendar & Coordination",
        description: "Manage appointments and coordinate with family using our shared care calendar. Perfect for care coordination with My Care Circle.",
        color: "text-slate-blue"
    },
    {
        id: "meds",
        icon: Pill,
        title: "Medication Tracker",
        description: "Never miss a dose with our built-in medication tracker. Essential for dementia care and daily health management.",
        color: "text-sage"
    },
    {
        id: "marketplace",
        icon: ShoppingBag,
        title: "Caregiver Marketplace",
        description: "Find affordable essentials or pass them on to those in need. A trusted community marketplace for equipment and supplies.",
        color: "text-mustard"
    },
    {
        id: "local-hugs",
        icon: HandHeart,
        title: "Local Hugs",
        description: "Find helping hands in your neighborhood. Connect with trusted volunteers for rides, grocery runs, and support when you need it most.",
        color: "text-terracotta"
    },
    {
        id: "mood",
        icon: Smile,
        title: "Mood Check & Wellness",
        description: "Find your center with our Mood Check tool. A guided meditation and daily check-in to support your mental well-being.",
        color: "text-lavender"
    }
];

export function FeaturesSection() {
    return (
        <section className="py-20 bg-background">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl md:text-5xl font-heading font-bold text-center mb-16 text-foreground">
                    Everything you need to <span className="text-terracotta">care</span> with confidence.
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature) => (
                        <div
                            key={feature.id}
                            id={feature.id}
                            className="bg-card border border-border/50 rounded-3xl p-8 hover:shadow-lg transition-all hover:-translate-y-1 group"
                        >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-background border border-border/50 ${feature.color} group-hover:scale-110 transition-transform`}>
                                <feature.icon className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-foreground">{feature.title}</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
