"use client";

import { useAuthStore } from "@/lib/store";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AuthGuardProps {
    children: React.ReactNode;
    requiredRole?: "admin" | "user";
}

/**
 * 一个客户端组件，用于保护需要认证的路由。
 * 检查用户是否已登录，如果未登录则重定向到登录页面。
 * 可以指定需要的角色，确保只有特定角色的用户可以访问。
 */
export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
    const { isAuthenticated, user, isAdmin } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    
    // 添加状态来跟踪是否已经执行了重定向
    const [isRedirecting, setIsRedirecting] = useState(false);
    // 添加状态记录初次渲染
    const [initialRender, setInitialRender] = useState(true);
    // 状态变更指示标记
    const [stateChecked, setStateChecked] = useState(false);

    // 检查登录状态前添加延迟，确保完全加载持久化状态
    useEffect(() => {
        if (initialRender) {
            // 在首次渲染后一小段时间再检查认证状态，
            // 给持久化状态充分的时间初始化
            const timer = setTimeout(() => {
                setInitialRender(false);
                setStateChecked(true);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [initialRender]);
    
    useEffect(() => {
        // 只在状态检查后处理重定向
        if (!stateChecked) return;
        
        // 防止重复重定向
        if (isRedirecting) return;
        
        // 如果用户未登录，重定向到登录页面
        if (!isAuthenticated) {
            // 检查当前URL中是否已经有callbackUrl参数，防止循环重定向
            if (window.location.pathname === '/login') return;
            
            setIsRedirecting(true);
            // 避免使用router.push，而是直接使用window.location能确保状态正确加载
            router.push(`/login?callbackUrl=${pathname}`);
            return;
        }

        // 如果需要管理员权限但用户不是管理员
        if (requiredRole === "admin" && !isAdmin()) {
            setIsRedirecting(true);
            router.push("/dashboard");
            return;
        }
    }, [isAuthenticated, requiredRole, user, router, pathname, isAdmin, isRedirecting, stateChecked]);

    // 未认证时不渲染任何内容
    if (!isAuthenticated) {
        return null;
    }

    // 如果需要管理员权限但用户不是管理员，不渲染任何内容
    if (requiredRole === "admin" && !isAdmin()) {
        return null;
    }

    // 通过认证检查，渲染子组件
    return <>{children}</>;
} 