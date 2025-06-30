"use client";

import { useAuthStore } from "@/lib/stores";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AuthGuardProps {
    children: React.ReactNode;
    requiredRole?: "admin" | "user" | "waste_disposal_merchant";
}

/**
 * 认证守卫组件，用于保护需要登录才能访问的页面
 * 可以通过requiredRole指定需要的角色权限（admin或user或waste_disposal_merchant）
 */
export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
    const { isAuthenticated, user, isAdmin } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        // 检查是否已登录
        if (!isAuthenticated) {
            // 用户未登录，重定向到登录页面
            router.push("/login");
            return;
        }

        // 如果指定了需要的角色权限，则检查当前用户是否具有该权限
        if (requiredRole) {
            let hasRequiredRole = false;

            if (requiredRole === "admin") {
                hasRequiredRole = isAdmin();
            } else if (requiredRole === "user") {
                // 普通用户权限同时允许user和waste_disposal_merchant
                hasRequiredRole = !!(user && (user.role === "user" || user.role === "waste_disposal_merchant"));
            } else if (requiredRole === "waste_disposal_merchant") {
                hasRequiredRole = !!(user && user.role === "waste_disposal_merchant");
            }

            if (!hasRequiredRole) {
                // 用户无权访问，重定向到适当页面
                if (requiredRole === "admin" && user && (user.role === "user" || user.role === "waste_disposal_merchant")) {
                    // 普通用户或尾料处置商尝试访问管理员页面，重定向到用户预约页面
                    router.push("/dashboard/appointments");
                } else {
                    // 其他情况重定向到仪表盘首页
                    router.push("/dashboard");
                }
                return;
            }
        }

        // 用户已登录且权限验证通过
        setAuthorized(true);
    }, [isAuthenticated, user, requiredRole, router, isAdmin, pathname]);

    // 显示授权后的内容
    return authorized ? <>{children}</> : null;
} 