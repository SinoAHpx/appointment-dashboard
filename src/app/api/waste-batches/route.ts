import { NextRequest, NextResponse } from "next/server";
import { withDbConnection } from "@/lib/db/db";
import {
    getAllWasteBatches,
    createWasteBatch,
} from "@/lib/db/waste-auction.queries";

/**
 * 获取所有尾料批次
 */
export async function GET() {
    try {
        const batches = await withDbConnection(() => {
            return getAllWasteBatches();
        });

        return NextResponse.json({
            success: true,
            data: batches,
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
 * 创建新的尾料批次
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            title,
            description,
            estimatedWeight,
            location,
            wasteType,
            category,
            createdBy,
        } = body;

        // 验证必填字段
        if (!title || !wasteType || !createdBy) {
            return NextResponse.json(
                {
                    success: false,
                    message: "标题、尾料类型和创建者为必填字段",
                },
                { status: 400 }
            );
        }

        const batch = await withDbConnection(() => {
            return createWasteBatch({
                title,
                description,
                estimatedWeight: estimatedWeight ? parseFloat(estimatedWeight) : undefined,
                location,
                wasteType,
                category,
                createdBy: parseInt(createdBy),
            });
        });

        if (!batch) {
            return NextResponse.json(
                {
                    success: false,
                    message: "创建尾料批次失败",
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: batch,
            message: "尾料批次创建成功",
        });
    } catch (error) {
        console.error("创建尾料批次失败:", error);
        return NextResponse.json(
            {
                success: false,
                message: "创建尾料批次失败",
            },
            { status: 500 }
        );
    }
} 