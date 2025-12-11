import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ChevronDown, HeartHandshake } from 'lucide-react';

export function LandingHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HeartHandshake className="w-8 h-8 text-terracotta" />
          <span className="font-heading font-bold text-xl text-foreground">HugLoom</span>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium hover:text-terracotta transition-colors outline-none">
              Features <ChevronDown className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <Link href="#community" className="w-full">Community Support</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="#calendar" className="w-full">Care Calendar</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="#meds" className="w-full">Medication Tracker</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="#marketplace" className="w-full">Marketplace</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="#local-hugs" className="w-full">Local Hugs</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="#mood" className="w-full">Mood Check</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" className="font-medium hover:text-terracotta hover:bg-terracotta/10">
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="font-bold bg-terracotta hover:bg-terracotta/90 text-white shadow-md hover:shadow-lg transition-all">
              Sign Up
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
