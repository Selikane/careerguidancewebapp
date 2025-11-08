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
import { Search, Business, LocationOn, AttachMoney, Schedule } from '@mui/icons-material';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [page, setPage] = useState(1);
  const jobsPerPage = 6;

  // Mock data - replace with actual API call
  useEffect(() => {
    const mockJobs = [
      {
        id: 1,
        title: 'Software Developer',
        company: 'Tech Solutions Lesotho',
        location: 'Maseru',
        industry: 'Technology',
        salary: 'M15,000 - M20,000',
        type: 'Full-time',
        requirements: 'Computer Science degree, 2+ years experience',
        deadline: '2024-04-30',
        matchScore: 85
      },
      {
        id: 2,
        title: 'Marketing Manager',
        company: 'Blue Mountain Enterprises',
        location: 'Maseru',
        industry: 'Marketing',
        salary: 'M12,000 - M18,000',
        type: 'Full-time',
        requirements: 'Marketing degree, 3+ years experience',
        deadline: '2024-04-25',
        matchScore: 72
      },
      {
        id: 3,
        title: 'Registered Nurse',
        company: 'Queen Elizabeth Hospital',
        location: 'Maseru',
        industry: 'Healthcare',
        salary: 'M10,000 - M15,000',
        type: 'Full-time',
        requirements: 'Nursing diploma, valid license',
        deadline: '2024-04-20',
        matchScore: 90
      }
    ];
    setJobs(mockJobs);
    setFilteredJobs(mockJobs);
  }, []);

  useEffect(() => {
    let filtered = jobs.filter(job =>
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.industry.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (industryFilter) {
      filtered = filtered.filter(job => job.industry === industryFilter);
    }

    if (locationFilter) {
      filtered = filtered.filter(job => job.location === locationFilter);
    }

    setFilteredJobs(filtered);
    setPage(1);
  }, [searchTerm, industryFilter, locationFilter, jobs]);

  const handleApply = (jobId) => {
    // Implement job application logic
    alert(`Applied for job ID: ${jobId}`);
  };

  const indexOfLastJob = page * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center">
        Job Opportunities
      </Typography>
      <Typography variant="h6" color="textSecondary" align="center" sx={{ mb: 4 }}>
        Find your dream job with Lesotho's top companies
      </Typography>

      {/* Search and Filters */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search jobs, companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Industry</InputLabel>
              <Select
                value={industryFilter}
                label="Industry"
                onChange={(e) => setIndustryFilter(e.target.value)}
              >
                <MenuItem value="">All Industries</MenuItem>
                <MenuItem value="Technology">Technology</MenuItem>
                <MenuItem value="Marketing">Marketing</MenuItem>
                <MenuItem value="Healthcare">Healthcare</MenuItem>
                <MenuItem value="Education">Education</MenuItem>
                <MenuItem value="Finance">Finance</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Location</InputLabel>
              <Select
                value={locationFilter}
                label="Location"
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                <MenuItem value="">All Locations</MenuItem>
                <MenuItem value="Maseru">Maseru</MenuItem>
                <MenuItem value="Leribe">Leribe</MenuItem>
                <MenuItem value="Berea">Berea</MenuItem>
                <MenuItem value="Mafeteng">Mafeteng</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Jobs Grid */}
      <Grid container spacing={3}>
        {currentJobs.map((job) => (
          <Grid item xs={12} md={6} lg={4} key={job.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" component="h2">
                    {job.title}
                  </Typography>
                  <Chip 
                    label={`${job.matchScore}% Match`} 
                    size="small" 
                    color={job.matchScore > 80 ? 'success' : job.matchScore > 60 ? 'warning' : 'error'}
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

                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip label={job.industry} size="small" variant="outlined" />
                  <Chip label={job.type} size="small" variant="outlined" />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AttachMoney sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    {job.salary}
                  </Typography>
                </Box>

                <Typography variant="body2" paragraph sx={{ fontSize: '0.875rem' }}>
                  <strong>Requirements:</strong> {job.requirements}
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                  <Typography variant="body2" color="error">
                    <Schedule sx={{ fontSize: 16, verticalAlign: 'middle', mr: 0.5 }} />
                    {new Date(job.deadline).toLocaleDateString()}
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => handleApply(job.id)}
                  >
                    Apply Now
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
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

      {filteredJobs.length === 0 && (
        <Typography variant="h6" align="center" sx={{ mt: 4 }}>
          No jobs found matching your criteria.
        </Typography>
      )}
    </Container>
  );
};

export default Jobs;