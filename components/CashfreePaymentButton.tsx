"use client";

import { useState } from "react";
import { load } from "@cashfreepayments/cashfree-js";

interface Props {
    amount: number; // INR
    receiptId?: string;
    customer?: {
        id?: string;
        email?: string;
        phone?: string;
    };
    returnUrl?: string;
    planType?: 'monthly' | 'yearly';
}

export default function CashfreePaymentButton({ amount, receiptId, customer, returnUrl, planType = 'monthly' }: Props) {
    const [loading, setLoading] = useState(false);

    const handlePay = async () => {
        console.log("--- Cashfree Payment Started ---");
        const isProd = process.env.NEXT_PUBLIC_CASHFREE_USE_PRODUCTION === "true";
        console.log("Mode:", isProd ? "production" : "sandbox");

        setLoading(true);
        try {
            // 1. Create Order on Server
            const res = await fetch("/api/payment/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount, receiptId, customer, returnUrl, planType }),
            });

            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") === -1) {
                const text = await res.text();
                console.error("Non-JSON response from server:", text);
                throw new Error("Server returned non-JSON response. Check console for details.");
            }

            const data = await res.json();
            if (!res.ok) {
                console.error("Order Creation Failed:", data);
                throw new Error(data.error || "Failed to create order");
            }

            const paymentSessionId = data.payment_session_id;
            if (!paymentSessionId) {
                console.error("No Session ID in response:", data);
                throw new Error("No payment session ID returned from server");
            }

            console.log("Received Session ID:", paymentSessionId.substring(0, 10) + "...");

            // 2. Load SDK and Checkout
            const cashfree = await load({
                mode: process.env.NEXT_PUBLIC_CASHFREE_USE_PRODUCTION === "true" ? "production" : "sandbox"
            });

            await cashfree.checkout({
                paymentSessionId,
                redirectTarget: "_self", // Redirect to return_url
            });

        } catch (e: any) {
            console.error("Payment Error:", e);
            alert(e.message || "Payment failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handlePay}
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg text-lg"
        >
            {loading ? "Processing…" : `Pay ₹${amount}/${planType === 'monthly' ? 'month' : 'year'}`}
        </button>
    );
}
