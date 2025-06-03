import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import {
    updateServiceItem,
    deleteServiceItem,
    UpdateServiceItemInput
} from "@/lib/db/checkout.queries";

// 更新服务项目
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json(
                { error: "无效的服务项目ID" },
                { status: 400 }
            );
        }

        const data = await request.json() as UpdateServiceItemInput;

        // 验证价格数据
        if (data.price !== undefined && data.price < 0) {
            return NextResponse.json(
                { error: "价格不能为负数" },
                { status: 400 }
            );
        }

        const db = getDb();
        const success = await updateServiceItem(db, id, data);

        if (!success) {
            return NextResponse.json(
                { error: "更新服务项目失败" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "服务项目更新成功"
        });
    } catch (error) {
        console.error("更新服务项目失败:", error);
        return NextResponse.json(
            { error: "更新服务项目时发生错误" },
            { status: 500 }
        );
    }
}

// 删除服务项目（软删除）
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json(
                { error: "无效的服务项目ID" },
                { status: 400 }
            );
        }

        const db = getDb();
        const success = await deleteServiceItem(db, id);

        if (!success) {
            return NextResponse.json(
                { error: "删除服务项目失败" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "服务项目删除成功"
        });
    } catch (error) {
        console.error("删除服务项目失败:", error);
        return NextResponse.json(
            { error: "删除服务项目时发生错误" },
            { status: 500 }
        );
    }
} 