// This file is a re-export to maintain backwards compatibility
// New code should import directly from src/lib/stores

export {
	useAuthStore,
	useAppointmentStore,
	useCustomerStore,
	useStaffStore,
	useVehicleStore,
	type User,
	type Appointment,
	type CustomerUser,
	type Staff,
	type Vehicle,
} from "./stores";
