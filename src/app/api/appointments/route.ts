import {
	type Appointment,
	type NewAppointmentData,
	type UpdateAppointmentData,
	addAppointment,
	deleteAppointment,
	getAllAppointments,
	updateAppointment,
} from "@/lib/appointment.queries";
import { NextRequest, NextResponse } from "next/server";

// 获取所有预约
export async function GET() {
	try {
		const appointments = getAllAppointments();
		return NextResponse.json({ success: true, appointments });
	} catch (error) {
		console.error("获取预约列表失败:", error);
		return NextResponse.json(
			{ success: false, message: "获取预约列表失败" },
			{ status: 500 },
		);
	}
}

// 创建新预约
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();

		// 验证必要字段
		if (!body.customerName) {
			return NextResponse.json(
				{ success: false, message: "客户姓名必填" },
				{ status: 400 },
			);
		}

		if (!body.appointmentTime) {
			return NextResponse.json(
				{ success: false, message: "预约时间必填" },
				{ status: 400 },
			);
		}

		// 准备预约数据
		const appointmentData: NewAppointmentData = {
			customerName: body.customerName,
			appointmentTime: body.appointmentTime,
			serviceType: body.serviceType || null,
			staffId: body.staffId ? parseInt(body.staffId) : null,
			vehicleId: body.vehicleId ? parseInt(body.vehicleId) : null,
			status: ["pending", "confirmed", "completed", "cancelled"].includes(
				body.status,
			)
				? (body.status as Appointment["status"])
				: "pending",
		};

		const newAppointment = addAppointment(appointmentData);

		if (!newAppointment) {
			return NextResponse.json(
				{ success: false, message: "创建预约失败" },
				{ status: 400 },
			);
		}

		return NextResponse.json({
			success: true,
			appointment: newAppointment,
		});
	} catch (error) {
		console.error("创建预约失败:", error);
		return NextResponse.json(
			{ success: false, message: "服务器错误" },
			{ status: 500 },
		);
	}
}

// 更新预约
export async function PUT(request: NextRequest) {
	try {
		const body = await request.json();

		if (!body.id) {
			return NextResponse.json(
				{ success: false, message: "预约ID必填" },
				{ status: 400 },
			);
		}

		const updateData: UpdateAppointmentData = {};

		// 只包含要更新的字段
		if (body.customerName !== undefined)
			updateData.customerName = body.customerName;
		if (body.appointmentTime !== undefined)
			updateData.appointmentTime = body.appointmentTime;
		if (body.serviceType !== undefined)
			updateData.serviceType = body.serviceType;

		// 处理staff和vehicle ID
		if (body.staffId !== undefined) {
			updateData.staffId = body.staffId ? parseInt(body.staffId) : null;
		}

		if (body.vehicleId !== undefined) {
			updateData.vehicleId = body.vehicleId ? parseInt(body.vehicleId) : null;
		}

		// 验证状态值有效性
		if (body.status !== undefined) {
			if (
				!["pending", "confirmed", "completed", "cancelled"].includes(
					body.status,
				)
			) {
				return NextResponse.json(
					{ success: false, message: "无效的状态值" },
					{ status: 400 },
				);
			}
			updateData.status = body.status as Appointment["status"];
		}

		const updatedAppointment = updateAppointment(parseInt(body.id), updateData);

		if (!updatedAppointment) {
			return NextResponse.json(
				{ success: false, message: "更新预约失败，预约可能不存在" },
				{ status: 400 },
			);
		}

		return NextResponse.json({
			success: true,
			appointment: updatedAppointment,
		});
	} catch (error) {
		console.error("更新预约失败:", error);
		return NextResponse.json(
			{ success: false, message: "服务器错误" },
			{ status: 500 },
		);
	}
}

// 删除预约
export async function DELETE(request: NextRequest) {
	try {
		// 从 URL 参数获取 ID
		const url = new URL(request.url);
		const id = url.searchParams.get("id");

		if (!id) {
			return NextResponse.json(
				{ success: false, message: "预约ID必填" },
				{ status: 400 },
			);
		}

		const success = deleteAppointment(parseInt(id));

		if (!success) {
			return NextResponse.json(
				{ success: false, message: "删除预约失败，预约可能不存在" },
				{ status: 404 },
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("删除预约失败:", error);
		return NextResponse.json(
			{ success: false, message: "服务器错误" },
			{ status: 500 },
		);
	}
}
