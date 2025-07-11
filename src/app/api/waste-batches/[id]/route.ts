import { NextRequest, NextResponse } from "next/server";
import { withDbConnection } from "@/lib/db/db";
import {
    getWasteBatchById,
    updateWasteBatchStatus,
    deleteWasteBatch,
} from "@/lib/db/waste-auction.queries";

/**
 * 获取单个尾料批次
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);
        if (isNaN(id)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "无效的批次ID",
                },
                { status: 400 }
            );
        }

        const batch = await withDbConnection(() => {
            return getWasteBatchById(id);
        });

        if (!batch) {
            return NextResponse.json(
                {
                    success: false,
                    message: "批次不存在",
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: batch,
        });
    } catch (error) {
        console.error("获取尾料批次失败:", error);
        return NextResponse.json(
            {
                success: false,
                message: "获取尾料批次失败",
            },
            { status: 500 }
        );
    }
}

/**
 * 更新尾料批次状态
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);
        if (isNaN(id)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "无效的批次ID",
                },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { status } = body;

        // 验证状态值
        const validStatuses = ["draft", "published", "auction_in_progress", "auction_ended", "allocated"];
        if (!status || !validStatuses.includes(status)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "无效的状态值",
                },
                { status: 400 }
            );
        }

        // 检查批次是否存在
        const existingBatch = await withDbConnection(() => {
            return getWasteBatchById(id);
        });

        if (!existingBatch) {
            return NextResponse.json(
                {
                    success: false,
                    message: "批次不存在",
                },
                { status: 404 }
            );
        }

        // 更新状态
        const success = await withDbConnection(() => {
            return updateWasteBatchStatus(id, status);
        });

        if (!success) {
            return NextResponse.json(
                {
                    success: false,
                    message: "状态更新失败",
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "状态更新成功",
        });
    } catch (error) {
        console.error("更新尾料批次状态失败:", error);
        return NextResponse.json(
            {
                success: false,
                message: "状态更新失败",
            },
            { status: 500 }
        );
    }
}

/**
 * 删除尾料批次
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);
        if (isNaN(id)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "无效的批次ID",
                },
                { status: 400 }
            );
        }

        // 检查批次是否存在
        const existingBatch = await withDbConnection(() => {
            return getWasteBatchById(id);
        });

        if (!existingBatch) {
            return NextResponse.json(
                {
                    success: false,
                    message: "批次不存在",
                },
                { status: 404 }
            );
        }

        // 删除批次
        const success = await withDbConnection(() => {
            return deleteWasteBatch(id);
        });

        if (!success) {
            return NextResponse.json(
                {
                    success: false,
                    message: "删除失败",
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "批次删除成功",
        });
    } catch (error) {
        console.error("删除尾料批次失败:", error);
        return NextResponse.json(
            {
                success: false,
                message: "删除失败",
            },
            { status: 500 }
        );
    }
} 