import { NextRequest, NextResponse } from "next/server";
import { withDbConnection } from "@/lib/db/db";
import {
    getWasteAuctionById,
    deleteWasteAuction,
} from "@/lib/db/waste-auction.queries";

/**
 * 获取单个竞价
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
                    message: "无效的竞价ID",
                },
                { status: 400 }
            );
        }

        const auction = await withDbConnection(() => {
            return getWasteAuctionById(id);
        });

        if (!auction) {
            return NextResponse.json(
                {
                    success: false,
                    message: "竞价不存在",
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: auction,
        });
    } catch (error) {
        console.error("获取竞价失败:", error);
        return NextResponse.json(
            {
                success: false,
                message: "获取竞价失败",
            },
            { status: 500 }
        );
    }
}

/**
 * 删除竞价
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
                    message: "无效的竞价ID",
                },
                { status: 400 }
            );
        }

        // 检查竞价是否存在
        const existingAuction = await withDbConnection(() => {
            return getWasteAuctionById(id);
        });

        if (!existingAuction) {
            return NextResponse.json(
                {
                    success: false,
                    message: "竞价不存在",
                },
                { status: 404 }
            );
        }

        // 删除竞价
        const success = await withDbConnection(() => {
            return deleteWasteAuction(id);
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
            message: "竞价删除成功",
        });
    } catch (error) {
        console.error("删除竞价失败:", error);
        return NextResponse.json(
            {
                success: false,
                message: "删除失败",
            },
            { status: 500 }
        );
    }
} 