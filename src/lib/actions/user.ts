"use server";

import { createClient } from "@/lib/supabase/server";

export async function searchUsers(query: string) {
    if (!query || query.length < 2) {
        return [];
    }

    const supabase = await createClient();

    const { data: users, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(5);

    if (error) {
        console.error("Error searching users:", error);
        return [];
    }

    return users;
}
