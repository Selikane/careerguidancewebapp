import React, { useContext } from 'react';
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

// Create a theme used by Material UI across the application.
const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
});

// ProtectedRoute ensures only authenticated users (and optionally a specific user type)
// can access wrapped routes. If the user is not authenticated they are redirected to
// the login page. If a requiredUserType is provided and the signed-in user does not
// match it, the user is redirected to the dashboard that matches their actual type.
const ProtectedRoute = ({ children, requiredUserType }) => {
  const { user, userType, loading } = useContext(AuthContext);

  // While authentication state is initializing, render a simple loading placeholder.
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  // If there is no authenticated user, navigate to the login page.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If a specific user type is required and the current user's type does not match,
  // redirect the user to the appropriate dashboard for their actual type.
  if (requiredUserType && userType !== requiredUserType) {
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

  // If all checks pass, render the wrapped children components.
  return children;
};

// Root application component: sets up theme, authentication context, routing,
// and page chrome (navbar/footer).
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

                {/* Dashboard routes are protected and limited to the matching user types. */}
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

                {/* Backwards-compatible redirects from older route paths to new ones. */}
                <Route path="/student/dashboard" element={<Navigate to="/student-dashboard" replace />} />
                <Route path="/institution/dashboard" element={<Navigate to="/institution-dashboard" replace />} />
                <Route path="/company/dashboard" element={<Navigate to="/company-dashboard" replace />} />
                <Route path="/admin/dashboard" element={<Navigate to="/admin-dashboard" replace />} />

                {/* Fallback route: redirect any unknown path to the home page. */}
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
