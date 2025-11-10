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
} from '@mui/icons-material';
import {
  applicationsService,
  coursesService,
  institutionService,
  admissionsService,
  demoService,
} from '../services/institutionService';
import { auth } from '../config/firebase'; // Assumed path

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
  ]); // Managed faculties
  const [institution, setInstitution] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    admitted: 0,
    rejected: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // New State for Course Application Filtering
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all'); // 'all' or a specific course ID

  // Dialog State
  const [courseDialog, setCourseDialog] = useState({
    open: false,
    editingCourse: null,
  });
  const [profileDialog, setProfileDialog] = useState({ open: false });
  const [facultyDialog, setFacultyDialog] = useState({ open: false, newFacultyName: '' });

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
      // For a demo/unauthenticated user, use a fixed key
      currentUid = 'demo-institution-user-123';
    }
    
    setInstitutionId(currentUid);
    initializeData(currentUid); // Always initialize data

    // return () => { /* clean up listeners */ };
  }, []);

  const initializeData = async (uid) => {
    setLoading(true);

    try {
      // 1. Subscribe to Applications (Real-time updates)
      const unsubscribeApplications = applicationsService.getApplications(uid, (snapshot) => {
        const applicationsData = snapshot.docs ? snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) : [];
        setApplications(applicationsData);
        updateStats(applicationsData);
      });

      // 2. Subscribe to Courses (Real-time updates)
      const unsubscribeCourses = coursesService.getCourses(uid, (snapshot) => {
        const coursesData = snapshot.docs ? snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) : [];
        setCourses(coursesData);
      });

      // 3. Subscribe to Institution Profile (Check for setup)
      const unsubscribeInstitution = institutionService.getInstitution(uid, (snapshot) => {
        if (snapshot.exists()) {
          const institutionData = { id: snapshot.id, ...snapshot.data() };
          setInstitution(institutionData);
          setProfileForm(institutionData);
          
          // Use stored faculties if available
          if (institutionData.faculties && Array.isArray(institutionData.faculties)) {
             setFaculties(institutionData.faculties);
          }

          setInitializing(false);
        } else {
          // If no profile exists, set initializing to true to show setup wizard
          setInitializing(true);
        }
        setLoading(false); // Set loading to false once the initial data check is complete
      });


      // Return cleanup function
      return () => {
        if (unsubscribeApplications) unsubscribeApplications();
        if (unsubscribeCourses) unsubscribeCourses();
        if (unsubscribeInstitution) unsubscribeInstitution();
      };
    } catch (error) {
      console.error('Error initializing data:', error);
      setLoading(false);
      showSnackbar('Failed to load dashboard data. Check console.', 'error');
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

  const updateStats = (applicationsData) => {
    const newStats = {
      total: applicationsData.length,
      admitted: applicationsData.filter((app) => app.status === 'admitted').length,
      rejected: applicationsData.filter((app) => app.status === 'rejected').length,
      pending: applicationsData.filter((app) => app.status === 'pending').length,
    };
    setStats(newStats);
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      admitted: { color: 'success', label: 'Admitted' },
      pending: { color: 'warning', label: 'Pending' },
      rejected: { color: 'error', label: 'Rejected' },
    };
    const config = statusConfig[status];
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const getCourseNameById = (courseId) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? course.name : 'Course Not Found (ID: ' + courseId + ')';
  };
  
  // Filtered Applications for display
  const filteredApplications = applications.filter(app => {
      if (selectedCourseFilter === 'all') {
          return true;
      }
      return app.courseId === selectedCourseFilter;
  });

  // --- FEATURE IMPLEMENTATION (CRUD) ---

  // 1. Institution Setup / Profile Management (Combined)
  const handleInitializeInstitution = async () => {
    try {
      if (!profileForm.name) {
        showSnackbar('Institution Name is required.', 'error');
        return;
      }
      
      // Save the institution's real name along with other setup data
      const setupData = { 
        ...profileForm, 
        faculties: faculties,
        name: profileForm.name, 
      };
      await institutionService.updateInstitution(institutionId, setupData);
      
      // Load demo data after successful setup
      await demoService.createDemoData(institutionId, profileForm.name); // Pass the institution name
      
      setInitializing(false);
      showSnackbar('Institution setup and demo data loaded successfully!', 'success');
    } catch (error) {
      setInitializing(true); // Keep the setup wizard open on error
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
  
  // 2. Course Management (Add, Edit, Delete)
  const handleOpenCourseDialog = (courseToEdit = null) => {
    if (courseToEdit) {
      // Editing Mode
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
      // Adding Mode
      setCourseForm(initialCourseFormState);
      setCourseDialog({ open: true, editingCourse: null });
    }
  };

  const handleCloseCourseDialog = () => {
    setCourseDialog({ open: false, editingCourse: null });
    setCourseForm(initialCourseFormState); // Reset form on close
  };

  const handleSaveCourse = async () => {
    const isEditing = !!courseDialog.editingCourse;
    const courseData = {
      ...courseForm,
      institutionId,
      capacity: parseInt(courseForm.capacity || 0),
      fee: parseFloat(courseForm.fee || 0),
      // Preserve existing application count when editing
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
    if (
      !window.confirm(
        'Are you sure you want to delete this course? This action cannot be undone.'
      )
    ) {
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

  // 3. Application Management (Status Update)
  const handleApplicationAction = async (applicationId, action) => {
    const institutionName = institution?.name;
    if (!institutionName) {
        showSnackbar('Institution name not loaded. Please complete the profile setup.', 'error');
        return;
    }
    
    try {
      // Update the application status and also save the Institution's NAME
      await applicationsService.updateApplicationStatus(applicationId, action, { 
          institutionName: institutionName 
      });
      showSnackbar(`Application ${action} successfully`, 'success');
    } catch (error) {
      showSnackbar(`Error updating application: ${error.message}`, 'error');
    }
  };
  
  // 4. Admissions Publishing
  const handlePublishAdmissions = async () => {
    if (
      stats.pending > 0 &&
      !window.confirm(
        `There are still ${stats.pending} pending applications. Are you sure you want to publish admissions? This will finalize results.`
      )
    ) {
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
    if (
        !window.confirm(
          `Are you sure you want to remove the faculty: ${facultyName}?`
        )
      ) {
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
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <School sx={{ fontSize: 64, color: 'primary.main', mb: 3 }} />
            <Typography variant="h4" gutterBottom>
              Welcome! Let's Set Up Your Institution
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
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
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Website"
                  value={profileForm.website}
                  onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                />
              </Grid>
            </Grid>
            <Button
              variant="contained"
              size="large"
              sx={{ mt: 4 }}
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
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Main Dashboard
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Snackbar for Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* --- Dialogs for Management --- */}

      {/* 1. Add/Edit Course Dialog (Updated to handle both modes) */}
      <Dialog
        open={courseDialog.open}
        onClose={handleCloseCourseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {courseDialog.editingCourse ? 'Edit Course' : 'Add New Course'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Course Name"
                value={courseForm.name}
                onChange={(e) =>
                  setCourseForm({ ...courseForm, name: e.target.value })
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Faculty</InputLabel>
                <Select
                  value={courseForm.faculty}
                  label="Faculty"
                  onChange={(e) =>
                    setCourseForm({ ...courseForm, faculty: e.target.value })
                  }
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
                onChange={(e) =>
                  setCourseForm({ ...courseForm, capacity: e.target.value })
                }
                required
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Duration"
                value={courseForm.duration}
                onChange={(e) =>
                  setCourseForm({ ...courseForm, duration: e.target.value })
                }
                placeholder="e.g., 4 years"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fee ($)"
                type="number"
                value={courseForm.fee}
                onChange={(e) =>
                  setCourseForm({ ...courseForm, fee: e.target.value })
                }
                required
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Requirements (e.g., Min GPA 3.0)"
                multiline
                rows={3}
                value={courseForm.requirements}
                onChange={(e) =>
                  setCourseForm({ ...courseForm, requirements: e.target.value })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCourseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveCourse}
            variant="contained"
            disabled={
              !courseForm.name || !courseForm.faculty || !courseForm.capacity
            }
          >
            {courseDialog.editingCourse ? 'Update' : 'Add'} Course
          </Button>
        </DialogActions>
      </Dialog>

      {/* 2. Profile Dialog (Updated) */}
      <Dialog
        open={profileDialog.open}
        onClose={() => setProfileDialog({ open: false })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Institution Profile</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
             <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Institution Name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Website"
                  value={profileForm.website}
                  onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                />
              </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfileDialog({ open: false })}>Cancel</Button>
          <Button onClick={handleUpdateProfile} variant="contained">
            Update Profile
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 3. Faculty Management Dialog (NEW FEATURE) */}
      <Dialog
        open={facultyDialog.open}
        onClose={() => setFacultyDialog({ open: false, newFacultyName: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Manage Faculties</DialogTitle>
        <DialogContent>
            <Box sx={{ mt: 1, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
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
                        />
                    ))}
                </Box>
            </Box>
            <Typography variant="subtitle1" sx={{ mt: 2 }} gutterBottom>
                Add New Faculty
            </Typography>
            <TextField
                fullWidth
                label="New Faculty Name"
                value={facultyDialog.newFacultyName}
                onChange={(e) => setFacultyDialog({ ...facultyDialog, newFacultyName: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleAddFaculty()}
            />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFacultyDialog({ open: false, newFacultyName: '' })}>Close</Button>
          <Button onClick={handleAddFaculty} variant="contained" disabled={!facultyDialog.newFacultyName.trim()}>
            Add Faculty
          </Button>
        </DialogActions>
      </Dialog>
      

      {/* --- Dashboard Header --- */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Institution Dashboard
          </Typography>
          <Typography variant="h6" color="textSecondary">
            {institution?.name || 'Your Institution'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenCourseDialog()}
        >
          Add New Course
        </Button>
      </Box>
      
      ---

      {/* --- Quick Stats --- */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Group sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.total}</Typography>
                  <Typography variant="body2">Total Applications</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <School sx={{ fontSize: 40, color: 'secondary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{courses.length}</Typography>
                  <Typography variant="body2">Courses Offered</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircle sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.admitted}</Typography>
                  <Typography variant="body2">Admitted Students</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Pending sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.pending}</Typography>
                  <Typography variant="body2">Pending Review</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      ---

      {/* --- Tabbed Content --- */}
      <Paper>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Applications" />
          <Tab label="Courses" />
          <Tab label="Admissions" />
          <Tab label="Institution Profile" />
        </Tabs>

        {/* --- Tab 1: Applications (Course Filtering Added) --- */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Student Applications
          </Typography>

          <Box sx={{ mb: 3, maxWidth: 300 }}>
              <FormControl fullWidth>
                  <InputLabel id="course-filter-label">Filter by Course</InputLabel>
                  <Select
                      labelId="course-filter-label"
                      value={selectedCourseFilter}
                      label="Filter by Course"
                      onChange={(e) => setSelectedCourseFilter(e.target.value)}
                  >
                      <MenuItem value="all">
                          **All Courses** ({applications.length} Total)
                      </MenuItem>
                      {courses.map((course) => (
                          <MenuItem key={course.id} value={course.id}>
                              {course.name} ({applications.filter(app => app.courseId === course.id).length} Apps)
                          </MenuItem>
                      ))}
                  </Select>
              </FormControl>
          </Box>


          {applications.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Description sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No Applications Yet
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Student applications will appear here. Click below to load demo data.
                </Typography>
                <Button
                  variant="outlined"
                  sx={{ mt: 2 }}
                  onClick={() => demoService.createDemoData(institutionId, institution?.name || 'Demo Institution')}
                >
                  Load Demo Data
                </Button>
              </CardContent>
            </Card>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student Name</TableCell>
                    <TableCell>Course</TableCell>
                    <TableCell>Institution Name</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Use the FILTERED applications array */}
                  {filteredApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>{app.studentName || 'N/A'}</TableCell>
                      <TableCell>
                        {/* Course Name Lookup Integrated */}
                        {app.courseId ? getCourseNameById(app.courseId) : app.courseName || 'N/A'}
                      </TableCell>
                      <TableCell>
                         {/* Display the saved Institution Name */}
                        {app.institutionName || 'Name Not Saved'} 
                      </TableCell>
                      <TableCell>{getStatusChip(app.status)}</TableCell>
                      <TableCell>
                        {/* Status Management Integrated */}
                        {app.status === 'pending' && (
                          <Box>
                            <IconButton
                              color="success"
                              onClick={() =>
                                handleApplicationAction(app.id, 'admitted')
                              }
                              title="Admit (Saves Institution Name to Application)'"
                            >
                              <CheckCircle />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={() =>
                                handleApplicationAction(app.id, 'rejected')
                              }
                              title="Reject (Saves Institution Name to Application)"
                            >
                              <Cancel />
                            </IconButton>
                          </Box>
                        )}
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
          <Typography variant="h6" gutterBottom>
            Course Management (View, Edit, Delete)
          </Typography>
          {courses.length === 0 ? (
            <Card>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                    <School sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                        No Courses Added Yet
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                        Start by adding your first course to accept student applications.
                    </Typography>
                    <Button 
                        variant="contained" 
                        startIcon={<Add />}
                        onClick={() => handleOpenCourseDialog()}
                    >
                        Add Your First Course
                    </Button>
                </CardContent>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {courses.map((course) => {
                const FacultyIcon = facultyIcons[course.faculty] || School;
                const capacityWarning =
                  course.currentApplications / course.capacity > 0.8;
                return (
                  <Grid item xs={12} md={6} key={course.id}>
                    <Card
                      variant="outlined"
                      sx={{ border: capacityWarning ? '1px solid orange' : null }}
                    >
                      <CardContent>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                            <FacultyIcon
                              sx={{ color: 'primary.main', mr: 2, mt: 0.5 }}
                            />
                            <Box>
                              <Typography variant="h6" gutterBottom>
                                {course.name}
                              </Typography>
                              <Typography color="textSecondary" gutterBottom>
                                {course.faculty}
                              </Typography>
                            </Box>
                          </Box>
                          <Box>
                            {/* Edit Button Integrated */}
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenCourseDialog(course)}
                              title="Edit Course"
                            >
                              <Edit />
                            </IconButton>
                            {/* Delete Button Integrated */}
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteCourse(course.id)}
                              title="Delete Course"
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </Box>
                        <Typography variant="body2" gutterBottom>
                          Duration: **{course.duration}** | Fee: **${course.fee}**
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 1 }}
                        >
                          **Requirements:** {course.requirements || 'N/A'}
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mt: 2,
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            Applications: {course.currentApplications}/{course.capacity}
                          </Typography>
                          <Chip
                            label={
                              course.currentApplications >= course.capacity
                                ? 'Full'
                                : 'Available'
                            }
                            color={
                              course.currentApplications >= course.capacity
                                ? 'error'
                                : 'success'
                            }
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
          <Typography variant="h6" gutterBottom>
            Admissions Management
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Publish Admissions
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Finalize and **publish admission results** for the current academic year ({new Date().getFullYear()}). This will notify all applicants of their final status.
                  </Typography>
                  <Button
                    variant="contained"
                    sx={{ mt: 2 }}
                    onClick={handlePublishAdmissions}
                    disabled={applications.length === 0}
                  >
                    Publish Admissions
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Admission Statistics
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography>Total Applications: **{stats.total}**</Typography>
                    <Typography color="success.main">
                      Admitted: **{stats.admitted}**
                    </Typography>
                    <Typography color="error">
                      Rejected: **{stats.rejected}**
                    </Typography>
                    <Typography color="warning.main">
                      Pending: **{stats.pending}**
                    </Typography>
                  </Box>
                  <Button variant="outlined" sx={{ mt: 2 }} disabled={stats.total === 0}>
                    Generate Report
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* --- Tab 4: Institution Profile --- */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Institution Profile & Settings
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Basic Information
                  </Typography>
                  {institution ? (
                    <>
                      <Typography>
                        <strong>Name:</strong> {institution.name}
                      </Typography>
                      <Typography>
                        <strong>Email:</strong> {institution.email || 'Not set'}
                      </Typography>
                      <Typography>
                        <strong>Phone:</strong> {institution.phone || 'Not set'}
                      </Typography>
                      <Typography>
                        <strong>Address:</strong> {institution.address || 'Not set'}
                      </Typography>
                      <Typography>
                        <strong>Website:</strong> {institution.website || 'Not set'}
                      </Typography>
                      <Button
                        variant="outlined"
                        sx={{ mt: 2 }}
                        onClick={() => setProfileDialog({ open: true })}
                      >
                        Edit Profile
                      </Button>
                    </>
                  ) : (
                    <Typography color="textSecondary">
                      No profile information found. Please set up your institution.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Faculty Management Card */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Faculty Management
                  </Typography>
                  <Typography color="textSecondary" gutterBottom>
                    Define and manage the faculties/departments offered by your institution.
                  </Typography>
                  <Box sx={{ mt: 2, mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                     {faculties.slice(0, 3).map((f, index) => (
                        <Chip key={index} label={f} size="small" variant="outlined" />
                     ))}
                     {faculties.length > 3 && (
                        <Chip label={`+${faculties.length - 3} more`} size="small" />
                     )}
                  </Box>
                  <Button 
                    variant="contained" 
                    startIcon={<Settings />}
                    onClick={() => setFacultyDialog({ open: true, newFacultyName: '' })}
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