// src/pages/StudentDashboard.js
import React, { useState, useEffect, useContext, useRef } from 'react';
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
  Edit,
  Refresh
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
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

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
  const [refreshing, setRefreshing] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  
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

  // Refs for unsubscribe functions
  const applicationsUnsubscribe = useRef(null);
  const jobApplicationsUnsubscribe = useRef(null);
  const coursesUnsubscribe = useRef(null);
  const notificationsUnsubscribe = useRef(null);
  const profileUnsubscribe = useRef(null);

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

    // Cleanup function
    return () => {
      if (applicationsUnsubscribe.current) {
        applicationsUnsubscribe.current();
      }
      if (jobApplicationsUnsubscribe.current) {
        jobApplicationsUnsubscribe.current();
      }
      if (coursesUnsubscribe.current) {
        coursesUnsubscribe.current();
      }
      if (notificationsUnsubscribe.current) {
        notificationsUnsubscribe.current();
      }
      if (profileUnsubscribe.current) {
        profileUnsubscribe.current();
      }
    };
  }, [user]);

  // Setup course listener separately
  const setupCourseListener = () => {
    try {
      coursesUnsubscribe.current = coursesService.getAvailableCourses((snapshot) => {
        if (snapshot.docs) {
          const coursesData = snapshot.docs.map(doc => {
            const courseData = doc.data();
            return {
              id: doc.id,
              name: courseData.name || 'Unnamed Course',
              institutionId: courseData.institutionId || 'unknown',
              institutionName: courseData.institutionName || courseData.institutionId || 'Unknown Institution',
              faculty: courseData.faculty || 'General Studies',
              duration: courseData.duration || 'Not specified',
              fee: courseData.fee || 0,
              requirements: courseData.requirements || 'None',
              currentApplications: courseData.currentApplications || 0,
              capacity: courseData.capacity || 100,
              ...courseData
            };
          });
          console.log('📚 Courses listener updated:', coursesData.length, 'courses');
          setAvailableCourses(coursesData);
        }
      });
      return true;
    } catch (error) {
      console.error('Error setting up courses listener:', error);
      return false;
    }
  };

  // Fallback function to load data manually if real-time listeners fail
  const loadDataManually = async (uid) => {
    try {
      console.log('🔄 Loading data manually for:', uid);
      
      // Load applications manually
      const applicationsQuery = query(
        collection(db, 'courseApplications'),
        where('studentId', '==', uid)
      );
      const applicationsSnapshot = await getDocs(applicationsQuery);
      const manualApplications = applicationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setApplications(manualApplications);

      // Load courses manually
      const coursesQuery = query(collection(db, 'courses'));
      const coursesSnapshot = await getDocs(coursesQuery);
      const manualCourses = coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('📚 Manual courses loaded:', manualCourses.length);
      setAvailableCourses(manualCourses);

      // Load available jobs manually
      const jobsQuery = query(collection(db, 'jobs'));
      const jobsSnapshot = await getDocs(jobsQuery);
      const manualJobs = jobsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAvailableJobs(manualJobs);

      // Load job applications manually
      const jobAppsQuery = query(
        collection(db, 'jobApplications'),
        where('studentId', '==', uid)
      );
      const jobAppsSnapshot = await getDocs(jobAppsQuery);
      const manualJobApps = jobAppsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setJobApplications(manualJobApps);

      // Load notifications manually
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('studentId', '==', uid)
      );
      const notificationsSnapshot = await getDocs(notificationsQuery);
      const manualNotifications = notificationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(manualNotifications);

      // Load job matches
      try {
        const matches = await jobsService.getJobMatches(uid);
        setJobMatches(matches);
      } catch (error) {
        console.error('Error loading job matches:', error);
        setJobMatches([]);
      }

      console.log('✅ Manual data loaded:', {
        applications: manualApplications.length,
        courses: manualCourses.length,
        jobs: manualJobs.length,
        jobApps: manualJobApps.length,
        notifications: manualNotifications.length
      });

      return true;
    } catch (error) {
      console.error('❌ Error loading data manually:', error);
      return false;
    }
  };

  const initializeData = async (uid) => {
    setLoading(true);
    setDataLoaded(false);

    try {
      // First try to load student profile
      const profileLoaded = await new Promise((resolve) => {
        profileUnsubscribe.current = studentProfileService.getStudentProfile(uid, (snapshot) => {
          if (snapshot.exists()) {
            const data = { id: snapshot.id, ...snapshot.data() };
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
            resolve(true);
          } else {
            setInitializing(true);
            resolve(false);
          }
        });
      });

      // Set up real-time listeners with error handling
      const setupListeners = async () => {
        try {
          // Applications listener
          applicationsUnsubscribe.current = studentApplicationsService.getStudentApplications(uid, (snapshot) => {
            if (snapshot.docs) {
              const applicationsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
              setApplications(applicationsData);
            }
          });

          // Courses listener
          const coursesListenerSuccess = setupCourseListener();

          // Job applications listener
          jobApplicationsUnsubscribe.current = jobApplicationsService.getStudentJobApplications(uid, (snapshot) => {
            if (snapshot.docs) {
              const jobAppsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
              setJobApplications(jobAppsData);
            }
          });

          // Notifications listener
          notificationsUnsubscribe.current = notificationsService.getStudentNotifications(uid, (snapshot) => {
            if (snapshot.docs) {
              const notificationsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
              setNotifications(notificationsData);
            }
          });

          // Load job matches (not real-time)
          try {
            const matches = await jobsService.getJobMatches(uid);
            setJobMatches(matches);
          } catch (error) {
            console.error('Error loading job matches:', error);
            setJobMatches([]);
          }

          return coursesListenerSuccess;
        } catch (error) {
          console.error('Error setting up listeners:', error);
          return false;
        }
      };

      const listenersSetup = await setupListeners();

      // If listeners fail, try manual loading
      if (!listenersSetup) {
        console.log('🔄 Listeners failed, trying manual load...');
        await loadDataManually(uid);
      }

      setDataLoaded(true);
      setLoading(false);

    } catch (error) {
      console.error('❌ Error initializing student data:', error);
      // Try manual loading as last resort
      await loadDataManually(uid);
      setDataLoaded(true);
      setLoading(false);
    }
  };

  const handleRefreshData = async () => {
    setRefreshing(true);
    
    try {
      if (studentId) {
        console.log('🔄 Starting manual refresh...');
        
        // Clean up existing course listener first to avoid conflicts
        if (coursesUnsubscribe.current) {
          coursesUnsubscribe.current();
          coursesUnsubscribe.current = null;
        }
        
        // Force reload all data
        const success = await loadDataManually(studentId);
        
        // Re-establish course listener after manual load
        setTimeout(() => {
          setupCourseListener();
        }, 500);
        
        if (success) {
          showSnackbar('Data refreshed successfully', 'success');
          console.log('✅ Refresh completed successfully');
        } else {
          showSnackbar('Partial data refresh completed', 'warning');
        }
      } else {
        showSnackbar('No student ID found', 'error');
      }
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
      showSnackbar('Error refreshing data: ' + error.message, 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleInitializeProfile = async () => {
    try {
      setInitializing(true);
      await demoStudentService.createDemoStudentProfile(studentId, user.email);
      await initializeData(studentId);
      showSnackbar('Student profile created successfully!', 'success');
    } catch (error) {
      console.error('Error creating student profile:', error);
      setInitializing(false);
      showSnackbar('Error creating student profile', 'error');
    }
  };

  const handleApplyForCourse = async () => {
    try {
      const { course } = applyCourseDialog;

      const applicationData = {
        studentId: studentId,
        studentName: `${studentProfile?.firstName} ${studentProfile?.lastName}` || user?.email,
        studentEmail: user.email,
        courseId: course.id,
        courseName: course.name,
        institutionId: course.institutionId,
        institutionName: course.institutionName || 'Unknown Institution',
        applicationDate: new Date(),
        status: 'pending',
        faculty: course.faculty || 'General',
        duration: course.duration || 'Not specified',
        fee: course.fee || 0
      };

      await studentApplicationsService.applyForCourse(applicationData);
      setApplyCourseDialog({ open: false, course: null });
      showSnackbar('Application submitted successfully!', 'success');
      
      // Refresh applications to show the new one
      setTimeout(() => {
        loadDataManually(studentId);
      }, 1000);
      
    } catch (error) {
      console.error('Error applying for course:', error);
      showSnackbar(error.message || 'Error applying for course', 'error');
    }
  };

  const handleApplyForJob = async () => {
    try {
      const { job } = applyJobDialog;
      
      const applicationData = {
        studentId: studentId,
        studentName: `${studentProfile?.firstName} ${studentProfile?.lastName}` || user?.email,
        studentEmail: user.email,
        jobId: job.id,
        jobTitle: job.title,
        companyId: job.companyId,
        companyName: job.companyName || 'Unknown Company',
        applicationDate: new Date(),
        status: 'pending'
      };

      await jobApplicationsService.applyForJob(applicationData);
      setApplyJobDialog({ open: false, job: null });
      showSnackbar('Job application submitted successfully!', 'success');
      
    } catch (error) {
      console.error('Error applying for job:', error);
      showSnackbar(error.message || 'Error applying for job', 'error');
    }
  };

  const handleWithdrawApplication = async (applicationId) => {
    try {
      await studentApplicationsService.withdrawApplication(applicationId);
      showSnackbar('Application withdrawn successfully', 'success');
      // Refresh applications
      setTimeout(() => {
        loadDataManually(studentId);
      }, 500);
    } catch (error) {
      console.error('Error withdrawing application:', error);
      showSnackbar('Error withdrawing application', 'error');
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await studentProfileService.updateStudentProfile(studentId, profileForm);
      setProfileDialog({ open: false });
      // Reload profile
      const profileQuery = query(
        collection(db, 'students'),
        where('__name__', '==', studentId)
      );
      const profileSnapshot = await getDocs(profileQuery);
      if (!profileSnapshot.empty) {
        const profileData = profileSnapshot.docs[0].data();
        setStudentProfile(profileData);
      }
      showSnackbar('Profile updated successfully', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
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
      showSnackbar('Document uploaded successfully', 'success');
    } catch (error) {
      console.error('Error uploading document:', error);
      showSnackbar('Error uploading document', 'error');
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationsService.markAsRead(notificationId);
      // Refresh notifications
      setTimeout(() => {
        loadDataManually(studentId);
      }, 500);
    } catch (error) {
      console.error('Error marking notification as read:', error);
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
      rejected: { color: 'error', label: 'Rejected', icon: <Cancel /> },
      withdrawn: { color: 'default', label: 'Withdrawn', icon: <Cancel /> }
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

  // Helper function to format Firestore timestamps
  const formatFirestoreDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    try {
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleDateString();
      }
      else if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleDateString();
      }
      else if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString();
      }
      else if (typeof timestamp === 'string') {
        return new Date(timestamp).toLocaleDateString();
      }
      else {
        return 'Invalid Date';
      }
    } catch (error) {
      return 'Date Error';
    }
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
          {!dataLoaded && (
            <Typography variant="caption" color="warning.main">
              Data loading... If this persists, click Refresh
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="outlined" 
            startIcon={<Refresh />}
            onClick={handleRefreshData}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<Edit />}
            onClick={() => setProfileDialog({ open: true })}
          >
            Edit Profile
          </Button>
        </Box>
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
                  <Typography variant="h4">{jobApplications.length}</Typography>
                  <Typography variant="body2">Job Applications</Typography>
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
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="h6" component="div">
                          {app.courseName}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          ${app.fee || 0}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" component="div">
                          <strong>Institution:</strong> {app.institutionName}
                        </Typography>
                        <Typography variant="body2" component="div">
                          <strong>Faculty:</strong> {app.faculty}
                        </Typography>
                        <Typography variant="body2" component="div">
                          <strong>Applied:</strong> {formatFirestoreDate(app.applicationDate)}
                        </Typography>
                        <Typography variant="body2" component="div">
                          <strong>Duration:</strong> {app.duration}
                        </Typography>
                      </Box>
                    }
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 140 }}>
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
                    secondary={`${app.companyName} • Applied: ${formatFirestoreDate(app.applicationDate)}`}
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
                <Button 
                  variant="contained" 
                  sx={{ mt: 2 }}
                  onClick={handleRefreshData}
                >
                  Refresh Courses
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {availableCourses
                .filter(course => course.name && course.institutionName)
                .map((course) => {
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
                    secondary={formatFirestoreDate(notification.createdAt)}
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