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
    "/dashboard/exports"
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

// 解析认证cookie并返回用户信息
const parseAuthCookie = (cookieValue: string) => {
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

        let authResult = { isAuthenticated: false, user: null, isAdmin: false };

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
                // 普通用户尝试访问管理员页面，重定向到用户可访问的页面
                const dashboardUrl = new URL("/dashboard/appointments", request.url);
                return NextResponse.redirect(dashboardUrl);
            }
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