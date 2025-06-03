import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/db";
import {
    getAllServiceItems,
    getActiveServiceItems,
    createServiceItem,
    updateServiceItem,
    deleteServiceItem,
    CreateServiceItemInput,
    UpdateServiceItemInput
} from "@/lib/db/checkout.queries";

// 获取服务项目列表
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get('active') === 'true';

        const db = getDb();
        const serviceItems = activeOnly
            ? await getActiveServiceItems(db)
            : await getAllServiceItems(db);

        return NextResponse.json({
            success: true,
            data: serviceItems
        });
    } catch (error) {
        console.error("获取服务项目失败:", error);
        return NextResponse.json(
            { error: "获取服务项目时发生错误" },
            { status: 500 }
        );
    }
}

// 创建新的服务项目
export async function POST(request: NextRequest) {
    try {
        const data = await request.json() as CreateServiceItemInput;

        // 验证数据
        if (!data.name || !data.unit || typeof data.price !== 'number') {
            return NextResponse.json(
                { error: "服务项目数据不完整" },
                { status: 400 }
            );
        }

        if (data.price < 0) {
            return NextResponse.json(
                { error: "价格不能为负数" },
                { status: 400 }
            );
        }

        const db = getDb();
        const newServiceItem = await createServiceItem(db, data);

        if (!newServiceItem) {
            return NextResponse.json(
                { error: "创建服务项目失败" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: newServiceItem
        });
    } catch (error) {
        console.error("创建服务项目失败:", error);
        return NextResponse.json(
            { error: "创建服务项目时发生错误" },
            { status: 500 }
        );
    }
} 