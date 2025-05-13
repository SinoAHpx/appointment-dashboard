import { getAllUsers, createUser } from "@/lib/db/user.queries";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";

// Get all users
export async function GET() {
    try {
        const users = getAllUsers();
        return NextResponse.json({
            success: true,
            users,
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { success: false, message: "获取用户失败" },
            { status: 500 }
        );
    }
}

// Create a new user
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password, role = "user", name, phone, isGovUser = false } = body;

        // Validate request
        if (!username || !password || !name) {
            return NextResponse.json(
                { success: false, message: "用户名、密码和姓名为必填项" },
                { status: 400 }
            );
        }

        // Additional validation
        if (username.length < 3) {
            return NextResponse.json(
                { success: false, message: "用户名长度不能少于3个字符" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { success: false, message: "密码长度不能少于6个字符" },
                { status: 400 }
            );
        }

        if (role !== "admin" && role !== "user") {
            return NextResponse.json(
                { success: false, message: "角色必须是 'admin' 或 'user'" },
                { status: 400 }
            );
        }

        // Create the user
        const newUser = createUser(username, password, role, name, phone, isGovUser);

        if (!newUser) {
            return NextResponse.json(
                { success: false, message: "用户名已被占用" },
                { status: 409 }
            );
        }

        return NextResponse.json({
            success: true,
            user: newUser,
            message: "用户创建成功",
        });
    } catch (error) {
        console.error("Error creating user:", error);
        return NextResponse.json(
            { success: false, message: "创建用户失败" },
            { status: 500 }
        );
    }
} 