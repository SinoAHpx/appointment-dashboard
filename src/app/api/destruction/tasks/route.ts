import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthVerificationResult } from "@/lib/auth";
import { createDestructionTask, getUserDestructionTasks } from "@/lib/db/destruction.queries";

// 获取用户的销毁任务
const getTasksHandler = async (request: NextRequest, auth: AuthVerificationResult) => {
    try {
        const tasks = getUserDestructionTasks(auth.userId);
        return NextResponse.json({
            success: true,
            tasks,
        });
    } catch (error) {
        console.error("获取销毁任务失败:", error);
        return NextResponse.json(
            { success: false, message: "获取销毁任务失败" },
            { status: 500 }
        );
    }
};

// 创建新的销毁任务
const createTaskHandler = async (request: NextRequest, auth: AuthVerificationResult) => {
    try {
        const body = await request.json();
        const {
            customerName,
            contactPhone,
            contactAddress,
            scheduledDate,
            serviceType,
            itemDescription,
            estimatedWeight,
            specialRequirements,
        } = body;

        // 验证必填字段
        if (!customerName || !contactPhone || !contactAddress || !scheduledDate || !serviceType) {
            return NextResponse.json(
                { success: false, message: "请填写所有必填信息" },
                { status: 400 }
            );
        }

        // 创建销毁任务
        const task = createDestructionTask({
            userId: auth.userId,
            customerName,
            contactPhone,
            contactAddress,
            scheduledDate,
            serviceType,
            itemDescription,
            estimatedWeight,
            specialRequirements,
        });

        if (!task) {
            return NextResponse.json(
                { success: false, message: "创建销毁任务失败" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            task,
            message: "销毁任务创建成功",
        });
    } catch (error) {
        console.error("创建销毁任务失败:", error);
        return NextResponse.json(
            { success: false, message: "创建销毁任务失败" },
            { status: 500 }
        );
    }
};

export const GET = withAuth(getTasksHandler);
export const POST = withAuth(createTaskHandler); 