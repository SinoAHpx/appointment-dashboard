import { NextRequest, NextResponse } from "next/server";
import { withDbConnection } from "@/lib/db/db";
import {
    getAllContracts,
    getPendingContracts,
    getContractStats,
    deleteContract,
} from "@/lib/db/contract.queries";

// 获取合同列表
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");

        const result = await withDbConnection((db) => {
            if (status === "pending") {
                return getPendingContracts(db);
            }
            return getAllContracts(db);
        });

        return NextResponse.json({
            success: true,
            contracts: result,
        });
    } catch (error) {
        console.error("获取合同列表失败:", error);
        return NextResponse.json(
            { error: "获取合同列表失败" },
            { status: 500 }
        );
    }
}

// 删除合同
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const contractId = searchParams.get("id");

        if (!contractId) {
            return NextResponse.json(
                { error: "缺少合同ID" },
                { status: 400 }
            );
        }

        const result = await withDbConnection((db) => {
            return deleteContract(db, parseInt(contractId));
        });

        if (result) {
            return NextResponse.json({
                success: true,
                message: "合同删除成功",
            });
        } else {
            return NextResponse.json(
                { error: "合同删除失败" },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error("删除合同失败:", error);
        return NextResponse.json(
            { error: "删除合同失败" },
            { status: 500 }
        );
    }
} 