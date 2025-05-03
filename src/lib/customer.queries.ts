import { getDb } from "./db";

// Define the Customer type based on the database schema
export interface Customer {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    company: string | null;
    createdAt: string;
}

// Type for creating a new customer
export type NewCustomerData = Omit<Customer, 'id' | 'createdAt'>;

// Type for updating an existing customer
export type UpdateCustomerData = Partial<Omit<Customer, 'id' | 'createdAt'>>;

/**
 * Fetches all customers from the database.
 */
export const getAllCustomers = (): Customer[] => {
    try {
        const db = getDb();
        const query = db.query<Customer, []>(
            "SELECT id, name, phone, email, address, company, createdAt FROM customers ORDER BY name ASC"
        );
        return query.all();
    } catch (error) {
        console.error("Error fetching all customers:", error);
        return [];
    }
};

/**
 * Adds a new customer to the database.
 */
export const addCustomer = (data: NewCustomerData): Customer | null => {
    try {
        const db = getDb();
        const {
            name,
            phone = null,
            email = null,
            address = null,
            company = null
        } = data;

        const insertQuery = db.query<
            Customer,
            [string, string | null, string | null, string | null, string | null]
        >(
            `INSERT INTO customers (name, phone, email, address, company) 
       VALUES (?, ?, ?, ?, ?) 
       RETURNING id, name, phone, email, address, company, createdAt`
        );

        const newCustomer = insertQuery.get(name, phone, email, address, company);
        return newCustomer;
    } catch (error) {
        // Check for unique constraint violations
        if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
            console.error(`Error adding customer: Phone or Email might already exist.`);
        } else {
            console.error("Error adding customer:", error);
        }
        return null;
    }
};

/**
 * Updates an existing customer's information.
 */
export const updateCustomer = (id: number, data: UpdateCustomerData): Customer | null => {
    try {
        const db = getDb();
        const fields = Object.keys(data) as (keyof UpdateCustomerData)[];
        if (fields.length === 0) {
            const currentQuery = db.query<Customer, [number]>("SELECT * FROM customers WHERE id = ?");
            return currentQuery.get(id);
        }

        let setClause = fields.map(field => `${field} = ?`).join(", ");
        const values = fields.map(field => data[field]);
        values.push(id);

        const updateQuery = db.query<Customer, any[]>(
            `UPDATE customers SET ${setClause} WHERE id = ? 
       RETURNING id, name, phone, email, address, company, createdAt`
        );

        const updatedCustomer = updateQuery.get(...values);
        return updatedCustomer;
    } catch (error) {
        // Check for unique constraint violations
        if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
            console.error(`Error updating customer ${id}: Phone or Email might already exist.`);
        } else {
            console.error(`Error updating customer ${id}:`, error);
        }
        return null;
    }
};

/**
 * Deletes a customer from the database.
 * Returns true if deletion was successful, false otherwise.
 */
export const deleteCustomer = (id: number): boolean => {
    try {
        const db = getDb();
        // Optional: What happens to appointments for this customer? 
        // Currently, appointments just store customerName as text.
        // If we linked appointments via customerId, we might need to handle that here.

        const deleteQuery = db.query("DELETE FROM customers WHERE id = ?");
        const result = deleteQuery.run(id);
        return result.changes > 0;
    } catch (error) {
        console.error("Error deleting customer:", error);
        return false;
    }
}; 