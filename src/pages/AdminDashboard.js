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
  InputLabel,
  alpha,
  CircularProgress
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
  Delete,
  Pending
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

// Color scheme matching the student dashboard
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

const AdminDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [systemStats, setSystemStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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
    setRefreshing(true);
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
      setRefreshing(false);
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
      active: { color: 'success', label: 'Active', icon: <CheckCircle /> },
      suspended: { color: 'error', label: 'Suspended', icon: <Block /> },
      approved: { color: 'success', label: 'Approved', icon: <CheckCircle /> },
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

  // Show access denied if no admin access
  if (!hasAdminAccess()) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ borderRadius: '12px' }}>
          Access denied. Admin privileges required.
        </Alert>
      </Container>
    );
  }

  if (loading && !refreshing) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px" flexDirection="column">
        <CircularProgress sx={{ color: accentColor }} size={60} />
        <Typography variant="h6" sx={{ mt: 2, color: secondaryColor, fontWeight: '300' }}>
          Loading Admin Dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ borderRadius: '8px' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ color: primaryColor, fontWeight: '300' }}>
            Admin Dashboard
          </Typography>
          <Typography variant="h6" sx={{ color: secondaryColor, fontWeight: '300' }}>
            Full System Administration
          </Typography>
        </Box>
        <Button 
          startIcon={<Refresh />} 
          onClick={loadData} 
          disabled={refreshing}
          variant="outlined"
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
      </Box>

      {/* Main Content - Statistics Removed */}
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
          <Tab label="Pending Approvals" />
          <Tab label="Institutions" />
          <Tab label="Courses" />
          <Tab label="Companies" />
          <Tab label="System Reports" />
        </Tabs>

        {/* Pending Approvals Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ color: primaryColor, fontWeight: '600' }}>
              Pending Approvals ({pendingApprovals.length})
            </Typography>
          </Box>
          {pendingApprovals.length === 0 ? (
            <Card sx={{ border: `1px solid ${mediumGray}`, borderRadius: '12px' }}>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <CheckCircle sx={{ fontSize: 64, color: accentColor, mb: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ color: primaryColor }}>
                  No Pending Approvals
                </Typography>
                <Typography variant="body2" sx={{ color: secondaryColor, fontWeight: '300' }}>
                  All institutions and companies are approved and active.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: '12px', border: `1px solid ${mediumGray}` }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Submitted Date</TableCell>
                    <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingApprovals.map((item) => (
                    <TableRow key={item.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ color: primaryColor }}>{item.name}</TableCell>
                      <TableCell>
                        <Chip 
                          label={item.type.charAt(0).toUpperCase() + item.type.slice(1)} 
                          variant="outlined"
                          size="small"
                          sx={{
                            borderColor: accentColor,
                            color: accentColor
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: secondaryColor }}>{item.email}</TableCell>
                      <TableCell sx={{ color: secondaryColor }}>
                        {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>{getStatusChip('pending')}</TableCell>
                      <TableCell>
                        <IconButton 
                          onClick={() => handleApprove(item.id, item.type)}
                          title="Approve"
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
                          onClick={() => handleReject(item.id, item.type)}
                          title="Reject"
                          sx={{
                            color: '#F44336',
                            '&:hover': {
                              backgroundColor: alpha('#F44336', 0.1)
                            }
                          }}
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ color: primaryColor, fontWeight: '600' }}>
              Institution Management ({institutions.length})
            </Typography>
            <Button 
              startIcon={<Add />} 
              variant="contained"
              onClick={() => {
                setInstitutionDialog({ open: true, mode: 'add', data: null });
                setInstitutionForm({ name: '', email: '', phone: '', address: '', website: '', description: '' });
              }}
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
              Add Institution
            </Button>
          </Box>
          <TableContainer component={Paper} sx={{ borderRadius: '12px', border: `1px solid ${mediumGray}` }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {institutions.map((institution) => (
                  <TableRow key={institution.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ color: primaryColor }}>{institution.name}</TableCell>
                    <TableCell sx={{ color: secondaryColor }}>{institution.email}</TableCell>
                    <TableCell sx={{ color: secondaryColor }}>{institution.phone}</TableCell>
                    <TableCell>
                      {getStatusChip(institution.isActive ? 'active' : 'suspended')}
                      {!institution.isApproved && getStatusChip('pending')}
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
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
                        onClick={() => handleStatusChange(
                          institution.id, 
                          'institution', 
                          institution.isActive ? 'suspended' : 'active'
                        )}
                        sx={{
                          color: institution.isActive ? '#FF9800' : '#4CAF50',
                          '&:hover': {
                            backgroundColor: alpha(institution.isActive ? '#FF9800' : '#4CAF50', 0.1)
                          }
                        }}
                      >
                        <Block />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteInstitution(institution.id)}
                        sx={{
                          color: '#F44336',
                          '&:hover': {
                            backgroundColor: alpha('#F44336', 0.1)
                          }
                        }}
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ color: primaryColor, fontWeight: '600' }}>
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
              Add Course
            </Button>
          </Box>
          <TableContainer component={Paper} sx={{ borderRadius: '12px', border: `1px solid ${mediumGray}` }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Course Name</TableCell>
                  <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Institution</TableCell>
                  <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Faculty</TableCell>
                  <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Duration</TableCell>
                  <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Capacity</TableCell>
                  <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ color: primaryColor }}>{course.name}</TableCell>
                    <TableCell sx={{ color: secondaryColor }}>{course.institutionName}</TableCell>
                    <TableCell sx={{ color: secondaryColor }}>{course.faculty}</TableCell>
                    <TableCell sx={{ color: secondaryColor }}>{course.duration}</TableCell>
                    <TableCell sx={{ color: secondaryColor }}>{course.currentApplications || 0}/{course.capacity}</TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
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
                        sx={{
                          color: '#F44336',
                          '&:hover': {
                            backgroundColor: alpha('#F44336', 0.1)
                          }
                        }}
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ color: primaryColor, fontWeight: '600' }}>
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
              Add Company
            </Button>
          </Box>
          <TableContainer component={Paper} sx={{ borderRadius: '12px', border: `1px solid ${mediumGray}` }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Company Name</TableCell>
                  <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Industry</TableCell>
                  <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: '600', color: primaryColor }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell sx={{ color: primaryColor }}>{company.name}</TableCell>
                    <TableCell sx={{ color: secondaryColor }}>{company.industry}</TableCell>
                    <TableCell sx={{ color: secondaryColor }}>{company.email}</TableCell>
                    <TableCell>
                      {getStatusChip(company.isActive ? 'active' : 'suspended')}
                      {!company.isApproved && getStatusChip('pending')}
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
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
                        onClick={() => handleStatusChange(
                          company.id, 
                          'company', 
                          company.isActive ? 'suspended' : 'active'
                        )}
                        sx={{
                          color: company.isActive ? '#FF9800' : '#4CAF50',
                          '&:hover': {
                            backgroundColor: alpha(company.isActive ? '#FF9800' : '#4CAF50', 0.1)
                          }
                        }}
                      >
                        <Block />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteCompany(company.id)}
                        sx={{
                          color: '#F44336',
                          '&:hover': {
                            backgroundColor: alpha('#F44336', 0.1)
                          }
                        }}
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
          <Typography variant="h6" gutterBottom sx={{ color: primaryColor, fontWeight: '600' }}>
            System Reports & Analytics
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ border: `1px solid ${mediumGray}`, borderRadius: '12px' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: primaryColor }}>
                    Platform Statistics
                  </Typography>
                  <Typography sx={{ color: secondaryColor, mb: 1 }}><strong>Total Users:</strong> {systemStats.totalUsers || 0}</Typography>
                  <Typography sx={{ color: secondaryColor, mb: 1 }}><strong>Total Institutions:</strong> {systemStats.totalInstitutions || 0}</Typography>
                  <Typography sx={{ color: secondaryColor, mb: 1 }}><strong>Total Companies:</strong> {systemStats.totalCompanies || 0}</Typography>
                  <Typography sx={{ color: secondaryColor, mb: 1 }}><strong>Total Courses:</strong> {systemStats.totalCourses || 0}</Typography>
                  <Typography sx={{ color: secondaryColor, mb: 1 }}><strong>Job Postings:</strong> {systemStats.jobPostings || 0}</Typography>
                  <Typography sx={{ color: secondaryColor, mb: 1 }}><strong>Course Applications:</strong> {systemStats.courseApplications || 0}</Typography>
                  <Typography sx={{ color: secondaryColor, mb: 1 }}><strong>Active Applications:</strong> {systemStats.activeApplications || 0}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ border: `1px solid ${mediumGray}`, borderRadius: '12px' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ color: primaryColor }}>
                    Quick Actions
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button 
                      variant="outlined" 
                      onClick={() => setTabValue(1)}
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
                      Manage Institutions
                    </Button>
                    <Button 
                      variant="outlined" 
                      onClick={() => setTabValue(2)}
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
                      Manage Courses
                    </Button>
                    <Button 
                      variant="outlined" 
                      onClick={() => setTabValue(3)}
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
                      Manage Companies
                    </Button>
                    <Button 
                      variant="outlined" 
                      onClick={() => setTabValue(0)}
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
      <Dialog 
        open={institutionDialog.open} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
        onClose={() => setInstitutionDialog({ open: false, mode: 'add', data: null })}
      >
        <DialogTitle sx={{ fontWeight: '600', color: primaryColor }}>
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
                value={institutionForm.email}
                onChange={(e) => setInstitutionForm({ ...institutionForm, email: e.target.value })}
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
                value={institutionForm.phone}
                onChange={(e) => setInstitutionForm({ ...institutionForm, phone: e.target.value })}
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
                label="Website"
                value={institutionForm.website}
                onChange={(e) => setInstitutionForm({ ...institutionForm, website: e.target.value })}
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
                value={institutionForm.address}
                onChange={(e) => setInstitutionForm({ ...institutionForm, address: e.target.value })}
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
                label="Description"
                multiline
                rows={3}
                value={institutionForm.description}
                onChange={(e) => setInstitutionForm({ ...institutionForm, description: e.target.value })}
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
            onClick={() => setInstitutionDialog({ open: false, mode: 'add', data: null })}
            sx={{ color: secondaryColor }}
          >
            Cancel
          </Button>
          <Button 
            onClick={institutionDialog.mode === 'add' ? handleAddInstitution : handleUpdateInstitution}
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
            {institutionDialog.mode === 'add' ? 'Add Institution' : 'Update Institution'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Course Dialog */}
      <Dialog 
        open={courseDialog.open} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
        onClose={() => setCourseDialog({ open: false, mode: 'add', data: null })}
      >
        <DialogTitle sx={{ fontWeight: '600', color: primaryColor }}>
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Institution</InputLabel>
                <Select
                  value={courseForm.institutionId}
                  label="Institution"
                  onChange={(e) => setCourseForm({ ...courseForm, institutionId: e.target.value })}
                  sx={{
                    borderRadius: '8px'
                  }}
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
                label="Capacity"
                type="number"
                value={courseForm.capacity}
                onChange={(e) => setCourseForm({ ...courseForm, capacity: e.target.value })}
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
                label="Requirements"
                multiline
                rows={2}
                value={courseForm.requirements}
                onChange={(e) => setCourseForm({ ...courseForm, requirements: e.target.value })}
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
                label="Description"
                multiline
                rows={3}
                value={courseForm.description}
                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
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
            onClick={() => setCourseDialog({ open: false, mode: 'add', data: null })}
            sx={{ color: secondaryColor }}
          >
            Cancel
          </Button>
          <Button 
            onClick={courseDialog.mode === 'add' ? handleAddCourse : handleUpdateCourse}
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
            {courseDialog.mode === 'add' ? 'Add Course' : 'Update Course'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Company Dialog */}
      <Dialog 
        open={companyDialog.open} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
        onClose={() => setCompanyDialog({ open: false, mode: 'add', data: null })}
      >
        <DialogTitle sx={{ fontWeight: '600', color: primaryColor }}>
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
                label="Industry"
                value={companyForm.industry}
                onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
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
                value={companyForm.email}
                onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
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
                value={companyForm.phone}
                onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
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
                label="Website"
                value={companyForm.website}
                onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
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
                value={companyForm.address}
                onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
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
                label="Description"
                multiline
                rows={3}
                value={companyForm.description}
                onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
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
            onClick={() => setCompanyDialog({ open: false, mode: 'add', data: null })}
            sx={{ color: secondaryColor }}
          >
            Cancel
          </Button>
          <Button 
            onClick={companyDialog.mode === 'add' ? handleAddCompany : handleUpdateCompany}
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
            {companyDialog.mode === 'add' ? 'Add Company' : 'Update Company'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;