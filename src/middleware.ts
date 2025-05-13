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
        // 检查当前URL是否有特殊查询参数，避免重定向循环
        const url = new URL(request.url);
        const bypassAuth = url.searchParams.has('bypassAuthCheck');

        // 如果请求URL已经有回调参数，可能是正在重定向，跳过处理
        const isRedirectingToLogin = url.pathname === '/login' &&
            url.searchParams.has('callbackUrl');

        // 如果已经在重定向过程中或有绕过检查参数，不再继续处理
        if (isRedirectingToLogin || bypassAuth) {
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

        try {
            // 首先尝试解析httpOnly cookie
            if (authSession) {
                let session;
                try {
                    session = JSON.parse(decodeURIComponent(authSession.value));
                } catch {
                    // 如果解码失败，尝试直接解析
                    session = JSON.parse(authSession.value);
                }

                // 检查用户是否已认证
                if (session.state?.isAuthenticated) {
                    return NextResponse.next();
                }
            }

            // 如果httpOnly cookie无效，再尝试非httpOnly cookie
            if (authClientSession) {
                let clientSession;
                try {
                    clientSession = JSON.parse(decodeURIComponent(authClientSession.value));
                } catch {
                    clientSession = JSON.parse(authClientSession.value);
                }

                if (clientSession.state?.isAuthenticated) {
                    return NextResponse.next();
                }
            }

            // 如果都无效，重定向到登录页面
            console.log("认证状态无效，重定向到登录页面");
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(loginUrl);
        } catch (error) {
            console.error("解析auth cookie失败:", error);
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("callbackUrl", pathname);
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