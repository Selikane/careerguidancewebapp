import React, { useState } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton
} from '@mui/material';
import {
  School,
  Group,
  Description,
  Add,
  CheckCircle,
  Cancel,
  Pending
} from '@mui/icons-material';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const InstitutionDashboard = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Mock data
  const applications = [
    { id: 1, student: 'John Doe', course: 'Computer Science', date: '2024-01-15', status: 'pending' },
    { id: 2, student: 'Jane Smith', course: 'Business Administration', date: '2024-01-16', status: 'admitted' },
    { id: 3, student: 'Mike Johnson', course: 'Computer Science', date: '2024-01-14', status: 'rejected' }
  ];

  const courses = [
    { id: 1, name: 'Computer Science', faculty: 'Science & Technology', applications: 45, capacity: 50 },
    { id: 2, name: 'Business Administration', faculty: 'Business', applications: 52, capacity: 60 },
    { id: 3, name: 'Electrical Engineering', faculty: 'Engineering', applications: 30, capacity: 40 }
  ];

  const getStatusChip = (status) => {
    const statusConfig = {
      admitted: { color: 'success', label: 'Admitted' },
      pending: { color: 'warning', label: 'Pending' },
      rejected: { color: 'error', label: 'Rejected' }
    };
    const config = statusConfig[status];
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const handleApplicationAction = (applicationId, action) => {
    // Implement application action logic
    alert(`${action} application ${applicationId}`);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Institution Dashboard
          </Typography>
          <Typography variant="h6" color="textSecondary">
            National University of Lesotho
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />}>
          Add New Course
        </Button>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Group sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h4">127</Typography>
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
                  <Typography variant="h4">15</Typography>
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
                  <Typography variant="h4">89</Typography>
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
                  <Typography variant="h4">38</Typography>
                  <Typography variant="body2">Pending Review</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Applications" />
          <Tab label="Courses" />
          <Tab label="Admissions" />
          <Tab label="Institution Profile" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Student Applications
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student Name</TableCell>
                  <TableCell>Course</TableCell>
                  <TableCell>Application Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>{app.student}</TableCell>
                    <TableCell>{app.course}</TableCell>
                    <TableCell>{new Date(app.date).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusChip(app.status)}</TableCell>
                    <TableCell>
                      {app.status === 'pending' && (
                        <Box>
                          <IconButton 
                            color="success" 
                            onClick={() => handleApplicationAction(app.id, 'admit')}
                          >
                            <CheckCircle />
                          </IconButton>
                          <IconButton 
                            color="error" 
                            onClick={() => handleApplicationAction(app.id, 'reject')}
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
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Course Management
          </Typography>
          <Grid container spacing={2}>
            {courses.map((course) => (
              <Grid item xs={12} md={6} key={course.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {course.name}
                    </Typography>
                    <Typography color="textSecondary" gutterBottom>
                      {course.faculty}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">
                        Applications: {course.applications}/{course.capacity}
                      </Typography>
                      <Chip 
                        label={course.applications >= course.capacity ? 'Full' : 'Available'} 
                        color={course.applications >= course.capacity ? 'error' : 'success'}
                        size="small"
                      />
                    </Box>
                    <Button variant="outlined" size="small" sx={{ mt: 1 }}>
                      Manage Course
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Admissions Management
          </Typography>
          <Card>
            <CardContent>
              <Typography gutterBottom>
                Publish admission results for the current academic year
              </Typography>
              <Button variant="contained" sx={{ mr: 2 }}>
                Publish Admissions
              </Button>
              <Button variant="outlined">
                Generate Report
              </Button>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Institution Profile
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Basic Information
                  </Typography>
                  <Typography><strong>Name:</strong> National University of Lesotho</Typography>
                  <Typography><strong>Email:</strong> info@nul.ls</Typography>
                  <Typography><strong>Phone:</strong> +266 2234 0600</Typography>
                  <Typography><strong>Address:</strong> Roma, Maseru, Lesotho</Typography>
                  <Button variant="outlined" sx={{ mt: 2 }}>
                    Edit Profile
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Faculty Management
                  </Typography>
                  <Typography color="textSecondary">
                    Manage faculties and departments
                  </Typography>
                  <Button variant="contained" sx={{ mt: 2 }}>
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