"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createCareCircle(name: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    console.log("Creating circle for user:", user.id, "with name:", name);

    // 1. Create the circle
    const { data: circle, error: circleError } = await supabase
        .from("care_circles")
        .insert({
            name,
            created_by: user.id,
        })
        .select()
        .single();

    if (circleError) {
        console.error("Error creating circle:", circleError);
        throw new Error(`Failed to create care circle: ${circleError.message}`);
    }

    console.log("Circle created:", circle);

    // 2. Add creator as admin member
    const { error: memberError } = await supabase
        .from("care_circle_members")
        .insert({
            circle_id: circle.id,
            user_id: user.id,
            role: "admin",
        });

    if (memberError) {
        console.error("Error adding member:", memberError);
        // Cleanup circle if member creation fails? Or just throw.
        throw new Error(`Failed to join created circle: ${memberError.message}`);
    }

    console.log("Member added successfully");

    revalidatePath("/care-circles");
    return circle;
}

export async function getCareCircles() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    // Get circles where user is a member
    const { data, error } = await supabase
        .from("care_circle_members")
        .select(`
      circle_id,
      role,
      care_circles (
        id,
        name,
        created_by,
        created_at
      )
    `)
        .eq("user_id", user.id);

    if (error) {
        console.error("Error fetching circles:", error);
        return [];
    }

    // Flatten the structure
    return data.map((item: any) => ({
        ...item.care_circles,
        my_role: item.role,
    }));
}

export async function getCircleDetails(circleId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.error("No user found");
        throw new Error("Unauthorized");
    }

    console.log("Getting circle details for:", circleId, "user:", user.id);

    // Verify membership
    const { data: membership, error: membershipError } = await supabase
        .from("care_circle_members")
        .select("role")
        .eq("circle_id", circleId)
        .eq("user_id", user.id)
        .single();

    console.log("Membership query result:", { membership, membershipError });

    if (membershipError || !membership) {
        console.error("Membership check failed:", membershipError);
        throw new Error("You are not a member of this circle");
    }

    // Get circle details
    const { data: circle, error: circleError } = await supabase
        .from("care_circles")
        .select("*")
        .eq("id", circleId)
        .single();

    if (circleError) {
        console.error("Circle fetch error:", circleError);
        throw new Error("Circle not found");
    }

    // Get members
    const { data: members, error: membersError } = await supabase
        .from("care_circle_members")
        .select(`
      role,
      joined_at,
      profiles (
        id,
        full_name,
        username,
        avatar_url
      )
    `)
        .eq("circle_id", circleId);

    console.log("Circle data:", { circle, members, myRole: membership.role });

    return {
        circle,
        members: members?.map((m: any) => ({
            ...m.profiles,
            role: m.role,
            joined_at: m.joined_at,
        })) || [],
        myRole: membership.role,
    };
}

export async function addMemberToCircle(circleId: string, email: string) {
    const supabase = await createClient();

    // 1. Find user by email (Note: Supabase Auth table is not directly queryable for email by default for security, 
    // but we might have a profile lookup or need to use an admin client if we want to search by email.
    // Alternatively, search by username if that's public in profiles).
    // For now, let's assume we search by username as per user request "Enter another user's email/username".
    // Searching by username in public.profiles is safer.

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", email) // Treating 'email' arg as username for now based on schema
        .single();

    if (profileError || !profile) {
        throw new Error("User not found. Please check the username.");
    }

    // 2. Check if already a member
    const { data: existing } = await supabase
        .from("care_circle_members")
        .select("user_id")
        .eq("circle_id", circleId)
        .eq("user_id", profile.id)
        .single();

    if (existing) {
        throw new Error("User is already a member of this circle");
    }

    // 3. Add member
    const { error: addError } = await supabase
        .from("care_circle_members")
        .insert({
            circle_id: circleId,
            user_id: profile.id,
            role: "member",
        });

    if (addError) {
        throw new Error("Failed to add member");
    }

    revalidatePath(`/care-circles/${circleId}`);
}
