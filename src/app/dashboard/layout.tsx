"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/stores";
import {
    Briefcase,
    Calendar,
    Car,
    Home,
    User,
    Users,
    FileDown,
    FileText,
    JapaneseYen,
    Trash2,
    Gavel,
    Package
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
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
        try {
            await logout();
            toast("已退出登录");
            // 确保状态更新后再跳转
            setTimeout(() => {
                router.replace("/login");
            }, 100);
        } catch (error) {
            console.error("登出失败:", error);
            toast.error("登出失败，请重试");
        }
    };

    // 所有可用的导航项目（管理员）
    const adminNavItems = [
        { name: "系统概览", path: "/dashboard", icon: Home },
        { name: "预约管理", path: "/dashboard/appointments", icon: Calendar },
        { name: "用户管理", path: "/dashboard/users", icon: Users },
        { name: "人员管理", path: "/dashboard/staff", icon: Briefcase },
        { name: "车辆管理", path: "/dashboard/vehicles", icon: Car },
        { name: "报价管理", path: "/dashboard/checkout", icon: JapaneseYen },
        { name: "尾料竞价", path: "/dashboard/waste-auctions", icon: Gavel },
        { name: "信息管理", path: "/dashboard/info", icon: FileText },
        { name: "数据导出", path: "/dashboard/exports", icon: FileDown },
    ];

    // 普通用户导航项目
    const userNavItems = [
        { name: "我的预约", path: "/dashboard/appointments", icon: Calendar },
        { name: "销毁任务", path: "/dashboard/destruction", icon: Trash2 }
    ];

    // 尾料处置商导航项目
    const wasteDisposalNavItems = [
        { name: "竞价大厅", path: "/dashboard/auctions", icon: Gavel },
        { name: "我的出价", path: "/dashboard/my-bids", icon: Package },
    ];

    // 根据用户角色过滤导航项目
    const getNavItems = () => {
        if (isAdmin()) {
            return adminNavItems;
        } else if (user?.role === 'waste_disposal_merchant') {
            return wasteDisposalNavItems;
        } else {
            return userNavItems;
        }
    };

    const navItems = getNavItems();

    // 标题文本根据用户角色不同
    const headerTitle = isAdmin() ? "预约管理系统" : "中国融通销毁中心预约登记系统";

    return (
        <>
            {/* 只在客户端组件准备好后，再渲染AuthGuard，避免初始化状态导致的循环重定向 */}
            {isReady ? (
                <AuthGuard>
                    <div className="flex min-h-screen flex-col">
                        <header className="bg-white border-b border-gray-200 shadow-sm">
                            <div className="w-full px-4 py-3 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <Image
                                        src="/logo.jpeg"
                                        alt="Logo"
                                        width={40}
                                        height={40}
                                        className="rounded-md"
                                    />
                                    <h1 className="text-xl font-bold">{headerTitle}</h1>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <User size={16} />
                                        <span>{user?.name}</span>
                                    </div>
                                    <Button variant="outline" onClick={handleLogout}>
                                        退出登录
                                    </Button>
                                </div>
                            </div>
                        </header>
                        <div className="flex flex-1">
                            {/* 管理员和尾料处置商显示侧边导航栏 */}
                            {(isAdmin() || user?.role === 'waste_disposal_merchant') ? (
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
                            ) : null}
                            <main className={`flex-1 bg-gray-50 p-6 ${!(isAdmin() || user?.role === 'waste_disposal_merchant') ? 'w-full' : ''}`}>
                                {children}
                            </main>
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
