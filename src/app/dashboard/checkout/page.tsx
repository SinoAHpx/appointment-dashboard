import { Suspense } from "react";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CheckoutPage() {
    return (
        <div className="container mx-auto p-6 space-y-6">
            <h1 className="text-3xl font-bold">报价管理</h1>

            <div className="max-w-3xl mx-auto">
                <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-4">服务定价设置</h2>
                        <CheckoutForm />
                    </Card>
                </Suspense>
            </div>
        </div>
    );
} 