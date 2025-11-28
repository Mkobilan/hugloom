import { AppLayout } from "@/components/layout/AppLayout";
import { CareCircleList } from "@/components/care/CareCircleList";
import { getCareCircles } from "@/lib/actions/care-circles";

export default async function CareCirclesPage() {
    const circles = await getCareCircles();

    return (
        <AppLayout>
            <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-heading font-bold text-terracotta mb-2">My Care Circles</h1>
                    <p className="text-white">
                        Collaborate with family and caregivers to manage tasks and appointments together.
                    </p>
                </div>

                <CareCircleList circles={circles} />
            </div>
        </AppLayout>
    );
}
