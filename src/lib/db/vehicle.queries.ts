import { getDb } from "./db";

// Define the Vehicle type based on the database schema
export interface Vehicle {
	id: number;
	plateNumber: string;  // 必填：车牌号
	model: string;        // 必填：车型
	vehicleType: "electric" | "fuel"; // 必填：车辆类型 - 电车或油车
	length: number;       // 车长（米）
	status: "available" | "in_use" | "maintenance";
	createdAt: string;
}

// Type for creating a new vehicle
export type NewVehicleData = {
	plateNumber: string;  // 必填：车牌号 
	model: string;        // 必填：车型
	vehicleType: Vehicle["vehicleType"]; // 必填：车辆类型
	length?: number;      // 可选：车长（米）
	status?: Vehicle["status"];
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
			"SELECT id, plateNumber, model, status, createdAt FROM vehicles ORDER BY createdAt DESC",
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
		const { plateNumber, model, vehicleType, length = 0, status = "available" } = data;
		const insertQuery = db.query<
			Vehicle,
			[string, string, Vehicle["vehicleType"], number, Vehicle["status"]]
		>(
			"INSERT INTO vehicles (plateNumber, model, vehicleType, length, status) VALUES (?, ?, ?, ?, ?) RETURNING id, plateNumber, model, vehicleType, length, status, createdAt",
		);
		const newVehicle = insertQuery.get(plateNumber, model, vehicleType, length, status);
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
				"SELECT * FROM vehicles WHERE id = ?",
			);
			return currentQuery.get(id);
		}

		let setClause = fields.map((field) => `${field} = ?`).join(", ");
		const values = fields.map((field) => data[field]);
		values.push(id.toString());

		const updateQuery = db.query<Vehicle, any[]>(
			`UPDATE vehicles SET ${setClause} WHERE id = ? RETURNING id, plateNumber, model, vehicleType, length, status, createdAt`,
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
		// First, update any appointments that reference this vehicle to NULL
		db.query(
			"UPDATE appointments SET vehicleId = NULL WHERE vehicleId = ?",
		).run(id);

		const deleteQuery = db.query("DELETE FROM vehicles WHERE id = ?");
		const result = deleteQuery.run(id);
		return result.changes > 0;
	} catch (error) {
		console.error("Error deleting vehicle:", error);
		return false;
	}
};
