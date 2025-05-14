import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { InfoForm } from "@/components/info/info-form";

export default function InfoPage() {
    return (
        <div className="container mx-auto p-2 space-y-6">
            <div className="max-w-3xl mx-auto">
                <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
                    <Card className="p-6">
                        <h2 className="text-xl font-semibold mb-4">系统信息设置</h2>
                        <InfoForm />
                    </Card>
                </Suspense>
            </div>
        </div>
    );
} 