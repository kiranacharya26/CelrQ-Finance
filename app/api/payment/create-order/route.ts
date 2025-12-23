import { NextResponse } from "next/server";
import { Cashfree } from "cashfree-pg";

export async function POST(req: Request) {
    const appId = (process.env.NEXT_PUBLIC_CASHFREE_APP_ID || "").trim();
    const secretKey = (process.env.CASHFREE_SECRET_KEY || "").trim();
    const isProd = process.env.NEXT_PUBLIC_CASHFREE_USE_PRODUCTION === "true";

    // Configure Cashfree inside the handler
    Cashfree.XClientId = appId;
    Cashfree.XClientSecret = secretKey;
    Cashfree.XEnvironment = isProd
        ? Cashfree.Environment.PRODUCTION
        : Cashfree.Environment.SANDBOX;

    console.log("--- Cashfree Order Creation Started ---");
    console.log("Environment:", isProd ? "PRODUCTION" : "SANDBOX");
    console.log("App ID Present:", !!appId);
    if (appId) {
        console.log("App ID Prefix:", appId.substring(0, 4));
    }
    console.log("Secret Key Present:", !!secretKey);

    if (!appId || !secretKey) {
        console.error("Missing Cashfree credentials in environment variables");
        return NextResponse.json({
            error: "Cashfree credentials not configured. Please check your Netlify environment variables."
        }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { amount, receiptId, customer, returnUrl, planType } = body;

        // Determine amount based on plan type (Server-side validation)
        let orderAmount = 149;
        if (planType === 'yearly') {
            orderAmount = 1499; // ₹1499/year
        } else {
            orderAmount = 149; // ₹149/month
        }

        if (!customer?.email || !customer?.id) {
            return NextResponse.json({ error: "Customer email and ID are required" }, { status: 400 });
        }

        // Get origin for return_url
        const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "https://clerq.finance";

        // Return to home page with payment success flag
        const finalReturnUrl = returnUrl || `${origin}/?payment_status={order_status}&order_id={order_id}`;

        const orderPayload = {
            order_id: `order_${Date.now()}`,
            order_amount: orderAmount,
            order_currency: 'INR',
            order_note: receiptId || "",
            customer_details: {
                customer_id: customer.id,
                customer_name: customer.name || 'User',
                customer_email: customer.email,
                customer_phone: customer.phone || '9999999999'
            },
            order_meta: {
                return_url: finalReturnUrl,
                notify_url: `${origin}/api/payment/webhook`
            }
        };

        console.log("Creating order with payload:", JSON.stringify(orderPayload, null, 2));

        const response = await Cashfree.PGCreateOrder("2023-08-01", orderPayload);

        console.log("Cashfree Response Status:", response.status);
        if (response.data && response.data.payment_session_id) {
            console.log("Generated Payment Session ID:", response.data.payment_session_id.substring(0, 10) + "...");
        }

        return NextResponse.json(response.data);

    } catch (err: any) {
        console.error("Cashfree order creation error:", err);

        // Log detailed error if available from Cashfree SDK
        if (err.response) {
            console.error("Cashfree Error Response Data:", JSON.stringify(err.response.data, null, 2));
            console.error("Cashfree Error Response Status:", err.response.status);

            const cashfreeError = err.response.data?.message || "Cashfree authentication or validation failed";
            return NextResponse.json({
                error: cashfreeError,
                details: err.response.data
            }, { status: err.response.status || 500 });
        }

        const msg = err?.message || "Failed to create order";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
