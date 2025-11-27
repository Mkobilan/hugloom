"use client";

import { AppLayout } from '@/components/layout/AppLayout';
import { CareDashboard } from '@/components/care/CareDashboard';

export default function CareTasksPage() {
    return (
        <AppLayout>
            <CareDashboard />
        </AppLayout>
    );
}
