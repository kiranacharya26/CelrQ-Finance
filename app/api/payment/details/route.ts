import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
    try {
        // Validate environment variables
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("Missing Supabase environment variables");
            return NextResponse.json({
                error: "Server configuration error"
            }, { status: 500 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");

        if (!email) {
            return NextResponse.json({
                error: "Email required"
            }, { status: 400 });
        }

        // Fetch payment details for this user
        const { data, error } = await supabase
            .from("payments")
            .select("*")
            .ilike("email", email)
            .eq("status", "PAID")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (error) {
            // If no payment found, return 404
            if (error.code === 'PGRST116') {
                return NextResponse.json({
                    error: "No payment found"
                }, { status: 404 });
            }

            console.error("Error fetching payment details:", error);
            return NextResponse.json({
                error: error.message
            }, { status: 500 });
        }

        return NextResponse.json(data);

    } catch (error: any) {
        console.error("Unexpected error in payment details:", error);
        return NextResponse.json({
            error: "Internal server error"
        }, { status: 500 });
    }
}
