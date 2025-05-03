"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store";
import {
    Briefcase,
    Calendar,
    Car,
    Home,
    User,
    Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { logout, user, isAuthenticated, isAdmin } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();

    // 添加渲染状态，防止初始化时闪烁或不必要的重定向
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // 在客户端渲染后标记组件已准备好
        const timer = setTimeout(() => {
            setIsReady(true);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    const handleLogout = async () => {
        await logout();
        toast("已退出登录");
        router.push("/login");
    };

    // 所有可用的导航项目
    const allNavItems = [
        { name: "仪表盘", path: "/dashboard", icon: Home },
        { name: "预约管理", path: "/dashboard/appointments", icon: Calendar },
        { name: "用户管理", path: "/dashboard/users", icon: Users },
        { name: "人员管理", path: "/dashboard/staff", icon: Briefcase },
        { name: "车辆管理", path: "/dashboard/vehicles", icon: Car },
    ];

    // 根据用户角色过滤导航项目
    const navItems = isAdmin()
        ? allNavItems
        : allNavItems.filter(
            (item) =>
                item.path === "/dashboard" || item.path === "/dashboard/appointments",
        );

    return (
        <>
            {/* 只在客户端组件准备好后，再渲染AuthGuard，避免初始化状态导致的循环重定向 */}
            {isReady ? (
                <AuthGuard>
                    <div className="flex min-h-screen flex-col">
                        <header className="bg-white border-b border-gray-200 shadow-sm">
                            <div className="w-full px-4 py-3 flex justify-between items-center">
                                <h1 className="text-xl font-bold">预约管理系统</h1>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <User size={16} />
                                        <span>{user?.name}</span>
                                        <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                                            {user?.role === "admin" ? "管理员" : "用户"}
                                        </span>
                                    </div>
                                    <Button variant="outline" onClick={handleLogout}>
                                        退出登录
                                    </Button>
                                </div>
                            </div>
                        </header>
                        <div className="flex flex-1">
                            <aside className="w-64 bg-white border-r border-gray-200 shadow-sm">
                                <nav className="p-4">
                                    <ul className="space-y-2">
                                        {navItems.map((item) => {
                                            const Icon = item.icon;
                                            const isActive = pathname === item.path;
                                            return (
                                                <li key={item.path}>
                                                    <Link
                                                        href={item.path}
                                                        className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${isActive
                                                            ? "bg-primary/10 text-primary font-medium"
                                                            : "hover:bg-gray-100"
                                                            }`}
                                                    >
                                                        <Icon size={18} />
                                                        <span>{item.name}</span>
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </nav>
                            </aside>
                            <main className="flex-1 bg-gray-50 p-6">{children}</main>
                        </div>
                    </div>
                </AuthGuard>
            ) : (
                // 显示加载状态
                <div className="flex min-h-screen items-center justify-center">
                    <div className="text-center">
                        <p>页面加载中...</p>
                    </div>
                </div>
            )}
        </>
    );
}
