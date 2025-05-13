import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import {
    getPricingSettings,
    updatePricingSettings,
    PricingSettings
} from "@/lib/db/checkout.queries";

export async function GET() {
    try {
        const db = getDb();
        const pricing = await getPricingSettings(db);

        return NextResponse.json(pricing);
    } catch (error) {
        console.error("获取价格配置失败:", error);
        return NextResponse.json(
            { error: "获取价格配置时发生错误" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const data = await request.json() as PricingSettings;

        // 验证数据
        if (
            typeof data.basicServicePrice !== 'number' ||
            typeof data.sortingServicePrice !== 'number' ||
            typeof data.packagingServicePrice !== 'number'
        ) {
            return NextResponse.json(
                { error: "价格配置数据不完整或格式不正确" },
                { status: 400 }
            );
        }

        const db = getDb();
        const success = await updatePricingSettings(db, {
            basicServicePrice: data.basicServicePrice,
            sortingServicePrice: data.sortingServicePrice,
            packagingServicePrice: data.packagingServicePrice
        });

        if (!success) {
            return NextResponse.json(
                { error: "更新价格配置失败" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            pricing: {
                basicServicePrice: data.basicServicePrice,
                sortingServicePrice: data.sortingServicePrice,
                packagingServicePrice: data.packagingServicePrice
            }
        });
    } catch (error) {
        console.error("更新价格配置失败:", error);
        return NextResponse.json(
            { error: "更新价格配置时发生错误" },
            { status: 500 }
        );
    }
} 