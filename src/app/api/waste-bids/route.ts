import { NextRequest, NextResponse } from "next/server";
import { withDbConnection } from "@/lib/db/db";
import {
    createWasteBid,
    getUserBids,
    getAuctionBids,
} from "@/lib/db/waste-auction.queries";

/**
 * 获取出价（可以是用户的出价历史或特定竞价的所有出价）
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        const auctionId = searchParams.get("auctionId");

        if (userId) {
            // 获取用户的出价历史
            const bids = await withDbConnection(() => {
                return getUserBids(parseInt(userId));
            });

            return NextResponse.json({
                success: true,
                data: bids,
            });
        } else if (auctionId) {
            // 获取特定竞价的所有出价
            const bids = await withDbConnection(() => {
                return getAuctionBids(parseInt(auctionId));
            });

            return NextResponse.json({
                success: true,
                data: bids,
            });
        } else {
            return NextResponse.json(
                {
                    success: false,
                    message: "请提供用户ID或竞价ID",
                },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error("获取出价失败:", error);
        return NextResponse.json(
            {
                success: false,
                message: "获取出价失败",
            },
            { status: 500 }
        );
    }
}

/**
 * 创建新出价
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { auctionId, bidderId, bidAmount, notes } = body;

        // 验证必填字段
        if (!auctionId || !bidderId || !bidAmount) {
            return NextResponse.json(
                {
                    success: false,
                    message: "竞价ID、出价人ID和出价金额为必填字段",
                },
                { status: 400 }
            );
        }

        // 验证出价金额
        const amount = parseFloat(bidAmount);
        if (amount <= 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: "出价金额必须大于0",
                },
                { status: 400 }
            );
        }

        const bid = await withDbConnection(() => {
            return createWasteBid({
                auctionId: parseInt(auctionId),
                bidderId: parseInt(bidderId),
                bidAmount: amount,
                notes,
            });
        });

        if (!bid) {
            return NextResponse.json(
                {
                    success: false,
                    message: "创建出价失败",
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: bid,
            message: "出价创建成功",
        });
    } catch (error) {
        console.error("创建出价失败:", error);
        return NextResponse.json(
            {
                success: false,
                message: "创建出价失败",
            },
            { status: 500 }
        );
    }
} 