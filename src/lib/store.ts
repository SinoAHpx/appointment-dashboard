// This file is a re-export to maintain backwards compatibility
// New code should import directly from src/lib/stores

export {
	useAuthStore,
	useAppointmentStore,
	useStaffStore,
	useVehicleStore,
	useUserStore,
	type User,
	type Appointment,
	type Staff,
	type Vehicle,
	type AdminUser,
} from "./stores";
