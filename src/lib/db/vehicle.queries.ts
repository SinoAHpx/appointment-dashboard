import { getDb } from "./db";

// Define the Vehicle type based on the database schema
export interface Vehicle {
	id: number;
	plateNumber: string;  // 必填：车牌号
	model: string;        // 必填：车型
	vehicleType: "electric" | "fuel"; // 必填：车辆类型 - 电车或油车
	length: number;       // 车长（米）
	isAvailable: boolean; // 新增：是否可用
	createdAt: string;
}

// Type for creating a new vehicle
export type NewVehicleData = {
	plateNumber: string;  // 必填：车牌号 
	model: string;        // 必填：车型
	vehicleType: Vehicle["vehicleType"]; // 必填：车辆类型
	length?: number | null;
	isAvailable?: boolean; // 新增：是否可用，默认为 true
};

// Type for updating an existing vehicle
export type UpdateVehicleData = Partial<Omit<Vehicle, "id" | "createdAt">>;

/**
 * Fetches all vehicles from the database.
 */
export const getAllVehicles = (): Vehicle[] => {
	try {
		const db = getDb();
		const query = db.query<Vehicle, []>(
			"SELECT id, plateNumber, model, vehicleType, length, isAvailable, createdAt FROM vehicles ORDER BY createdAt DESC",
		);
		return query.all();
	} catch (error) {
		console.error("Error fetching all vehicles:", error);
		return [];
	}
};

/**
 * Adds a new vehicle to the database.
 */
export const addVehicle = (data: NewVehicleData): Vehicle | null => {
	try {
		const db = getDb();
		const {
			plateNumber,
			model,
			vehicleType,
			length = null,
			isAvailable = true,
		} = data;

		const insertQuery = db.query<
			Vehicle,
			[string, string, string, number | null, boolean]
		>(
			"INSERT INTO vehicles (plateNumber, model, vehicleType, length, isAvailable) VALUES (?, ?, ?, ?, ?) RETURNING id, plateNumber, model, vehicleType, length, isAvailable, createdAt",
		);

		const newVehicle = insertQuery.get(
			plateNumber,
			model,
			vehicleType,
			length,
			isAvailable,
		);
		return newVehicle;
	} catch (error) {
		// Check for unique constraint violation (plateNumber)
		if (
			error instanceof Error &&
			error.message.includes("UNIQUE constraint failed: vehicles.plateNumber")
		) {
			console.error(`Error adding vehicle: Plate number already exists.`);
		} else {
			console.error("Error adding vehicle:", error);
		}
		return null;
	}
};

/**
 * Updates an existing vehicle's information.
 */
export const updateVehicle = (
	id: number,
	data: UpdateVehicleData,
): Vehicle | null => {
	try {
		const db = getDb();
		const fields = Object.keys(data) as (keyof UpdateVehicleData)[];
		if (fields.length === 0) {
			const currentQuery = db.query<Vehicle, [number]>(
				"SELECT id, plateNumber, model, vehicleType, length, isAvailable, createdAt FROM vehicles WHERE id = ?",
			);
			return currentQuery.get(id);
		}

		let setClause = fields.map((field) => `${field} = ?`).join(", ");
		const values = fields.map((field) => data[field]);
		values.push(id.toString());

		const updateQuery = db.query<Vehicle, any[]>(
			`UPDATE vehicles SET ${setClause} WHERE id = ? RETURNING id, plateNumber, model, vehicleType, length, isAvailable, createdAt`,
		);
		const updatedVehicle = updateQuery.get(...values);
		return updatedVehicle;
	} catch (error) {
		// Check for unique constraint violation if plateNumber is updated
		if (
			data.plateNumber &&
			error instanceof Error &&
			error.message.includes("UNIQUE constraint failed: vehicles.plateNumber")
		) {
			console.error(
				`Error updating vehicle ${id}: Plate number already exists.`,
			);
		} else {
			console.error(`Error updating vehicle ${id}:`, error);
		}
		return null;
	}
};

/**
 * Deletes a vehicle from the database.
 * Returns true if deletion was successful, false otherwise.
 */
export const deleteVehicle = (id: number): boolean => {
	try {
		const db = getDb();
		// 当删除车辆时，不再直接修改 appointments 表。
		// 依赖后续业务逻辑处理（如编辑预约时发现车辆不存在）。
		// 或者可以创建一个单独的服务来异步清理这些关联。

		const deleteQuery = db.query("DELETE FROM vehicles WHERE id = ?");
		const result = deleteQuery.run(id);
		return result.changes > 0;
	} catch (error) {
		console.error("Error deleting vehicle:", error);
		return false;
	}
};
