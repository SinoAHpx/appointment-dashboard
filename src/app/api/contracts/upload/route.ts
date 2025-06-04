import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { withDbConnection } from "@/lib/db/db";
import { createContract } from "@/lib/db/contract.queries";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const userId = formData.get("userId") as string;

        if (!file) {
            return NextResponse.json(
                { error: "没有上传文件" },
                { status: 400 }
            );
        }

        if (!userId) {
            return NextResponse.json(
                { error: "缺少用户ID" },
                { status: 400 }
            );
        }

        // 验证文件类型（只允许图片）
        if (!file.type.startsWith("image/")) {
            return NextResponse.json(
                { error: "只能上传图片文件" },
                { status: 400 }
            );
        }

        // 验证文件大小（限制为5MB）
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: "文件大小不能超过5MB" },
                { status: 400 }
            );
        }

        // 创建上传目录
        const uploadDir = join(process.cwd(), "public", "uploads", "contracts");
        await mkdir(uploadDir, { recursive: true });

        // 生成唯一文件名
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2);
        const fileExtension = file.name.split(".").pop();
        const filename = `${timestamp}_${randomString}.${fileExtension}`;
        const filepath = join(uploadDir, filename);

        // 保存文件
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        // 保存到数据库
        const result = await withDbConnection((db) => {
            return createContract(
                db,
                parseInt(userId),
                file.name,
                `/uploads/contracts/${filename}`
            );
        });

        return NextResponse.json({
            success: true,
            contract: result,
            message: "合同上传成功",
        });
    } catch (error) {
        console.error("合同上传失败:", error);
        return NextResponse.json(
            { error: "合同上传失败" },
            { status: 500 }
        );
    }
} 