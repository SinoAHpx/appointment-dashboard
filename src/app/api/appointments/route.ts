import {
	type Appointment,
	type AppointmentHistory,
	type NewAppointmentData,
	type UpdateAppointmentData,
	addAppointment,
	deleteAppointment,
	getAllAppointments,
	getAppointmentHistory,
	updateAppointment,
} from "@/lib/db/appointment.queries";
import { verifyAdmin, verifyAuth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { updateStaff } from "@/lib/db/staff.queries";
import { updateVehicle } from "@/lib/db/vehicle.queries";

// 获取所有预约
export async function GET(request: NextRequest) {
	try {
		const auth = await verifyAuth(request);
		if (!auth.isAuthenticated) {
			return NextResponse.json(
				{ success: false, message: "未授权访问" },
				{ status: 401 }
			);
		}

		const url = new URL(request.url);
		const id = url.searchParams.get("id");
		const includeHistory = url.searchParams.get("includeHistory") === "true";

		let appointments = getAllAppointments();

		if (!auth.isAdmin) {
			appointments = appointments.filter(
				app => app.createdBy === auth.userId
			);
		}

		if (id) {
			const filteredAppointments = appointments.filter(
				(app) => app.id === parseInt(id)
			);

			if (filteredAppointments.length === 0) {
				return NextResponse.json(
					{ success: false, message: "找不到指定的预约记录或无权访问该记录" },
					{ status: 404 }
				);
			}

			const appointment = filteredAppointments[0];
			let history: AppointmentHistory[] = [];

			if (includeHistory && auth.isAdmin) {
				history = getAppointmentHistory(parseInt(id));
			}

			let assignedStaff: string[] = [];
			if (appointment.assignedStaffJson) {
				try {
					assignedStaff = JSON.parse(appointment.assignedStaffJson);
				} catch (e) {
					console.error("Error parsing assignedStaffJson", e);
				}
			}

			let assignedVehicles: string[] = [];
			if (appointment.assignedVehicleJson) {
				try {
					assignedVehicles = JSON.parse(appointment.assignedVehicleJson);
				} catch (e) {
					console.error("Error parsing assignedVehicleJson", e);
				}
			}

			const responseAppointment = {
				...appointment,
				assignedStaff,
				assignedVehicles
			};

			return NextResponse.json({
				success: true,
				appointment: responseAppointment,
				history: includeHistory && auth.isAdmin ? history : undefined
			});
		}

		const transformedAppointments = appointments.map(app => {
			let assignedStaff: string[] = [];
			if (app.assignedStaffJson) {
				try {
					assignedStaff = JSON.parse(app.assignedStaffJson);
				} catch (e) {
					console.error("Error parsing assignedStaffJson", e);
				}
			}

			let assignedVehicles: string[] = [];
			if (app.assignedVehicleJson) {
				try {
					assignedVehicles = JSON.parse(app.assignedVehicleJson);
				} catch (e) {
					console.error("Error parsing assignedVehicleJson", e);
				}
			}

			return {
				...app,
				assignedStaff,
				assignedVehicles
			};
		});

		return NextResponse.json({ success: true, appointments: transformedAppointments });
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
		const auth = await verifyAuth(request);
		if (!auth.isAuthenticated) {
			return NextResponse.json(
				{ success: false, message: "未授权访问" },
				{ status: 401 }
			);
		}

		const body = await request.json();

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

		const appointmentData: NewAppointmentData = {
			customerName: body.customerName,
			appointmentTime: body.appointmentTime,
			serviceType: body.serviceType || null,
			documentTypesJson: body.documentTypesJson || null,
			status: ["pending", "confirmed", "in_progress", "completed", "cancelled"].includes(
				body.status,
			)
				? (body.status as Appointment["status"])
				: "pending",
			estimatedCompletionTime: body.estimatedCompletionTime || null,
			processingNotes: body.processingNotes || null,
			contactPhone: body.contactPhone || null,
			contactAddress: body.contactAddress || null,
			notes: body.notes || null,
			documentCount: body.documentCount || 1,
			createdBy: auth.userId,
		};

		if (body.assignedStaffJson !== undefined) {
			appointmentData.assignedStaffJson = body.assignedStaffJson;
		} else if (body.assignedStaff) {
			appointmentData.assignedStaffJson = Array.isArray(body.assignedStaff) && body.assignedStaff.length > 0
				? JSON.stringify(body.assignedStaff)
				: null;
		}

		if (body.assignedVehicleJson !== undefined) {
			appointmentData.assignedVehicleJson = body.assignedVehicleJson;
		} else if (body.assignedVehicles) {
			appointmentData.assignedVehicleJson = Array.isArray(body.assignedVehicles) && body.assignedVehicles.length > 0
				? JSON.stringify(body.assignedVehicles)
				: null;
		}

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
		const auth = await verifyAuth(request);
		if (!auth.isAuthenticated) {
			return NextResponse.json(
				{ success: false, message: "未授权访问" },
				{ status: 401 }
			);
		}

		const body = await request.json();

		if (!body.id) {
			return NextResponse.json(
				{ success: false, message: "预约ID必填" },
				{ status: 400 },
			);
		}

		const appointments = getAllAppointments();
		const appointmentToUpdate = appointments.find(app => app.id === parseInt(body.id));

		if (!appointmentToUpdate) {
			return NextResponse.json(
				{ success: false, message: "预约不存在" },
				{ status: 404 }
			);
		}

		if (!auth.isAdmin && appointmentToUpdate.createdBy !== auth.userId) {
			return NextResponse.json(
				{ success: false, message: "无权操作此预约" },
				{ status: 403 }
			);
		}

		const oldAssignedStaffIds: number[] = appointmentToUpdate.assignedStaffJson
			? JSON.parse(appointmentToUpdate.assignedStaffJson).map(Number)
			: [];
		const oldAssignedVehicleIds: number[] = appointmentToUpdate.assignedVehicleJson
			? JSON.parse(appointmentToUpdate.assignedVehicleJson).map(Number)
			: [];

		const updateData: UpdateAppointmentData = {};

		if (body.customerName !== undefined)
			updateData.customerName = body.customerName;
		if (body.appointmentTime !== undefined)
			updateData.appointmentTime = body.appointmentTime;
		if (body.serviceType !== undefined)
			updateData.serviceType = body.serviceType;
		if (body.documentTypesJson !== undefined)
			updateData.documentTypesJson = body.documentTypesJson;
		if (body.estimatedCompletionTime !== undefined)
			updateData.estimatedCompletionTime = body.estimatedCompletionTime;
		if (body.processingNotes !== undefined)
			updateData.processingNotes = body.processingNotes;
		if (body.contactPhone !== undefined)
			updateData.contactPhone = body.contactPhone;
		if (body.contactAddress !== undefined)
			updateData.contactAddress = body.contactAddress;
		if (body.notes !== undefined)
			updateData.notes = body.notes;
		if (body.documentCount !== undefined)
			updateData.documentCount = body.documentCount;

		let newAssignedStaffIds: number[] = oldAssignedStaffIds;
		let newAssignedVehicleIds: number[] = oldAssignedVehicleIds;

		if (auth.isAdmin) {
			if (body.assignedStaffJson !== undefined) {
				updateData.assignedStaffJson = body.assignedStaffJson;
				newAssignedStaffIds = body.assignedStaffJson ? JSON.parse(body.assignedStaffJson).map(Number) : [];
			} else if (body.assignedStaff !== undefined) {
				updateData.assignedStaffJson = Array.isArray(body.assignedStaff) && body.assignedStaff.length > 0
					? JSON.stringify(body.assignedStaff)
					: null;
				newAssignedStaffIds = Array.isArray(body.assignedStaff) && body.assignedStaff.length > 0
					? body.assignedStaff.map(Number)
					: [];
			}

			if (body.assignedVehicleJson !== undefined) {
				updateData.assignedVehicleJson = body.assignedVehicleJson;
				newAssignedVehicleIds = body.assignedVehicleJson ? JSON.parse(body.assignedVehicleJson).map(Number) : [];
			} else if (body.assignedVehicles !== undefined) {
				updateData.assignedVehicleJson = Array.isArray(body.assignedVehicles) && body.assignedVehicles.length > 0
					? JSON.stringify(body.assignedVehicles)
					: null;
				newAssignedVehicleIds = Array.isArray(body.assignedVehicles) && body.assignedVehicles.length > 0
					? body.assignedVehicles.map(Number)
					: [];
			}
		}

		updateData.lastUpdatedBy = auth.userId;

		if (body.status !== undefined) {
			if (
				!["pending", "confirmed", "in_progress", "completed", "cancelled"].includes(
					body.status,
				)
			) {
				return NextResponse.json(
					{ success: false, message: "无效的状态值" },
					{ status: 400 },
				);
			}
			if (body.status === "in_progress" && !auth.isAdmin) {
				return NextResponse.json(
					{ success: false, message: "只有管理员可以将预约设置为处理中状态" },
					{ status: 403 }
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

		if (auth.isAdmin) {
			const staffToMakeAvailable = oldAssignedStaffIds.filter(id => !newAssignedStaffIds.includes(id));
			const staffToMakeUnavailable = newAssignedStaffIds.filter(id => !oldAssignedStaffIds.includes(id));

			staffToMakeAvailable.forEach(staffId => {
				try {
					updateStaff(staffId, { isAvailable: true });
				} catch (e) {
					console.error(`Error making staff ${staffId} available:`, e);
				}
			});
			staffToMakeUnavailable.forEach(staffId => {
				try {
					updateStaff(staffId, { isAvailable: false });
				} catch (e) {
					console.error(`Error making staff ${staffId} unavailable:`, e);
				}
			});

			const vehiclesToMakeAvailable = oldAssignedVehicleIds.filter(id => !newAssignedVehicleIds.includes(id));
			const vehiclesToMakeUnavailable = newAssignedVehicleIds.filter(id => !oldAssignedVehicleIds.includes(id));

			vehiclesToMakeAvailable.forEach(vehicleId => {
				try {
					updateVehicle(vehicleId, { isAvailable: true });
				} catch (e) {
					console.error(`Error making vehicle ${vehicleId} available:`, e);
				}
			});
			vehiclesToMakeUnavailable.forEach(vehicleId => {
				try {
					updateVehicle(vehicleId, { isAvailable: false });
				} catch (e) {
					console.error(`Error making vehicle ${vehicleId} unavailable:`, e);
				}
			});
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

// 更新预约状态
export async function PATCH(request: NextRequest) {
	try {
		const auth = await verifyAuth(request);
		if (!auth.isAuthenticated) {
			return NextResponse.json(
				{ success: false, message: "未授权访问" },
				{ status: 401 }
			);
		}

		const body = await request.json();

		if (!body.id) {
			return NextResponse.json(
				{ success: false, message: "预约ID必填" },
				{ status: 400 },
			);
		}

		const appointments = getAllAppointments();
		const appointment = appointments.find(app => app.id === parseInt(body.id));

		if (!appointment) {
			return NextResponse.json(
				{ success: false, message: "预约不存在" },
				{ status: 404 }
			);
		}

		if (!auth.isAdmin && appointment.createdBy !== auth.userId) {
			return NextResponse.json(
				{ success: false, message: "无权操作此预约" },
				{ status: 403 }
			);
		}

		if (!auth.isAdmin && body.status && body.status !== "cancelled") {
			return NextResponse.json(
				{ success: false, message: "普通用户只能取消预约" },
				{ status: 403 }
			);
		}

		if (auth.isAdmin && body.requestHistory) {
			const history = getAppointmentHistory(parseInt(body.id));
			return NextResponse.json({
				success: true,
				history,
			});
		}

		const updateData: UpdateAppointmentData = {
			status: body.status as Appointment["status"],
			lastUpdatedBy: auth.userId
		};

		const updatedAppointment = updateAppointment(parseInt(body.id), updateData);

		if (!updatedAppointment) {
			return NextResponse.json(
				{ success: false, message: "更新预约状态失败" },
				{ status: 400 },
			);
		}

		return NextResponse.json({
			success: true,
			appointment: updatedAppointment,
		});
	} catch (error) {
		console.error("更新预约状态失败:", error);
		return NextResponse.json(
			{ success: false, message: "服务器错误" },
			{ status: 500 },
		);
	}
}

// 删除预约
export async function DELETE(request: NextRequest) {
	try {
		const auth = await verifyAuth(request);
		if (!auth.isAuthenticated) {
			return NextResponse.json(
				{ success: false, message: "未授权访问" },
				{ status: 401 }
			);
		}

		const url = new URL(request.url);
		const id = url.searchParams.get("id");

		if (!id) {
			return NextResponse.json(
				{ success: false, message: "预约ID必填" },
				{ status: 400 },
			);
		}

		const appointments = getAllAppointments();
		const appointment = appointments.find(app => app.id === parseInt(id));

		if (!appointment) {
			return NextResponse.json(
				{ success: false, message: "预约不存在" },
				{ status: 404 }
			);
		}

		if (!auth.isAdmin && appointment.createdBy !== auth.userId) {
			return NextResponse.json(
				{ success: false, message: "无权删除此预约" },
				{ status: 403 }
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
