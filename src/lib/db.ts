import { Database } from "bun:sqlite";

// Create a singleton database connection
let _db: Database | null = null;

// Initialize database schema
const initDb = (db: Database) => {
	console.log("Initializing SQLite database schema...");
	try {
		// Create users table
		db.run(`
            CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username TEXT UNIQUE NOT NULL,
              password TEXT NOT NULL, -- In a real app, store hashed passwords!
              role TEXT CHECK( role IN ('admin', 'user') ) NOT NULL DEFAULT 'user',
              createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

		// Create staff table
		db.run(`
            CREATE TABLE IF NOT EXISTS staff (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              status TEXT CHECK( status IN ('active', 'inactive', 'on_leave') ) NOT NULL DEFAULT 'active',
              createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

		// Create vehicles table
		db.run(`
            CREATE TABLE IF NOT EXISTS vehicles (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              plateNumber TEXT UNIQUE NOT NULL,
              model TEXT,
              status TEXT CHECK( status IN ('available', 'in_use', 'maintenance') ) NOT NULL DEFAULT 'available',
              createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

		// Create appointments table
		db.run(`
            CREATE TABLE IF NOT EXISTS appointments (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              customerName TEXT NOT NULL, -- Maybe link to customers table later? For now, keep simple.
              appointmentTime DATETIME NOT NULL,
              serviceType TEXT,
              staffId INTEGER,
              vehicleId INTEGER,
              status TEXT CHECK( status IN ('pending', 'confirmed', 'completed', 'cancelled') ) NOT NULL DEFAULT 'pending',
              createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (staffId) REFERENCES staff (id) ON DELETE SET NULL, -- Optional: Handle staff deletion
              FOREIGN KEY (vehicleId) REFERENCES vehicles (id) ON DELETE SET NULL -- Optional: Handle vehicle deletion
            );
        `);

		// Create customers table
		db.run(`
            CREATE TABLE IF NOT EXISTS customers (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              phone TEXT UNIQUE,
              email TEXT UNIQUE,
              address TEXT,
              company TEXT,
              createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

		// Insert admin user if not exists
		const adminCheck = db
			.query("SELECT id FROM users WHERE username = ?")
			.get("admin");
		if (!adminCheck) {
			// In a real app, hash this password!
			db.run(`
              INSERT INTO users (username, password, role) VALUES ('admin', 'admin123', 'admin')
            `);
			console.log(
				"Created default admin user with username 'admin' and password 'admin123'",
			);
		} else {
			console.log("Admin user already exists");
		}

		// Check if tables were created
		const tables = db
			.query("SELECT name FROM sqlite_master WHERE type='table'")
			.all();
		console.log("Database tables:", tables.map((t: any) => t.name).join(", "));

		console.log("Database schema initialized successfully");
	} catch (error) {
		console.error("Error initializing database schema:", error);
		throw error; // Re-throw to allow caller to handle it
	}
};

// Get the database instance - initialize if not already created
export const getDb = () => {
	if (!_db) {
		console.log("Creating new SQLite database connection...");
		try {
			_db = new Database("appointment_dashboard.sqlite", { create: true });
			// Initialize the database schema
			initDb(_db);
			console.log(
				"New database connection created and initialized successfully",
			);
		} catch (error) {
			console.error("Failed to initialize database:", error);
			_db = null; // Reset the database connection
			throw error;
		}
	}
	return _db;
};

// Initialize the database on module import
let db: Database;

try {
	console.log("Initializing database during module import...");
	db = getDb();
	console.log("Database initialized successfully and ready for use");
} catch (error) {
	console.error("Critical error during database initialization:", error);
	// In a real app, you might want to handle this error more gracefully
	throw new Error(
		`Database initialization failed: ${error instanceof Error ? error.message : String(error)}`,
	);
}

// Export the database
export { db };
export default db;
