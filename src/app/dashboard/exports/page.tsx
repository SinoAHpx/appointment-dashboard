"use client";

import { DataExport } from "@/components/exports/DataExport";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/lib/stores";
import { FileDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ExportsPage() {
    const router = useRouter();
    const { isAuthenticated, isAdmin } = useAuthStore();

    // 如果用户未登录或不是管理员，重定向到登录页面
    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
        } else if (!isAdmin()) {
            router.push("/dashboard");
        }
    }, [isAuthenticated, isAdmin, router]);

    if (!isAuthenticated || !isAdmin()) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">数据导出</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileDown className="h-5 w-5" />
                        数据导出工具
                    </CardTitle>
                    <CardDescription>
                        导出数据库中的预约信息、用户信息和车辆信息
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DataExport />
                </CardContent>
            </Card>
        </div>
    );
} 