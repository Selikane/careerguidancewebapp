import React, { useState, useEffect, useContext } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar
} from '@mui/material';
import { Search, School, LocationOn, People, Login } from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import { collection, getDocs, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');
  const [page, setPage] = useState(1);
  const [institutions, setInstitutions] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);

  const coursesPerPage = 6;
  const { user, userType } = useContext(AuthContext);

  // Load courses and institutions from Firebase
  useEffect(() => {
    loadCourses();
    loadInstitutions();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const coursesSnapshot = await getDocs(collection(db, 'courses'));
      const coursesData = coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort courses by creation date (newest first)
      const sortedCourses = coursesData.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB - dateA;
      });
      
      setCourses(sortedCourses);
      setFilteredCourses(sortedCourses);
      
      // Extract unique faculties
      const uniqueFaculties = [...new Set(coursesData.map(course => course.faculty).filter(Boolean))];
      setFaculties(uniqueFaculties);
      
    } catch (error) {
      console.error('Error loading courses:', error);
      showSnackbar('Error loading courses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadInstitutions = async () => {
    try {
      const institutionsSnapshot = await getDocs(collection(db, 'institutions'));
      const institutionsData = institutionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInstitutions(institutionsData);
    } catch (error) {
      console.error('Error loading institutions:', error);
    }
  };

  useEffect(() => {
    let filtered = courses.filter(course =>
      course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.institutionName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.faculty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (institutionFilter) {
      filtered = filtered.filter(course => course.institutionId === institutionFilter);
    }

    if (facultyFilter) {
      filtered = filtered.filter(course => course.faculty === facultyFilter);
    }

    setFilteredCourses(filtered);
    setPage(1);
  }, [searchTerm, institutionFilter, facultyFilter, courses]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleApply = async (course) => {
    // Check if user is logged in
    if (!user) {
      setSelectedCourse(course);
      setLoginDialogOpen(true);
      return;
    }

    // Check if user is a student
    if (userType !== 'student') {
      showSnackbar('Only students can apply for courses', 'error');
      return;
    }

    try {
      // Check if already applied
      const applicationsQuery = query(
        collection(db, 'courseApplications'),
        where('studentId', '==', user.uid),
        where('courseId', '==', course.id)
      );
      const applicationsSnapshot = await getDocs(applicationsQuery);
      
      if (!applicationsSnapshot.empty) {
        showSnackbar('You have already applied for this course', 'warning');
        return;
      }

      // Check if course is full
      if (course.currentApplications >= course.capacity) {
        showSnackbar('This course is already full', 'error');
        return;
      }

      // Submit application
      await addDoc(collection(db, 'courseApplications'), {
        courseId: course.id,
        courseName: course.name,
        institutionId: course.institutionId,
        institutionName: course.institutionName,
        studentId: user.uid,
        studentEmail: user.email,
        studentName: user.displayName || user.email,
        status: 'pending',
        appliedAt: serverTimestamp(),
        faculty: course.faculty,
        duration: course.duration
      });

      // Update course application count
      // Note: In a real app, you might want to use a transaction or cloud function for this
      showSnackbar('Application submitted successfully!', 'success');
      
      // Reload courses to update application counts
      loadCourses();
      
    } catch (error) {
      console.error('Error applying for course:', error);
      showSnackbar('Error submitting application', 'error');
    }
  };

  const getInstitutionName = (institutionId) => {
    const institution = institutions.find(inst => inst.id === institutionId);
    return institution?.name || 'Unknown Institution';
  };

  const getApplicationStatus = (course) => {
    if (course.currentApplications >= course.capacity) {
      return { status: 'full', label: 'Course Full' };
    }
    
    const deadline = course.deadline?.toDate ? course.deadline.toDate() : new Date();
    const now = new Date();
    if (deadline < now) {
      return { status: 'expired', label: 'Application Closed' };
    }
    
    return { status: 'open', label: 'Apply Now' };
  };

  const isNewCourse = (course) => {
    const createdDate = course.createdAt?.toDate ? course.createdAt.toDate() : new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return createdDate > sevenDaysAgo;
  };

  const indexOfLastCourse = page * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentCourses = filteredCourses.slice(indexOfFirstCourse, indexOfLastCourse);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center">
        Available Courses
      </Typography>
      <Typography variant="h6" color="textSecondary" align="center" sx={{ mb: 4 }}>
        Discover your path to higher education in Lesotho
      </Typography>

      {/* Search and Filters */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search courses, institutions, faculties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Institution</InputLabel>
              <Select
                value={institutionFilter}
                label="Institution"
                onChange={(e) => setInstitutionFilter(e.target.value)}
              >
                <MenuItem value="">All Institutions</MenuItem>
                {institutions.map((institution) => (
                  <MenuItem key={institution.id} value={institution.id}>
                    {institution.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Faculty</InputLabel>
              <Select
                value={facultyFilter}
                label="Faculty"
                onChange={(e) => setFacultyFilter(e.target.value)}
              >
                <MenuItem value="">All Faculties</MenuItem>
                {faculties.map((faculty, index) => (
                  <MenuItem key={index} value={faculty}>
                    {faculty}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Courses Grid */}
      <Grid container spacing={3}>
        {currentCourses.map((course) => {
          const applicationStatus = getApplicationStatus(course);
          const isNew = isNewCourse(course);
          
          return (
            <Grid item xs={12} md={6} lg={4} key={course.id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                position: 'relative',
                border: isNew ? '2px solid #1976d2' : '1px solid #e0e0e0'
              }}>
                {isNew && (
                  <Chip 
                    label="NEW" 
                    color="primary" 
                    size="small"
                    sx={{ 
                      position: 'absolute', 
                      top: 8, 
                      right: 8,
                      fontWeight: 'bold'
                    }}
                  />
                )}
                
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {course.name}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <School sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="textSecondary">
                      {getInstitutionName(course.institutionId)}
                    </Typography>
                  </Box>

                  <Chip 
                    label={course.faculty} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />

                  <Typography variant="body2" paragraph>
                    <strong>Duration:</strong> {course.duration}
                  </Typography>

                  <Typography variant="body2" paragraph sx={{ minHeight: '40px' }}>
                    <strong>Requirements:</strong> {course.requirements || 'Check institution website'}
                  </Typography>

                  {course.description && (
                    <Typography variant="body2" color="textSecondary" paragraph sx={{ 
                      fontSize: '0.875rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {course.description}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <People sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {course.currentApplications || 0}/{course.capacity}
                      </Typography>
                    </Box>
                    {course.deadline && (
                      <Typography variant="body2" color={applicationStatus.status === 'expired' ? 'error' : 'textSecondary'}>
                        Deadline: {course.deadline?.toDate ? course.deadline.toDate().toLocaleDateString() : 'N/A'}
                      </Typography>
                    )}
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => handleApply(course)}
                    disabled={applicationStatus.status === 'full' || applicationStatus.status === 'expired'}
                    startIcon={applicationStatus.status === 'open' ? <Login /> : undefined}
                  >
                    {applicationStatus.label}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Pagination */}
      {filteredCourses.length > coursesPerPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={Math.ceil(filteredCourses.length / coursesPerPage)}
            page={page}
            onChange={(event, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}

      {filteredCourses.length === 0 && !loading && (
        <Typography variant="h6" align="center" sx={{ mt: 4 }}>
          No courses found matching your criteria.
        </Typography>
      )}

      {/* Login Prompt Dialog */}
      <Dialog open={loginDialogOpen} onClose={() => setLoginDialogOpen(false)}>
        <DialogTitle>Login Required</DialogTitle>
        <DialogContent>
          <Typography>
            You need to be logged in as a student to apply for courses. Please log in or create an account to continue.
          </Typography>
          {selectedCourse && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Course you want to apply for:
              </Typography>
              <Typography variant="body2">
                <strong>{selectedCourse.name}</strong> at {getInstitutionName(selectedCourse.institutionId)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLoginDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setLoginDialogOpen(false);
              // Redirect to login page - you'll need to implement this based on your routing
              window.location.href = '/login?redirect=courses';
            }}
          >
            Go to Login
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Courses;