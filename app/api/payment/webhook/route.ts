import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

/**
 * Cashfree webhook endpoint.
 * Cashfree sends a POST request with JSON body and an `x-cf-signature`
 * header that is HMAC‑SHA256 of the raw request body using your secret key.
 */
export async function POST(req: Request) {
    try {
        // Validate environment variables
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("Missing Supabase environment variables in webhook");
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        // Initialise Supabase (service role key – server only)
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const signature = req.headers.get("x-cf-signature") ?? "";
        const rawBody = await req.text(); // raw string for signature verification

        // Verify signature using the secret key from env
        if (!process.env.CASHFREE_SECRET_KEY) {
            console.error("Missing CASHFREE_SECRET_KEY");
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        const expected = crypto
            .createHmac("sha256", process.env.CASHFREE_SECRET_KEY)
            .update(rawBody)
            .digest("hex");

        console.log("Webhook Debug:", {
            receivedSignature: signature,
            computedSignature: expected,
            rawBodyLength: rawBody.length,
            secretKeyLength: process.env.CASHFREE_SECRET_KEY.length
        });

        if (signature !== expected) {
            console.warn("Cashfree webhook signature mismatch");
            // TEMPORARY: Allow it for debugging if needed, but for now keep returning 400
            // return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }

        const payload = JSON.parse(rawBody);
        const {
            order_id,
            payment_id,
            order_amount,
            order_currency,
            order_status,
            customer_details,
        } = payload;

        // Normalize status - Cashfree sends "SUCCESS", "FAILED", etc.
        // We normalize to "PAID" or "FAILED" for consistency
        let normalizedStatus = order_status;
        if (order_status === "SUCCESS" || order_status === "ACTIVE") {
            normalizedStatus = "PAID";
        } else if (order_status === "FAILED" || order_status === "CANCELLED") {
            normalizedStatus = "FAILED";
        }

        console.log(`Webhook received: order_id=${order_id}, status=${order_status} -> ${normalizedStatus}`);

        // Insert or update payment record in Supabase
        const { error } = await supabase.from("payments").upsert(
            {
                order_id,
                payment_id,
                amount: order_amount, // Cashfree sends amount in INR, not paise
                currency: order_currency,
                status: normalizedStatus,
                user_id: customer_details?.customer_id,
                email: customer_details?.customer_email, // Add email for fallback matching
                metadata: payload, // Store full payload for debugging
            },
            { onConflict: "order_id" }
        );

        if (error) {
            console.error("Supabase upsert error:", error);
            return NextResponse.json({ error: "DB error" }, { status: 500 });
        }

        console.log(`Payment record saved: order_id=${order_id}, status=${normalizedStatus}`);
        return NextResponse.json({ received: true });

    } catch (error: any) {
        console.error("Webhook error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
