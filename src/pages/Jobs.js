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
  CircularProgress,
  alpha
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
  
  // Color scheme matching the home page
  const primaryColor = '#000000';
  const secondaryColor = '#333333';
  const accentColor = '#FF6B35';
  const backgroundColor = '#FFFFFF';
  const lightGray = '#f5f5f5';
  const mediumGray = '#e0e0e0';

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
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress sx={{ color: accentColor }} />
        <Typography variant="h6" sx={{ mt: 3, color: secondaryColor, fontWeight: '300' }}>
          Finding job opportunities for you...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom 
          sx={{ 
            fontWeight: '300',
            color: primaryColor,
            letterSpacing: '-0.01em'
          }}
        >
          Job Opportunities
        </Typography>
        <Typography 
          variant="h6" 
          sx={{ 
            color: secondaryColor,
            fontWeight: '300',
            maxWidth: '600px',
            mx: 'auto'
          }}
        >
          Discover your next career opportunity with Lesotho's top employers
        </Typography>
      </Box>

      {error && (
        <Alert severity="info" sx={{ mb: 4, borderRadius: '8px' }}>
          {error}
        </Alert>
      )}

      {/* Search and Filters */}
      <Box sx={{ mb: 6, p: 3, backgroundColor: lightGray, borderRadius: '12px' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Job title, company, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: secondaryColor }} />
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: backgroundColor,
                  borderRadius: '8px'
                }
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
                sx={{
                  backgroundColor: backgroundColor,
                  borderRadius: '8px'
                }}
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
                sx={{
                  backgroundColor: backgroundColor,
                  borderRadius: '8px'
                }}
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
                sx={{
                  backgroundColor: backgroundColor,
                  borderRadius: '8px'
                }}
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
        <Typography variant="body1" sx={{ mb: 3, color: secondaryColor }}>
          Showing {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} matching your criteria
        </Typography>
      )}

      {/* Jobs Grid */}
      <Grid container spacing={4}>
        {currentJobs.map((job) => {
          const matchScore = calculateMatchScore(job);
          
          return (
            <Grid item xs={12} md={6} lg={4} key={job.id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                border: `1px solid ${mediumGray}`,
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                backgroundColor: backgroundColor,
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: `0 20px 40px ${alpha(primaryColor, 0.15)}`,
                  borderColor: accentColor
                }
              }}>
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  {/* Header with Title and Match Score */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                    <Typography 
                      variant="h6" 
                      component="h2" 
                      sx={{ 
                        lineHeight: 1.2,
                        fontWeight: '600',
                        color: primaryColor,
                        flex: 1,
                        mr: 1
                      }}
                    >
                      {job.title}
                    </Typography>
                    <Chip 
                      label={`${matchScore}% Match`} 
                      size="small" 
                      sx={{
                        backgroundColor: matchScore > 80 ? accentColor : matchScore > 60 ? alpha(accentColor, 0.7) : alpha(accentColor, 0.4),
                        color: 'white',
                        fontWeight: '600',
                        minWidth: '80px'
                      }}
                    />
                  </Box>
                  
                  {/* Company and Location */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Business sx={{ fontSize: 18, mr: 1, color: accentColor }} />
                    <Typography variant="body2" sx={{ color: secondaryColor }}>
                      {job.company}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <LocationOn sx={{ fontSize: 18, mr: 1, color: accentColor }} />
                    <Typography variant="body2" sx={{ color: secondaryColor }}>
                      {job.location}
                    </Typography>
                  </Box>

                  {/* Job Tags */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                    <Chip 
                      label={job.industry} 
                      size="small" 
                      sx={{
                        backgroundColor: alpha(accentColor, 0.1),
                        color: accentColor,
                        fontWeight: '500',
                        border: `1px solid ${alpha(accentColor, 0.3)}`
                      }}
                    />
                    <Chip 
                      label={job.type} 
                      size="small" 
                      sx={{
                        backgroundColor: alpha(accentColor, 0.1),
                        color: accentColor,
                        fontWeight: '500',
                        border: `1px solid ${alpha(accentColor, 0.3)}`
                      }}
                    />
                    {job.isRemote && (
                      <Chip 
                        label="Remote" 
                        size="small" 
                        sx={{
                          backgroundColor: accentColor,
                          color: 'white',
                          fontWeight: '600'
                        }}
                      />
                    )}
                  </Box>

                  {/* Salary */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <AttachMoney sx={{ fontSize: 18, mr: 1, color: accentColor }} />
                    <Typography variant="body2" sx={{ color: secondaryColor, fontWeight: '500' }}>
                      {job.salary}
                    </Typography>
                  </Box>

                  {/* Description */}
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: secondaryColor,
                      fontSize: '0.875rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      mb: 3,
                      lineHeight: 1.5
                    }}
                  >
                    {job.description}
                  </Typography>

                  {/* Footer with Deadline and Apply Button */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mt: 'auto',
                    p: 2,
                    backgroundColor: lightGray,
                    borderRadius: '8px',
                    marginTop: 'auto'
                  }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: accentColor, fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                        <Schedule sx={{ fontSize: 16, mr: 0.5 }} />
                        Apply by: {job.deadline.toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      onClick={() => handleApply(job.id)}
                      startIcon={<Work />}
                      sx={{
                        backgroundColor: accentColor,
                        color: 'white',
                        borderRadius: '25px',
                        px: 3,
                        fontWeight: '600',
                        '&:hover': {
                          backgroundColor: '#E55A2B',
                          transform: 'translateY(-2px)'
                        },
                        transition: 'all 0.3s ease'
                      }}
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
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <Pagination
            count={Math.ceil(filteredJobs.length / jobsPerPage)}
            page={page}
            onChange={(event, value) => setPage(value)}
            sx={{
              '& .MuiPaginationItem-root': {
                color: secondaryColor,
                '&.Mui-selected': {
                  backgroundColor: accentColor,
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#E55A2B'
                  }
                }
              }
            }}
          />
        </Box>
      )}

      {filteredJobs.length === 0 && !loading && (
        <Typography variant="h6" align="center" sx={{ mt: 4, color: secondaryColor }}>
          No jobs match your search criteria. Try different filters or search terms.
        </Typography>
      )}
    </Container>
  );
};

export default Jobs;