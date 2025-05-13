import { getDb } from "./db";

// Define the Appointment type based on the database schema
export interface Appointment {
	id: number;
	appointmentId: string; // Unique appointment identifier for tracking
	customerName: string;
	contactPhone: string | null;
	contactAddress: string | null;
	notes: string | null;
	documentCount: number;
	appointmentTime: string; // Store as ISO 8601 string (DATETIME)
	serviceType: string | null;
	documentTypesJson: string | null; // 新增：以JSON格式存储文档类型信息
	status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
	estimatedCompletionTime: string | null; // Estimated completion time
	processingNotes: string | null; // Notes for processing
	lastUpdatedBy: number | null; // User ID who last updated
	lastUpdatedAt: string | null; // Timestamp of last update
	createdBy: number | null; // User ID who created the appointment
	createdAt: string;
	assignedStaffJson: string | null; // JSON string of assigned staff IDs array
	assignedVehicleJson: string | null; // JSON string of assigned vehicle IDs array
}

// History record for appointment status changes
export interface AppointmentHistory {
	id: number;
	appointmentId: number;
	status: Appointment["status"];
	notes: string | null;
	updatedBy: number;
	updatedAt: string;
	assignedStaffJson: string | null; // JSON string of assigned staff IDs array
	assignedVehicleJson: string | null; // JSON string of assigned vehicle IDs array
}

// Type for creating a new appointment (omit id and createdAt)
export type NewAppointmentData = Omit<
	Appointment,
	"id" | "appointmentId" | "createdAt" | "lastUpdatedBy" | "lastUpdatedAt" | "estimatedCompletionTime" | "processingNotes" | "assignedStaffJson" | "assignedVehicleJson" | "documentTypesJson"
> & {
	appointmentTime: string; // Ensure time is provided
	documentTypesJson?: string | null; // Optional JSON string of document types and counts
	estimatedCompletionTime?: string | null;
	processingNotes?: string | null;
	contactPhone?: string | null;
	contactAddress?: string | null;
	notes?: string | null;
	documentCount?: number;
	updatedBy?: number | null;
	createdBy: number; // Required - the user who created the appointment
	assignedStaffJson?: string | null; // JSON string of assigned staff IDs array
	assignedVehicleJson?: string | null; // JSON string of assigned vehicle IDs array
};

// Type for updating an appointment (all fields optional)
export type UpdateAppointmentData = Partial<
	Omit<Appointment, "id" | "appointmentId" | "createdAt">
>;

// Type for recording a status change
export type AppointmentStatusChange = {
	appointmentId: number;
	status: Appointment["status"];
	notes?: string | null;
	updatedBy: number;
	assignedStaffJson?: string | null; // JSON string of assigned staff IDs array
	assignedVehicleJson?: string | null; // JSON string of assigned vehicle IDs array
};

/**
 * Fetches all appointments from the database, ordered by appointment time.
 */
export const getAllAppointments = (): Appointment[] => {
	try {
		const db = getDb();
		const query = db.query<Appointment, []>(
			"SELECT id, appointmentId, customerName, contactPhone, contactAddress, notes, documentCount, appointmentTime, serviceType, documentTypesJson, status, estimatedCompletionTime, processingNotes, lastUpdatedBy, lastUpdatedAt, createdBy, createdAt, assignedStaffJson, assignedVehicleJson FROM appointments ORDER BY appointmentTime DESC",
		);
		return query.all();
	} catch (error) {
		console.error("Error fetching all appointments:", error);
		return [];
	}
};

/**
 * Generates a unique appointment ID with prefix
 */
export const generateAppointmentId = (): string => {
	const prefix = 'APT';
	const timestamp = Date.now().toString().slice(-6);
	const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
	return `${prefix}-${timestamp}-${random}`;
};

/**
 * Records a status change in the appointment history
 */
export const recordAppointmentHistory = (
	data: AppointmentStatusChange
): boolean => {
	try {
		const db = getDb();
		const { appointmentId, status, notes, updatedBy, assignedStaffJson, assignedVehicleJson } = data;
		const now = new Date().toISOString();

		const insertQuery = db.query(
			`INSERT INTO appointment_history 
			(appointmentId, status, notes, updatedBy, updatedAt, assignedStaffJson, assignedVehicleJson)
			VALUES (?, ?, ?, ?, ?, ?, ?)`
		);

		const result = insertQuery.run(
			appointmentId,
			status,
			notes || null,
			updatedBy,
			now,
			assignedStaffJson || null,
			assignedVehicleJson || null
		);

		return result.changes > 0;
	} catch (error) {
		console.error("Error recording appointment history:", error);
		return false;
	}
};

/**
 * Gets appointment history records for a specific appointment
 */
export const getAppointmentHistory = (appointmentId: number): AppointmentHistory[] => {
	try {
		const db = getDb();
		const query = db.query<AppointmentHistory, [number]>(
			`SELECT * FROM appointment_history 
			WHERE appointmentId = ? 
			ORDER BY updatedAt DESC`
		);

		return query.all(appointmentId);
	} catch (error) {
		console.error("Error fetching appointment history:", error);
		return [];
	}
};

/**
 * Adds a new appointment to the database.
 */
export const addAppointment = (
	data: NewAppointmentData,
): Appointment | null => {
	try {
		const db = getDb();
		const {
			customerName,
			appointmentTime,
			serviceType = null,
			documentTypesJson = null, // 新增：处理文档类型JSON
			status = "pending",
			estimatedCompletionTime = null,
			processingNotes = null,
			contactPhone = null,
			contactAddress = null,
			notes = null,
			documentCount = 1,
			updatedBy = null,
			createdBy,
			assignedStaffJson = null,
			assignedVehicleJson = null,
		} = data;

		// Generate unique appointment ID
		const appointmentId = generateAppointmentId();
		const now = new Date().toISOString();

		const insertQuery = db.query<
			Appointment,
			[
				string,
				string,
				string | null,
				string | null,
				string | null,
				number,
				string,
				string | null,
				string | null, // documentTypesJson
				Appointment["status"],
				string | null,
				string | null,
				number | null,
				string | null,
				number,
				string | null,
				string | null
			]
		>(
			`INSERT INTO appointments 
       (appointmentId, customerName, contactPhone, contactAddress, notes, documentCount, appointmentTime, serviceType, documentTypesJson, status, estimatedCompletionTime, processingNotes, lastUpdatedBy, lastUpdatedAt, createdBy, assignedStaffJson, assignedVehicleJson)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
       RETURNING id, appointmentId, customerName, contactPhone, contactAddress, notes, documentCount, appointmentTime, serviceType, documentTypesJson, status, estimatedCompletionTime, processingNotes, lastUpdatedBy, lastUpdatedAt, createdBy, createdAt, assignedStaffJson, assignedVehicleJson`,
		);

		const newAppointment = insertQuery.get(
			appointmentId,
			customerName,
			contactPhone,
			contactAddress,
			notes,
			documentCount,
			appointmentTime,
			serviceType,
			documentTypesJson,
			status,
			estimatedCompletionTime,
			processingNotes,
			updatedBy,
			updatedBy ? now : null,
			createdBy,
			assignedStaffJson,
			assignedVehicleJson
		);

		// Record initial status in history if there's an updatedBy value
		if (updatedBy && newAppointment) {
			recordAppointmentHistory({
				appointmentId: newAppointment.id,
				status,
				notes: processingNotes,
				updatedBy,
				assignedStaffJson,
				assignedVehicleJson
			});
		}

		return newAppointment;
	} catch (error) {
		console.error("Error adding appointment:", error);
		return null;
	}
};

/**
 * Updates an existing appointment.
 */
export const updateAppointment = (
	id: number,
	data: UpdateAppointmentData,
): Appointment | null => {
	try {
		const db = getDb();
		const fields = Object.keys(data) as (keyof UpdateAppointmentData)[];
		if (fields.length === 0) {
			// If no data to update, fetch and return the current appointment
			const currentQuery = db.query<Appointment, [number]>(
				"SELECT * FROM appointments WHERE id = ?",
			);
			return currentQuery.get(id);
		}

		// Add lastUpdatedAt field to update the timestamp
		if (data.lastUpdatedBy && !fields.includes("lastUpdatedAt")) {
			data.lastUpdatedAt = new Date().toISOString();
			fields.push("lastUpdatedAt");
		}

		let setClause = fields.map((field) => `${field} = ?`).join(", ");
		const values = fields.map((field) => data[field]);
		values.push(id); // Add id for the WHERE clause

		const updateQuery = db.query<Appointment, any[]>(
			`UPDATE appointments SET ${setClause} WHERE id = ? 
       RETURNING id, appointmentId, customerName, contactPhone, contactAddress, notes, documentCount, appointmentTime, serviceType, documentTypesJson, status, estimatedCompletionTime, processingNotes, lastUpdatedBy, lastUpdatedAt, createdBy, createdAt, assignedStaffJson, assignedVehicleJson`,
		);

		const updatedAppointment = updateQuery.get(...values);

		// Record status change in history if status was updated and there's an updatedBy value
		if (data.status && data.lastUpdatedBy && updatedAppointment) {
			recordAppointmentHistory({
				appointmentId: id,
				status: data.status,
				notes: data.processingNotes !== undefined ? data.processingNotes : updatedAppointment.processingNotes,
				updatedBy: data.lastUpdatedBy,
				assignedStaffJson: data.assignedStaffJson !== undefined ? data.assignedStaffJson : updatedAppointment.assignedStaffJson,
				assignedVehicleJson: data.assignedVehicleJson !== undefined ? data.assignedVehicleJson : updatedAppointment.assignedVehicleJson
			});
		}

		return updatedAppointment;
	} catch (error) {
		console.error("Error updating appointment:", error);
		return null;
	}
};

/**
 * Deletes an appointment from the database.
 * Returns true if deletion was successful, false otherwise.
 */
export const deleteAppointment = (id: number): boolean => {
	try {
		const db = getDb();
		const deleteQuery = db.query("DELETE FROM appointments WHERE id = ?");
		const result = deleteQuery.run(id);
		return result.changes > 0;
	} catch (error) {
		console.error("Error deleting appointment:", error);
		return false;
	}
};
