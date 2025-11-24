"use client";

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Calendar, MessageCircle, MapPin, Smile, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { redirect } from 'next/navigation'
import { Link } from 'solito/link';

const DashboardTile = ({ icon: Icon, title, subtitle, color, href }: any) => (
  <Link href={href || '#'}>
    <div className={cn("p-4 rounded-2xl flex flex-col items-start gap-3 transition-transform active:scale-95 cursor-pointer h-full", color)}>
      <div className="p-2 bg-white/50 rounded-full">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="font-bold text-sm">{title}</h3>
        <p className="text-xs opacity-80">{subtitle}</p>
      </div>
    </div>
  </Link>
);

const FeedItem = ({ author, content, time }: any) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-border/50">
    <div className="flex items-center gap-3 mb-2">
      <div className="w-8 h-8 rounded-full bg-sage/20 flex items-center justify-center text-xs font-bold text-sage">
        {author[0]}
      </div>
      <div>
        <h4 className="font-bold text-sm">{author}</h4>
        <p className="text-[10px] text-muted-foreground">{time}</p>
      </div>
    </div>
    <p className="text-sm text-foreground/90 mb-3">{content}</p>
    <div className="flex items-center gap-4">
      <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-terracotta transition-colors">
        <Heart className="w-4 h-4" />
        <span>Hug</span>
      </button>
      <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-sage transition-colors">
        <MessageCircle className="w-4 h-4" />
        <span>Reply</span>
      </button>
    </div>
  </div>
);

export default function Home() {
  const supabase = createClient();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login';
      }
    };
    checkSession();
  }, []);
  return (
    <AppLayout>
      {/* Greeting Section */}
      <section className="mb-8 text-center animate-in fade-in slide-in-from-top-4 duration-700">
        <h2 className="text-2xl font-heading font-bold text-terracotta mb-2">
          Good morning, Sarah ☕
        </h2>
        <p className="text-muted-foreground font-medium">
          14 caregivers have sent you hugs today.
        </p>
      </section>

      {/* Quick Tiles */}
      <section className="grid grid-cols-2 gap-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
        <DashboardTile
          icon={Calendar}
          title="Care Tasks"
          subtitle="Dad's 10am pill"
          color="bg-terracotta/10 text-terracotta"
          href="/meds"
        />
        <DashboardTile
          icon={MessageCircle}
          title="Active Chats"
          subtitle="3 unread"
          color="bg-sage/10 text-sage"
          href="/messages"
        />
        <DashboardTile
          icon={MapPin}
          title="Local Support"
          subtitle="3 nearby"
          color="bg-mustard/10 text-mustard"
          href="/marketplace"
        />
        <DashboardTile
          icon={Smile}
          title="Mood Check"
          subtitle="How are you?"
          color="bg-lavender text-muted-foreground"
          href="#"
        />
      </section>

      {/* Mini Feed */}
      <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold text-lg text-foreground">Latest from your circle</h3>
          <button className="text-xs text-terracotta font-medium">View all</button>
        </div>

        <div className="space-y-4">
          <FeedItem
            author="Maria G."
            content="Just found a great respite care service in downtown! They have openings for next week."
            time="2h ago"
          />
          <FeedItem
            author="David L."
            content="Dad had a good day today. We managed to get through lunch without an argument. Small wins."
            time="4h ago"
          />
          <FeedItem
            author="Elena R."
            content="Does anyone have recommendations for a good pill organizer? The one we have is too hard to open."
            time="5h ago"
          />
        </div>
      </section>
    </AppLayout>
  );
}
