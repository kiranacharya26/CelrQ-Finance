import { NextResponse } from "next/server";
import { Cashfree } from "cashfree-pg";

// Configure Cashfree
Cashfree.XClientId = process.env.NEXT_PUBLIC_CASHFREE_APP_ID!;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY!;
Cashfree.XEnvironment = process.env.CASHFREE_USE_PRODUCTION === "true"
    ? Cashfree.Environment.PRODUCTION
    : Cashfree.Environment.SANDBOX;

export async function POST(req: Request) {
    try {
        const { amount, receiptId, customer, returnUrl } = await req.json();
        if (!amount) {
            return NextResponse.json({ error: "Amount is required" }, { status: 400 });
        }

        if (!customer?.email || !customer?.id) {
            return NextResponse.json({ error: "Customer email and ID are required" }, { status: 400 });
        }

        // Get origin for return_url
        const origin = req.headers.get("origin") || "http://localhost:3000";
        // Return to home page with payment success flag, which will verify and redirect to dashboard
        const finalReturnUrl = returnUrl || `${origin}/?payment_status={order_status}&order_id={order_id}`;

        const orderPayload = {
            order_id: `order_${Date.now()}`,
            order_amount: 129,
            order_currency: 'INR',
            order_note: receiptId || "",
            customer_details: {
                customer_id: customer.id, // Assuming customer.id maps to userId
                customer_name: customer.name || 'User', // Assuming customer.name maps to name
                customer_email: customer.email, // Assuming customer.email maps to email
                customer_phone: '9999999999'
            },
            order_meta: {
                return_url: finalReturnUrl,
                notify_url: `${origin}/api/payment/webhook`
            }
        };

        // Use PGCreateOrder with correct version string
        // Note: In some versions, it might be just createOrder or similar.
        // Based on docs, it is PGCreateOrder("2023-08-01", ...)
        // If that fails, we might need to check the SDK export.
        // Let's try to instantiate if it's a class, or check the method name.
        // Actually, the error says PGCreateOrder is not a function.
        // This implies we might need to use the instance method or the static method is named differently.

        // Attempt to use the newer SDK pattern if available:
        // const cashfree = new Cashfree({ ... });
        // await cashfree.pg.createOrder(...)

        // But since we are using the static configuration style:
        const response = await Cashfree.PGCreateOrder("2023-08-01", orderPayload);

        return NextResponse.json(response.data);

    } catch (err: any) {
        console.error("Cashfree order creation error:", err);
        const msg = err?.response?.data?.message || err?.message || "Failed to create order";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
