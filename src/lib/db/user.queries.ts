import { getDb } from "./db";

// Define the User type based on the database schema
export interface User {
    id: number;
    username: string;
    password: string;
    name: string;
    phone?: string | null;
    role: "admin" | "user";
    isGovUser: boolean;
    createdAt: string;
}

/**
 * Finds a user by username and includes the password for authentication
 */
export const findUserByUsernameWithPassword = (username: string): User | null => {
    try {
        const db = getDb();
        const query = db.query<User, [string]>(
            "SELECT id, username, password, name, phone, role, isGovUser, createdAt FROM users WHERE username = ?",
        );
        return query.get(username);
    } catch (error) {
        console.error("Error finding user by username:", error);
        return null;
    }
};

/**
 * Finds a user by username but excludes the password
 */
export const findUserByUsername = (username: string): Omit<User, "password"> | null => {
    try {
        const db = getDb();
        const query = db.query<Omit<User, "password">, [string]>(
            "SELECT id, username, name, phone, role, isGovUser, createdAt FROM users WHERE username = ?",
        );
        return query.get(username);
    } catch (error) {
        console.error("Error finding user by username:", error);
        return null;
    }
};

/**
 * Gets all users without exposing passwords
 */
export const getAllUsers = (): Omit<User, "password">[] => {
    try {
        const db = getDb();
        const query = db.query<Omit<User, "password">, []>(
            "SELECT id, username, name, phone, role, isGovUser, createdAt FROM users ORDER BY createdAt DESC",
        );
        return query.all();
    } catch (error) {
        console.error("Error fetching all users:", error);
        return [];
    }
};

/**
 * Creates a new user
 * Note: In a production app, the password should be hashed
 */
export const createUser = (
    username: string,
    password: string,
    role: User["role"] = "user",
    name: string = "",
    phone: string | null = null,
    isGovUser: boolean = false
): Omit<User, "password"> | null => {
    try {
        const db = getDb();

        // Check if username already exists
        const existingUser = findUserByUsername(username);
        if (existingUser) {
            return null; // Username already taken
        }

        // Insert new user
        const insertQuery = db.query<User, [string, string, User["role"], string, string | null, boolean]>(
            "INSERT INTO users (username, password, role, name, phone, isGovUser) VALUES (?, ?, ?, ?, ?, ?) RETURNING id, username, role, name, phone, isGovUser, createdAt",
        );

        // Return user without password
        const newUser = insertQuery.get(username, password, role, name, phone, isGovUser);
        if (!newUser) return null;

        // Omit password from the returned user
        const { password: _, ...userWithoutPassword } = newUser;
        return userWithoutPassword;
    } catch (error) {
        console.error("Error creating user:", error);
        return null;
    }
};

/**
 * Updates a user's information
 * Note: In a production app, the password should be hashed
 */
export const updateUser = (
    id: number,
    data: Partial<Pick<User, "username" | "password" | "role" | "name" | "phone" | "isGovUser">>,
): Omit<User, "password"> | null => {
    try {
        const db = getDb();
        let updateClause = "";
        const values: (string | number | null | boolean)[] = [];

        if (data.username !== undefined) {
            updateClause += "username = ?, ";
            values.push(data.username);
        }
        if (data.password !== undefined) {
            updateClause += "password = ?, ";
            values.push(data.password);
        }
        if (data.role !== undefined) {
            updateClause += "role = ?, ";
            values.push(data.role);
        }
        if (data.name !== undefined) {
            updateClause += "name = ?, ";
            values.push(data.name);
        }
        if (data.phone !== undefined) {
            updateClause += "phone = ?, ";
            values.push(data.phone);
        }
        if (data.isGovUser !== undefined) {
            updateClause += "isGovUser = ?, ";
            values.push(data.isGovUser);
        }

        if (values.length === 0) {
            // No fields to update
            const currentUserQuery = db.query<Omit<User, "password">, [number]>(
                "SELECT id, username, name, phone, role, isGovUser, createdAt FROM users WHERE id = ?",
            );
            return currentUserQuery.get(id);
        }

        // Remove trailing comma and space
        updateClause = updateClause.slice(0, -2);
        values.push(id); // Add id for the WHERE clause

        const updateQuery = db.query<User, (string | number | null | boolean)[]>(
            `UPDATE users SET ${updateClause} WHERE id = ? RETURNING id, username, name, phone, role, isGovUser, createdAt`,
        );

        const updatedUser = updateQuery.get(...values);
        return updatedUser;
    } catch (error) {
        console.error("Error updating user:", error);
        return null;
    }
};

/**
 * Deletes a user from the database
 * Returns true if deletion was successful, false otherwise
 */
export const deleteUser = (id: number): boolean => {
    try {
        const db = getDb();
        const deleteQuery = db.query("DELETE FROM users WHERE id = ?");
        const result = deleteQuery.run(id);
        return result.changes > 0;
    } catch (error) {
        console.error("Error deleting user:", error);
        return false;
    }
}; 