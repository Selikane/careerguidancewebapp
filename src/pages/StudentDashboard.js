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
  Select,
  alpha
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
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Color scheme matching the home page
const primaryColor = '#000000';
const secondaryColor = '#333333';
const accentColor = '#FF6B35';
const backgroundColor = '#FFFFFF';
const lightGray = '#f5f5f5';
const mediumGray = '#e0e0e0';

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
  const [prospectuses, setProspectuses] = useState([]);
  
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

  useEffect(() => {
    if (studentProfile?.institutionId) {
      const fetchProspectuses = async () => {
        const q = query(collection(db, 'prospectuses'), where('institutionId', '==', studentProfile.institutionId));
        const snapshot = await getDocs(q);
        setProspectuses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      };
      fetchProspectuses();
    }
  }, [studentProfile?.institutionId]);

  // Improved function to load courses with better data processing
  const loadCoursesData = async () => {
    try {
      console.log('Loading courses data...');
      
      // Method 1: Try through coursesService first
      try {
        const coursesData = await coursesService.getAvailableCourses();
        if (coursesData && coursesData.length > 0) {
          console.log('Courses loaded via service:', coursesData.length);
          const processedCourses = coursesData.map(course => ({
            id: course.id,
            name: course.name || course.title || 'Unnamed Course',
            institutionId: course.institutionId || 'unknown',
            institutionName: course.institutionName || 'Unknown Institution',
            faculty: course.faculty || course.department || 'General Studies',
            duration: course.duration || course.courseDuration || 'Not specified',
            fee: course.fee || course.tuition || 0,
            requirements: course.requirements || course.prerequisites || 'None specified',
            description: course.description || course.courseDescription || '',
            currentApplications: course.currentApplications || course.applicationsCount || 0,
            capacity: course.capacity || course.maxCapacity || 100,
            status: course.status || 'active',
            ...course
          }));
          return processedCourses;
        }
      } catch (serviceError) {
        console.log('Courses service failed, trying direct Firestore...', serviceError);
      }

      // Method 2: Direct Firestore query
      const coursesQuery = query(collection(db, 'courses'));
      const coursesSnapshot = await getDocs(coursesQuery);
      
      if (coursesSnapshot.empty) {
        console.log('No courses found in Firestore');
        return [];
      }

      const coursesData = [];
      
      for (const doc of coursesSnapshot.docs) {
        const courseData = doc.data();
        
        // Get institution name if available
        let institutionName = 'Unknown Institution';
        if (courseData.institutionId) {
          try {
            const institutionDoc = await getDoc(doc(db, 'institutions', courseData.institutionId));
            if (institutionDoc.exists()) {
              institutionName = institutionDoc.data().name || institutionDoc.data().institutionName || 'Unknown Institution';
            }
          } catch (error) {
            console.log('Could not fetch institution name for course:', doc.id);
          }
        }

        const processedCourse = {
          id: doc.id,
          name: courseData.name || courseData.title || 'Unnamed Course',
          institutionId: courseData.institutionId || 'unknown',
          institutionName: courseData.institutionName || institutionName,
          faculty: courseData.faculty || courseData.department || 'General Studies',
          duration: courseData.duration || courseData.courseDuration || 'Not specified',
          fee: courseData.fee || courseData.tuition || 0,
          requirements: courseData.requirements || courseData.prerequisites || 'None specified',
          description: courseData.description || courseData.courseDescription || '',
          currentApplications: courseData.currentApplications || courseData.applicationsCount || 0,
          capacity: courseData.capacity || courseData.maxCapacity || 100,
          status: courseData.status || 'active',
          ...courseData
        };

        // Only include active courses
        if (processedCourse.status === 'active' || !processedCourse.status) {
          coursesData.push(processedCourse);
        }
      }

      console.log('Courses processed:', coursesData.length);
      return coursesData;
    } catch (error) {
      console.error('Error loading courses:', error);
      return [];
    }
  };

  // Enhanced fallback function to load data manually
  const loadDataManually = async (uid) => {
    try {
      console.log('Loading data manually for:', uid);
      
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

      // Load courses using improved function
      const manualCourses = await loadCoursesData();
      setAvailableCourses(manualCourses);

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

      console.log('Manual data loaded:', {
        applications: manualApplications.length,
        courses: manualCourses.length,
        jobApps: manualJobApps.length,
        notifications: manualNotifications.length,
        jobMatches: jobMatches.length
      });

      return true;
    } catch (error) {
      console.error('Error loading data manually:', error);
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

      // Set up real-time listeners with enhanced error handling
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

          // Enhanced Courses listener with better data processing
          try {
            coursesUnsubscribe.current = coursesService.getAvailableCourses((snapshot) => {
              if (snapshot.docs) {
                const coursesData = snapshot.docs.map(doc => {
                  const courseData = doc.data();
                  return {
                    id: doc.id,
                    name: courseData.name || courseData.title || 'Unnamed Course',
                    institutionId: courseData.institutionId || 'unknown',
                    institutionName: courseData.institutionName || 'Unknown Institution',
                    faculty: courseData.faculty || courseData.department || 'General Studies',
                    duration: courseData.duration || courseData.courseDuration || 'Not specified',
                    fee: courseData.fee || courseData.tuition || 0,
                    requirements: courseData.requirements || courseData.prerequisites || 'None',
                    description: courseData.description || '',
                    currentApplications: courseData.currentApplications || courseData.applicationsCount || 0,
                    capacity: courseData.capacity || courseData.maxCapacity || 100,
                    status: courseData.status || 'active',
                    ...courseData
                  };
                }).filter(course => course.status === 'active' || !course.status);
                
                setAvailableCourses(coursesData);
                console.log('Courses listener loaded:', coursesData.length, 'courses');
              }
            });
          } catch (coursesError) {
            console.error('Courses listener failed, loading manually:', coursesError);
            // Load courses manually if listener fails
            const manualCourses = await loadCoursesData();
            setAvailableCourses(manualCourses);
          }

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

          return true;
        } catch (error) {
          console.error('Error setting up listeners:', error);
          return false;
        }
      };

      const listenersSetup = await setupListeners();

      // If listeners fail or no courses loaded, try manual loading
      if (!listenersSetup || availableCourses.length === 0) {
        console.log('Listeners failed or no courses, trying manual load...');
        await loadDataManually(uid);
      }

      setDataLoaded(true);
      setLoading(false);

    } catch (error) {
      console.error('Error initializing student data:', error);
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
        // Force reload all data, especially courses
        await loadDataManually(studentId);
        showSnackbar('Data refreshed successfully', 'success');
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      showSnackbar('Error refreshing data', 'error');
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
      admitted: { color: 'success', label: 'Admitted' },
      pending: { color: 'warning', label: 'Pending' },
      rejected: { color: 'error', label: 'Rejected' },
      withdrawn: { color: 'default', label: 'Withdrawn' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Chip
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
        <Card sx={{ borderRadius: '12px', border: `1px solid ${mediumGray}` }}>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h4" gutterBottom sx={{ color: primaryColor, fontWeight: '300' }}>
              Welcome to Student Dashboard
            </Typography>
            <Typography variant="body1" sx={{ color: secondaryColor, mb: 4, fontWeight: '300' }}>
              Let's set up your student profile to get started with course and job applications
            </Typography>
            <Button 
              variant="contained" 
              size="large" 
              onClick={handleInitializeProfile}
              sx={{
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
        <CircularProgress sx={{ color: accentColor }} size={60} />
        <Typography variant="h6" sx={{ mt: 2, color: secondaryColor, fontWeight: '300' }}>
          Loading Student Dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, px: { xs: 1, sm: 2, md: 4 } }}>
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

      {/* Apply for Course Dialog */}
      <Dialog 
        open={applyCourseDialog.open} 
        onClose={() => setApplyCourseDialog({ open: false, course: null })} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ fontWeight: '600', color: primaryColor }}>
          Apply for Course
        </DialogTitle>
        <DialogContent>
          {applyCourseDialog.course && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ color: primaryColor }}>{applyCourseDialog.course.name}</Typography>
              <Typography sx={{ color: secondaryColor }}>{applyCourseDialog.course.institutionName}</Typography>
              <Typography variant="body2" sx={{ mt: 2, color: secondaryColor }}>
                Faculty: {applyCourseDialog.course.faculty}
              </Typography>
              <Typography variant="body2" sx={{ color: secondaryColor }}>
                Duration: {applyCourseDialog.course.duration}
              </Typography>
              <Typography variant="body2" sx={{ color: secondaryColor }}>
                Fee: ${applyCourseDialog.course.fee}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setApplyCourseDialog({ open: false, course: null })}
            sx={{ color: secondaryColor }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleApplyForCourse} 
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
            Apply Now
          </Button>
        </DialogActions>
      </Dialog>

      {/* Apply for Job Dialog */}
      <Dialog 
        open={applyJobDialog.open} 
        onClose={() => setApplyJobDialog({ open: false, job: null })} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ fontWeight: '600', color: primaryColor }}>
          Apply for Job
        </DialogTitle>
        <DialogContent>
          {applyJobDialog.job && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ color: primaryColor }}>{applyJobDialog.job.title}</Typography>
              <Typography sx={{ color: secondaryColor }}>{applyJobDialog.job.companyName}</Typography>
              <Typography variant="body2" sx={{ mt: 2, color: secondaryColor }}>
                {applyJobDialog.job.description}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setApplyJobDialog({ open: false, job: null })}
            sx={{ color: secondaryColor }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleApplyForJob} 
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
            Apply Now
          </Button>
        </DialogActions>
      </Dialog>

      {/* Profile Dialog */}
      <Dialog 
        open={profileDialog.open} 
        onClose={() => setProfileDialog({ open: false })} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ fontWeight: '600', color: primaryColor }}>
          Edit Student Profile
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={profileForm.firstName}
                onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
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
                label="Last Name"
                value={profileForm.lastName}
                onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
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
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Education Level</InputLabel>
                <Select
                  value={profileForm.educationLevel}
                  label="Education Level"
                  onChange={(e) => setProfileForm({ ...profileForm, educationLevel: e.target.value })}
                  sx={{
                    borderRadius: '8px'
                  }}
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px'
                  }
                }}
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
                  sx={{
                    borderRadius: '8px'
                  }}
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

      {/* Upload Document Dialog */}
      <Dialog 
        open={uploadDialog.open} 
        onClose={() => setUploadDialog({ open: false, documentType: '' })} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ fontWeight: '600', color: primaryColor }}>
          Upload {uploadDialog.documentType?.replace('_', ' ')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => setUploadFile(e.target.files[0])}
              style={{ marginBottom: '16px' }}
            />
            <Typography variant="body2" sx={{ color: secondaryColor }}>
              Supported formats: PDF, DOC, DOCX, JPG, JPEG, PNG
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setUploadDialog({ open: false, documentType: '' })}
            sx={{ color: secondaryColor }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUploadDocument} 
            variant="contained" 
            disabled={!uploadFile}
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
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ color: primaryColor, fontWeight: '300' }}>
            Student Dashboard
          </Typography>
          <Typography variant="h6" sx={{ color: secondaryColor, fontWeight: '300' }}>
            Welcome back, {studentProfile?.firstName || user?.email}
          </Typography>
          {!dataLoaded && (
            <Typography variant="caption" sx={{ color: accentColor }}>
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
            sx={{
              borderColor: accentColor,
              color: accentColor,
              borderRadius: '25px',
              '&:hover': {
                borderColor: '#E55A2B',
                backgroundColor: alpha(accentColor, 0.1)
              }
            }}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => setProfileDialog({ open: true })}
            sx={{
              borderColor: primaryColor,
              color: primaryColor,
              borderRadius: '25px',
              '&:hover': {
                borderColor: accentColor,
                color: accentColor,
                backgroundColor: alpha(accentColor, 0.1)
              }
            }}
          >
            Edit Profile
          </Button>
        </Box>
      </Box>

      {/* Main Content Tabs */}
      <Paper sx={{ borderRadius: '12px', border: `1px solid ${mediumGray}` }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              color: secondaryColor,
              '&.Mui-selected': {
                color: accentColor,
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: accentColor,
            }
          }}
        >
          <Tab label="My Applications" />
          <Tab label="Available Courses" />
          <Tab label="Job Matches" />
          <Tab label="Notifications" />
          <Tab label="Profile & Documents" />
        </Tabs>

        {/* My Applications Tab */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom sx={{ color: primaryColor, fontWeight: '600' }}>
            My Course Applications ({applications.length})
          </Typography>
          
          {applications.length === 0 ? (
            <Card sx={{ border: `1px solid ${mediumGray}`, borderRadius: '12px' }}>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h6" gutterBottom sx={{ color: primaryColor }}>
                  No Applications Yet
                </Typography>
                <Typography variant="body2" sx={{ color: secondaryColor, mb: 3, fontWeight: '300' }}>
                  Start by applying to available courses.
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={() => setTabValue(1)}
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
                  Browse Courses
                </Button>
              </CardContent>
            </Card>
          ) : (
            <List>
              {applications.map((app) => (
                <ListItem key={app.id} divider sx={{ py: 2 }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="h6" component="div" sx={{ color: primaryColor }}>
                          {app.courseName}
                        </Typography>
                        <Typography variant="body2" sx={{ color: secondaryColor }}>
                          ${app.fee || 0}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" component="div" sx={{ color: secondaryColor }}>
                          <strong>Institution:</strong> {app.institutionName}
                        </Typography>
                        <Typography variant="body2" component="div" sx={{ color: secondaryColor }}>
                          <strong>Faculty:</strong> {app.faculty}
                        </Typography>
                        <Typography variant="body2" component="div" sx={{ color: secondaryColor }}>
                          <strong>Applied:</strong> {formatFirestoreDate(app.applicationDate)}
                        </Typography>
                        <Typography variant="body2" component="div" sx={{ color: secondaryColor }}>
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
                        sx={{ 
                          color: accentColor,
                          '&:hover': {
                            backgroundColor: alpha(accentColor, 0.1)
                          }
                        }}
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

          <Typography variant="h6" gutterBottom sx={{ mt: 4, color: primaryColor, fontWeight: '600' }}>
            My Job Applications ({jobApplications.length})
          </Typography>
          {jobApplications.length === 0 ? (
            <Card variant="outlined" sx={{ borderRadius: '12px' }}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" sx={{ color: secondaryColor }}>
                  No job applications yet.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <List>
              {jobApplications.map((app) => (
                <ListItem key={app.id} divider sx={{ py: 2 }}>
                  <ListItemText
                    primary={<Typography sx={{ color: primaryColor }}>{app.jobTitle}</Typography>}
                    secondary={<Typography sx={{ color: secondaryColor }}>{`${app.companyName} • Applied: ${formatFirestoreDate(app.applicationDate)}`}</Typography>}
                  />
                  {getStatusChip(app.status)}
                </ListItem>
              ))}
            </List>
          )}
        </TabPanel>

        {/* Available Courses Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom sx={{ color: primaryColor, fontWeight: '600', mb: 3 }}>
            Available Courses ({availableCourses.length})
          </Typography>
          
          {availableCourses.length === 0 ? (
            <Card sx={{ border: `1px solid ${mediumGray}`, borderRadius: '12px' }}>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h6" gutterBottom sx={{ color: primaryColor }}>
                  No Courses Available
                </Typography>
                <Typography variant="body2" sx={{ color: secondaryColor, mb: 3, fontWeight: '300' }}>
                  Check back later for new course offerings or refresh to load courses.
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={handleRefreshData}
                  disabled={refreshing}
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
                  {refreshing ? 'Loading...' : 'Refresh Courses'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {availableCourses
                .filter(course => course.name && course.institutionName)
                .map((course) => {
                  const alreadyApplied = applications.some(app => app.courseId === course.id);
                  const institutionApplications = applications.filter(app => 
                    app.institutionId === course.institutionId
                  ).length;

                  return (
                    <Grid item xs={12} sm={6} md={4} key={course.id}>
                      <Card 
                        sx={{ 
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          borderRadius: '12px',
                          border: `1px solid ${mediumGray}`,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: `0 8px 25px ${alpha(primaryColor, 0.1)}`,
                            borderColor: accentColor
                          }
                        }}
                      >
                        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="h6" gutterBottom sx={{ color: primaryColor, minHeight: '64px' }}>
                            {course.name}
                          </Typography>
                          <Typography sx={{ color: secondaryColor, mb: 1, fontWeight: '300' }}>
                            {course.institutionName}
                          </Typography>
                          <Typography variant="body2" sx={{ color: secondaryColor, mb: 0.5 }}>
                            <strong>Faculty:</strong> {course.faculty}
                          </Typography>
                          <Typography variant="body2" sx={{ color: secondaryColor, mb: 0.5 }}>
                            <strong>Duration:</strong> {course.duration}
                          </Typography>
                          <Typography variant="body2" sx={{ color: secondaryColor, mb: 1 }}>
                            <strong>Fee:</strong> ${course.fee}
                          </Typography>
                          
                          {course.requirements && course.requirements !== 'None specified' && (
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: secondaryColor, 
                                mb: 2,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}
                            >
                              <strong>Requirements:</strong> {course.requirements}
                            </Typography>
                          )}
                          
                          <Box sx={{ mt: 'auto' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="body2" sx={{ color: secondaryColor }}>
                                Applications: {course.currentApplications}/{course.capacity}
                              </Typography>
                            </Box>
                            
                            <Button
                              fullWidth
                              variant={alreadyApplied ? "outlined" : "contained"}
                              disabled={alreadyApplied || institutionApplications >= 2}
                              onClick={() => setApplyCourseDialog({ open: true, course })}
                              sx={{
                                backgroundColor: alreadyApplied ? mediumGray : accentColor,
                                color: alreadyApplied ? secondaryColor : 'white',
                                borderRadius: '25px',
                                py: 1,
                                '&:hover': {
                                  backgroundColor: alreadyApplied ? mediumGray : '#E55A2B'
                                }
                              }}
                            >
                              {alreadyApplied ? 'Applied' : institutionApplications >= 2 ? 'Limit Reached' : 'Apply Now'}
                            </Button>
                            
                            {institutionApplications >= 2 && (
                              <Typography variant="caption" sx={{ color: accentColor, mt: 1, display: 'block', textAlign: 'center' }}>
                                Maximum 2 applications per institution
                              </Typography>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
            </Grid>
          )}

          <Typography variant="h6" gutterBottom sx={{ mt: 4, color: primaryColor, fontWeight: '600' }}>
            Institution Prospectuses ({prospectuses.length})
          </Typography>
          {prospectuses.length === 0 ? (
            <Card sx={{ border: `1px solid ${mediumGray}`, borderRadius: '12px', mt: 2 }}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" sx={{ color: secondaryColor }}>
                  No prospectus available for your institution.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <List sx={{ mt: 2 }}>
              {prospectuses.map((prospectus) => (
                <ListItem key={prospectus.id} divider>
                  <ListItemText
                    primary={<Typography sx={{ color: primaryColor }}>{prospectus.title} ({prospectus.year})</Typography>}
                    secondary={<Typography sx={{ color: secondaryColor }}>{prospectus.description}</Typography>}
                  />
                  <Button
                    size="small"
                    href={prospectus.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: accentColor }}
                  >
                    View Document
                  </Button>
                </ListItem>
              ))}
            </List>
          )}
        </TabPanel>

        {/* Job Matches Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom sx={{ color: primaryColor, fontWeight: '600' }}>
            Recommended Jobs ({jobMatches.length})
          </Typography>
          {jobMatches.length === 0 ? (
            <Card sx={{ border: `1px solid ${mediumGray}`, borderRadius: '12px' }}>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h6" gutterBottom sx={{ color: primaryColor }}>
                  No Job Matches Yet
                </Typography>
                <Typography variant="body2" sx={{ color: secondaryColor, mb: 3, fontWeight: '300' }}>
                  Complete your profile to get better job recommendations.
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={() => setProfileDialog({ open: true })}
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
                  Update Profile
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {jobMatches.map((job) => {
                const alreadyApplied = jobApplications.some(app => app.jobId === job.id);
                
                return (
                  <Grid item xs={12} md={6} key={job.id}>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        borderRadius: '12px',
                        border: `1px solid ${mediumGray}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: `0 8px 25px ${alpha(primaryColor, 0.1)}`,
                          borderColor: accentColor
                        }
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ color: primaryColor }}>
                          {job.title}
                        </Typography>
                        <Typography sx={{ color: secondaryColor, mb: 1, fontWeight: '300' }}>
                          {job.companyName}
                        </Typography>
                        <Typography variant="body2" gutterBottom sx={{ color: secondaryColor }}>
                          {job.location} • {job.type}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <Typography variant="body2" sx={{ color: secondaryColor }}>Match Score: {job.matchScore}%</Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={job.matchScore} 
                          sx={{ 
                            mb: 2,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: lightGray,
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: job.matchScore > 80 ? accentColor : job.matchScore > 60 ? '#FFA726' : '#EF5350'
                            }
                          }}
                        />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button 
                            variant={alreadyApplied ? "outlined" : "contained"} 
                            size="small"
                            disabled={alreadyApplied}
                            onClick={() => setApplyJobDialog({ open: true, job })}
                            sx={{
                              backgroundColor: alreadyApplied ? 'transparent' : accentColor,
                              color: alreadyApplied ? accentColor : 'white',
                              borderColor: accentColor,
                              borderRadius: '20px',
                              '&:hover': {
                                backgroundColor: alreadyApplied ? alpha(accentColor, 0.1) : '#E55A2B'
                              }
                            }}
                          >
                            {alreadyApplied ? 'Applied' : 'Apply Now'}
                          </Button>
                          <Button 
                            variant="outlined" 
                            size="small"
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
          <Typography variant="h6" gutterBottom sx={{ color: primaryColor, fontWeight: '600' }}>
            Notifications ({notifications.length})
          </Typography>
          {notifications.length === 0 ? (
            <Card sx={{ border: `1px solid ${mediumGray}`, borderRadius: '12px' }}>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h6" gutterBottom sx={{ color: primaryColor }}>
                  No Notifications
                </Typography>
                <Typography variant="body2" sx={{ color: secondaryColor, fontWeight: '300' }}>
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
                    py: 2,
                    backgroundColor: notification.read ? 'transparent' : alpha(accentColor, 0.05),
                    borderLeft: notification.read ? 'none' : '4px solid',
                    borderLeftColor: accentColor,
                    borderRadius: '8px',
                    mb: 1
                  }}
                >
                  <ListItemText
                    primary={<Typography sx={{ color: primaryColor }}>{notification.message}</Typography>}
                    secondary={<Typography sx={{ color: secondaryColor }}>{formatFirestoreDate(notification.createdAt)}</Typography>}
                    sx={{ 
                      opacity: notification.read ? 0.7 : 1,
                    }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {!notification.read && (
                      <>
                        <Chip 
                          label="New" 
                          size="small" 
                          sx={{ 
                            backgroundColor: accentColor,
                            color: 'white',
                            fontWeight: '600'
                          }}
                        />
                        <Button 
                          size="small" 
                          onClick={() => handleMarkAsRead(notification.id)}
                          sx={{
                            color: accentColor,
                            '&:hover': {
                              backgroundColor: alpha(accentColor, 0.1)
                            }
                          }}
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
          <Typography variant="h6" gutterBottom sx={{ color: primaryColor, fontWeight: '600' }}>
            Student Profile
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ border: `1px solid ${mediumGray}`, borderRadius: '12px' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: primaryColor }}>
                    Personal Information
                  </Typography>
                  <Typography sx={{ color: secondaryColor, mb: 1 }}><strong>Name:</strong> {studentProfile?.firstName} {studentProfile?.lastName}</Typography>
                  <Typography sx={{ color: secondaryColor, mb: 1 }}><strong>Email:</strong> {user?.email}</Typography>
                  <Typography sx={{ color: secondaryColor, mb: 1 }}><strong>Phone:</strong> {studentProfile?.phone || 'Not set'}</Typography>
                  <Typography sx={{ color: secondaryColor, mb: 1 }}><strong>Address:</strong> {studentProfile?.address || 'Not set'}</Typography>
                  <Typography sx={{ color: secondaryColor, mb: 1 }}><strong>Education Level:</strong> {studentProfile?.educationLevel ? studentProfile.educationLevel.replace('_', ' ').toUpperCase() : 'Not set'}</Typography>
                  <Typography sx={{ color: secondaryColor, mb: 2 }}><strong>Skills:</strong> {studentProfile?.skills?.join(', ') || 'None'}</Typography>
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
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ border: `1px solid ${mediumGray}`, borderRadius: '12px' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: primaryColor }}>
                    Academic Documents
                  </Typography>
                  <Typography variant="body2" sx={{ color: secondaryColor, mb: 2, fontWeight: '300' }}>
                    Upload your documents to improve your profile and job matching
                  </Typography>
                  
                  <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {documentTypes.map((docType) => (
                      <Box key={docType} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                        <Typography variant="body2" sx={{ color: secondaryColor }}>
                          {docType.replace('_', ' ').toUpperCase()}
                        </Typography>
                        <Button
                          size="small"
                          onClick={() => setUploadDialog({ open: true, documentType: docType })}
                          sx={{
                            color: accentColor,
                            '&:hover': {
                              backgroundColor: alpha(accentColor, 0.1)
                            }
                          }}
                        >
                          Upload
                        </Button>
                      </Box>
                    ))}
                  </Box>

                  {studentProfile?.documents && Object.keys(studentProfile.documents).length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ color: primaryColor }}>
                        Uploaded Documents:
                      </Typography>
                      {Object.entries(studentProfile.documents).map(([docType, docInfo]) => (
                        <Box key={docType} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, py: 0.5 }}>
                          <Typography variant="body2" sx={{ color: secondaryColor }}>
                            {docType.replace('_', ' ').toUpperCase()}
                          </Typography>
                          <Button 
                            size="small" 
                            href={docInfo.url} 
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              color: accentColor,
                              '&:hover': {
                                backgroundColor: alpha(accentColor, 0.1)
                              }
                            }}
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