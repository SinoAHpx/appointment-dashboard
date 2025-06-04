import { NextRequest, NextResponse } from "next/server";
import { withDbConnection } from "@/lib/db/db";
import { createUser } from "@/lib/db/user.queries";

export async function POST(request: NextRequest) {
    try {
        const { username, password, name, phone, email } = await request.json();

        // 验证必填字段
        if (!username || !password || !name || !phone) {
            return NextResponse.json(
                { error: "所有字段都是必填的" },
                { status: 400 }
            );
        }

        // 验证用户名长度
        if (username.length < 2) {
            return NextResponse.json(
                { error: "用户名至少需要2个字符" },
                { status: 400 }
            );
        }

        // 验证密码长度
        if (password.length < 6) {
            return NextResponse.json(
                { error: "密码至少需要6个字符" },
                { status: 400 }
            );
        }

        // 创建用户（默认为pending状态）
        const user = await withDbConnection((db) => {
            return createUser(username, password, "user", name, phone, false, "pending");
        });

        if (!user) {
            return NextResponse.json(
                { error: "用户名已存在" },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            user,
            message: "注册成功，请等待管理员审核",
        });
    } catch (error) {
        console.error("注册用户失败:", error);
        return NextResponse.json(
            { error: "注册失败，请稍后再试" },
            { status: 500 }
        );
    }
} 