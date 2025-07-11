"use client";

import { Suspense, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { InfoForm } from "@/components/info/info-form";
import { useSystemInfoStore } from "@/lib/stores/info";

function InfoPageContent() {
    const { fetchInfo, isLoading } = useSystemInfoStore();

    useEffect(() => {
        // 页面加载时预获取数据
        fetchInfo();
    }, [fetchInfo]);

    return (
        <div className="container mx-auto p-2 space-y-6">
            <div className="max-w-3xl mx-auto">
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">系统信息设置</h2>
                    <InfoForm />
                </Card>
            </div>
        </div>
    );
}

function InfoPageSkeleton() {
    return (
        <div className="container mx-auto p-2 space-y-6">
            <div className="max-w-3xl mx-auto">
                <Card className="p-6">
                    <Skeleton className="h-7 w-32 mb-4" />
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-32 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="flex justify-end">
                            <Skeleton className="h-10 w-24" />
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default function InfoPage() {
    return (
        <Suspense fallback={<InfoPageSkeleton />}>
            <InfoPageContent />
        </Suspense>
    );
} 