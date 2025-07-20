import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'; // Using AdapterDateFns for date-fns

// Context Providers
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider as CustomThemeProvider, useTheme } from './contexts/ThemeContext';

// Pages - Landing
import LandingPage from './pages/landing/LandingPage';

// Pages - Auth
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Pages - Doctor
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import PatientProfilePage from './pages/doctor/PatientProfilePage';
import ObservationPage from './pages/doctor/ObservationPage';
import MedicalRecordPage from './pages/doctor/MedicalRecordPage';

// Pages - Patient
import PatientDashboard from './pages/patient/PatientDashboard';
import AppointmentPage from './pages/patient/AppointmentPage';
import PatientMedicalRecordPage from './pages/patient/MedicalRecordPage';

// Route Guards
const PrivateRoute: React.FC<{ element: React.ReactElement; allowedRoles?: string[] }> = ({ 
  element, 
  allowedRoles 
}) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" />;
  }
  
  return element;
};

function AppContent() {
  const { theme } = useTheme();
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Doctor Routes */}
            <Route 
              path="/doctor/dashboard" 
              element={
                <PrivateRoute 
                  element={<DoctorDashboard />} 
                  allowedRoles={['doctor']} 
                />
              } 
            />
            <Route 
              path="/doctor/patients/:patientId" 
              element={
                <PrivateRoute 
                  element={<PatientProfilePage />} 
                  allowedRoles={['doctor']} 
                />
              } 
            />
            <Route 
              path="/doctor/observation/:patientId" 
              element={
                <PrivateRoute 
                  element={<ObservationPage />} 
                  allowedRoles={['doctor']} 
                />
              } 
            />
            <Route 
              path="/doctor/records/:recordId" 
              element={
                <PrivateRoute 
                  element={<MedicalRecordPage />} 
                  allowedRoles={['doctor']} 
                />
              } 
            />
            
            {/* Patient Routes */}
            <Route 
              path="/patient/dashboard" 
              element={
                <PrivateRoute 
                  element={<PatientDashboard />} 
                  allowedRoles={['patient']} 
                />
              } 
            />
            <Route 
              path="/patient/appointments" 
              element={
                <PrivateRoute 
                  element={<AppointmentPage />} 
                  allowedRoles={['patient']} 
                />
              } 
            />
            <Route 
              path="/patient/records/:recordId" 
              element={
                <PrivateRoute 
                  element={<PatientMedicalRecordPage />} 
                  allowedRoles={['patient']} 
                />
              } 
            />
            
            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <CustomThemeProvider>
        <AppContent />
      </CustomThemeProvider>
    </AuthProvider>
  );
}

export default App;
