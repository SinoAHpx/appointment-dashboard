import { updateUser, deleteUser } from "@/lib/user.queries";
import { NextResponse } from "next/server";

// Update a user by ID
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = Number(params.id);

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, message: "无效的用户ID" },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { username, password, role, name, email } = body;

        // Make sure at least one field is being updated
        if (!username && !password && !role && !name && !email) {
            return NextResponse.json(
                { success: false, message: "没有提供需要更新的字段" },
                { status: 400 }
            );
        }

        // Validate role if provided
        if (role && role !== "admin" && role !== "user") {
            return NextResponse.json(
                { success: false, message: "角色必须是 'admin' 或 'user'" },
                { status: 400 }
            );
        }

        // Handle password validation if provided
        if (password && password.length < 6) {
            return NextResponse.json(
                { success: false, message: "密码长度不能少于6个字符" },
                { status: 400 }
            );
        }

        // Update the user
        const updatedUser = updateUser(id, { username, password, role, name, email });

        if (!updatedUser) {
            return NextResponse.json(
                { success: false, message: "用户不存在或更新失败" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            user: updatedUser,
            message: "用户更新成功",
        });
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json(
            { success: false, message: "更新用户失败" },
            { status: 500 }
        );
    }
}

// Delete a user by ID
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = Number(params.id);

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, message: "无效的用户ID" },
                { status: 400 }
            );
        }

        // Check if trying to delete the admin user (ID 1)
        if (id === 1) {
            return NextResponse.json(
                { success: false, message: "不能删除管理员账户" },
                { status: 403 }
            );
        }

        const success = deleteUser(id);

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
} 