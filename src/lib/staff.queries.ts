import { getDb } from "./db";

// Define the Staff type based on the database schema
export interface Staff {
	id: number;
	name: string;
	status: "active" | "inactive" | "on_leave";
	createdAt: string;
}

/**
 * Fetches all staff members from the database.
 */
export const getAllStaff = (): Staff[] => {
	try {
		const db = getDb();
		const query = db.query<Staff, []>(
			"SELECT id, name, status, createdAt FROM staff ORDER BY createdAt DESC",
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
export const addStaff = (
	name: string,
	status: Staff["status"] = "active",
): Staff | null => {
	try {
		const db = getDb();
		const insertQuery = db.query<Staff, [string, Staff["status"]]>(
			"INSERT INTO staff (name, status) VALUES (?, ?) RETURNING id, name, status, createdAt",
		);
		const newStaff = insertQuery.get(name, status);
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
	data: Partial<Pick<Staff, "name" | "status">>,
): Staff | null => {
	try {
		const db = getDb();
		let updateClause = "";
		const values: (string | number)[] = [];

		if (data.name !== undefined) {
			updateClause += "name = ?, ";
			values.push(data.name);
		}
		if (data.status !== undefined) {
			updateClause += "status = ?, ";
			values.push(data.status);
		}

		if (values.length === 0) {
			// No fields to update, maybe fetch and return the existing one?
			const currentStaffQuery = db.query<Staff, [number]>(
				"SELECT id, name, status, createdAt FROM staff WHERE id = ?",
			);
			return currentStaffQuery.get(id);
		}

		// Remove trailing comma and space
		updateClause = updateClause.slice(0, -2);
		values.push(id); // Add id for the WHERE clause

		const updateQuery = db.query<Staff, (string | number)[]>(
			`UPDATE staff SET ${updateClause} WHERE id = ? RETURNING id, name, status, createdAt`,
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
