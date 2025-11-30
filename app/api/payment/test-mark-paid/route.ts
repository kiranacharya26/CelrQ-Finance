import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth";

/**
 * DEVELOPMENT ONLY: Manually mark current user as paid
 * This endpoint should be removed in production!
 */
export async function POST(req: Request) {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: "Not available in production" }, { status: 403 });
    }

    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { userId, email } = await req.json();

        if (!userId && !email) {
            return NextResponse.json({ error: "userId or email required" }, { status: 400 });
        }

        // Create a test payment record
        const { data, error } = await supabase.from("payments").insert({
            order_id: `test_order_${Date.now()}`,
            payment_id: `test_payment_${Date.now()}`,
            user_id: userId,
            email: email,
            amount: 129,
            currency: "INR",
            status: "PAID",
            metadata: { test: true, created_at: new Date().toISOString() }
        });

        if (error) {
            console.error("Error creating test payment:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: "User marked as paid (TEST MODE)",
            userId,
            email
        });

    } catch (error: any) {
        console.error("Error in test payment endpoint:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
