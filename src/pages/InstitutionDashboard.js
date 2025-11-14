import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Tab,
  Tabs,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Badge,
  alpha
} from '@mui/material';
import {
  School,
  Group,
  Description,
  Add,
  CheckCircle,
  Cancel,
  Pending,
  Edit,
  Delete,
  Science,
  Business,
  Engineering,
  Settings,
  Refresh,
  Email,
  Phone,
} from '@mui/icons-material';
import {
  applicationsService,
  coursesService,
  institutionService,
  admissionsService,
  demoService,
} from '../services/institutionService';
import { auth } from '../config/firebase';

// Color scheme matching the student dashboard
const primaryColor = '#000000';
const secondaryColor = '#333333';
const accentColor = '#FF6B35';
const backgroundColor = '#FFFFFF';
const lightGray = '#f5f5f5';
const mediumGray = '#e0e0e0';

// --- HELPER COMPONENTS ---
function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Reset state for the course form
const initialCourseFormState = {
  name: '',
  faculty: '',
  capacity: '',
  duration: '',
  requirements: '',
  fee: '',
};

// --- MAIN COMPONENT ---
const InstitutionDashboard = () => {
  // --- STATE MANAGEMENT ---
  const [tabValue, setTabValue] = useState(0);
  const [institutionId, setInstitutionId] = useState(null);
  const [applications, setApplications] = useState([]);
  const [courses, setCourses] = useState([]);
  const [faculties, setFaculties] = useState([
    'Science & Technology',
    'Business School',
    'Engineering',
    'Medicine',
    'Arts & Humanities',
    'Social Sciences',
    'Education',
    'Law',
  ]);
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // New State for Course Application Filtering
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');

  // Dialog State
  const [courseDialog, setCourseDialog] = useState({
    open: false,
    editingCourse: null,
  });
  const [profileDialog, setProfileDialog] = useState({ open: false });
  const [facultyDialog, setFacultyDialog] = useState({ open: false, newFacultyName: '' });
  const [applicationDetailDialog, setApplicationDetailDialog] = useState({ 
    open: false, 
    application: null 
  });

  // Form State
  const [courseForm, setCourseForm] = useState(initialCourseFormState);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    type: 'university',
  });

  // Faculty Icon Mapping
  const facultyIcons = {
    'Science & Technology': Science,
    'Business School': Business,
    'Engineering': Engineering,
    'Medicine': School,
    'Arts & Humanities': School,
    'Social Sciences': School,
    'Education': School,
    'Law': School,
  };

  // --- EFFECT HOOKS (Initialization) ---
  useEffect(() => {
    const user = auth.currentUser;
    let currentUid;

    if (user) {
      currentUid = user.uid;
    } else {
      currentUid = 'demo-institution-user-123';
    }
    
    setInstitutionId(currentUid);
    initializeData(currentUid);

    // Cleanup function
    return () => {
      // Cleanup will be handled by the unsubscribe functions returned from initializeData
    };
  }, []);

  const initializeData = async (uid) => {
    setLoading(true);
    console.log('Initializing institution data for:', uid);

    try {
      // 1. First load institution profile to check if setup is needed
      const institutionUnsubscribe = institutionService.getInstitution(uid, (snapshot) => {
        if (snapshot.exists()) {
          const institutionData = { id: snapshot.id, ...snapshot.data() };
          console.log('Institution profile loaded:', institutionData);
          setInstitution(institutionData);
          setProfileForm(institutionData);
          
          if (institutionData.faculties && Array.isArray(institutionData.faculties)) {
            setFaculties(institutionData.faculties);
          }
          setInitializing(false);
        } else {
          console.log('No institution profile found - showing setup wizard');
          setInitializing(true);
        }
      });

      // 2. Set up real-time listeners for courses and applications
      const coursesUnsubscribe = coursesService.getCourses(uid, (snapshot) => {
        const coursesData = snapshot.docs ? snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) : [];
        console.log('Courses updated:', coursesData.length);
        setCourses(coursesData);
      });

      const applicationsUnsubscribe = applicationsService.getApplications(uid, (snapshot) => {
        const applicationsData = snapshot.docs ? snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) : [];
        console.log('Applications updated:', applicationsData.length);
        setApplications(applicationsData);
      });

      setLoading(false);

      // Return cleanup function
      return () => {
        if (institutionUnsubscribe) institutionUnsubscribe();
        if (coursesUnsubscribe) coursesUnsubscribe();
        if (applicationsUnsubscribe) applicationsUnsubscribe();
      };
    } catch (error) {
      console.error('Error initializing data:', error);
      setLoading(false);
      showSnackbar('Failed to load dashboard data. Check console.', 'error');
    }
  };

  // Manual refresh function
  const handleRefreshData = async () => {
    setRefreshing(true);
    try {
      if (institutionId) {
        // Re-initialize data
        await initializeData(institutionId);
        showSnackbar('Data refreshed successfully', 'success');
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      showSnackbar('Error refreshing data', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  // --- UI/UTILITY FUNCTIONS ---
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      admitted: { color: 'success', label: 'Admitted', icon: <CheckCircle /> },
      pending: { color: 'warning', label: 'Pending', icon: <Pending /> },
      rejected: { color: 'error', label: 'Rejected', icon: <Cancel /> },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Chip
        icon={config.icon}
        label={config.label}
        color={config.color}
        size="small"
        sx={{
          '&.MuiChip-success': {
            backgroundColor: alpha('#4CAF50', 0.1),
            color: '#4CAF50'
          },
          '&.MuiChip-warning': {
            backgroundColor: alpha('#FF9800', 0.1),
            color: '#FF9800'
          },
          '&.MuiChip-error': {
            backgroundColor: alpha('#F44336', 0.1),
            color: '#F44336'
          }
        }}
      />
    );
  };

  const getCourseNameById = (courseId) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? course.name : 'Course Not Found';
  };

  const formatFirestoreDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleDateString();
      } else if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleDateString();
      } else if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString();
      } else if (typeof timestamp === 'string') {
        return new Date(timestamp).toLocaleDateString();
      } else {
        return 'Invalid Date';
      }
    } catch (error) {
      return 'Date Error';
    }
  };
  
  // Filtered Applications for display
  const filteredApplications = applications.filter(app => {
    if (selectedCourseFilter === 'all') {
      return true;
    }
    return app.courseId === selectedCourseFilter;
  });

  // Get pending applications count for badge
  const pendingApplicationsCount = applications.filter(app => app.status === 'pending').length;

  // --- FEATURE IMPLEMENTATION (CRUD) ---

  // 1. Institution Setup / Profile Management
  const handleInitializeInstitution = async () => {
    try {
      if (!profileForm.name) {
        showSnackbar('Institution Name is required.', 'error');
        return;
      }
      
      const setupData = { 
        ...profileForm, 
        faculties: faculties,
        name: profileForm.name, 
      };
      await institutionService.updateInstitution(institutionId, setupData);
      
      // Load demo data after successful setup
      await demoService.createDemoData(institutionId, profileForm.name);
      
      setInitializing(false);
      showSnackbar('Institution setup and demo data loaded successfully!', 'success');
    } catch (error) {
      setInitializing(true);
      showSnackbar(`Error setting up institution: ${error.message}`, 'error');
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const updateData = { ...profileForm, faculties: faculties };
      await institutionService.updateInstitution(institutionId, updateData);
      setProfileDialog({ open: false });
      showSnackbar('Profile updated successfully', 'success');
    } catch (error) {
      showSnackbar(`Error updating profile: ${error.message}`, 'error');
    }
  };
  
  // 2. Course Management
  const handleOpenCourseDialog = (courseToEdit = null) => {
    if (courseToEdit) {
      setCourseForm({
        name: courseToEdit.name,
        faculty: courseToEdit.faculty,
        capacity: String(courseToEdit.capacity),
        duration: courseToEdit.duration,
        requirements: courseToEdit.requirements,
        fee: String(courseToEdit.fee),
      });
      setCourseDialog({ open: true, editingCourse: courseToEdit });
    } else {
      setCourseForm(initialCourseFormState);
      setCourseDialog({ open: true, editingCourse: null });
    }
  };

  const handleCloseCourseDialog = () => {
    setCourseDialog({ open: false, editingCourse: null });
    setCourseForm(initialCourseFormState);
  };

  const handleSaveCourse = async () => {
    const isEditing = !!courseDialog.editingCourse;
    const courseData = {
      ...courseForm,
      institutionId,
      capacity: parseInt(courseForm.capacity || 0),
      fee: parseFloat(courseForm.fee || 0),
      currentApplications: isEditing
        ? courseDialog.editingCourse.currentApplications
        : 0,
    };

    if (!courseData.name || !courseData.faculty || courseData.capacity <= 0) {
        showSnackbar('Name, Faculty, and Capacity are required.', 'error');
        return;
    }

    try {
      if (isEditing) {
        await coursesService.updateCourse(courseDialog.editingCourse.id, courseData);
        showSnackbar('Course updated successfully', 'success');
      } else {
        await coursesService.addCourse(courseData);
        showSnackbar('Course added successfully', 'success');
      }
      handleCloseCourseDialog();
    } catch (error) {
      console.error('Error saving course:', error);
      showSnackbar(`Error ${isEditing ? 'updating' : 'adding'} course`, 'error');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }
    try {
      await coursesService.deleteCourse(courseId);
      showSnackbar('Course deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting course:', error);
      showSnackbar('Error deleting course', 'error');
    }
  };

  // 3. Application Management with enhanced real-time updates
  const handleApplicationAction = async (applicationId, action) => {
    const institutionName = institution?.name;
    if (!institutionName) {
      showSnackbar('Institution name not loaded. Please complete the profile setup.', 'error');
      return;
    }
    
    try {
      await applicationsService.updateApplicationStatus(applicationId, action, { 
        institutionName: institutionName,
        decisionDate: new Date()
      });
      showSnackbar(`Application ${action} successfully`, 'success');
    } catch (error) {
      showSnackbar(`Error updating application: ${error.message}`, 'error');
    }
  };

  const handleViewApplicationDetails = (application) => {
    setApplicationDetailDialog({ open: true, application });
  };
  
  // 4. Admissions Publishing
  const handlePublishAdmissions = async () => {
    if (pendingApplicationsCount > 0 && !window.confirm(`There are still ${pendingApplicationsCount} pending applications. Are you sure you want to publish admissions?`)) {
      return;
    }

    try {
      const academicYear = new Date().getFullYear();
      await admissionsService.publishAdmissions(institutionId, academicYear);
      showSnackbar('Admissions published successfully! Students have been notified.', 'success');
    } catch (error) {
      showSnackbar(`Error publishing admissions: ${error.message}`, 'error');
    }
  };
  
  // 5. Faculty Management
  const handleAddFaculty = async () => {
    if (!facultyDialog.newFacultyName.trim()) {
      showSnackbar('Faculty name cannot be empty.', 'error');
      return;
    }
    const newFaculty = facultyDialog.newFacultyName.trim();
    if (faculties.includes(newFaculty)) {
      showSnackbar('Faculty already exists.', 'warning');
      return;
    }
    
    const updatedFaculties = [...faculties, newFaculty];
    
    try {
      await institutionService.updateInstitution(institutionId, { faculties: updatedFaculties });
      setFaculties(updatedFaculties);
      setFacultyDialog({ open: false, newFacultyName: '' });
      showSnackbar(`${newFaculty} added successfully.`, 'success');
    } catch (error) {
      showSnackbar(`Error adding faculty: ${error.message}`, 'error');
    }
  };

  const handleRemoveFaculty = async (facultyName) => {
    if (!window.confirm(`Are you sure you want to remove the faculty: ${facultyName}?`)) {
      return;
    }
    
    const updatedFaculties = faculties.filter(f => f !== facultyName);
    
    try {
      await institutionService.updateInstitution(institutionId, { faculties: updatedFaculties });
      setFaculties(updatedFaculties);
      showSnackbar(`${facultyName} removed successfully.`, 'success');
    } catch (error) {
      showSnackbar(`Error removing faculty: ${error.message}`, 'error');
    }
  };

  // --- RENDERING LOGIC ---

  // Initial Setup Wizard
  if (initializing && !loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Card sx={{ borderRadius: '12px', border: `1px solid ${mediumGray}` }}>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <School sx={{ fontSize: 64, color: accentColor, mb: 3 }} />
            <Typography variant="h4" gutterBottom sx={{ color: primaryColor, fontWeight: '300' }}>
              Welcome! Let's Set Up Your Institution
            </Typography>
            <Typography variant="body1" sx={{ color: secondaryColor, mb: 4, fontWeight: '300' }}>
              Fill in the details below to finalize your dashboard setup.
            </Typography>
            <Grid container spacing={3} sx={{ maxWidth: 600, margin: '0 auto' }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Institution Name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px'
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Website"
                  value={profileForm.website}
                  onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px'
                    }
                  }}
                />
              </Grid>
            </Grid>
            <Button
              variant="contained"
              size="large"
              sx={{ 
                mt: 4,
                backgroundColor: accentColor,
                color: 'white',
                borderRadius: '25px',
                px: 4,
                py: 1.5,
                fontWeight: '600',
                '&:hover': {
                  backgroundColor: '#E55A2B'
                }
              }}
              onClick={handleInitializeInstitution}
              disabled={!profileForm.name}
            >
              Complete Setup & Load Demo Data
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // Loading State
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px" flexDirection="column">
        <CircularProgress sx={{ color: accentColor }} size={60} />
        <Typography variant="h6" sx={{ mt: 2, color: secondaryColor, fontWeight: '300' }}>
          Loading Institution Dashboard...
        </Typography>
      </Box>
    );
  }

  // Main Dashboard
  return (
    <Container maxWidth="lg" sx={{ py: 4, px: { xs: 1, sm: 2, md: 4 } }}>
      {/* Snackbar for Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ borderRadius: '8px' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* --- Dialogs for Management --- */}

      {/* 1. Add/Edit Course Dialog */}
      <Dialog
        open={courseDialog.open}
        onClose={handleCloseCourseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ fontWeight: '600', color: primaryColor }}>
          {courseDialog.editingCourse ? 'Edit Course' : 'Add New Course'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Course Name"
                value={courseForm.name}
                onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Faculty</InputLabel>
                <Select
                  value={courseForm.faculty}
                  label="Faculty"
                  onChange={(e) => setCourseForm({ ...courseForm, faculty: e.target.value })}
                  sx={{
                    borderRadius: '8px'
                  }}
                >
                  {faculties.map((faculty) => (
                    <MenuItem key={faculty} value={faculty}>
                      {faculty}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Capacity"
                type="number"
                value={courseForm.capacity}
                onChange={(e) => setCourseForm({ ...courseForm, capacity: e.target.value })}
                required
                inputProps={{ min: 1 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Duration"
                value={courseForm.duration}
                onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
                placeholder="e.g., 4 years"
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fee ($)"
                type="number"
                value={courseForm.fee}
                onChange={(e) => setCourseForm({ ...courseForm, fee: e.target.value })}
                required
                inputProps={{ min: 0 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Requirements (e.g., Min GPA 3.0)"
                multiline
                rows={3}
                value={courseForm.requirements}
                onChange={(e) => setCourseForm({ ...courseForm, requirements: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px'
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseCourseDialog}
            sx={{ color: secondaryColor }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveCourse}
            variant="contained"
            disabled={!courseForm.name || !courseForm.faculty || !courseForm.capacity}
            sx={{
              backgroundColor: accentColor,
              color: 'white',
              borderRadius: '25px',
              px: 3,
              '&:hover': {
                backgroundColor: '#E55A2B'
              }
            }}
          >
            {courseDialog.editingCourse ? 'Update' : 'Add'} Course
          </Button>
        </DialogActions>
      </Dialog>

      {/* 2. Profile Dialog */}
      <Dialog
        open={profileDialog.open}
        onClose={() => setProfileDialog({ open: false })}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ fontWeight: '600', color: primaryColor }}>
          Edit Institution Profile
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Institution Name"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Website"
                value={profileForm.website}
                onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px'
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setProfileDialog({ open: false })}
            sx={{ color: secondaryColor }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateProfile} 
            variant="contained"
            sx={{
              backgroundColor: accentColor,
              color: 'white',
              borderRadius: '25px',
              px: 3,
              '&:hover': {
                backgroundColor: '#E55A2B'
              }
            }}
          >
            Update Profile
          </Button>
        </DialogActions>
      </Dialog>

      {/* 3. Faculty Management Dialog */}
      <Dialog
        open={facultyDialog.open}
        onClose={() => setFacultyDialog({ open: false, newFacultyName: '' })}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ fontWeight: '600', color: primaryColor }}>
          Manage Faculties
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ color: primaryColor }}>
              Current Faculties:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {faculties.map((faculty) => (
                <Chip
                  key={faculty}
                  label={faculty}
                  onDelete={() => handleRemoveFaculty(faculty)}
                  color="primary"
                  variant="outlined"
                  sx={{
                    borderColor: accentColor,
                    color: accentColor,
                    '&:hover': {
                      backgroundColor: alpha(accentColor, 0.1)
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
          <Typography variant="subtitle1" sx={{ mt: 2, color: primaryColor }} gutterBottom>
            Add New Faculty
          </Typography>
          <TextField
            fullWidth
            label="New Faculty Name"
            value={facultyDialog.newFacultyName}
            onChange={(e) => setFacultyDialog({ ...facultyDialog, newFacultyName: e.target.value })}
            onKeyPress={(e) => e.key === 'Enter' && handleAddFaculty()}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px'
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setFacultyDialog({ open: false, newFacultyName: '' })}
            sx={{ color: secondaryColor }}
          >
            Close
          </Button>
          <Button 
            onClick={handleAddFaculty} 
            variant="contained" 
            disabled={!facultyDialog.newFacultyName.trim()}
            sx={{
              backgroundColor: accentColor,
              color: 'white',
              borderRadius: '25px',
              px: 3,
              '&:hover': {
                backgroundColor: '#E55A2B'
              }
            }}
          >
            Add Faculty
          </Button>
        </DialogActions>
      </Dialog>

      {/* 4. Application Detail Dialog */}
      <Dialog
        open={applicationDetailDialog.open}
        onClose={() => setApplicationDetailDialog({ open: false, application: null })}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ fontWeight: '600', color: primaryColor }}>
          Application Details
        </DialogTitle>
        <DialogContent>
          {applicationDetailDialog.application && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ color: primaryColor }}>
                  Student Information
                </Typography>
                <Typography sx={{ color: secondaryColor, mb: 1 }}><strong>Name:</strong> {applicationDetailDialog.application.studentName}</Typography>
                <Typography sx={{ color: secondaryColor, mb: 1 }}><strong>Email:</strong> {applicationDetailDialog.application.studentEmail}</Typography>
                <Typography sx={{ color: secondaryColor, mb: 1 }}><strong>Applied Date:</strong> {formatFirestoreDate(applicationDetailDialog.application.applicationDate)}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ color: primaryColor }}>
                  Course Information
                </Typography>
                <Typography sx={{ color: secondaryColor, mb: 1 }}><strong>Course:</strong> {getCourseNameById(applicationDetailDialog.application.courseId)}</Typography>
                <Typography sx={{ color: secondaryColor, mb: 1 }}><strong>Faculty:</strong> {applicationDetailDialog.application.faculty}</Typography>
                <Typography sx={{ color: secondaryColor, mb: 1 }}><strong>Status:</strong> {getStatusChip(applicationDetailDialog.application.status)}</Typography>
              </Grid>
              {applicationDetailDialog.application.decisionDate && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ color: primaryColor }}>
                    Decision Information
                  </Typography>
                  <Typography sx={{ color: secondaryColor }}><strong>Decision Date:</strong> {formatFirestoreDate(applicationDetailDialog.application.decisionDate)}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setApplicationDetailDialog({ open: false, application: null })}
            sx={{ color: secondaryColor }}
          >
            Close
          </Button>
          {applicationDetailDialog.application?.status === 'pending' && (
            <Box>
              <Button 
                startIcon={<CheckCircle />}
                onClick={() => {
                  handleApplicationAction(applicationDetailDialog.application.id, 'admitted');
                  setApplicationDetailDialog({ open: false, application: null });
                }}
                sx={{
                  color: '#4CAF50',
                  '&:hover': {
                    backgroundColor: alpha('#4CAF50', 0.1)
                  }
                }}
              >
                Admit
              </Button>
              <Button 
                startIcon={<Cancel />}
                onClick={() => {
                  handleApplicationAction(applicationDetailDialog.application.id, 'rejected');
                  setApplicationDetailDialog({ open: false, application: null });
                }}
                sx={{
                  color: '#F44336',
                  '&:hover': {
                    backgroundColor: alpha('#F44336', 0.1)
                  }
                }}
              >
                Reject
              </Button>
            </Box>
          )}
        </DialogActions>
      </Dialog>

      {/* --- Dashboard Header --- */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, mb: 4, gap: { xs: 2, sm: 0 } }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ color: primaryColor, fontWeight: '300', fontSize: { xs: '2rem', sm: '2.5rem' } }}>
            Institution Dashboard
          </Typography>
          <Typography variant="h6" sx={{ color: secondaryColor, fontWeight: '300', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
            {institution?.name || 'Your Institution'}
          </Typography>
          {!institution && (
            <Typography variant="caption" sx={{ color: accentColor }}>
              Complete setup to start receiving applications
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' } }}>
          <Button 
            variant="outlined" 
            startIcon={<Refresh />}
            onClick={handleRefreshData}
            disabled={refreshing}
            sx={{
              borderColor: accentColor,
              color: accentColor,
              borderRadius: '25px',
              width: { xs: '100%', sm: 'auto' },
              mb: { xs: 1, sm: 0 },
              '&:hover': {
                borderColor: '#E55A2B',
                backgroundColor: alpha(accentColor, 0.1)
              }
            }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenCourseDialog()}
            sx={{
              backgroundColor: accentColor,
              color: 'white',
              borderRadius: '25px',
              px: 3,
              width: { xs: '100%', sm: 'auto' },
              '&:hover': {
                backgroundColor: '#E55A2B'
              }
            }}
          >
            Add New Course
          </Button>
        </Box>
      </Box>

      {/* --- Tabbed Content --- */}
      <Paper sx={{ borderRadius: '12px', border: `1px solid ${mediumGray}`, overflowX: 'auto' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              color: secondaryColor,
              '&.Mui-selected': {
                color: accentColor,
              },
              fontSize: { xs: '0.9rem', sm: '1rem' }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: accentColor,
            }
          }}
        >
          <Tab 
            label={
              <Badge badgeContent={pendingApplicationsCount} color="warning">
                Applications
              </Badge>
            } 
          />
          <Tab label="Courses" />
          <Tab label="Admissions" />
          <Tab label="Institution Profile" />
        </Tabs>

        {/* --- Tab 1: Applications --- */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ color: primaryColor, fontWeight: '600' }}>
              Student Applications ({filteredApplications.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel id="course-filter-label">Filter by Course</InputLabel>
                <Select
                  labelId="course-filter-label"
                  value={selectedCourseFilter}
                  label="Filter by Course"
                  onChange={(e) => setSelectedCourseFilter(e.target.value)}
                  sx={{
                    borderRadius: '8px'
                  }}
                >
                  <MenuItem value="all">
                    All Courses ({applications.length})
                  </MenuItem>
                  {courses.map((course) => (
                    <MenuItem key={course.id} value={course.id}>
                      {course.name} ({applications.filter(app => app.courseId === course.id).length})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          {applications.length === 0 ? (
            <Card sx={{ border: `1px solid ${mediumGray}`, borderRadius: '12px' }}>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Description sx={{ fontSize: 64, color: accentColor, mb: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ color: primaryColor }}>
                  No Applications Yet
                </Typography>
                <Typography variant="body2" sx={{ color: secondaryColor, mb: 3, fontWeight: '300' }}>
                  Student applications will appear here in real-time. Click below to load demo data.
                </Typography>
                <Button
                  variant="contained"
                  sx={{ 
                    mt: 2,
                    backgroundColor: accentColor,
                    color: 'white',
                    borderRadius: '25px',
                    px: 4,
                    '&:hover': {
                      backgroundColor: '#E55A2B'
                    }
                  }}
                  onClick={() => demoService.createDemoData(institutionId, institution?.name || 'Demo Institution')}
                >
                  Load Demo Applications
                </Button>
              </CardContent>
            </Card>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: '12px', border: `1px solid ${mediumGray}` }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Student Name</TableCell>
                    <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Contact</TableCell>
                    <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Course</TableCell>
                    <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Applied Date</TableCell>
                    <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredApplications.map((app) => (
                    <TableRow key={app.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ color: primaryColor }}>
                          {app.studentName || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Email fontSize="small" sx={{ color: accentColor }} />
                            <Typography variant="caption" sx={{ color: secondaryColor }}>
                              {app.studentEmail}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: secondaryColor }}>
                        {getCourseNameById(app.courseId)}
                      </TableCell>
                      <TableCell sx={{ color: secondaryColor }}>
                        {formatFirestoreDate(app.applicationDate)}
                      </TableCell>
                      <TableCell>{getStatusChip(app.status)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleViewApplicationDetails(app)}
                            sx={{
                              borderColor: primaryColor,
                              color: primaryColor,
                              borderRadius: '20px',
                              '&:hover': {
                                borderColor: accentColor,
                                color: accentColor,
                                backgroundColor: alpha(accentColor, 0.1)
                              }
                            }}
                          >
                            View Details
                          </Button>
                          {app.status === 'pending' && (
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleApplicationAction(app.id, 'admitted')}
                                title="Admit Student"
                                sx={{
                                  color: '#4CAF50',
                                  '&:hover': {
                                    backgroundColor: alpha('#4CAF50', 0.1)
                                  }
                                }}
                              >
                                <CheckCircle />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleApplicationAction(app.id, 'rejected')}
                                title="Reject Application"
                                sx={{
                                  color: '#F44336',
                                  '&:hover': {
                                    backgroundColor: alpha('#F44336', 0.1)
                                  }
                                }}
                              >
                                <Cancel />
                              </IconButton>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* --- Tab 2: Courses --- */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom sx={{ color: primaryColor, fontWeight: '600' }}>
            Course Management ({courses.length} courses)
          </Typography>
          {courses.length === 0 ? (
            <Card sx={{ border: `1px solid ${mediumGray}`, borderRadius: '12px' }}>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <School sx={{ fontSize: 64, color: accentColor, mb: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ color: primaryColor }}>
                  No Courses Added Yet
                </Typography>
                <Typography variant="body2" sx={{ color: secondaryColor, mb: 3, fontWeight: '300' }}>
                  Start by adding your first course to accept student applications.
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<Add />}
                  onClick={() => handleOpenCourseDialog()}
                  sx={{
                    backgroundColor: accentColor,
                    color: 'white',
                    borderRadius: '25px',
                    px: 4,
                    '&:hover': {
                      backgroundColor: '#E55A2B'
                    }
                  }}
                >
                  Add Your First Course
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {courses.map((course) => {
                const FacultyIcon = facultyIcons[course.faculty] || School;
                const capacityWarning = course.currentApplications / course.capacity > 0.8;
                const isFull = course.currentApplications >= course.capacity;
                
                return (
                  <Grid item xs={12} md={6} key={course.id}>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        borderRadius: '12px',
                        border: `1px solid ${mediumGray}`,
                        backgroundColor: isFull ? alpha('#F44336', 0.05) : capacityWarning ? alpha('#FF9800', 0.05) : null,
                        borderColor: isFull ? '#F44336' : capacityWarning ? '#FF9800' : mediumGray,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: `0 8px 25px ${alpha(primaryColor, 0.1)}`,
                          borderColor: accentColor
                        }
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                            <FacultyIcon sx={{ color: accentColor, mr: 2, mt: 0.5 }} />
                            <Box>
                              <Typography variant="h6" gutterBottom sx={{ color: primaryColor }}>
                                {course.name}
                              </Typography>
                              <Typography sx={{ color: secondaryColor, fontWeight: '300' }} gutterBottom>
                                {course.faculty}
                              </Typography>
                            </Box>
                          </Box>
                          <Box>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenCourseDialog(course)}
                              title="Edit Course"
                              sx={{
                                color: accentColor,
                                '&:hover': {
                                  backgroundColor: alpha(accentColor, 0.1)
                                }
                              }}
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteCourse(course.id)}
                              title="Delete Course"
                              sx={{
                                color: '#F44336',
                                '&:hover': {
                                  backgroundColor: alpha('#F44336', 0.1)
                                }
                              }}
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </Box>
                        <Typography variant="body2" gutterBottom sx={{ color: secondaryColor }}>
                          Duration: {course.duration} | Fee: ${course.fee}
                        </Typography>
                        <Typography variant="body2" sx={{ color: secondaryColor, mt: 1, fontWeight: '300' }}>
                          Requirements: {course.requirements || 'N/A'}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: '600', color: primaryColor }}>
                            Applications: {course.currentApplications}/{course.capacity}
                          </Typography>
                          <Chip
                            label={isFull ? 'Full' : capacityWarning ? 'Almost Full' : 'Available'}
                            color={isFull ? 'error' : capacityWarning ? 'warning' : 'success'}
                            size="small"
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </TabPanel>

        {/* --- Tab 3: Admissions --- */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom sx={{ color: primaryColor, fontWeight: '600' }}>
            Admissions Management
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ border: `1px solid ${mediumGray}`, borderRadius: '12px' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: primaryColor }}>
                    Publish Admissions
                  </Typography>
                  <Typography variant="body2" sx={{ color: secondaryColor, mb: 2, fontWeight: '300' }}>
                    Finalize and publish admission results for the current academic year ({new Date().getFullYear()}). This will notify all applicants of their final status.
                  </Typography>
                  <Button
                    variant="contained"
                    sx={{ 
                      mt: 1,
                      backgroundColor: accentColor,
                      color: 'white',
                      borderRadius: '25px',
                      px: 3,
                      '&:hover': {
                        backgroundColor: '#E55A2B'
                      }
                    }}
                    onClick={handlePublishAdmissions}
                    disabled={applications.length === 0}
                  >
                    Publish Admissions
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ border: `1px solid ${mediumGray}`, borderRadius: '12px' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: primaryColor }}>
                    Admission Overview
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography sx={{ color: secondaryColor, mb: 1 }}>Total Applications: {applications.length}</Typography>
                    <Typography sx={{ color: '#4CAF50', mb: 1 }}>Admitted: {applications.filter(app => app.status === 'admitted').length}</Typography>
                    <Typography sx={{ color: '#F44336', mb: 1 }}>Rejected: {applications.filter(app => app.status === 'rejected').length}</Typography>
                    <Typography sx={{ color: '#FF9800', mb: 2 }}>Pending: {pendingApplicationsCount}</Typography>
                  </Box>
                  <Button 
                    variant="outlined" 
                    sx={{ 
                      mt: 1,
                      borderColor: primaryColor,
                      color: primaryColor,
                      borderRadius: '25px',
                      '&:hover': {
                        borderColor: accentColor,
                        color: accentColor,
                        backgroundColor: alpha(accentColor, 0.1)
                      }
                    }} 
                    disabled={applications.length === 0}
                  >
                    Generate Report
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* --- Tab 4: Institution Profile --- */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom sx={{ color: primaryColor, fontWeight: '600' }}>
            Institution Profile & Settings
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ border: `1px solid ${mediumGray}`, borderRadius: '12px' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: primaryColor }}>
                    Basic Information
                  </Typography>
                  {institution ? (
                    <>
                      <Typography sx={{ color: secondaryColor, mb: 1 }}><strong>Name:</strong> {institution.name}</Typography>
                      <Typography sx={{ color: secondaryColor, mb: 1 }}><strong>Email:</strong> {institution.email || 'Not set'}</Typography>
                      <Typography sx={{ color: secondaryColor, mb: 1 }}><strong>Phone:</strong> {institution.phone || 'Not set'}</Typography>
                      <Typography sx={{ color: secondaryColor, mb: 1 }}><strong>Address:</strong> {institution.address || 'Not set'}</Typography>
                      <Typography sx={{ color: secondaryColor, mb: 2 }}><strong>Website:</strong> {institution.website || 'Not set'}</Typography>
                      <Button
                        variant="outlined"
                        sx={{ 
                          mt: 1,
                          borderColor: primaryColor,
                          color: primaryColor,
                          borderRadius: '25px',
                          '&:hover': {
                            borderColor: accentColor,
                            color: accentColor,
                            backgroundColor: alpha(accentColor, 0.1)
                          }
                        }}
                        onClick={() => setProfileDialog({ open: true })}
                      >
                        Edit Profile
                      </Button>
                    </>
                  ) : (
                    <Typography sx={{ color: secondaryColor }}>
                      No profile information found. Please set up your institution.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Faculty Management Card */}
            <Grid item xs={12} md={6}>
              <Card sx={{ border: `1px solid ${mediumGray}`, borderRadius: '12px' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: primaryColor }}>
                    Faculty Management
                  </Typography>
                  <Typography sx={{ color: secondaryColor, mb: 2, fontWeight: '300' }}>
                    Define and manage the faculties/departments offered by your institution.
                  </Typography>
                  <Box sx={{ mt: 2, mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {faculties.slice(0, 3).map((f, index) => (
                      <Chip 
                        key={index} 
                        label={f} 
                        size="small" 
                        variant="outlined" 
                        sx={{
                          borderColor: accentColor,
                          color: accentColor
                        }}
                      />
                    ))}
                    {faculties.length > 3 && (
                      <Chip 
                        label={`+${faculties.length - 3} more`} 
                        size="small" 
                        sx={{
                          borderColor: mediumGray,
                          color: secondaryColor
                        }}
                      />
                    )}
                  </Box>
                  <Button 
                    variant="contained" 
                    startIcon={<Settings />}
                    onClick={() => setFacultyDialog({ open: true, newFacultyName: '' })}
                    sx={{
                      backgroundColor: accentColor,
                      color: 'white',
                      borderRadius: '25px',
                      px: 3,
                      '&:hover': {
                        backgroundColor: '#E55A2B'
                      }
                    }}
                  >
                    Manage Faculties
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default InstitutionDashboard;