import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 需要保护的路由路径
const protectedPaths = ["/dashboard", "/dashboard/"];

// 检查路径是否是受保护路径或其子路径
const isProtectedPath = (path: string) => {
    return protectedPaths.some(
        (protectedPath) =>
            path === protectedPath || path.startsWith(`${protectedPath}/`)
    );
};

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 检查是否访问受保护路径
    if (isProtectedPath(pathname)) {
        // 如果请求URL已经有回调参数，可能是正在重定向，跳过处理
        const requestUrl = new URL(request.url);
        const isRedirectingToLogin = requestUrl.pathname === '/login' &&
            requestUrl.searchParams.has('callbackUrl');

        // 如果已经在重定向过程中，不再继续处理
        if (isRedirectingToLogin) {
            return NextResponse.next();
        }

        // 检查认证cookies
        const authSession = request.cookies.get("auth-storage");

        // 如果没有认证cookie或认证状态为false，重定向到登录页面
        if (!authSession) {
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(loginUrl);
        }

        try {
            // 解析auth cookie的内容
            let session;
            try {
                session = JSON.parse(decodeURIComponent(authSession.value));
            } catch {
                // 如果解码失败，尝试直接解析
                session = JSON.parse(authSession.value);
            }

            // 检查用户是否已认证
            if (!session.state?.isAuthenticated) {
                const loginUrl = new URL("/login", request.url);
                loginUrl.searchParams.set("callbackUrl", pathname);
                return NextResponse.redirect(loginUrl);
            }
        } catch (error) {
            console.error("解析auth cookie失败:", error);
            const loginUrl = new URL("/login", request.url);
            return NextResponse.redirect(loginUrl);
        }
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