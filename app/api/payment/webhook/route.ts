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

        const signature = req.headers.get("x-webhook-signature") ?? "";
        const timestamp = req.headers.get("x-webhook-timestamp") ?? "";
        const rawBody = await req.text();

        const webhookSecret = (process.env.CASHFREE_WEBHOOK_SECRET || process.env.CASHFREE_SECRET_KEY || "").trim();

        if (!webhookSecret) {
            console.error("Missing CASHFREE_WEBHOOK_SECRET or CASHFREE_SECRET_KEY");
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        // Verify signature: HMAC-SHA256(timestamp + rawBody, secret)
        const dataToVerify = timestamp + rawBody;
        const expected = crypto
            .createHmac("sha256", webhookSecret)
            .update(dataToVerify)
            .digest("base64");

        console.log("Webhook Verification:", {
            received: signature,
            expected: expected,
            timestamp: timestamp
        });

        if (signature !== expected) {
            console.warn("Cashfree webhook signature mismatch!");
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }

        const payload = JSON.parse(rawBody);
        const eventType = payload.type;
        const data = payload.data || payload;
        const order = data.order || data;
        const payment = data.payment || {};
        const customer = data.customer_details || order.customer_details || {};

        const order_id = order.order_id;
        const order_amount = order.order_amount;
        const order_currency = order.order_currency;

        // Determine status based on event type
        let normalizedStatus = "PENDING";
        if (eventType === "PAYMENT_SUCCESS_WEBHOOK" || eventType === "ORDER_PAID_WEBHOOK") {
            normalizedStatus = "PAID";
        } else if (eventType === "PAYMENT_FAILED_WEBHOOK" || eventType === "ORDER_FAILED_WEBHOOK") {
            normalizedStatus = "FAILED";
        } else {
            // Fallback to payment_status if type is unknown
            const pStatus = payment.payment_status || order.order_status;
            if (pStatus === "SUCCESS") normalizedStatus = "PAID";
            else if (pStatus === "FAILED") normalizedStatus = "FAILED";
        }

        console.log(`[Webhook] Event: ${eventType}, Order: ${order_id}, Status: ${normalizedStatus}`);

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
