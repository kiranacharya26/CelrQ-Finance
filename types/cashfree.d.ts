declare module '@cashfreepayments/cashfree-js' {
    export interface CashfreeInstance {
        checkout(options: {
            paymentSessionId: string;
            redirectTarget?: string;
        }): Promise<void>;
    }

    export function load(options?: {
        mode?: 'sandbox' | 'production';
    }): Promise<CashfreeInstance>;
}
