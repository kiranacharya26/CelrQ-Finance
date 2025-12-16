import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Cashfree } from "cashfree-pg";

export async function POST(req: Request) {
    const isProduction = process.env.CASHFREE_USE_PRODUCTION === "true";

    try {
        // Validate environment variables
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("Missing Supabase environment variables in verify");
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        // Configure Cashfree
        if (!process.env.NEXT_PUBLIC_CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
            console.error("Missing Cashfree environment variables");
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        console.log("Cashfree Environment:", {
            appId: process.env.NEXT_PUBLIC_CASHFREE_APP_ID?.substring(0, 10) + "...",
            isProduction,
            environment: isProduction ? "PRODUCTION" : "SANDBOX"
        });

        Cashfree.XClientId = process.env.NEXT_PUBLIC_CASHFREE_APP_ID;
        Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;
        Cashfree.XEnvironment = isProduction
            ? Cashfree.Environment.PRODUCTION
            : Cashfree.Environment.SANDBOX;

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const body = await req.json();
        const { orderId, customerEmail } = body;

        if (!orderId) {
            return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
        }

        console.log(`Verifying payment for order: ${orderId}`);

        // 1. Fetch order details to get customer_id (user_id)
        let orderData;

        try {
            // Direct fetch fallback since SDK method is failing
            const baseUrl = isProduction ? "https://api.cashfree.com" : "https://sandbox.cashfree.com";
            const fetchRes = await fetch(`${baseUrl}/pg/orders/${orderId}`, {
                method: 'GET',
                headers: {
                    'x-client-id': process.env.NEXT_PUBLIC_CASHFREE_APP_ID!,
                    'x-client-secret': process.env.CASHFREE_SECRET_KEY!,
                    'x-api-version': '2023-08-01'
                }
            });

            if (!fetchRes.ok) {
                const errText = await fetchRes.text();
                throw new Error(`Cashfree API Error: ${fetchRes.status} ${errText}`);
            }

            orderData = await fetchRes.json();
            console.log("✅ Cashfree Order Fetch Success (Direct API):", JSON.stringify(orderData, null, 2));
        } catch (cfError: any) {
            console.error("❌ Cashfree verification failed:", cfError.message);
            // Strict verification: If we can't verify with Cashfree, we fail.
            return NextResponse.json({ error: "Failed to verify with payment gateway" }, { status: 502 });
        }

        // If we successfully verified with Cashfree
        if (orderData.order_status === "PAID" || orderData.order_status === "ACTIVE") {
            console.log("✅ Order is PAID:", orderId);

            const paymentRecord = {
                order_id: orderId,
                status: "PAID",
                amount: orderData.order_amount,
                currency: orderData.order_currency,
                user_id: orderData.customer_details?.customer_id || "unknown_user",
                email: orderData.customer_details?.customer_email || null,
                metadata: orderData,
            };

            console.log("Attempting to save to Supabase:", paymentRecord);

            const { data, error } = await supabase.from("payments").upsert(
                paymentRecord,
                { onConflict: "order_id" }
            ).select();

            if (error) {
                console.error("Supabase update error:", error);
                return NextResponse.json({ error: "Database update failed: " + error.message }, { status: 500 });
            }

            console.log("✅ Payment saved successfully:", data);
            return NextResponse.json({ success: true, status: "PAID" });
        }

        console.warn("⚠️  Order status is not PAID:", orderData.order_status);
        return NextResponse.json({ success: false, status: orderData.order_status });
    } catch (error: any) {
        console.error("❌ Payment verification error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
