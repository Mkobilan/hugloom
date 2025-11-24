import { AppLayout } from '@/components/layout/AppLayout'
import { User, Settings, HelpCircle, LogOut, HeartHandshake, Shield } from 'lucide-react'
import { Link } from 'solito/link'

const MenuItem = ({ icon: Icon, label, href, color = "text-foreground" }: any) => (
    <Link href={href}>
        <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-border/50 hover:bg-cream/50 transition-colors mb-3">
            <div className={`p-2 rounded-full bg-cream ${color}`}>
                <Icon className="w-5 h-5" />
            </div>
            <span className="font-medium text-foreground flex-1">{label}</span>
        </div>
    </Link>
)

export default function MorePage() {
    return (
        <AppLayout>
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-heading font-bold text-terracotta mb-6">Menu</h1>

                <div className="mb-8 flex items-center gap-4 p-4 bg-terracotta/10 rounded-2xl">
                    <div className="w-16 h-16 rounded-full bg-terracotta/20 flex items-center justify-center text-terracotta font-bold text-2xl">
                        S
                    </div>
                    <div>
                        <h2 className="font-bold text-lg">Sarah Jenkins</h2>
                        <p className="text-sm text-muted-foreground">Caregiver for Mom • NYC</p>
                    </div>
                </div>

                <div className="space-y-1">
                    <MenuItem icon={User} label="My Profile" href="/profile" />
                    <MenuItem icon={HeartHandshake} label="My Care Circles" href="/circles" />
                    <MenuItem icon={Shield} label="Local Help" href="/help" />
                    <MenuItem icon={Settings} label="Settings" href="/settings" />
                    <MenuItem icon={HelpCircle} label="Support & Resources" href="/support" />

                    <button className="w-full flex items-center gap-4 p-4 bg-white rounded-xl border border-red-100 hover:bg-red-50 transition-colors mt-6 text-red-500">
                        <div className="p-2 rounded-full bg-red-100">
                            <LogOut className="w-5 h-5" />
                        </div>
                        <span className="font-medium flex-1 text-left">Sign Out</span>
                    </button>
                </div>
            </div>
        </AppLayout>
    )
}
