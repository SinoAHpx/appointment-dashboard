"use client";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    useAppointmentStore,
    useAuthStore,
    useStaffStore,
    useVehicleStore,
} from "@/lib/store";
import { CalendarDays, Car, Clock, UserCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";

export default function DashboardPage() {
    const { isAuthenticated, isAdmin, user } = useAuthStore();
    const router = useRouter();
    const [isReady, setIsReady] = useState(false);

    // Fetch data from stores
    const { appointments, fetchAppointments } = useAppointmentStore();
    const { staffList } = useStaffStore();
    const { vehicles } = useVehicleStore();

    // Calculate stats (example logic, replace with more robust logic if needed)
    const today = new Date().toISOString().split("T")[0];
    const todaysAppointments = appointments.filter((app) =>
        (app.dateTime ?? '').startsWith(today),
    );
    const pendingAppointments = appointments.filter(
        (app) => app.status === "pending",
    );
    const availableStaff = staffList.filter((staff) => staff.status === "active");
    const availableVehicles = vehicles.filter((vehicle) => vehicle.status === "available");

    useEffect(() => {
        // 在客户端渲染后标记组件已准备好
        const timer = setTimeout(() => {
            setIsReady(true);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    // 如果是普通用户，直接重定向到预约页面
    useEffect(() => {
        if (isReady && isAuthenticated && !isAdmin()) {
            router.push("/dashboard/appointments");
        }
    }, [isReady, isAuthenticated, isAdmin, router]);

    // 普通用户不应该看到此页面，仅管理员可见
    if (!isAdmin()) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <p>正在加载中，请稍候...</p>
            </div>
        );
    }

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const handleCardClick = (path: string) => {
        router.push(path);
    };

    return (
        <AuthGuard requiredRole="admin">
            <div className="space-y-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold">
                        欢迎回来, {user?.username || "用户"}
                    </h1>
                    <p className="text-muted-foreground">查看并管理您的预约系统</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleCardClick("/dashboard/appointments")}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">总预约数</CardTitle>
                            <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{appointments.length}</div>
                            {/* Add comparison logic if historical data is available */}
                            {/* <p className="text-xs text-muted-foreground">
                                较上周增长 +12%
                            </p> */}
                        </CardContent>
                    </Card>
                    <Card
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleCardClick("/dashboard/appointments")}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">今日预约</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {todaysAppointments.length}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                其中{" "}
                                {
                                    pendingAppointments.filter((app) =>
                                        (app.dateTime ?? '').startsWith(today),
                                    ).length
                                }{" "}
                                个待确认
                            </p>
                        </CardContent>
                    </Card>
                    <Card
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleCardClick("/dashboard/staff")}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">工作人员</CardTitle>
                            <UserCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{staffList.length}</div>
                            <p className="text-xs text-muted-foreground">
                                {availableStaff.length} 人可用
                            </p>
                        </CardContent>
                    </Card>
                    <Card
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleCardClick("/dashboard/vehicles")}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">车辆</CardTitle>
                            <Car className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{vehicles.length}</div>
                            <p className="text-xs text-muted-foreground">
                                可用 {availableVehicles.length} 辆
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="col-span-1">
                        <CardHeader>
                            <CardTitle>预约管理</CardTitle>
                            <CardDescription>管理您的预约记录</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col space-y-2">
                                <div className="flex items-center justify-between">
                                    <span>今日预约</span>
                                    <span className="font-medium">{todaysAppointments.length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>待确认预约</span>
                                    <span className="font-medium">
                                        {pendingAppointments.length}
                                    </span>
                                </div>
                                {/* Add logic for upcoming appointments if needed */}
                                {/* <div className="flex items-center justify-between">
                                    <span>即将到期预约</span>
                                    <span className="font-medium">5</span>
                                </div> */}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button asChild className="w-full">
                                <Link href="/dashboard/appointments">查看所有预约</Link>
                            </Button>
                        </CardFooter>
                    </Card>

                    {isAdmin() && (
                        <Card className="col-span-1">
                            <CardHeader>
                                <CardTitle>人员管理</CardTitle>
                                <CardDescription>管理您的员工信息</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span>总员工数</span>
                                        <span className="font-medium">{staffList.length}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>当前可用</span>
                                        <span className="font-medium">{availableStaff.length}</span>
                                    </div>
                                    {/* Add logic for staff on leave if needed */}
                                    {/* <div className="flex items-center justify-between">
                                        <span>本周休假</span>
                                        <span className="font-medium">2</span>
                                    </div> */}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button asChild className="w-full">
                                    <Link href="/dashboard/staff">查看所有员工</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    )}
                    {isAdmin() && (
                        <div className="grid gap-4 grid-cols-1">
                            {/* Vehicle Management Card - Adjusted grid for removal of Reports */}
                            <Card className="col-span-1">
                                <CardHeader>
                                    <CardTitle>车辆管理</CardTitle>
                                    <CardDescription>管理您的车辆信息</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span>总车辆数</span>
                                            <span className="font-medium">{vehicles.length}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>可用车辆</span>
                                            <span className="font-medium">
                                                {availableVehicles.length}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button asChild className="w-full">
                                        <Link href="/dashboard/vehicles">查看所有车辆</Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </AuthGuard>
    );
}
