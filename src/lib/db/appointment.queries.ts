import { getDb } from "./db";

// Define the Appointment type based on the database schema
/**
 * Represents an appointment record in the database
 * @interface Appointment
 */
export interface Appointment {
	id: number;                          // Primary key
	appointmentId: string;               // Unique appointment identifier for tracking
	customerName: string;                // Customer's full name
	contactPhone: string | null;         // Customer's contact phone number
	contactAddress: string | null;       // Customer's address
	notes: string | null;                // General notes about the appointment
	documentCount: number;               // Number of documents for this appointment
	documentTypesJson: string | null;    // JSON string containing types of documents
	documentCountsJson: string | null;   // JSON string containing counts for each document type
	appointmentTime: string;             // Scheduled appointment time (ISO 8601 string / DATETIME)
	serviceType: string | null;          // Type of service requested
	documentCategory: string | null;     // Category of document being processed
	staffId: number | null;              // ID of primary staff assigned (legacy)
	vehicleId: number | null;            // ID of assigned vehicle
	status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled"; // Current status
	estimatedCompletionTime: string | null; // Estimated completion time
	processingNotes: string | null;      // Notes for internal processing
	lastUpdatedBy: number | null;        // User ID who last updated the appointment
	lastUpdatedAt: string | null;        // Timestamp of last update
	createdBy: number | null;            // User ID who created the appointment
	createdAt: string;                   // Timestamp when appointment was created
	assignedStaffJson: string | null;    // JSON string of assigned staff IDs array
}

// History record for appointment status changes
/**
 * Represents a history record for appointment status changes
 * @interface AppointmentHistory
 */
export interface AppointmentHistory {
	id: number;                          // Primary key
	appointmentId: number;               // Foreign key to the appointment
	status: Appointment["status"];       // Status at this history point
	staffId: number | null;              // Staff assigned at this history point
	vehicleId: number | null;            // Vehicle assigned at this history point
	notes: string | null;                // Notes added during this status change
	updatedBy: number;                   // User who made this status change
	updatedAt: string;                   // Timestamp of the status change
	assignedStaffJson: string | null;    // JSON string of assigned staff IDs at this point
	documentTypesJson: string | null;    // JSON string of document types at this point
	documentCountsJson: string | null;   // JSON string of document counts at this point
}

// Type for creating a new appointment (omit id and createdAt)
/**
 * Data required to create a new appointment
 * Omits system-generated fields and makes some fields optional
 * @type NewAppointmentData
 */
export type NewAppointmentData = Omit<
	Appointment,
	"id" | "appointmentId" | "createdAt" | "staffId" | "vehicleId" | "lastUpdatedBy" | "lastUpdatedAt" | "estimatedCompletionTime" | "processingNotes" | "assignedStaffJson"
> & {
	staffId?: number | null;              // Optional in creation
	vehicleId?: number | null;            // Optional in creation
	appointmentTime: string;              // Ensure time is provided
	estimatedCompletionTime?: string | null; // Optional estimated completion time
	processingNotes?: string | null;      // Optional processing notes
	contactPhone?: string | null;         // Optional contact phone
	contactAddress?: string | null;       // Optional contact address
	notes?: string | null;                // Optional general notes
	documentCount?: number;               // Optional document count, defaults to 1
	documentTypesJson?: string | null;    // Optional JSON string of document types
	documentCountsJson?: string | null;   // Optional JSON string of document counts
	updatedBy?: number | null;            // Optional ID of user updating record
	createdBy: number;                    // Required - the user who created the appointment
	assignedStaffJson?: string | null;    // Optional JSON string of assigned staff IDs
};

// Type for updating an appointment (all fields optional)
/**
 * Data structure for updating an existing appointment
 * All fields are optional since partial updates are allowed
 * @type UpdateAppointmentData
 */
export type UpdateAppointmentData = Partial<
	Omit<Appointment, "id" | "appointmentId" | "createdAt">
>;

// Type for recording a status change
/**
 * Data required to record a status change in appointment history
 * @type AppointmentStatusChange
 */
export type AppointmentStatusChange = {
	appointmentId: number;                // ID of the appointment being updated
	status: Appointment["status"];        // New status
	staffId?: number | null;              // Optional staff assignment
	vehicleId?: number | null;            // Optional vehicle assignment
	notes?: string | null;                // Optional notes about the change
	updatedBy: number;                    // User making the change
	assignedStaffJson?: string | null;    // Optional JSON string of assigned staff IDs
	documentTypesJson?: string | null;    // Optional JSON string of document types
	documentCountsJson?: string | null;   // Optional JSON string of document counts
};

/**
 * Fetches all appointments from the database, ordered by appointment time.
 */
export const getAllAppointments = (): Appointment[] => {
	try {
		const db = getDb();
		const query = db.query<Appointment, []>(
			"SELECT id, appointmentId, customerName, contactPhone, contactAddress, notes, documentCount, documentTypesJson, documentCountsJson, appointmentTime, serviceType, documentCategory, staffId, vehicleId, status, estimatedCompletionTime, processingNotes, lastUpdatedBy, lastUpdatedAt, createdBy, createdAt, assignedStaffJson FROM appointments ORDER BY appointmentTime DESC",
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
		const {
			appointmentId,
			status,
			staffId,
			vehicleId,
			notes,
			updatedBy,
			assignedStaffJson,
			documentTypesJson,
			documentCountsJson
		} = data;
		const now = new Date().toISOString();

		const insertQuery = db.query(
			`INSERT INTO appointment_history 
			(appointmentId, status, staffId, vehicleId, notes, updatedBy, updatedAt, assignedStaffJson, documentTypesJson, documentCountsJson)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		);

		const result = insertQuery.run(
			appointmentId,
			status,
			staffId || null,
			vehicleId || null,
			notes || null,
			updatedBy,
			now,
			assignedStaffJson || null,
			documentTypesJson || null,
			documentCountsJson || null
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
			documentCategory = null,
			staffId = null,
			vehicleId = null,
			status = "pending",
			estimatedCompletionTime = null,
			processingNotes = null,
			contactPhone = null,
			contactAddress = null,
			notes = null,
			documentCount = 1,
			documentTypesJson = null,
			documentCountsJson = null,
			updatedBy = null,
			createdBy,
			assignedStaffJson = null,
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
				string | null,
				string | null,
				string,
				string | null,
				string | null,
				number | null,
				number | null,
				Appointment["status"],
				string | null,
				string | null,
				number | null,
				string | null,
				number,
				string | null
			]
		>(
			`INSERT INTO appointments 
       (appointmentId, customerName, contactPhone, contactAddress, notes, documentCount, documentTypesJson, documentCountsJson, appointmentTime, serviceType, documentCategory, staffId, vehicleId, status, estimatedCompletionTime, processingNotes, lastUpdatedBy, lastUpdatedAt, createdBy, assignedStaffJson)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
       RETURNING id, appointmentId, customerName, contactPhone, contactAddress, notes, documentCount, documentTypesJson, documentCountsJson, appointmentTime, serviceType, documentCategory, staffId, vehicleId, status, estimatedCompletionTime, processingNotes, lastUpdatedBy, lastUpdatedAt, createdBy, createdAt, assignedStaffJson`,
		);

		const newAppointment = insertQuery.get(
			appointmentId,
			customerName,
			contactPhone,
			contactAddress,
			notes,
			documentCount,
			documentTypesJson,
			documentCountsJson,
			appointmentTime,
			serviceType,
			documentCategory,
			staffId,
			vehicleId,
			status,
			estimatedCompletionTime,
			processingNotes,
			updatedBy,
			updatedBy ? now : null,
			createdBy,
			assignedStaffJson
		);

		// Record initial status in history if there's an updatedBy value
		if (updatedBy && newAppointment) {
			recordAppointmentHistory({
				appointmentId: newAppointment.id,
				status,
				staffId,
				vehicleId,
				notes: processingNotes,
				updatedBy,
				assignedStaffJson,
				documentTypesJson,
				documentCountsJson
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
       RETURNING id, appointmentId, customerName, contactPhone, contactAddress, notes, documentCount, documentTypesJson, documentCountsJson, appointmentTime, serviceType, documentCategory, staffId, vehicleId, status, estimatedCompletionTime, processingNotes, lastUpdatedBy, lastUpdatedAt, createdBy, createdAt, assignedStaffJson`,
		);

		const updatedAppointment = updateQuery.get(...values);

		// Record status change in history if status was updated and there's an updatedBy value
		if (data.status && data.lastUpdatedBy && updatedAppointment) {
			recordAppointmentHistory({
				appointmentId: id,
				status: data.status,
				staffId: data.staffId !== undefined ? data.staffId : updatedAppointment.staffId,
				vehicleId: data.vehicleId !== undefined ? data.vehicleId : updatedAppointment.vehicleId,
				notes: data.processingNotes !== undefined ? data.processingNotes : updatedAppointment.processingNotes,
				updatedBy: data.lastUpdatedBy,
				assignedStaffJson: data.assignedStaffJson !== undefined ? data.assignedStaffJson : updatedAppointment.assignedStaffJson,
				documentTypesJson: data.documentTypesJson !== undefined ? data.documentTypesJson : updatedAppointment.documentTypesJson,
				documentCountsJson: data.documentCountsJson !== undefined ? data.documentCountsJson : updatedAppointment.documentCountsJson
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
