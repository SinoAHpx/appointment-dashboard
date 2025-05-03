import { getDb } from "./db";

// Define the Staff type based on the database schema
export interface Staff {
	id: number;
	name: string;      // 必填
	phone: string;     // 必填
	email?: string | null;
	position?: string | null;
	status: "active" | "inactive" | "on_leave";
	createdAt: string;
}

// Type for creating a new staff member
export type NewStaffData = {
	name: string;      // 必填
	phone: string;     // 必填
	email?: string | null;
	position?: string | null;
	status?: Staff["status"];
};

// Type for updating a staff member
export type UpdateStaffData = Partial<Omit<Staff, "id" | "createdAt">>;

/**
 * Fetches all staff members from the database.
 */
export const getAllStaff = (): Staff[] => {
	try {
		const db = getDb();
		const query = db.query<Staff, []>(
			"SELECT id, name, phone, email, position, status, createdAt FROM staff ORDER BY createdAt DESC",
		);
		return query.all();
	} catch (error) {
		console.error("Error fetching all staff:", error);
		return [];
	}
};

/**
 * Adds a new staff member to the database.
 */
export const addStaff = (data: NewStaffData): Staff | null => {
	try {
		const db = getDb();
		const { name, phone, email = null, position = null, status = "active" } = data;

		const insertQuery = db.query<Staff, [string, string, string | null, string | null, Staff["status"]]>(
			"INSERT INTO staff (name, phone, email, position, status) VALUES (?, ?, ?, ?, ?) RETURNING id, name, phone, email, position, status, createdAt",
		);

		const newStaff = insertQuery.get(name, phone, email, position, status);
		return newStaff;
	} catch (error) {
		console.error("Error adding staff:", error);
		return null;
	}
};

/**
 * Updates an existing staff member's information.
 */
export const updateStaff = (
	id: number,
	data: UpdateStaffData,
): Staff | null => {
	try {
		const db = getDb();
		const fields = Object.keys(data) as (keyof UpdateStaffData)[];

		if (fields.length === 0) {
			// No fields to update, maybe fetch and return the existing one?
			const currentStaffQuery = db.query<Staff, [number]>(
				"SELECT id, name, phone, email, position, status, createdAt FROM staff WHERE id = ?",
			);
			return currentStaffQuery.get(id);
		}

		// Build the SET clause and values array
		let setClause = fields.map((field) => `${field} = ?`).join(", ");
		const values = fields.map((field) => data[field]);
		values.push(id.toString()); // Add id for the WHERE clause

		const updateQuery = db.query<Staff, any[]>(
			`UPDATE staff SET ${setClause} WHERE id = ? RETURNING id, name, phone, email, position, status, createdAt`,
		);

		const updatedStaff = updateQuery.get(...values);
		return updatedStaff;
	} catch (error) {
		console.error("Error updating staff:", error);
		return null;
	}
};

/**
 * Deletes a staff member from the database.
 * Returns true if deletion was successful, false otherwise.
 */
export const deleteStaff = (id: number): boolean => {
	try {
		const db = getDb();
		// First, update any appointments that reference this staff to NULL
		db.query("UPDATE appointments SET staffId = NULL WHERE staffId = ?").run(
			id,
		);

		const deleteQuery = db.query("DELETE FROM staff WHERE id = ?");
		const result = deleteQuery.run(id);
		// bun:sqlite specific: result.changes should be > 0 for successful delete
		return result.changes > 0;
	} catch (error) {
		console.error("Error deleting staff:", error);
		return false;
	}
};
