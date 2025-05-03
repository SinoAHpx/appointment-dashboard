import {
	type NewVehicleData,
	type UpdateVehicleData,
	type Vehicle,
	addVehicle,
	deleteVehicle,
	getAllVehicles,
	updateVehicle,
} from "@/lib/db/vehicle.queries";
import { NextRequest, NextResponse } from "next/server";

// 获取所有车辆
export async function GET() {
	try {
		const vehicles = getAllVehicles();
		return NextResponse.json({ success: true, vehicles });
	} catch (error) {
		console.error("获取车辆列表失败:", error);
		return NextResponse.json(
			{ success: false, message: "获取车辆列表失败" },
			{ status: 500 },
		);
	}
}

// 创建新车辆
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		// 验证必要字段
		if (!body.plateNumber) {
			return NextResponse.json(
				{ success: false, message: "车牌号必填" },
				{ status: 400 },
			);
		}

		// 准备车辆数据
		const vehicleData: NewVehicleData = {
			plateNumber: body.plateNumber,
			model: body.model || null,
			status: ["available", "in_use", "maintenance"].includes(body.status)
				? (body.status as Vehicle["status"])
				: "available",
		};

		const newVehicle = addVehicle(vehicleData);

		if (!newVehicle) {
			return NextResponse.json(
				{
					success: false,
					message: "创建车辆失败，车牌号可能已存在",
				},
				{ status: 400 },
			);
		}

		return NextResponse.json({
			success: true,
			vehicle: newVehicle,
		});
	} catch (error) {
		console.error("创建车辆失败:", error);
		return NextResponse.json(
			{ success: false, message: "服务器错误" },
			{ status: 500 },
		);
	}
}

// 更新车辆
export async function PUT(request: NextRequest) {
	try {
		const body = await request.json();

		if (!body.id) {
			return NextResponse.json(
				{ success: false, message: "车辆ID必填" },
				{ status: 400 },
			);
		}

		const updateData: UpdateVehicleData = {};

		// 只包含要更新的字段
		if (body.plateNumber !== undefined)
			updateData.plateNumber = body.plateNumber;
		if (body.model !== undefined) updateData.model = body.model;

		// 验证状态值有效性
		if (body.status !== undefined) {
			if (!["available", "in_use", "maintenance"].includes(body.status)) {
				return NextResponse.json(
					{ success: false, message: "无效的状态值" },
					{ status: 400 },
				);
			}
			updateData.status = body.status as Vehicle["status"];
		}

		const updatedVehicle = updateVehicle(parseInt(body.id), updateData);

		if (!updatedVehicle) {
			return NextResponse.json(
				{
					success: false,
					message: "更新车辆失败，车辆可能不存在或车牌号已被使用",
				},
				{ status: 400 },
			);
		}

		return NextResponse.json({
			success: true,
			vehicle: updatedVehicle,
		});
	} catch (error) {
		console.error("更新车辆失败:", error);
		return NextResponse.json(
			{ success: false, message: "服务器错误" },
			{ status: 500 },
		);
	}
}

// 删除车辆
export async function DELETE(request: NextRequest) {
	try {
		// 从 URL 参数获取 ID
		const url = new URL(request.url);
		const id = url.searchParams.get("id");

		if (!id) {
			return NextResponse.json(
				{ success: false, message: "车辆ID必填" },
				{ status: 400 },
			);
		}

		const success = deleteVehicle(parseInt(id));

		if (!success) {
			return NextResponse.json(
				{
					success: false,
					message: "删除车辆失败，车辆可能不存在或正在被预约使用",
				},
				{ status: 404 },
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("删除车辆失败:", error);
		return NextResponse.json(
			{ success: false, message: "服务器错误" },
			{ status: 500 },
		);
	}
}
