import { getDb } from "./db";

// Define the User type based on the database schema
export interface User {
    id: number;
    username: string;
    // password should not be exposed frequently
    role: 'admin' | 'user';
    createdAt: string;
}

// Type for user with password (used internally for auth)
interface UserWithPassword extends User {
    password: string;
}

/**
 * Finds a user by their username.
 * IMPORTANT: Selects the password field, use with caution.
 */
export const findUserByUsernameWithPassword = (
    username: string
): UserWithPassword | null => {
    try {
        const db = getDb();
        const query = db.query<UserWithPassword, [string]>(
            "SELECT id, username, password, role, createdAt FROM users WHERE username = ? LIMIT 1"
        );
        const user = query.get(username);
        return user || null;
    } catch (error) {
        console.error("Error finding user by username:", error);
        return null;
    }
};

/**
 * Finds a user by their ID.
 * Does NOT select the password field.
 */
export const findUserById = (id: number): User | null => {
    try {
        const db = getDb();
        const query = db.query<User, [number]>(
            "SELECT id, username, role, createdAt FROM users WHERE id = ? LIMIT 1"
        );
        const user = query.get(id);
        return user || null;
    } catch (error) {
        console.error("Error finding user by ID:", error);
        return null;
    }
};

// Add other user-related queries here as needed (e.g., createUser, updateUser, deleteUser) 