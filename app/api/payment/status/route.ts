import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
    try {
        // Validate environment variables
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("Missing Supabase environment variables");
            return NextResponse.json({
                hasPaid: false,
                error: "Server configuration error"
            }, { status: 500 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");
        const userId = searchParams.get("userId");

        console.log("Payment status check:", { userId, email });

        if (!email && !userId) {
            return NextResponse.json({
                hasPaid: false,
                error: "Email or User ID required"
            }, { status: 400 });
        }

        // Check for any successful payment for this user
        // We check both user_id AND email to be safe
        let query = supabase.from("payments").select("*").in("status", ["PAID", "SUCCESS"]);

        if (userId && email) {
            // Check if either user_id matches OR email matches (case insensitive)
            query = query.or(`user_id.eq.${userId},email.ilike.${email}`);
        } else if (userId) {
            query = query.eq("user_id", userId);
        } else if (email) {
            query = query.ilike("email", email);
        }

        // Check if user has a payment record
        // We check for 'PAID' status (Cashfree standard) or 'SUCCESS' (legacy/webhook)
        const { data: payments, error } = await query
            .order('created_at', { ascending: false })
            .limit(1);

        const payment = payments && payments.length > 0 ? payments[0] : null;

        console.log("Payment query result:", {
            payment: payment,
            error: error?.message,
        });

        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine
            console.error("Error fetching payment status:", error);

            // If table doesn't exist, return false instead of error
            if (
                error.code === 'PGRST205' ||
                error.message?.includes("relation") ||
                error.message?.includes("does not exist") ||
                error.message?.includes("Could not find the table")
            ) {
                console.warn("Payments table does not exist. Assuming no payments made.");
                return NextResponse.json({ hasPaid: false });
            }

            return NextResponse.json({
                hasPaid: false,
                error: error.message
            }, { status: 500 });
        }

        // Check for trial start record
        const { data: trialRecord } = await supabase
            .from('payments')
            .select('created_at')
            .eq('order_id', `trial_${email}`)
            .single();

        const { data: firstUpload } = await supabase
            .from('uploads')
            .select('created_at')
            .eq('user_email', email)
            .order('created_at', { ascending: true })
            .limit(1)
            .single();

        let isTrial = false;
        let trialDaysRemaining = 0;
        let hasPaid = !!payment;

        if (!hasPaid) {
            // Determine trial start date:
            // 1. Prefer the permanent 'TRIAL_STARTED' payment record
            // 2. Fallback to first upload date (backward compatibility)
            // 3. If neither, user hasn't started trial yet (Day 1)

            let trialStartDate: Date | null = null;

            if (trialRecord) {
                trialStartDate = new Date(trialRecord.created_at);
            } else if (firstUpload) {
                trialStartDate = new Date(firstUpload.created_at);
            }

            if (trialStartDate) {
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - trialStartDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays <= 7) {
                    isTrial = true;
                    trialDaysRemaining = 7 - diffDays;
                    hasPaid = true; // Grant access
                } else {
                    // Trial expired
                    isTrial = false;
                    trialDaysRemaining = 0;
                    hasPaid = false; // Deny access
                }
            } else {
                // No trial record and no uploads -> Brand new user -> Start Trial
                console.log("Starting new trial for user:", email);

                // Record trial start
                const { error: insertError } = await supabase.from('payments').insert({
                    email: email,
                    user_id: userId || null,
                    status: 'TRIAL_STARTED',
                    order_id: `trial_${email}`,
                    amount: 0,
                    created_at: new Date().toISOString()
                });

                if (insertError) {
                    console.error("Failed to start trial:", insertError);
                    // If table missing or other error, we still allow access for now to avoid blocking new users
                    // but we warn.
                }

                isTrial = true;
                trialDaysRemaining = 7;
                hasPaid = true;
            }
        }

        // Check if user has ANY past paid/cancelled subscription history
        // This helps distinguish between a new user (eligible for trial) and a returning user (needs to renew)
        let wasPremium = false;
        if (userId || email) {
            let historyQuery = supabase
                .from('payments')
                .select('*', { count: 'exact', head: true })
                .in('status', ['PAID', 'SUCCESS', 'CANCELLED']);

            if (userId && email) {
                historyQuery = historyQuery.or(`user_id.eq.${userId},email.ilike.${email}`);
            } else if (userId) {
                historyQuery = historyQuery.eq("user_id", userId);
            } else if (email) {
                historyQuery = historyQuery.ilike("email", email);
            }

            const { count } = await historyQuery;
            if (count && count > 0) {
                wasPremium = true;
            }
        }

        console.log("Final status:", { hasPaid, isTrial, trialDaysRemaining, wasPremium });
        return NextResponse.json({
            hasPaid,
            isTrial,
            trialDaysRemaining,
            paymentDetails: payment,
            wasPremium
        });

    } catch (error: any) {
        console.error("Unexpected error in payment status check:", error);
        return NextResponse.json({
            hasPaid: false,
            error: "Internal server error"
        }, { status: 500 });
    }
}
