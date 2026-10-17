import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";

// Public Pages
import { HomePage } from "./pages/HomePage";
import { HowItWorksPage } from "./pages/HowItWorksPage";
import { FoodSafetyPage } from "./pages/FoodSafetyPage";
import { RescueProcessPage } from "./pages/RescueProcessPage";
import { AboutPage } from "./pages/AboutPage";
import { LoginPage } from "./pages/LoginPage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";

// Donor Pages
import { DonorDashboardPage } from "./pages/DonorDashboardPage";
import { DonorCreateDonationPage } from "./pages/DonorCreateDonationPage";
import { DonorDonationsPage } from "./pages/DonorDonationsPage";
import { DonorTrackPage } from "./pages/DonorTrackPage";
import { DonorProfilePage } from "./pages/DonorProfilePage";
import { DonorNotificationsPage } from "./pages/DonorNotificationsPage";

// NGO Pages
import { NgoDashboardPage } from "./pages/NgoDashboardPage";
import { NgoDonationsPage } from "./pages/NgoDonationsPage";
import { NgoRescuesPage } from "./pages/NgoRescuesPage";
import { NgoDeliveryPage } from "./pages/NgoDeliveryPage";
import { NgoEmergencyPage } from "./pages/NgoEmergencyPage";
import { NgoTrustPage } from "./pages/NgoTrustPage";
import { NgoComplaintsPage } from "./pages/NgoComplaintsPage";
import { NgoProfilePage } from "./pages/NgoProfilePage";

// Volunteer Pages
import { VolunteerDashboardPage } from "./pages/VolunteerDashboardPage";
import { VolunteerTasksPage } from "./pages/VolunteerTasksPage";
import { VolunteerActivePage } from "./pages/VolunteerActivePage";
import { VolunteerScannerPage } from "./pages/VolunteerScannerPage";
import { VolunteerHistoryPage } from "./pages/VolunteerHistoryPage";
import { VolunteerProfilePage } from "./pages/VolunteerProfilePage";

// Admin Pages
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { AdminDonationsPage } from "./pages/AdminDonationsPage";
import { AdminRescuesPage } from "./pages/AdminRescuesPage";
import { AdminComplaintsPage } from "./pages/AdminComplaintsPage";
import { AdminReportsPage } from "./pages/AdminReportsPage";
import { AdminProfilePage } from "./pages/AdminProfilePage";

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/food-safety" element={<FoodSafetyPage />} />
            <Route path="/rescue-process" element={<RescueProcessPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/register/:role" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ForgotPasswordPage />} />

            {/* Donor Portal */}
            <Route path="/donor/dashboard" element={<DonorDashboardPage />} />
            <Route path="/donor/create-donation" element={<DonorCreateDonationPage />} />
            <Route path="/donor/donations" element={<DonorDonationsPage />} />
            <Route path="/donor/history" element={<DonorDonationsPage />} />
            <Route path="/donor/track/:id" element={<DonorTrackPage />} />
            <Route path="/donor/profile" element={<DonorProfilePage />} />
            <Route path="/donor/notifications" element={<DonorNotificationsPage />} />

            {/* NGO Portal */}
            <Route path="/ngo/dashboard" element={<NgoDashboardPage />} />
            <Route path="/ngo/donations" element={<NgoDonationsPage />} />
            <Route path="/ngo/rescues" element={<NgoRescuesPage />} />
            <Route path="/ngo/delivery" element={<NgoDeliveryPage />} />
            <Route path="/ngo/emergency" element={<NgoEmergencyPage />} />
            <Route path="/ngo/trust" element={<NgoTrustPage />} />
            <Route path="/ngo/complaints" element={<NgoComplaintsPage />} />
            <Route path="/ngo/profile" element={<NgoProfilePage />} />
            <Route path="/ngo/notifications" element={<DonorNotificationsPage />} />

            {/* Volunteer Portal */}
            <Route path="/volunteer/dashboard" element={<VolunteerDashboardPage />} />
            <Route path="/volunteer/tasks" element={<VolunteerTasksPage />} />
            <Route path="/volunteer/active" element={<VolunteerActivePage />} />
            <Route path="/volunteer/assignments" element={<VolunteerActivePage />} />
            <Route path="/volunteer/delivery" element={<VolunteerActivePage />} />
            <Route path="/volunteer/scanner" element={<VolunteerScannerPage />} />
            <Route path="/volunteer/pickup" element={<VolunteerScannerPage />} />
            <Route path="/volunteer/history" element={<VolunteerHistoryPage />} />
            <Route path="/volunteer/profile" element={<VolunteerProfilePage />} />
            <Route path="/volunteer/trust" element={<VolunteerProfilePage />} />
            <Route path="/volunteer/notifications" element={<DonorNotificationsPage />} />

            {/* Admin Portal */}
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/donors" element={<AdminUsersPage />} />
            <Route path="/admin/ngos" element={<AdminUsersPage />} />
            <Route path="/admin/volunteers" element={<AdminUsersPage />} />
            <Route path="/admin/donations" element={<AdminDonationsPage />} />
            <Route path="/admin/safety" element={<AdminDonationsPage />} />
            <Route path="/admin/rescues" element={<AdminRescuesPage />} />
            <Route path="/admin/emergency" element={<AdminRescuesPage />} />
            <Route path="/admin/complaints" element={<AdminComplaintsPage />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
            <Route path="/admin/analytics" element={<AdminReportsPage />} />
            <Route path="/admin/audit" element={<AdminReportsPage />} />
            <Route path="/admin/profile" element={<AdminProfilePage />} />
            <Route path="/admin/notifications" element={<DonorNotificationsPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}
