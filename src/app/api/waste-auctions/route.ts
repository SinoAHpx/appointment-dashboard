import { NextRequest, NextResponse } from "next/server";
import { withDbConnection } from "@/lib/db/db";
import {
    getAllWasteAuctions,
    getActiveWasteAuctions,
    createWasteAuction,
    getWasteAuctionById,
} from "@/lib/db/waste-auction.queries";

/**
 * 获取竞价列表
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get("active") === "true";

        const auctions = await withDbConnection(() => {
            return activeOnly ? getActiveWasteAuctions() : getAllWasteAuctions();
        });

        return NextResponse.json({
            success: true,
            data: auctions,
        });
    } catch (error) {
        console.error("获取竞价列表失败:", error);
        return NextResponse.json(
            {
                success: false,
                message: "获取竞价列表失败",
            },
            { status: 500 }
        );
    }
}

/**
 * 创建新的竞价
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            batchId,
            title,
            description,
            startTime,
            endTime,
            basePrice,
            reservePrice,
            createdBy,
        } = body;

        // 验证必填字段
        if (!batchId || !title || !startTime || !endTime || !createdBy) {
            return NextResponse.json(
                {
                    success: false,
                    message: "批次ID、标题、开始时间、结束时间和创建者为必填字段",
                },
                { status: 400 }
            );
        }

        // 验证时间
        const start = new Date(startTime);
        const end = new Date(endTime);
        const now = new Date();

        if (start <= now) {
            return NextResponse.json(
                {
                    success: false,
                    message: "竞价开始时间必须晚于当前时间",
                },
                { status: 400 }
            );
        }

        if (end <= start) {
            return NextResponse.json(
                {
                    success: false,
                    message: "竞价结束时间必须晚于开始时间",
                },
                { status: 400 }
            );
        }

        const auction = await withDbConnection(() => {
            return createWasteAuction({
                batchId: parseInt(batchId),
                title,
                description,
                startTime,
                endTime,
                basePrice: parseFloat(basePrice) || 0,
                reservePrice: reservePrice ? parseFloat(reservePrice) : undefined,
                createdBy: parseInt(createdBy),
            });
        });

        if (!auction) {
            return NextResponse.json(
                {
                    success: false,
                    message: "创建竞价失败",
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: auction,
            message: "竞价创建成功",
        });
    } catch (error) {
        console.error("创建竞价失败:", error);
        return NextResponse.json(
            {
                success: false,
                message: "创建竞价失败",
            },
            { status: 500 }
        );
    }
} 