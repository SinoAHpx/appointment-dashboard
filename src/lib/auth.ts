import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { findUserByUsernameWithPassword } from "./db/user.queries";

// Auth verification result type
export interface AuthVerificationResult {
    isAuthenticated: boolean;
    isAdmin: boolean;
    userId: number;
    username?: string;
}

/**
 * Verifies if the request is from an authenticated user
 * Returns auth status, admin status, and user ID if authenticated
 */
export async function verifyAuth(
    request: NextRequest
): Promise<AuthVerificationResult> {
    try {
        // Get cookie store - async in Next.js 15
        const cookieStore = await cookies();
        const authCookie = cookieStore.get("auth-storage");

        if (!authCookie?.value) {
            return { isAuthenticated: false, isAdmin: false, userId: 0 };
        }

        try {
            // Parse the auth cookie value
            const authData = JSON.parse(authCookie.value);

            if (
                !authData?.state?.isAuthenticated ||
                !authData?.state?.user?.id ||
                !authData?.state?.user?.username
            ) {
                return { isAuthenticated: false, isAdmin: false, userId: 0 };
            }

            // Get user data from cookie
            const { user } = authData.state;

            // Verify user exists in database (additional security check)
            const dbUser = findUserByUsernameWithPassword(user.username);
            if (!dbUser) {
                return { isAuthenticated: false, isAdmin: false, userId: 0 };
            }

            return {
                isAuthenticated: true,
                isAdmin: dbUser.role === "admin",
                userId: dbUser.id,
                username: dbUser.username,
            };
        } catch (error) {
            console.error("Error parsing auth cookie:", error);
            return { isAuthenticated: false, isAdmin: false, userId: 0 };
        }
    } catch (error) {
        console.error("Auth verification error:", error);
        return { isAuthenticated: false, isAdmin: false, userId: 0 };
    }
}

/**
 * Verifies if the request is from an admin user
 * Returns boolean indicating admin status
 */
export async function verifyAdmin(request: NextRequest): Promise<boolean> {
    const auth = await verifyAuth(request);
    return auth.isAuthenticated && auth.isAdmin;
}

/**
 * API权限验证包装器 - 用于保护需要认证的API端点
 */
export function withAuth<T extends any[]>(
    handler: (request: NextRequest, auth: AuthVerificationResult, ...args: T) => Promise<NextResponse>
) {
    return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
        try {
            const auth = await verifyAuth(request);

            if (!auth.isAuthenticated) {
                return NextResponse.json(
                    { success: false, message: "未授权访问" },
                    { status: 401 }
                );
            }

            return handler(request, auth, ...args);
        } catch (error) {
            console.error("API权限验证失败:", error);
            return NextResponse.json(
                { success: false, message: "服务器错误" },
                { status: 500 }
            );
        }
    };
}

/**
 * API管理员权限验证包装器 - 用于保护需要管理员权限的API端点
 */
export function withAdminAuth<T extends any[]>(
    handler: (request: NextRequest, auth: AuthVerificationResult, ...args: T) => Promise<NextResponse>
) {
    return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
        try {
            const auth = await verifyAuth(request);

            if (!auth.isAuthenticated) {
                return NextResponse.json(
                    { success: false, message: "未授权访问" },
                    { status: 401 }
                );
            }

            if (!auth.isAdmin) {
                return NextResponse.json(
                    { success: false, message: "需要管理员权限" },
                    { status: 403 }
                );
            }

            return handler(request, auth, ...args);
        } catch (error) {
            console.error("API管理员权限验证失败:", error);
            return NextResponse.json(
                { success: false, message: "服务器错误" },
                { status: 500 }
            );
        }
    };
} 