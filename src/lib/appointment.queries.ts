import { getDb } from "./db";

// Define the Appointment type based on the database schema
export interface Appointment {
    id: number;
    customerName: string;
    appointmentTime: string; // Store as ISO 8601 string (DATETIME)
    serviceType: string | null;
    staffId: number | null;
    vehicleId: number | null;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    createdAt: string;
}

// Type for creating a new appointment (omit id and createdAt)
export type NewAppointmentData = Omit<Appointment, 'id' | 'createdAt' | 'staffId' | 'vehicleId'> & {
    staffId?: number | null; // Optional in creation
    vehicleId?: number | null; // Optional in creation
    appointmentTime: string; // Ensure time is provided
};

// Type for updating an appointment (all fields optional)
export type UpdateAppointmentData = Partial<Omit<Appointment, 'id' | 'createdAt'>>;


/**
 * Fetches all appointments from the database, ordered by appointment time.
 */
export const getAllAppointments = (): Appointment[] => {
    try {
        const db = getDb();
        const query = db.query<Appointment, []>(
            "SELECT id, customerName, appointmentTime, serviceType, staffId, vehicleId, status, createdAt FROM appointments ORDER BY appointmentTime DESC"
        );
        return query.all();
    } catch (error) {
        console.error("Error fetching all appointments:", error);
        return [];
    }
};

/**
 * Adds a new appointment to the database.
 */
export const addAppointment = (data: NewAppointmentData): Appointment | null => {
    try {
        const db = getDb();
        const {
            customerName,
            appointmentTime,
            serviceType = null,
            staffId = null,
            vehicleId = null,
            status = 'pending'
        } = data;

        // Ensure appointmentTime is a valid format if needed, though TEXT affinity is flexible
        // const isoTime = new Date(appointmentTime).toISOString(); // Example if strict ISO needed

        const insertQuery = db.query<
            Appointment,
            [string, string, string | null, number | null, number | null, Appointment['status']]
        >(
            `INSERT INTO appointments 
       (customerName, appointmentTime, serviceType, staffId, vehicleId, status)
       VALUES (?, ?, ?, ?, ?, ?) 
       RETURNING id, customerName, appointmentTime, serviceType, staffId, vehicleId, status, createdAt`
        );

        const newAppointment = insertQuery.get(
            customerName,
            appointmentTime, // Use the provided string directly
            serviceType,
            staffId,
            vehicleId,
            status
        );
        return newAppointment;
    } catch (error) {
        console.error("Error adding appointment:", error);
        return null;
    }
};

/**
 * Updates an existing appointment.
 */
export const updateAppointment = (id: number, data: UpdateAppointmentData): Appointment | null => {
    try {
        const db = getDb();
        const fields = Object.keys(data) as (keyof UpdateAppointmentData)[];
        if (fields.length === 0) {
            // If no data to update, fetch and return the current appointment
            const currentQuery = db.query<Appointment, [number]>("SELECT * FROM appointments WHERE id = ?");
            return currentQuery.get(id);
        }

        let setClause = fields.map(field => `${field} = ?`).join(", ");
        const values = fields.map(field => data[field]);
        values.push(id); // Add id for the WHERE clause

        const updateQuery = db.query<Appointment, any[]>(
            `UPDATE appointments SET ${setClause} WHERE id = ? 
       RETURNING id, customerName, appointmentTime, serviceType, staffId, vehicleId, status, createdAt`
        );

        const updatedAppointment = updateQuery.get(...values);
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