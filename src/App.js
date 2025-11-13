import React, { useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import InstitutionDashboard from './pages/InstitutionDashboard';
import CompanyDashboard from './pages/CompanyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Courses from './pages/Courses';
import Jobs from './pages/Jobs';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Protected Route Component using useContext
const ProtectedRoute = ({ children, requiredUserType }) => {
  const { user, userType, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredUserType && userType !== requiredUserType) {
    // Redirect to appropriate dashboard based on actual user type
    switch (userType) {
      case 'student':
        return <Navigate to="/student-dashboard" replace />;
      case 'institution':
        return <Navigate to="/institution-dashboard" replace />;
      case 'company':
        return <Navigate to="/company-dashboard" replace />;
      case 'admin':
        return <Navigate to="/admin-dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <div className="App">
            <Navbar />
            <main style={{ minHeight: '80vh' }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/jobs" element={<Jobs />} />
                
                {/* Updated Dashboard Routes - Match what Login component expects */}
                <Route 
                  path="/student-dashboard" 
                  element={
                    <ProtectedRoute requiredUserType="student">
                      <StudentDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/institution-dashboard" 
                  element={
                    <ProtectedRoute requiredUserType="institution">
                      <InstitutionDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/company-dashboard" 
                  element={
                    <ProtectedRoute requiredUserType="company">
                      <CompanyDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin-dashboard" 
                  element={
                    <ProtectedRoute requiredUserType="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  } 
                />

                {/* Keep old routes as redirects for backward compatibility */}
                <Route path="/student/dashboard" element={<Navigate to="/student-dashboard" replace />} />
                <Route path="/institution/dashboard" element={<Navigate to="/institution-dashboard" replace />} />
                <Route path="/company/dashboard" element={<Navigate to="/company-dashboard" replace />} />
                <Route path="/admin/dashboard" element={<Navigate to="/admin-dashboard" replace />} />

                {/* Catch all route - redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
