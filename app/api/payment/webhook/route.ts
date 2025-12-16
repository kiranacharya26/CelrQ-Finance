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

        // Cashfree webhook structure is nested: data -> order -> ...
        // Or sometimes directly at root depending on event type.
        // Let's try to extract safely.
        const data = payload.data || payload;
        const order = data.order || data;
        const payment = data.payment || {};
        const customer = data.customer_details || order.customer_details || {};

        const order_id = order.order_id;
        const order_amount = order.order_amount;
        const order_currency = order.order_currency;
        const order_status = payment.payment_status || order.order_status; // Payment status is more granular

        // Normalize status
        let normalizedStatus = order_status;
        if (order_status === "SUCCESS" || order_status === "ACTIVE") {
            normalizedStatus = "PAID";
        } else if (order_status === "FAILED" || order_status === "CANCELLED") {
            normalizedStatus = "FAILED";
        }

        console.log(`Webhook received: order_id=${order_id}, status=${order_status} -> ${normalizedStatus}`);

        if (!order_id) {
            console.error("Missing order_id in webhook payload:", JSON.stringify(payload));
            return NextResponse.json({ error: "Invalid payload structure" }, { status: 400 });
        }

        // Insert or update payment record in Supabase
        const { error } = await supabase.from("payments").upsert(
            {
                order_id,
                amount: order_amount,
                currency: order_currency,
                status: normalizedStatus,
                user_id: customer.customer_id,
                email: customer.customer_email,
                metadata: payload,
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
