import Landing, { size as s0 } from './Landing.jsx';
import CustomerServices, { size as s1 } from './CustomerServices.jsx';
import CustomerBarbers, { size as s2 } from './CustomerBarbers.jsx';
import CustomerAppointmentBooking, { size as s3 } from './CustomerAppointmentBooking.jsx';
import CustomerMyAppointments, { size as s4 } from './CustomerMyAppointments.jsx';
import CustomerQueueStatus, { size as s5 } from './CustomerQueueStatus.jsx';
import CustomerProfileHistory, { size as s6 } from './CustomerProfileHistory.jsx';
import ReceptionistDashboard, { size as s7 } from './ReceptionistDashboard.jsx';
import ReceptionistAppointmentManagement, { size as s8 } from './ReceptionistAppointmentManagement.jsx';
import ReceptionistWalkInQueueManagement, { size as s9 } from './ReceptionistWalkInQueueManagement.jsx';
import ReceptionistCustomerManagement, { size as s10 } from './ReceptionistCustomerManagement.jsx';
import ReceptionistPaymentTransactions, { size as s11 } from './ReceptionistPaymentTransactions.jsx';
import BarberDashboard, { size as s12 } from './BarberDashboard.jsx';
import BarberMyAppointments, { size as s13 } from './BarberMyAppointments.jsx';
import BarberQueueCustomerManagement, { size as s14 } from './BarberQueueCustomerManagement.jsx';
import BarberServiceManagement, { size as s15 } from './BarberServiceManagement.jsx';
import BarberSchedule, { size as s16 } from './BarberSchedule.jsx';
import AdminDashboard, { size as s17 } from './AdminDashboard.jsx';
import AdminUserManagement, { size as s18 } from './AdminUserManagement.jsx';
import AdminBarberStaffManagement, { size as s19 } from './AdminBarberStaffManagement.jsx';
import AdminServiceManagement, { size as s20 } from './AdminServiceManagement.jsx';
import AdminAppointmentManagement, { size as s21 } from './AdminAppointmentManagement.jsx';
import AdminReportsAnalytics, { size as s22 } from './AdminReportsAnalytics.jsx';
import AdminInventoryManagement, { size as s23 } from './AdminInventoryManagement.jsx';

export const screens = [
  { id: "Landing", path: "/", group: "Landing", label: "Home", Component: Landing, ...s0 },
  { id: "CustomerServices", path: "/customer/services", group: "Customer", label: "Services", Component: CustomerServices, ...s1 },
  { id: "CustomerBarbers", path: "/customer/barbers", group: "Customer", label: "Barbers", Component: CustomerBarbers, ...s2 },
  { id: "CustomerAppointmentBooking", path: "/customer/appointment-booking", group: "Customer", label: "Appointment Booking", Component: CustomerAppointmentBooking, ...s3 },
  { id: "CustomerMyAppointments", path: "/customer/my-appointments", group: "Customer", label: "My Appointments", Component: CustomerMyAppointments, ...s4 },
  { id: "CustomerQueueStatus", path: "/customer/queue-status", group: "Customer", label: "Queue Status", Component: CustomerQueueStatus, ...s5 },
  { id: "CustomerProfileHistory", path: "/customer/profile-history", group: "Customer", label: "Profile & History", Component: CustomerProfileHistory, ...s6 },
  { id: "ReceptionistDashboard", path: "/receptionist/dashboard", group: "Receptionist", label: "Dashboard", Component: ReceptionistDashboard, ...s7 },
  { id: "ReceptionistAppointmentManagement", path: "/receptionist/appointment-management", group: "Receptionist", label: "Appointment Management", Component: ReceptionistAppointmentManagement, ...s8 },
  { id: "ReceptionistWalkInQueueManagement", path: "/receptionist/walk-in-queue-management", group: "Receptionist", label: "Walk-in & Queue Management", Component: ReceptionistWalkInQueueManagement, ...s9 },
  { id: "ReceptionistCustomerManagement", path: "/receptionist/customer-management", group: "Receptionist", label: "Customer Management", Component: ReceptionistCustomerManagement, ...s10 },
  { id: "ReceptionistPaymentTransactions", path: "/receptionist/payment-transactions", group: "Receptionist", label: "Payment & Transactions", Component: ReceptionistPaymentTransactions, ...s11 },
  { id: "BarberDashboard", path: "/barber/dashboard", group: "Barber", label: "Dashboard", Component: BarberDashboard, ...s12 },
  { id: "BarberMyAppointments", path: "/barber/my-appointments", group: "Barber", label: "My Appointments", Component: BarberMyAppointments, ...s13 },
  { id: "BarberQueueCustomerManagement", path: "/barber/queue-customer-management", group: "Barber", label: "Queue & Customer Management", Component: BarberQueueCustomerManagement, ...s14 },
  { id: "BarberServiceManagement", path: "/barber/service-management", group: "Barber", label: "Service Management", Component: BarberServiceManagement, ...s15 },
  { id: "BarberSchedule", path: "/barber/schedule", group: "Barber", label: "Schedule", Component: BarberSchedule, ...s16 },
  { id: "AdminDashboard", path: "/admin/dashboard", group: "Admin", label: "Dashboard", Component: AdminDashboard, ...s17 },
  { id: "AdminUserManagement", path: "/admin/user-management", group: "Admin", label: "User Management", Component: AdminUserManagement, ...s18 },
  { id: "AdminBarberStaffManagement", path: "/admin/barber-staff-management", group: "Admin", label: "Barber & Staff Management", Component: AdminBarberStaffManagement, ...s19 },
  { id: "AdminServiceManagement", path: "/admin/service-management", group: "Admin", label: "Service Management", Component: AdminServiceManagement, ...s20 },
  { id: "AdminAppointmentManagement", path: "/admin/appointment-management", group: "Admin", label: "Appointment Management", Component: AdminAppointmentManagement, ...s21 },
  { id: "AdminReportsAnalytics", path: "/admin/reports-analytics", group: "Admin", label: "Reports & Analytics", Component: AdminReportsAnalytics, ...s22 },
  { id: "AdminInventoryManagement", path: "/admin/inventory-management", group: "Admin", label: "Inventory Management", Component: AdminInventoryManagement, ...s23 },
  { id: 'CustomerConfirmation', path: '/customer/confirmation', group: 'Customer', label: 'Booking Confirmation', Component: () => <CustomerProfileHistory title="BOOKING CONFIRMATION" />, ...s6 },
];
