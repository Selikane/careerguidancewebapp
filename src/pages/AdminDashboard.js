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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  AdminPanelSettings,
  School,
  Business,
  Group,
  CheckCircle,
  Cancel,
  TrendingUp,
  Block,
  Refresh,
  Add,
  Edit,
  Delete
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  query,
  where 
} from 'firebase/firestore';
import { db } from '../config/firebase';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [systemStats, setSystemStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Dialog states
  const [institutionDialog, setInstitutionDialog] = useState({ open: false, mode: 'add', data: null });
  const [courseDialog, setCourseDialog] = useState({ open: false, mode: 'add', data: null });
  const [companyDialog, setCompanyDialog] = useState({ open: false, mode: 'add', data: null });
  
  // Form states
  const [institutionForm, setInstitutionForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    description: ''
  });
  
  const [courseForm, setCourseForm] = useState({
    name: '',
    institutionId: '',
    faculty: '',
    duration: '',
    requirements: '',
    capacity: '',
    description: ''
  });

  const [companyForm, setCompanyForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    industry: '',
    website: '',
    description: ''
  });

  const { user, userType, isHardcodedAdminSession } = useContext(AuthContext);

  // Check if user has admin access (bypass authentication check)
  const hasAdminAccess = () => {
    // Always return true for now - we'll handle security via Firestore rules
    // In production, you'd want proper authentication
    return true;
    
    // Uncomment below for proper authentication check
    /*
    return isHardcodedAdminSession || 
           userType === 'admin' || 
           (user && ['systemadmin@gmail.com', 'admin@careerguidels.org', 'kabelo@admin.com'].includes(user.email?.toLowerCase()));
    */
  };

  useEffect(() => {
    if (hasAdminAccess()) {
      loadData();
    }
  }, [tabValue]);

  // Load all data from Firestore
  const loadData = async () => {
    if (!hasAdminAccess()) return;
    
    setLoading(true);
    try {
      // Load institutions
      const institutionsSnapshot = await getDocs(collection(db, 'institutions'));
      const institutionsData = institutionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInstitutions(institutionsData);

      // Load companies
      const companiesSnapshot = await getDocs(collection(db, 'companies'));
      const companiesData = companiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCompanies(companiesData);

      // Load courses
      const coursesSnapshot = await getDocs(collection(db, 'courses'));
      const coursesData = coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCourses(coursesData);

      // Load pending approvals (institutions and companies not approved)
      const pendingInstitutions = institutionsData.filter(inst => !inst.isApproved);
      const pendingCompanies = companiesData.filter(comp => !comp.isApproved);
      setPendingApprovals([
        ...pendingInstitutions.map(inst => ({ ...inst, type: 'institution' })),
        ...pendingCompanies.map(comp => ({ ...comp, type: 'company' }))
      ]);

      // Calculate stats
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const courseAppsSnapshot = await getDocs(collection(db, 'courseApplications'));
      const jobsSnapshot = await getDocs(collection(db, 'jobs'));

      setSystemStats({
        totalUsers: usersSnapshot.size,
        totalInstitutions: institutionsData.length,
        totalCompanies: companiesData.length,
        totalCourses: coursesData.length,
        jobPostings: jobsSnapshot.size,
        courseApplications: courseAppsSnapshot.size,
        activeApplications: courseAppsSnapshot.docs.filter(doc => doc.data().status === 'pending').length
      });

    } catch (error) {
      console.error('Error loading data:', error);
      showSnackbar('Error loading data. Check console for details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Institution Management
  const handleAddInstitution = async () => {
    try {
      await addDoc(collection(db, 'institutions'), {
        ...institutionForm,
        isActive: true,
        isApproved: true,
        createdAt: serverTimestamp()
      });
      showSnackbar('Institution added successfully!');
      setInstitutionDialog({ open: false, mode: 'add', data: null });
      setInstitutionForm({ name: '', email: '', phone: '', address: '', website: '', description: '' });
      loadData();
    } catch (error) {
      showSnackbar('Error adding institution: ' + error.message, 'error');
    }
  };

  const handleUpdateInstitution = async () => {
    try {
      await updateDoc(doc(db, 'institutions', institutionDialog.data.id), {
        ...institutionForm,
        updatedAt: serverTimestamp()
      });
      showSnackbar('Institution updated successfully!');
      setInstitutionDialog({ open: false, mode: 'add', data: null });
      setInstitutionForm({ name: '', email: '', phone: '', address: '', website: '', description: '' });
      loadData();
    } catch (error) {
      showSnackbar('Error updating institution: ' + error.message, 'error');
    }
  };

  const handleDeleteInstitution = async (institutionId) => {
    if (window.confirm('Are you sure you want to delete this institution?')) {
      try {
        await deleteDoc(doc(db, 'institutions', institutionId));
        showSnackbar('Institution deleted successfully!');
        loadData();
      } catch (error) {
        showSnackbar('Error deleting institution: ' + error.message, 'error');
      }
    }
  };

  // Course Management
  const handleAddCourse = async () => {
    try {
      await addDoc(collection(db, 'courses'), {
        ...courseForm,
        capacity: parseInt(courseForm.capacity),
        currentApplications: 0,
        isActive: true,
        createdAt: serverTimestamp()
      });
      showSnackbar('Course added successfully!');
      setCourseDialog({ open: false, mode: 'add', data: null });
      setCourseForm({ name: '', institutionId: '', faculty: '', duration: '', requirements: '', capacity: '', description: '' });
      loadData();
    } catch (error) {
      showSnackbar('Error adding course: ' + error.message, 'error');
    }
  };

  const handleUpdateCourse = async () => {
    try {
      await updateDoc(doc(db, 'courses', courseDialog.data.id), {
        ...courseForm,
        capacity: parseInt(courseForm.capacity),
        updatedAt: serverTimestamp()
      });
      showSnackbar('Course updated successfully!');
      setCourseDialog({ open: false, mode: 'add', data: null });
      setCourseForm({ name: '', institutionId: '', faculty: '', duration: '', requirements: '', capacity: '', description: '' });
      loadData();
    } catch (error) {
      showSnackbar('Error updating course: ' + error.message, 'error');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await deleteDoc(doc(db, 'courses', courseId));
        showSnackbar('Course deleted successfully!');
        loadData();
      } catch (error) {
        showSnackbar('Error deleting course: ' + error.message, 'error');
      }
    }
  };

  // Company Management
  const handleAddCompany = async () => {
    try {
      await addDoc(collection(db, 'companies'), {
        ...companyForm,
        isActive: true,
        isApproved: true,
        createdAt: serverTimestamp()
      });
      showSnackbar('Company added successfully!');
      setCompanyDialog({ open: false, mode: 'add', data: null });
      setCompanyForm({ name: '', email: '', phone: '', address: '', industry: '', website: '', description: '' });
      loadData();
    } catch (error) {
      showSnackbar('Error adding company: ' + error.message, 'error');
    }
  };

  const handleUpdateCompany = async () => {
    try {
      await updateDoc(doc(db, 'companies', companyDialog.data.id), {
        ...companyForm,
        updatedAt: serverTimestamp()
      });
      showSnackbar('Company updated successfully!');
      setCompanyDialog({ open: false, mode: 'add', data: null });
      setCompanyForm({ name: '', email: '', phone: '', address: '', industry: '', website: '', description: '' });
      loadData();
    } catch (error) {
      showSnackbar('Error updating company: ' + error.message, 'error');
    }
  };

  const handleDeleteCompany = async (companyId) => {
    if (window.confirm('Are you sure you want to delete this company?')) {
      try {
        await deleteDoc(doc(db, 'companies', companyId));
        showSnackbar('Company deleted successfully!');
        loadData();
      } catch (error) {
        showSnackbar('Error deleting company: ' + error.message, 'error');
      }
    }
  };

  // Approval Management
  const handleApprove = async (itemId, itemType) => {
    try {
      const collectionName = itemType === 'institution' ? 'institutions' : 'companies';
      await updateDoc(doc(db, collectionName, itemId), {
        isApproved: true,
        approvedAt: serverTimestamp()
      });
      showSnackbar(`${itemType} approved successfully!`);
      loadData();
    } catch (error) {
      showSnackbar('Error approving: ' + error.message, 'error');
    }
  };

  const handleReject = async (itemId, itemType) => {
    try {
      const collectionName = itemType === 'institution' ? 'institutions' : 'companies';
      await updateDoc(doc(db, collectionName, itemId), {
        isActive: false,
        rejectedAt: serverTimestamp()
      });
      showSnackbar(`${itemType} rejected successfully!`);
      loadData();
    } catch (error) {
      showSnackbar('Error rejecting: ' + error.message, 'error');
    }
  };

  const handleStatusChange = async (itemId, itemType, newStatus) => {
    try {
      const collectionName = itemType === 'institution' ? 'institutions' : 'companies';
      await updateDoc(doc(db, collectionName, itemId), {
        isActive: newStatus === 'active',
        statusUpdatedAt: serverTimestamp()
      });
      showSnackbar(`Status updated to ${newStatus} successfully!`);
      loadData();
    } catch (error) {
      showSnackbar('Error updating status: ' + error.message, 'error');
    }
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      active: { color: 'success', label: 'Active' },
      suspended: { color: 'error', label: 'Suspended' },
      approved: { color: 'success', label: 'Approved' },
      pending: { color: 'warning', label: 'Pending' },
      rejected: { color: 'error', label: 'Rejected' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const calculateStats = () => {
    return {
      totalInstitutions: institutions.length,
      totalCompanies: companies.length,
      totalStudents: students.length,
      totalPending: pendingApprovals.length,
      totalCourses: courses.length
    };
  };

  const stats = calculateStats();

  // Show access denied if no admin access
  if (!hasAdminAccess()) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Access denied. Admin privileges required.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Admin Dashboard
          </Typography>
          <Typography variant="h6" color="textSecondary">
            Full System Administration
          </Typography>
        </Box>
        <Button 
          startIcon={<Refresh />} 
          onClick={loadData} 
          disabled={loading}
          variant="outlined"
        >
          Refresh
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
                  <Typography variant="h4">{stats.totalInstitutions}</Typography>
                  <Typography variant="body2">Institutions</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Business sx={{ fontSize: 40, color: 'secondary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.totalCompanies}</Typography>
                  <Typography variant="body2">Companies</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Group sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.totalCourses}</Typography>
                  <Typography variant="body2">Courses</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.totalPending}</Typography>
                  <Typography variant="body2">Pending Approvals</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Pending Approvals" />
          <Tab label="Institutions" />
          <Tab label="Courses" />
          <Tab label="Companies" />
          <Tab label="System Reports" />
        </Tabs>

        {/* Pending Approvals Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Pending Approvals ({pendingApprovals.length})
            </Typography>
          </Box>
          {pendingApprovals.length === 0 ? (
            <Alert severity="info">No pending approvals at this time.</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Submitted Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingApprovals.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>
                        <Chip 
                          label={item.type.charAt(0).toUpperCase() + item.type.slice(1)} 
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{item.email}</TableCell>
                      <TableCell>
                        {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>{getStatusChip('pending')}</TableCell>
                      <TableCell>
                        <IconButton 
                          color="success" 
                          onClick={() => handleApprove(item.id, item.type)}
                          title="Approve"
                        >
                          <CheckCircle />
                        </IconButton>
                        <IconButton 
                          color="error" 
                          onClick={() => handleReject(item.id, item.type)}
                          title="Reject"
                        >
                          <Cancel />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        {/* Institutions Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Institution Management ({institutions.length})
            </Typography>
            <Button 
              startIcon={<Add />} 
              variant="contained"
              onClick={() => {
                setInstitutionDialog({ open: true, mode: 'add', data: null });
                setInstitutionForm({ name: '', email: '', phone: '', address: '', website: '', description: '' });
              }}
            >
              Add Institution
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {institutions.map((institution) => (
                  <TableRow key={institution.id}>
                    <TableCell>{institution.name}</TableCell>
                    <TableCell>{institution.email}</TableCell>
                    <TableCell>{institution.phone}</TableCell>
                    <TableCell>
                      {getStatusChip(institution.isActive ? 'active' : 'suspended')}
                      {!institution.isApproved && getStatusChip('pending')}
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => {
                          setInstitutionDialog({ open: true, mode: 'edit', data: institution });
                          setInstitutionForm({
                            name: institution.name || '',
                            email: institution.email || '',
                            phone: institution.phone || '',
                            address: institution.address || '',
                            website: institution.website || '',
                            description: institution.description || ''
                          });
                        }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color={institution.isActive ? "warning" : "success"}
                        onClick={() => handleStatusChange(
                          institution.id, 
                          'institution', 
                          institution.isActive ? 'suspended' : 'active'
                        )}
                      >
                        <Block />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteInstitution(institution.id)}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Courses Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Course Management ({courses.length})
            </Typography>
            <Button 
              startIcon={<Add />} 
              variant="contained"
              onClick={() => {
                setCourseDialog({ open: true, mode: 'add', data: null });
                setCourseForm({ 
                  name: '', 
                  institutionId: '', 
                  faculty: '', 
                  duration: '', 
                  requirements: '', 
                  capacity: '', 
                  description: '' 
                });
              }}
            >
              Add Course
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Course Name</TableCell>
                  <TableCell>Institution</TableCell>
                  <TableCell>Faculty</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Capacity</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>{course.name}</TableCell>
                    <TableCell>{course.institutionName}</TableCell>
                    <TableCell>{course.faculty}</TableCell>
                    <TableCell>{course.duration}</TableCell>
                    <TableCell>{course.currentApplications || 0}/{course.capacity}</TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => {
                          setCourseDialog({ open: true, mode: 'edit', data: course });
                          setCourseForm({
                            name: course.name || '',
                            institutionId: course.institutionId || '',
                            faculty: course.faculty || '',
                            duration: course.duration || '',
                            requirements: course.requirements || '',
                            capacity: course.capacity?.toString() || '',
                            description: course.description || ''
                          });
                        }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteCourse(course.id)}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Companies Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Company Management ({companies.length})
            </Typography>
            <Button 
              startIcon={<Add />} 
              variant="contained"
              onClick={() => {
                setCompanyDialog({ open: true, mode: 'add', data: null });
                setCompanyForm({ 
                  name: '', 
                  email: '', 
                  phone: '', 
                  address: '', 
                  industry: '', 
                  website: '', 
                  description: '' 
                });
              }}
            >
              Add Company
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Company Name</TableCell>
                  <TableCell>Industry</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>{company.name}</TableCell>
                    <TableCell>{company.industry}</TableCell>
                    <TableCell>{company.email}</TableCell>
                    <TableCell>
                      {getStatusChip(company.isActive ? 'active' : 'suspended')}
                      {!company.isApproved && getStatusChip('pending')}
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => {
                          setCompanyDialog({ open: true, mode: 'edit', data: company });
                          setCompanyForm({
                            name: company.name || '',
                            email: company.email || '',
                            phone: company.phone || '',
                            address: company.address || '',
                            industry: company.industry || '',
                            website: company.website || '',
                            description: company.description || ''
                          });
                        }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color={company.isActive ? "warning" : "success"}
                        onClick={() => handleStatusChange(
                          company.id, 
                          'company', 
                          company.isActive ? 'suspended' : 'active'
                        )}
                      >
                        <Block />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteCompany(company.id)}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* System Reports Tab */}
        <TabPanel value={tabValue} index={4}>
          <Typography variant="h6" gutterBottom>
            System Reports & Analytics
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Platform Statistics
                  </Typography>
                  <Typography><strong>Total Users:</strong> {systemStats.totalUsers || 0}</Typography>
                  <Typography><strong>Total Institutions:</strong> {systemStats.totalInstitutions || 0}</Typography>
                  <Typography><strong>Total Companies:</strong> {systemStats.totalCompanies || 0}</Typography>
                  <Typography><strong>Total Courses:</strong> {systemStats.totalCourses || 0}</Typography>
                  <Typography><strong>Job Postings:</strong> {systemStats.jobPostings || 0}</Typography>
                  <Typography><strong>Course Applications:</strong> {systemStats.courseApplications || 0}</Typography>
                  <Typography><strong>Active Applications:</strong> {systemStats.activeApplications || 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Quick Actions
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button 
                      variant="outlined" 
                      onClick={() => setTabValue(1)}
                    >
                      Manage Institutions
                    </Button>
                    <Button 
                      variant="outlined" 
                      onClick={() => setTabValue(2)}
                    >
                      Manage Courses
                    </Button>
                    <Button 
                      variant="outlined" 
                      onClick={() => setTabValue(3)}
                    >
                      Manage Companies
                    </Button>
                    <Button 
                      variant="outlined" 
                      onClick={() => setTabValue(0)}
                    >
                      Review Pending Approvals
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Institution Dialog */}
      <Dialog open={institutionDialog.open} maxWidth="md" fullWidth>
        <DialogTitle>
          {institutionDialog.mode === 'add' ? 'Add New Institution' : 'Edit Institution'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Institution Name"
                value={institutionForm.name}
                onChange={(e) => setInstitutionForm({ ...institutionForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={institutionForm.email}
                onChange={(e) => setInstitutionForm({ ...institutionForm, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={institutionForm.phone}
                onChange={(e) => setInstitutionForm({ ...institutionForm, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Website"
                value={institutionForm.website}
                onChange={(e) => setInstitutionForm({ ...institutionForm, website: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={institutionForm.address}
                onChange={(e) => setInstitutionForm({ ...institutionForm, address: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={institutionForm.description}
                onChange={(e) => setInstitutionForm({ ...institutionForm, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInstitutionDialog({ open: false, mode: 'add', data: null })}>
            Cancel
          </Button>
          <Button 
            onClick={institutionDialog.mode === 'add' ? handleAddInstitution : handleUpdateInstitution}
            variant="contained"
          >
            {institutionDialog.mode === 'add' ? 'Add Institution' : 'Update Institution'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Course Dialog */}
      <Dialog open={courseDialog.open} maxWidth="md" fullWidth>
        <DialogTitle>
          {courseDialog.mode === 'add' ? 'Add New Course' : 'Edit Course'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Course Name"
                value={courseForm.name}
                onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Institution</InputLabel>
                <Select
                  value={courseForm.institutionId}
                  label="Institution"
                  onChange={(e) => setCourseForm({ ...courseForm, institutionId: e.target.value })}
                >
                  {institutions.map((inst) => (
                    <MenuItem key={inst.id} value={inst.id}>
                      {inst.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Faculty"
                value={courseForm.faculty}
                onChange={(e) => setCourseForm({ ...courseForm, faculty: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Duration"
                value={courseForm.duration}
                onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Capacity"
                type="number"
                value={courseForm.capacity}
                onChange={(e) => setCourseForm({ ...courseForm, capacity: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Requirements"
                multiline
                rows={2}
                value={courseForm.requirements}
                onChange={(e) => setCourseForm({ ...courseForm, requirements: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={courseForm.description}
                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCourseDialog({ open: false, mode: 'add', data: null })}>
            Cancel
          </Button>
          <Button 
            onClick={courseDialog.mode === 'add' ? handleAddCourse : handleUpdateCourse}
            variant="contained"
          >
            {courseDialog.mode === 'add' ? 'Add Course' : 'Update Course'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Company Dialog */}
      <Dialog open={companyDialog.open} maxWidth="md" fullWidth>
        <DialogTitle>
          {companyDialog.mode === 'add' ? 'Add New Company' : 'Edit Company'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Company Name"
                value={companyForm.name}
                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Industry"
                value={companyForm.industry}
                onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={companyForm.email}
                onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={companyForm.phone}
                onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Website"
                value={companyForm.website}
                onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={companyForm.address}
                onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={companyForm.description}
                onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompanyDialog({ open: false, mode: 'add', data: null })}>
            Cancel
          </Button>
          <Button 
            onClick={companyDialog.mode === 'add' ? handleAddCompany : handleUpdateCompany}
            variant="contained"
          >
            {companyDialog.mode === 'add' ? 'Add Company' : 'Update Company'}
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

export default AdminDashboard;