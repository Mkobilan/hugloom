import Link from 'next/link';

export function LandingFooter() {
    return (
        <footer className="bg-background py-12 border-t border-border/50">
            <div className="container mx-auto px-4 text-center">
                <p className="text-muted-foreground text-sm">
                    &copy; {new Date().getFullYear()} HugLoom. All rights reserved.
                </p>
                <div className="flex justify-center gap-6 mt-4 text-sm text-muted-foreground">
                    <Link href="/terms" className="hover:text-terracotta underline-offset-4 hover:underline">Terms of Service</Link>
                    <Link href="/privacy" className="hover:text-terracotta underline-offset-4 hover:underline">Privacy Policy</Link>
                    <Link href="/contact" className="hover:text-terracotta underline-offset-4 hover:underline">Contact Us</Link>
                </div>
            </div>
        </footer>
    );
}
