import { updateUser, deleteUser } from "@/lib/db/user.queries";
import { NextRequest, NextResponse } from "next/server";
import { withAdminAuth, AuthVerificationResult } from "@/lib/auth";

// 更新用户 - 仅管理员可访问
const updateUserHandler = async (
    request: NextRequest,
    auth: AuthVerificationResult,
    { params }: { params: Promise<{ id: string }> }
) => {
    try {
        const { id } = await params;
        const userId = parseInt(id);

        if (isNaN(userId)) {
            return NextResponse.json(
                { success: false, message: "无效的用户ID" },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { username, password, role, name, phone, isGovUser } = body;

        // 基本验证
        if (username && username.length < 3) {
            return NextResponse.json(
                { success: false, message: "用户名长度不能少于3个字符" },
                { status: 400 }
            );
        }

        if (password && password.length < 6) {
            return NextResponse.json(
                { success: false, message: "密码长度不能少于6个字符" },
                { status: 400 }
            );
        }

        if (role && role !== "admin" && role !== "user" && role !== "waste_disposal_merchant") {
            return NextResponse.json(
                { success: false, message: "角色必须是 'admin'、'user' 或 'waste_disposal_merchant'" },
                { status: 400 }
            );
        }

        // 构建更新数据对象
        const updateData: any = {};
        if (username !== undefined) updateData.username = username;
        if (password !== undefined) updateData.password = password;
        if (role !== undefined) updateData.role = role;
        if (name !== undefined) updateData.name = name;
        if (phone !== undefined) updateData.phone = phone;
        if (isGovUser !== undefined) updateData.isGovUser = isGovUser;

        const success = updateUser(userId, updateData);

        if (!success) {
            return NextResponse.json(
                { success: false, message: "用户不存在或更新失败" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "用户更新成功",
        });
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json(
            { success: false, message: "更新用户失败" },
            { status: 500 }
        );
    }
};

export const PUT = withAdminAuth(updateUserHandler);

// 删除用户 - 仅管理员可访问
const deleteUserHandler = async (
    request: NextRequest,
    auth: AuthVerificationResult,
    { params }: { params: Promise<{ id: string }> }
) => {
    try {
        const { id } = await params;
        const userId = parseInt(id);

        if (isNaN(userId)) {
            return NextResponse.json(
                { success: false, message: "无效的用户ID" },
                { status: 400 }
            );
        }

        // 防止管理员删除自己的账户
        if (userId === auth.userId) {
            return NextResponse.json(
                { success: false, message: "不能删除自己的账户" },
                { status: 400 }
            );
        }

        const success = deleteUser(userId);

        if (!success) {
            return NextResponse.json(
                { success: false, message: "用户不存在或删除失败" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "用户删除成功",
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json(
            { success: false, message: "删除用户失败" },
            { status: 500 }
        );
    }
};

export const DELETE = withAdminAuth(deleteUserHandler); 