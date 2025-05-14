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
        return Response.json(info);
    } catch (error) {
        console.error("获取系统信息失败:", error);
        return Response.json({ error: "获取系统信息失败" }, { status: 500 });
    }
}

/**
 * 更新系统信息
 */
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        await updateSystemInfo(body);

        return Response.json({ message: "系统信息更新成功" });
    } catch (error) {
        console.error("更新系统信息失败:", error);
        return Response.json({ error: "更新系统信息失败" }, { status: 500 });
    }
} 