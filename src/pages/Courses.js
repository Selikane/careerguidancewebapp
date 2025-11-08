import React, { useState, useEffect } from 'react';
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
  Pagination
} from '@mui/material';
import { Search, School, LocationOn, People } from '@mui/icons-material';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');
  const [page, setPage] = useState(1);
  const coursesPerPage = 6;

  // Mock data - replace with actual API call
  useEffect(() => {
    const mockCourses = [
      {
        id: 1,
        name: 'Computer Science',
        institution: 'National University of Lesotho',
        faculty: 'Science and Technology',
        duration: '4 years',
        requirements: 'Mathematics and Physical Science',
        capacity: 50,
        applied: 45,
        deadline: '2024-03-31'
      },
      {
        id: 2,
        name: 'Business Administration',
        institution: 'Limkokwing University',
        faculty: 'Business',
        duration: '3 years',
        requirements: 'Mathematics and English',
        capacity: 60,
        applied: 52,
        deadline: '2024-04-15'
      },
      {
        id: 3,
        name: 'Nursing',
        institution: 'Lesotho Health Training College',
        faculty: 'Health Sciences',
        duration: '4 years',
        requirements: 'Biology and Chemistry',
        capacity: 40,
        applied: 38,
        deadline: '2024-03-20'
      }
    ];
    setCourses(mockCourses);
    setFilteredCourses(mockCourses);
  }, []);

  useEffect(() => {
    let filtered = courses.filter(course =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.institution.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.faculty.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (institutionFilter) {
      filtered = filtered.filter(course => course.institution === institutionFilter);
    }

    if (facultyFilter) {
      filtered = filtered.filter(course => course.faculty === facultyFilter);
    }

    setFilteredCourses(filtered);
    setPage(1);
  }, [searchTerm, institutionFilter, facultyFilter, courses]);

  const handleApply = (courseId) => {
    // Implement application logic
    alert(`Applied for course ID: ${courseId}`);
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
              placeholder="Search courses, institutions..."
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
                <MenuItem value="National University of Lesotho">NUL</MenuItem>
                <MenuItem value="Limkokwing University">Limkokwing</MenuItem>
                <MenuItem value="Lesotho Health Training College">LHTC</MenuItem>
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
                <MenuItem value="Science and Technology">Science & Technology</MenuItem>
                <MenuItem value="Business">Business</MenuItem>
                <MenuItem value="Health Sciences">Health Sciences</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Courses Grid */}
      <Grid container spacing={3}>
        {currentCourses.map((course) => (
          <Grid item xs={12} md={6} lg={4} key={course.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="h2" gutterBottom>
                  {course.name}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <School sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="textSecondary">
                    {course.institution}
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

                <Typography variant="body2" paragraph>
                  <strong>Requirements:</strong> {course.requirements}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <People sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {course.applied}/{course.capacity}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="error">
                    Deadline: {new Date(course.deadline).toLocaleDateString()}
                  </Typography>
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => handleApply(course.id)}
                  disabled={course.applied >= course.capacity}
                >
                  {course.applied >= course.capacity ? 'Course Full' : 'Apply Now'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
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

      {filteredCourses.length === 0 && (
        <Typography variant="h6" align="center" sx={{ mt: 4 }}>
          No courses found matching your criteria.
        </Typography>
      )}
    </Container>
  );
};

export default Courses;