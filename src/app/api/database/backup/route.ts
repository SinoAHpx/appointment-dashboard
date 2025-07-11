import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

/**
 * 数据库备份API - 读取并返回数据库文件
 */
export async function GET(request: NextRequest) {
    try {
        // 数据库文件路径（通常在项目根目录）
        const dbPath = join(process.cwd(), "appointment_dashboard.sqlite");

        // 读取数据库文件
        const dbBuffer = await readFile(dbPath);

        // 生成时间戳用于文件名
        const timestamp = new Date().toISOString().replace(/:/g, "-").replace(/\./g, "-").substring(0, 19);
        const fileName = `appointment_dashboard_backup_${timestamp}.sqlite`;

        // 返回文件内容
        return new NextResponse(dbBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/x-sqlite3",
                "Content-Disposition": `attachment; filename="${fileName}"`,
                "Content-Length": dbBuffer.length.toString(),
            },
        });
    } catch (error) {
        console.error("数据库备份失败:", error);

        return NextResponse.json(
            {
                success: false,
                message: "数据库备份失败",
                error: error instanceof Error ? error.message : "未知错误"
            },
            { status: 500 }
        );
    }
} 