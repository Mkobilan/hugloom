import { AppLayout } from "@/components/layout/AppLayout";
import { getCircleDetails } from "@/lib/actions/care-circles";
import { createClient } from "@/lib/supabase/server";
import { CircleDetailView } from "@/components/care/CircleDetailView";
import { redirect } from "next/navigation";

export default async function CircleDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Get circle details
    const circleData = await getCircleDetails(id);

    if (!circleData) {
        return (
            <AppLayout>
                <div className="max-w-4xl mx-auto p-6">
                    <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
                    <p className="text-gray-600 mt-2">You are not a member of this Care Circle.</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <CircleDetailView circleData={circleData} circleId={id} />
        </AppLayout>
    );
}
