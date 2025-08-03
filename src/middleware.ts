import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 需要保护的路由路径
const protectedPaths = ["/dashboard", "/dashboard/"];

// 管理员专用路径 - 只有管理员才能访问
const adminOnlyPaths = [
    "/dashboard/users",
    "/dashboard/staff",
    "/dashboard/vehicles",
    "/dashboard/info",
    "/dashboard/exports",
    "/dashboard/waste-auctions" // 尾料竞价管理（管理员专用）
];

// 尾料处置商专用路径 - 只有尾料处置商和管理员才能访问
const wasteDisposalPaths = [
    "/dashboard/auctions",
    "/dashboard/my-bids"
];

// 检查路径是否是受保护路径或其子路径
const isProtectedPath = (path: string) => {
    return protectedPaths.some(
        (protectedPath) =>
            path === protectedPath || path.startsWith(`${protectedPath}/`)
    );
};

// 检查路径是否是管理员专用路径或其子路径
const isAdminOnlyPath = (path: string) => {
    return adminOnlyPaths.some(
        (adminPath) =>
            path === adminPath || path.startsWith(`${adminPath}/`)
    );
};

// 检查路径是否是尾料处置商专用路径或其子路径
const isWasteDisposalPath = (path: string) => {
    return wasteDisposalPaths.some(
        (wasteDisposalPath) =>
            path === wasteDisposalPath || path.startsWith(`${wasteDisposalPath}/`)
    );
};

// 认证结果类型定义
interface AuthResult {
    isAuthenticated: boolean;
    user: { role: string } | null;
    isAdmin: boolean;
}

// 解析认证cookie并返回用户信息
const parseAuthCookie = (cookieValue: string): AuthResult => {
    try {
        // 尝试URL解码
        let session;
        try {
            session = JSON.parse(decodeURIComponent(cookieValue));
        } catch {
            // 如果解码失败，尝试直接解析
            session = JSON.parse(cookieValue);
        }

        if (session?.state?.isAuthenticated && session?.state?.user) {
            return {
                isAuthenticated: true,
                user: session.state.user,
                isAdmin: session.state.user.role === "admin"
            };
        }
        return { isAuthenticated: false, user: null, isAdmin: false };
    } catch (error) {
        console.error("解析auth cookie失败:", error);
        return { isAuthenticated: false, user: null, isAdmin: false };
    }
};

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 检查是否访问受保护路径
    if (isProtectedPath(pathname)) {
        // 检查当前URL是否有特殊查询参数，避免重定向循环 (This logic is no longer needed)
        const url = new URL(request.url);

        // 如果请求URL已经有回调参数，可能是正在重定向，跳过处理
        const isRedirectingToLogin = url.pathname === '/login' &&
            url.searchParams.has('callbackUrl');

        // 如果已经在重定向过程中，不再继续处理
        if (isRedirectingToLogin) {
            return NextResponse.next();
        }

        // 检查认证cookies (同时检查两种cookie)
        const authSession = request.cookies.get("auth-storage");
        const authClientSession = request.cookies.get("auth-storage-client");

        // 如果两种cookie都不存在，重定向到登录页面
        if (!authSession && !authClientSession) {
            console.log("没有发现认证cookie，重定向到登录页面");
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(loginUrl);
        }

        let authResult: AuthResult = { isAuthenticated: false, user: null, isAdmin: false };

        // 首先尝试解析httpOnly cookie
        if (authSession) {
            authResult = parseAuthCookie(authSession.value);
        }

        // 如果httpOnly cookie无效，再尝试非httpOnly cookie
        if (!authResult.isAuthenticated && authClientSession) {
            authResult = parseAuthCookie(authClientSession.value);
        }

        // 如果用户未认证，重定向到登录页面
        if (!authResult.isAuthenticated) {
            console.log("用户未认证，重定向到登录页面");
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(loginUrl);
        }

        // 检查管理员专用路径
        if (isAdminOnlyPath(pathname)) {
            if (!authResult.isAdmin) {
                console.log(`非管理员用户尝试访问管理员专用路径: ${pathname}`);
                // 根据用户角色重定向到对应的默认页面
                let redirectPath = "/dashboard/appointments"; // 普通用户默认页面
                if (authResult.user?.role === 'waste_disposal_merchant') {
                    redirectPath = "/dashboard/auctions"; // 尾料处置商默认页面
                }
                const dashboardUrl = new URL(redirectPath, request.url);
                return NextResponse.redirect(dashboardUrl);
            }
        }

        // 检查尾料处置商是否尝试访问普通用户的预约页面
        if (pathname === "/dashboard/appointments" || pathname.startsWith("/dashboard/appointments/")) {
            if (authResult.user?.role === 'waste_disposal_merchant') {
                console.log(`尾料处置商用户尝试访问预约页面: ${pathname}`);
                // 尾料处置商不允许访问预约页面，重定向到竞拍页面
                const auctionsUrl = new URL("/dashboard/auctions", request.url);
                return NextResponse.redirect(auctionsUrl);
            }
        }

        // 检查尾料处置商专用路径
        if (isWasteDisposalPath(pathname)) {
            const isWasteDisposalMerchant = authResult.user?.role === 'waste_disposal_merchant';
            if (!authResult.isAdmin && !isWasteDisposalMerchant) {
                console.log(`普通用户尝试访问尾料处置商专用路径: ${pathname}`);
                // 普通用户尝试访问尾料处置商页面，重定向到预约页面
                const dashboardUrl = new URL("/dashboard/appointments", request.url);
                return NextResponse.redirect(dashboardUrl);
            }
        }

        // 处理对根 /dashboard 路径的访问，根据角色重定向
        if (pathname === "/dashboard") {
            if (authResult.user?.role === 'waste_disposal_merchant') {
                return NextResponse.redirect(new URL("/dashboard/auctions", request.url));
            }
            if (authResult.user?.role === 'user') {
                return NextResponse.redirect(new URL("/dashboard/appointments", request.url));
            }
            // 管理员将停留在 /dashboard 概览页面，无需重定向
        }

        // 用户已认证且有相应权限，允许访问
        return NextResponse.next();
    }

    return NextResponse.next();
}

// 配置中间件匹配的路由
export const config = {
    matcher: [
        /*
         * 匹配所有路径，除了:
         * - api 路由
         * - _next 静态文件
         * - public 静态文件
         * - login/register 认证页面
         * - favicon.ico 图标
         */
        "/((?!api|_next/static|_next/image|favicon.ico|login|register).*)",
    ],
}; 