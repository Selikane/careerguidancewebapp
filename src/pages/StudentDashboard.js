// src/pages/StudentDashboard.js
import React, { useState, useEffect, useContext } from 'react';
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
  List,
  ListItem,
  ListItemText,
  Chip,
  LinearProgress,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
  IconButton,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  School,
  Work,
  Description,
  Notifications,
  TrendingUp,
  CheckCircle,
  Pending,
  Cancel,
  Add,
  Upload,
  Edit
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import {
  studentApplicationsService,
  jobApplicationsService,
  studentProfileService,
  coursesService,
  jobsService,
  notificationsService,
  demoStudentService
} from '../services/studentService';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const StudentDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const { user } = useContext(AuthContext);
  const [studentId, setStudentId] = useState(null);
  const [applications, setApplications] = useState([]);
  const [jobApplications, setJobApplications] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [jobMatches, setJobMatches] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [studentProfile, setStudentProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Dialog states
  const [applyCourseDialog, setApplyCourseDialog] = useState({ open: false, course: null });
  const [applyJobDialog, setApplyJobDialog] = useState({ open: false, job: null });
  const [profileDialog, setProfileDialog] = useState({ open: false });
  const [uploadDialog, setUploadDialog] = useState({ open: false, documentType: '' });

  // Form states
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    educationLevel: '',
    skills: []
  });

  const [uploadFile, setUploadFile] = useState(null);

  const educationLevels = [
    'high_school',
    'diploma', 
    'bachelors',
    'masters',
    'phd'
  ];

  const skillsList = [
    'JavaScript', 'Python', 'Java', 'C++', 'React', 'Node.js',
    'HTML/CSS', 'SQL', 'MongoDB', 'AWS', 'Docker', 'Git',
    'Machine Learning', 'Data Analysis', 'UI/UX Design'
  ];

  const documentTypes = [
    'transcript',
    'certificate',
    'resume',
    'cover_letter',
    'id_document'
  ];

  useEffect(() => {
    if (user) {
      setStudentId(user.uid);
      initializeData(user.uid);
    }
  }, [user]);

  const initializeData = async (uid) => {
    setLoading(true);
    console.log('🚀 Initializing student dashboard for:', uid);

    try {
      // Load student profile
      await loadStudentProfile(uid);
      
      // Load applications
      await loadStudentApplications(uid);
      
      // Load job applications
      await loadJobApplications(uid);
      
      // Load available courses
      await loadAvailableCourses();
      
      // Load job matches
      await loadJobMatches(uid);
      
      // Load notifications
      await loadNotifications(uid);

      setLoading(false);
    } catch (error) {
      console.error('❌ Error initializing student data:', error);
      setLoading(false);
    }
  };

  const loadStudentProfile = (uid) => {
    return new Promise((resolve) => {
      const unsubscribe = studentProfileService.getStudentProfile(uid, (snapshot) => {
        if (snapshot.exists()) {
          const data = { id: snapshot.id, ...snapshot.data() };
          console.log('✅ Student profile loaded:', data);
          setStudentProfile(data);
          setProfileForm({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            phone: data.phone || '',
            address: data.address || '',
            educationLevel: data.educationLevel || '',
            skills: data.skills || []
          });
          setInitializing(false);
          unsubscribe();
          resolve(data);
        } else {
          console.log('❌ No student profile found');
          setInitializing(true);
          unsubscribe();
          resolve(null);
        }
      });
    });
  };

  const loadStudentApplications = (uid) => {
    return new Promise((resolve) => {
      const unsubscribe = studentApplicationsService.getStudentApplications(uid, (snapshot) => {
        const applicationsData = snapshot.docs ? snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) : [];
        console.log('✅ Applications loaded:', applicationsData.length);
        setApplications(applicationsData);
        unsubscribe();
        resolve(applicationsData);
      });
    });
  };

  const loadJobApplications = (uid) => {
    return new Promise((resolve) => {
      const unsubscribe = jobApplicationsService.getStudentJobApplications(uid, (snapshot) => {
        const jobAppsData = snapshot.docs ? snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) : [];
        console.log('✅ Job applications loaded:', jobAppsData.length);
        setJobApplications(jobAppsData);
        unsubscribe();
        resolve(jobAppsData);
      });
    });
  };

  const loadAvailableCourses = () => {
    return new Promise((resolve) => {
      const unsubscribe = coursesService.getAvailableCourses((snapshot) => {
        const coursesData = snapshot.docs ? snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) : [];
        console.log('✅ Available courses loaded:', coursesData.length);
        setAvailableCourses(coursesData);
        unsubscribe();
        resolve(coursesData);
      });
    });
  };

  const loadJobMatches = async (uid) => {
    try {
      const matches = await jobsService.getJobMatches(uid);
      console.log('✅ Job matches loaded:', matches.length);
      setJobMatches(matches);
    } catch (error) {
      console.error('❌ Error loading job matches:', error);
      setJobMatches([]);
    }
  };

  const loadNotifications = (uid) => {
    return new Promise((resolve) => {
      const unsubscribe = notificationsService.getStudentNotifications(uid, (snapshot) => {
        const notificationsData = snapshot.docs ? snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) : [];
        console.log('✅ Notifications loaded:', notificationsData.length);
        setNotifications(notificationsData);
        unsubscribe();
        resolve(notificationsData);
      });
    });
  };

  const handleInitializeProfile = async () => {
    try {
      setInitializing(true);
      await demoStudentService.createDemoStudentProfile(studentId, user.email);
      await initializeData(studentId);
      showSnackbar('Student profile created successfully!', 'success');
    } catch (error) {
      console.error('❌ Error creating student profile:', error);
      setInitializing(false);
      showSnackbar('Error creating student profile', 'error');
    }
  };

  const handleApplyForCourse = async () => {
    try {
      const { course } = applyCourseDialog;
      
      const applicationData = {
        studentId: studentId,
        studentName: `${studentProfile?.firstName} ${studentProfile?.lastName}`,
        studentEmail: user.email,
        courseId: course.id,
        courseName: course.name,
        institutionId: course.institutionId,
        institutionName: course.institutionName,
        applicationDate: new Date()
      };

      await studentApplicationsService.applyForCourse(applicationData);
      setApplyCourseDialog({ open: false, course: null });
      showSnackbar('Application submitted successfully!', 'success');
      
      // Refresh applications
      await loadStudentApplications(studentId);
    } catch (error) {
      console.error('❌ Error applying for course:', error);
      showSnackbar(error.message, 'error');
    }
  };

  const handleApplyForJob = async () => {
    try {
      const { job } = applyJobDialog;
      
      const applicationData = {
        studentId: studentId,
        studentName: `${studentProfile?.firstName} ${studentProfile?.lastName}`,
        studentEmail: user.email,
        jobId: job.id,
        jobTitle: job.title,
        companyId: job.companyId,
        companyName: job.companyName,
        applicationDate: new Date()
      };

      await jobApplicationsService.applyForJob(applicationData);
      setApplyJobDialog({ open: false, job: null });
      showSnackbar('Job application submitted successfully!', 'success');
      
      // Refresh job applications
      await loadJobApplications(studentId);
    } catch (error) {
      console.error('❌ Error applying for job:', error);
      showSnackbar('Error applying for job', 'error');
    }
  };

  const handleWithdrawApplication = async (applicationId) => {
    try {
      await studentApplicationsService.withdrawApplication(applicationId);
      showSnackbar('Application withdrawn successfully', 'success');
      await loadStudentApplications(studentId);
    } catch (error) {
      console.error('❌ Error withdrawing application:', error);
      showSnackbar('Error withdrawing application', 'error');
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await studentProfileService.updateStudentProfile(studentId, profileForm);
      setProfileDialog({ open: false });
      await loadStudentProfile(studentId);
      showSnackbar('Profile updated successfully', 'success');
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      showSnackbar('Error updating profile', 'error');
    }
  };

  const handleUploadDocument = async () => {
    try {
      if (!uploadFile) {
        showSnackbar('Please select a file to upload', 'error');
        return;
      }

      await studentProfileService.uploadDocument(studentId, uploadFile, uploadDialog.documentType);
      setUploadDialog({ open: false, documentType: '' });
      setUploadFile(null);
      await loadStudentProfile(studentId);
      showSnackbar('Document uploaded successfully', 'success');
    } catch (error) {
      console.error('❌ Error uploading document:', error);
      showSnackbar('Error uploading document', 'error');
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationsService.markAsRead(notificationId);
      await loadNotifications(studentId);
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      admitted: { color: 'success', label: 'Admitted', icon: <CheckCircle /> },
      pending: { color: 'warning', label: 'Pending', icon: <Pending /> },
      rejected: { color: 'error', label: 'Rejected', icon: <Cancel /> }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Chip
        icon={config.icon}
        label={config.label}
        color={config.color}
        size="small"
      />
    );
  };

  // Setup Wizard for new student
  if (initializing) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <School sx={{ fontSize: 64, color: 'primary.main', mb: 3 }} />
            <Typography variant="h4" gutterBottom>
              Welcome to Student Dashboard
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
              Let's set up your student profile to get started with course and job applications
            </Typography>
            <Button 
              variant="contained" 
              size="large" 
              onClick={handleInitializeProfile}
            >
              Create Student Profile
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px" flexDirection="column">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading Student Dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
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

      {/* Apply for Course Dialog */}
      <Dialog open={applyCourseDialog.open} onClose={() => setApplyCourseDialog({ open: false, course: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Apply for Course</DialogTitle>
        <DialogContent>
          {applyCourseDialog.course && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">{applyCourseDialog.course.name}</Typography>
              <Typography color="textSecondary">{applyCourseDialog.course.institutionName}</Typography>
              <Typography variant="body2" sx={{ mt: 2 }}>
                Faculty: {applyCourseDialog.course.faculty}
              </Typography>
              <Typography variant="body2">
                Duration: {applyCourseDialog.course.duration}
              </Typography>
              <Typography variant="body2">
                Fee: ${applyCourseDialog.course.fee}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApplyCourseDialog({ open: false, course: null })}>Cancel</Button>
          <Button onClick={handleApplyForCourse} variant="contained">
            Apply Now
          </Button>
        </DialogActions>
      </Dialog>

      {/* Apply for Job Dialog */}
      <Dialog open={applyJobDialog.open} onClose={() => setApplyJobDialog({ open: false, job: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Apply for Job</DialogTitle>
        <DialogContent>
          {applyJobDialog.job && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6">{applyJobDialog.job.title}</Typography>
              <Typography color="textSecondary">{applyJobDialog.job.companyName}</Typography>
              <Typography variant="body2" sx={{ mt: 2 }}>
                {applyJobDialog.job.description}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApplyJobDialog({ open: false, job: null })}>Cancel</Button>
          <Button onClick={handleApplyForJob} variant="contained">
            Apply Now
          </Button>
        </DialogActions>
      </Dialog>

      {/* Profile Dialog */}
      <Dialog open={profileDialog.open} onClose={() => setProfileDialog({ open: false })} maxWidth="md" fullWidth>
        <DialogTitle>Edit Student Profile</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={profileForm.firstName}
                onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={profileForm.lastName}
                onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
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
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Education Level</InputLabel>
                <Select
                  value={profileForm.educationLevel}
                  label="Education Level"
                  onChange={(e) => setProfileForm({ ...profileForm, educationLevel: e.target.value })}
                >
                  {educationLevels.map((level) => (
                    <MenuItem key={level} value={level}>
                      {level.replace('_', ' ').toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
              <FormControl fullWidth>
                <InputLabel>Skills</InputLabel>
                <Select
                  multiple
                  value={profileForm.skills}
                  label="Skills"
                  onChange={(e) => setProfileForm({ ...profileForm, skills: e.target.value })}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {skillsList.map((skill) => (
                    <MenuItem key={skill} value={skill}>
                      {skill}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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

      {/* Upload Document Dialog */}
      <Dialog open={uploadDialog.open} onClose={() => setUploadDialog({ open: false, documentType: '' })} maxWidth="sm" fullWidth>
        <DialogTitle>Upload {uploadDialog.documentType?.replace('_', ' ')}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => setUploadFile(e.target.files[0])}
              style={{ marginBottom: '16px' }}
            />
            <Typography variant="body2" color="textSecondary">
              Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog({ open: false, documentType: '' })}>Cancel</Button>
          <Button onClick={handleUploadDocument} variant="contained" disabled={!uploadFile}>
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Student Dashboard
          </Typography>
          <Typography variant="h6" color="textSecondary">
            Welcome back, {studentProfile?.firstName || user?.email}
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          startIcon={<Edit />}
          onClick={() => setProfileDialog({ open: true })}
        >
          Edit Profile
        </Button>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <School sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{applications.length}</Typography>
                  <Typography variant="body2">Course Applications</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Work sx={{ fontSize: 40, color: 'secondary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{jobMatches.length}</Typography>
                  <Typography variant="body2">Job Matches</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Description sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">
                    {applications.filter(app => app.status === 'admitted').length}
                  </Typography>
                  <Typography variant="body2">Admissions</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Notifications sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">
                    {notifications.filter(n => !n.read).length}
                  </Typography>
                  <Typography variant="body2">Unread Notifications</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Paper>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="My Applications" icon={<School />} iconPosition="start" />
          <Tab label="Available Courses" icon={<Add />} iconPosition="start" />
          <Tab label="Job Matches" icon={<Work />} iconPosition="start" />
          <Tab label="Notifications" icon={<Notifications />} iconPosition="start" />
          <Tab label="Profile & Documents" icon={<Description />} iconPosition="start" />
        </Tabs>

        {/* My Applications Tab */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            My Course Applications ({applications.length})
          </Typography>
          {applications.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <School sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No Applications Yet
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  Start by applying to available courses.
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={() => setTabValue(1)}
                >
                  Browse Courses
                </Button>
              </CardContent>
            </Card>
          ) : (
            <List>
              {applications.map((app) => (
                <ListItem key={app.id} divider>
                  <ListItemText
                    primary={app.courseName}
                    secondary={`${app.institutionName} • Applied: ${app.applicationDate?.toDate ? app.applicationDate.toDate().toLocaleDateString() : 'N/A'}`}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getStatusChip(app.status)}
                    {app.status === 'pending' && (
                      <Button 
                        size="small" 
                        color="error"
                        onClick={() => handleWithdrawApplication(app.id)}
                      >
                        Withdraw
                      </Button>
                    )}
                  </Box>
                </ListItem>
              ))}
            </List>
          )}

          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            My Job Applications ({jobApplications.length})
          </Typography>
          {jobApplications.length === 0 ? (
            <Card variant="outlined">
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="textSecondary">
                  No job applications yet.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <List>
              {jobApplications.map((app) => (
                <ListItem key={app.id} divider>
                  <ListItemText
                    primary={app.jobTitle}
                    secondary={`${app.companyName} • Applied: ${app.applicationDate?.toDate ? app.applicationDate.toDate().toLocaleDateString() : 'N/A'}`}
                  />
                  {getStatusChip(app.status)}
                </ListItem>
              ))}
            </List>
          )}
        </TabPanel>

        {/* Available Courses Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Available Courses ({availableCourses.length})
          </Typography>
          {availableCourses.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <School sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No Courses Available
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Check back later for new course offerings.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {availableCourses.map((course) => {
                const alreadyApplied = applications.some(app => app.courseId === course.id);
                const institutionApplications = applications.filter(app => 
                  app.institutionId === course.institutionId
                ).length;

                return (
                  <Grid item xs={12} md={6} key={course.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {course.name}
                        </Typography>
                        <Typography color="textSecondary" gutterBottom>
                          {course.institutionName} • {course.faculty}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          Duration: {course.duration}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          Fee: ${course.fee}
                        </Typography>
                        {course.requirements && (
                          <Typography variant="body2" gutterBottom>
                            Requirements: {course.requirements}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                          <Typography variant="body2" color="textSecondary">
                            Applications: {course.currentApplications}/{course.capacity}
                          </Typography>
                          <Button
                            variant={alreadyApplied ? "outlined" : "contained"}
                            disabled={alreadyApplied || institutionApplications >= 2}
                            onClick={() => setApplyCourseDialog({ open: true, course })}
                          >
                            {alreadyApplied ? 'Applied' : institutionApplications >= 2 ? 'Limit Reached' : 'Apply'}
                          </Button>
                        </Box>
                        {institutionApplications >= 2 && (
                          <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                            Maximum 2 applications per institution
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </TabPanel>

        {/* Job Matches Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Recommended Jobs ({jobMatches.length})
          </Typography>
          {jobMatches.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Work sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No Job Matches Yet
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  Complete your profile to get better job recommendations.
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={() => setProfileDialog({ open: true })}
                >
                  Update Profile
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {jobMatches.map((job) => {
                const alreadyApplied = jobApplications.some(app => app.jobId === job.id);
                
                return (
                  <Grid item xs={12} md={6} key={job.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {job.title}
                        </Typography>
                        <Typography color="textSecondary" gutterBottom>
                          {job.companyName}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          {job.location} • {job.type}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <TrendingUp fontSize="small" />
                          <Typography variant="body2">Match Score: {job.matchScore}%</Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={job.matchScore} 
                          sx={{ mb: 2 }}
                          color={job.matchScore > 80 ? 'success' : job.matchScore > 60 ? 'warning' : 'error'}
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button 
                            variant={alreadyApplied ? "outlined" : "contained"} 
                            size="small"
                            disabled={alreadyApplied}
                            onClick={() => setApplyJobDialog({ open: true, job })}
                          >
                            {alreadyApplied ? 'Applied' : 'Apply Now'}
                          </Button>
                          <Button variant="outlined" size="small">
                            View Details
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Notifications ({notifications.length})
          </Typography>
          {notifications.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Notifications sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No Notifications
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  You're all caught up! New notifications will appear here.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <List>
              {notifications.map((notification) => (
                <ListItem 
                  key={notification.id} 
                  divider
                  sx={{ 
                    backgroundColor: notification.read ? 'transparent' : 'action.hover',
                    borderLeft: notification.read ? 'none' : '4px solid',
                    borderLeftColor: 'primary.main'
                  }}
                >
                  <ListItemText
                    primary={notification.message}
                    secondary={notification.createdAt?.toDate ? notification.createdAt.toDate().toLocaleDateString() : 'N/A'}
                    sx={{ 
                      opacity: notification.read ? 0.7 : 1,
                    }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {!notification.read && (
                      <>
                        <Chip label="New" color="primary" size="small" />
                        <Button 
                          size="small" 
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          Mark Read
                        </Button>
                      </>
                    )}
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </TabPanel>

        {/* Profile & Documents Tab */}
        <TabPanel value={tabValue} index={4}>
          <Typography variant="h6" gutterBottom>
            Student Profile
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Personal Information
                  </Typography>
                  <Typography><strong>Name:</strong> {studentProfile?.firstName} {studentProfile?.lastName}</Typography>
                  <Typography><strong>Email:</strong> {user?.email}</Typography>
                  <Typography><strong>Phone:</strong> {studentProfile?.phone || 'Not set'}</Typography>
                  <Typography><strong>Address:</strong> {studentProfile?.address || 'Not set'}</Typography>
                  <Typography><strong>Education Level:</strong> {studentProfile?.educationLevel ? studentProfile.educationLevel.replace('_', ' ').toUpperCase() : 'Not set'}</Typography>
                  <Typography><strong>Skills:</strong> {studentProfile?.skills?.join(', ') || 'None'}</Typography>
                  <Button 
                    variant="outlined" 
                    startIcon={<Edit />}
                    sx={{ mt: 2 }}
                    onClick={() => setProfileDialog({ open: true })}
                  >
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Academic Documents
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Upload your documents to improve your profile and job matching
                  </Typography>
                  
                  <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {documentTypes.map((docType) => (
                      <Box key={docType} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">
                          {docType.replace('_', ' ').toUpperCase()}
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<Upload />}
                          onClick={() => setUploadDialog({ open: true, documentType: docType })}
                        >
                          Upload
                        </Button>
                      </Box>
                    ))}
                  </Box>

                  {studentProfile?.documents && Object.keys(studentProfile.documents).length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Uploaded Documents:
                      </Typography>
                      {Object.entries(studentProfile.documents).map(([docType, docInfo]) => (
                        <Box key={docType} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2">
                            {docType.replace('_', ' ').toUpperCase()}
                          </Typography>
                          <Button 
                            size="small" 
                            href={docInfo.url} 
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View
                          </Button>
                        </Box>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default StudentDashboard;