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
import { withAdminAuth, AuthVerificationResult } from "@/lib/auth";

// 获取所有车辆 - 仅管理员可访问
const getVehiclesHandler = async (request: NextRequest, auth: AuthVerificationResult) => {
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
};

export const GET = withAdminAuth(getVehiclesHandler);

// 创建新车辆 - 仅管理员可访问
const createVehicleHandler = async (request: NextRequest, auth: AuthVerificationResult) => {
	try {
		const body = await request.json();

		// 验证必要字段
		if (!body.plateNumber) {
			return NextResponse.json(
				{ success: false, message: "车牌号必填" },
				{ status: 400 },
			);
		}

		if (!body.model) {
			return NextResponse.json(
				{ success: false, message: "车型必填" },
				{ status: 400 },
			);
		}

		if (!body.vehicleType || !["electric", "fuel"].includes(body.vehicleType)) {
			return NextResponse.json(
				{ success: false, message: "请选择有效的车辆类型（电车或油车）" },
				{ status: 400 },
			);
		}

		// 创建新车辆数据对象
		const vehicleData: NewVehicleData = {
			plateNumber: body.plateNumber,
			model: body.model,
			vehicleType: body.vehicleType,
			length: parseFloat(body.length) || 0,
			isAvailable: body.isAvailable,
		};

		const newVehicle = addVehicle(vehicleData);

		if (!newVehicle) {
			return NextResponse.json(
				{ success: false, message: "创建车辆失败，车牌号可能已存在" },
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
};

export const POST = withAdminAuth(createVehicleHandler);

// 更新车辆 - 仅管理员可访问
const updateVehicleHandler = async (request: NextRequest, auth: AuthVerificationResult) => {
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
		if (body.plateNumber !== undefined) {
			if (body.plateNumber === "") {
				return NextResponse.json(
					{ success: false, message: "车牌号不能为空" },
					{ status: 400 },
				);
			}
			updateData.plateNumber = body.plateNumber;
		}

		if (body.model !== undefined) {
			if (body.model === "") {
				return NextResponse.json(
					{ success: false, message: "车型不能为空" },
					{ status: 400 },
				);
			}
			updateData.model = body.model;
		}

		// 验证车辆类型有效性
		if (body.vehicleType !== undefined) {
			if (!["electric", "fuel"].includes(body.vehicleType)) {
				return NextResponse.json(
					{ success: false, message: "无效的车辆类型" },
					{ status: 400 },
				);
			}
			updateData.vehicleType = body.vehicleType;
		}

		// 处理车长更新
		if (body.length !== undefined) {
			updateData.length = parseFloat(body.length) || 0;
		}

		// 更新 isAvailable 状态
		if (body.isAvailable !== undefined) {
			if (typeof body.isAvailable !== "boolean") {
				return NextResponse.json(
					{ success: false, message: "isAvailable 必须是布尔值" },
					{ status: 400 },
				);
			}
			updateData.isAvailable = body.isAvailable;
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
};

export const PUT = withAdminAuth(updateVehicleHandler);

// 删除车辆 - 仅管理员可访问
const deleteVehicleHandler = async (request: NextRequest, auth: AuthVerificationResult) => {
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
};

export const DELETE = withAdminAuth(deleteVehicleHandler);
