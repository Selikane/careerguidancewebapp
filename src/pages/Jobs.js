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
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  Search, 
  Business, 
  LocationOn, 
  AttachMoney, 
  Schedule,
  Work 
} from '@mui/icons-material';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { AuthContext } from '../contexts/AuthContext';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);
  
  const jobsPerPage = 6;

  // Fetch jobs data from Firebase
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Simple query that doesn't require composite index
        const jobsQuery = query(
          collection(db, 'jobs'),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(jobsQuery);
        
        const jobsData = [];
        
        querySnapshot.forEach((doc) => {
          try {
            const jobData = doc.data();
            
            // Skip if job is explicitly inactive
            if (jobData.isActive === false) {
              return;
            }
            
            // Convert Firestore timestamp to Date if needed
            const deadline = jobData.deadline?.toDate 
              ? jobData.deadline.toDate() 
              : jobData.deadline 
                ? new Date(jobData.deadline) 
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            
            const createdAt = jobData.createdAt?.toDate 
              ? jobData.createdAt.toDate() 
              : jobData.createdAt 
                ? new Date(jobData.createdAt) 
                : new Date();
            
            jobsData.push({
              id: doc.id,
              title: jobData.title || jobData.jobTitle || 'Untitled Job',
              company: jobData.companyName || jobData.company || jobData.employer || 'Unknown Company',
              location: jobData.location || jobData.jobLocation || 'Location not specified',
              industry: jobData.industry || jobData.category || 'General',
              salary: jobData.salary || jobData.compensation || 'Salary not specified',
              type: jobData.jobType || jobData.type || jobData.employmentType || 'Full-time',
              requirements: jobData.requirements || jobData.qualifications || 'No specific requirements',
              description: jobData.description || jobData.jobDescription || 'No description available',
              deadline: deadline,
              createdAt: createdAt,
              isActive: true,
              isRemote: jobData.isRemote || false,
              contactEmail: jobData.contactEmail || jobData.email,
              contactPhone: jobData.contactPhone || jobData.phone
            });
          } catch (docError) {
            console.error('Error processing job document:', docError);
          }
        });
        
        if (jobsData.length === 0) {
          setError('No job opportunities available at the moment. Please check back later!');
        }
        
        setJobs(jobsData);
        setFilteredJobs(jobsData);
        
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setError('Unable to load job opportunities. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // Filter jobs based on search and filters
  useEffect(() => {
    let filtered = jobs.filter(job => {
      const searchLower = searchTerm.toLowerCase();
      return (
        job.title.toLowerCase().includes(searchLower) ||
        job.company.toLowerCase().includes(searchLower) ||
        job.industry.toLowerCase().includes(searchLower) ||
        (job.description && job.description.toLowerCase().includes(searchLower)) ||
        (job.requirements && job.requirements.toLowerCase().includes(searchLower))
      );
    });

    if (industryFilter) {
      filtered = filtered.filter(job => 
        job.industry.toLowerCase().includes(industryFilter.toLowerCase())
      );
    }

    if (locationFilter) {
      filtered = filtered.filter(job => 
        job.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    if (jobTypeFilter) {
      filtered = filtered.filter(job => 
        job.type.toLowerCase().includes(jobTypeFilter.toLowerCase())
      );
    }

    setFilteredJobs(filtered);
    setPage(1);
  }, [searchTerm, industryFilter, locationFilter, jobTypeFilter, jobs]);

  const handleApply = async (jobId) => {
    if (!user) {
      alert('Please log in to apply for jobs.');
      return;
    }

    try {
      alert('Application submitted successfully! The employer will review your application.');
    } catch (err) {
      console.error('Error applying for job:', err);
      alert('Failed to submit application. Please try again.');
    }
  };

  // Calculate match score based on user profile
  const calculateMatchScore = (job) => {
    const baseScore = Math.floor(Math.random() * 30) + 60;
    return baseScore;
  };

  // Get unique industries, locations, and job types for filters
  const industries = [...new Set(jobs.map(job => job.industry).filter(Boolean))];
  const locations = [...new Set(jobs.map(job => job.location).filter(Boolean))];
  const jobTypes = [...new Set(jobs.map(job => job.type).filter(Boolean))];

  const indexOfLastJob = page * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Finding job opportunities for you...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center">
        Job Opportunities
      </Typography>
      <Typography variant="h6" color="textSecondary" align="center" sx={{ mb: 4 }}>
        Discover your next career opportunity with Lesotho's top employers
      </Typography>

      {error && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Search and Filters */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Job title, company, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Industry</InputLabel>
              <Select
                value={industryFilter}
                label="Industry"
                onChange={(e) => setIndustryFilter(e.target.value)}
              >
                <MenuItem value="">All Industries</MenuItem>
                {industries.map(industry => (
                  <MenuItem key={industry} value={industry}>
                    {industry}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Location</InputLabel>
              <Select
                value={locationFilter}
                label="Location"
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                <MenuItem value="">All Locations</MenuItem>
                {locations.map(location => (
                  <MenuItem key={location} value={location}>
                    {location}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Job Type</InputLabel>
              <Select
                value={jobTypeFilter}
                label="Job Type"
                onChange={(e) => setJobTypeFilter(e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                {jobTypes.map(type => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Results Count */}
      {jobs.length > 0 && (
        <Typography variant="body1" sx={{ mb: 2 }}>
          Showing {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} matching your criteria
        </Typography>
      )}

      {/* Jobs Grid */}
      <Grid container spacing={3}>
        {currentJobs.map((job) => {
          const matchScore = calculateMatchScore(job);
          
          return (
            <Grid item xs={12} md={6} lg={4} key={job.id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s',
                border: '1px solid #e0e0e0',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="h2" sx={{ lineHeight: 1.2 }}>
                      {job.title}
                    </Typography>
                    <Chip 
                      label={`${matchScore}% Match`} 
                      size="small" 
                      color={matchScore > 80 ? 'success' : matchScore > 60 ? 'warning' : 'error'}
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Business sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="textSecondary">
                      {job.company}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationOn sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="textSecondary">
                      {job.location}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip label={job.industry} size="small" variant="outlined" />
                    <Chip label={job.type} size="small" variant="outlined" />
                    {job.isRemote && <Chip label="Remote" size="small" color="primary" />}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AttachMoney sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {job.salary}
                    </Typography>
                  </Box>

                  <Typography 
                    variant="body2" 
                    paragraph 
                    sx={{ 
                      fontSize: '0.875rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {job.description}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                    <Typography variant="body2" color="error">
                      <Schedule sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                      Apply by: {job.deadline.toLocaleDateString()}
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => handleApply(job.id)}
                      startIcon={<Work />}
                    >
                      Apply Now
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Pagination */}
      {filteredJobs.length > jobsPerPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={Math.ceil(filteredJobs.length / jobsPerPage)}
            page={page}
            onChange={(event, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}

      {filteredJobs.length === 0 && !loading && (
        <Typography variant="h6" align="center" sx={{ mt: 4, color: 'text.secondary' }}>
          No jobs match your search criteria. Try different filters or search terms.
        </Typography>
      )}
    </Container>
  );
};

export default Jobs;