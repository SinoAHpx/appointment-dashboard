import { NextRequest, NextResponse } from "next/server";
import { withDbConnection } from "@/lib/db/db";
import { approveUser, rejectUser } from "@/lib/db/user.queries";

// 审核用户
export async function POST(request: NextRequest) {
    try {
        const { userId, action, approvedBy, rejectionReason } = await request.json();

        if (!userId || !action || !approvedBy) {
            return NextResponse.json(
                { error: "缺少必要参数" },
                { status: 400 }
            );
        }

        if (action !== "approve" && action !== "reject") {
            return NextResponse.json(
                { error: "无效的操作类型" },
                { status: 400 }
            );
        }

        if (action === "reject" && !rejectionReason) {
            return NextResponse.json(
                { error: "拒绝用户时必须提供拒绝原因" },
                { status: 400 }
            );
        }

        const result = await withDbConnection((db) => {
            if (action === "approve") {
                return approveUser(userId, approvedBy);
            } else {
                return rejectUser(userId, approvedBy, rejectionReason);
            }
        });

        if (result) {
            return NextResponse.json({
                success: true,
                user: result,
                message: action === "approve" ? "用户审核通过" : "用户已被拒绝",
            });
        } else {
            return NextResponse.json(
                { error: "审核操作失败" },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error("用户审核失败:", error);
        return NextResponse.json(
            { error: "用户审核失败" },
            { status: 500 }
        );
    }
} 