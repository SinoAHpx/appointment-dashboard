import { NextRequest } from "next/server";
import { getSystemInfo, updateSystemInfo } from "@/lib/db/info.queries";

/**
 * 获取系统信息
 */
export async function GET() {
    try {
        const info = await getSystemInfo();
        if (!info) {
            return Response.json({ error: "系统信息不存在" }, { status: 404 });
        }

        // 设置缓存头，避免频繁查询数据库
        return Response.json(info, {
            headers: {
                'Cache-Control': 'public, max-age=300, stale-while-revalidate=60', // 缓存5分钟
                'ETag': `"${JSON.stringify(info).length}-${Date.now()}"`, // 简单的ETag
            },
        });
    } catch (error) {
        console.error("获取系统信息失败:", error);
        return Response.json(
            { error: "获取系统信息失败" },
            {
                status: 500,
                headers: {
                    'Cache-Control': 'no-cache', // 错误响应不缓存
                }
            }
        );
    }
}

/**
 * 更新系统信息
 */
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();

        // 基本数据验证
        if (!body || typeof body !== 'object') {
            return Response.json(
                { error: "请求数据格式错误" },
                { status: 400 }
            );
        }

        // 必要字段验证
        const requiredFields = ['notes', 'company_name', 'company_address', 'company_phone', 'company_email'];
        for (const field of requiredFields) {
            if (!body[field] || typeof body[field] !== 'string' || body[field].trim().length === 0) {
                return Response.json(
                    { error: `字段 ${field} 不能为空` },
                    { status: 400 }
                );
            }
        }

        // 邮箱格式验证
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body.company_email)) {
            return Response.json(
                { error: "邮箱格式不正确" },
                { status: 400 }
            );
        }

        await updateSystemInfo(body);

        return Response.json(
            { message: "系统信息更新成功", data: body },
            {
                headers: {
                    'Cache-Control': 'no-cache', // 更新后不缓存，确保下次获取最新数据
                }
            }
        );
    } catch (error) {
        console.error("更新系统信息失败:", error);
        return Response.json(
            { error: "更新系统信息失败" },
            {
                status: 500,
                headers: {
                    'Cache-Control': 'no-cache',
                }
            }
        );
    }
} 