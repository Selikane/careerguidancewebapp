// src/services/companyService.js
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Safe callback wrapper
const safeCallback = (callback, data) => {
  if (typeof callback === 'function') {
    callback(data);
  }
};

// Company Profile
export const companyProfileService = {
  // Get company profile
  getCompanyProfile: (companyId, callback) => {
    try {
      const companyRef = doc(db, 'companies', companyId);
      
      return onSnapshot(companyRef, 
        (snapshot) => {
          safeCallback(callback, snapshot);
        },
        (error) => {
          console.log('Company profile error:', error);
          safeCallback(callback, { exists: () => false });
        }
      );
    } catch (error) {
      console.error('Error setting up company profile listener:', error);
      safeCallback(callback, { exists: () => false });
    }
  },

  // Update company profile
  updateCompanyProfile: async (companyId, profileData) => {
    try {
      const companyRef = doc(db, 'companies', companyId);
      await setDoc(companyRef, {
        ...profileData,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating company profile:', error);
      throw error;
    }
  }
};

// Job Postings
export const jobsService = {
  // Get company's job postings
  getCompanyJobs: (companyId, callback) => {
    try {
      const q = query(
        collection(db, 'jobs'),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );
      
      return onSnapshot(q, 
        (snapshot) => {
          safeCallback(callback, snapshot);
        },
        (error) => {
          console.log('Jobs collection might not exist yet:', error);
          safeCallback(callback, { docs: [] });
        }
      );
    } catch (error) {
      console.error('Error setting up jobs listener:', error);
      safeCallback(callback, { docs: [] });
    }
  },

  // Create new job posting
  createJob: async (jobData) => {
    try {
      const jobsRef = collection(db, 'jobs');
      const result = await addDoc(jobsRef, {
        ...jobData,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return result;
    } catch (error) {
      console.error('Error creating job:', error);
      throw error;
    }
  },

  // Update job posting
  updateJob: async (jobId, jobData) => {
    try {
      const jobRef = doc(db, 'jobs', jobId);
      await updateDoc(jobRef, {
        ...jobData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating job:', error);
      throw error;
    }
  },

  // Close job posting
  closeJob: async (jobId) => {
    try {
      const jobRef = doc(db, 'jobs', jobId);
      await updateDoc(jobRef, {
        status: 'closed',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error closing job:', error);
      throw error;
    }
  }
};

// Applicant Management
export const applicantsService = {
  // Get applicants for company's jobs
  getCompanyApplicants: (companyId, callback) => {
    try {
      const q = query(
        collection(db, 'jobApplications'),
        where('companyId', '==', companyId),
        orderBy('applicationDate', 'desc')
      );
      
      return onSnapshot(q, 
        (snapshot) => {
          safeCallback(callback, snapshot);
        },
        (error) => {
          console.log('Job applications collection might not exist yet:', error);
          safeCallback(callback, { docs: [] });
        }
      );
    } catch (error) {
      console.error('Error setting up applicants listener:', error);
      safeCallback(callback, { docs: [] });
    }
  },

  // Get qualified applicants with matching algorithm
  getQualifiedApplicants: async (jobId) => {
    try {
      // Get job details
      const jobRef = doc(db, 'jobs', jobId);
      const jobSnapshot = await getDoc(jobRef);
      
      if (!jobSnapshot.exists()) {
        return [];
      }

      const jobData = jobSnapshot.data();
      
      // Get all applicants for this job
      const applicationsRef = collection(db, 'jobApplications');
      const q = query(applicationsRef, where('jobId', '==', jobId));
      const applicationsSnapshot = await getDocs(q);
      
      const applications = applicationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get student profiles for each applicant
      const qualifiedApplicants = await Promise.all(
        applications.map(async (application) => {
          try {
            const studentRef = doc(db, 'students', application.studentId);
            const studentSnapshot = await getDoc(studentRef);
            
            if (!studentSnapshot.exists()) {
              return null;
            }

            const studentData = studentSnapshot.data();
            
            // Calculate match score based on qualifications
            const matchScore = calculateMatchScore(studentData, jobData);
            
            return {
              ...application,
              studentProfile: studentData,
              matchScore: matchScore
            };
          } catch (error) {
            console.error('Error getting student profile:', error);
            return null;
          }
        })
      );

      // Filter out null values and sort by match score
      return qualifiedApplicants
        .filter(applicant => applicant !== null)
        .sort((a, b) => b.matchScore - a.matchScore);
    } catch (error) {
      console.error('Error getting qualified applicants:', error);
      return [];
    }
  },

  // Update applicant status
  updateApplicantStatus: async (applicationId, status) => {
    try {
      const applicationRef = doc(db, 'jobApplications', applicationId);
      await updateDoc(applicationRef, {
        status: status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating applicant status:', error);
      throw error;
    }
  }
};

// Analytics
export const analyticsService = {
  // Get company analytics
  getCompanyAnalytics: async (companyId) => {
    try {
      // Get all company jobs
      const jobsRef = collection(db, 'jobs');
      const jobsQuery = query(jobsRef, where('companyId', '==', companyId));
      const jobsSnapshot = await getDocs(jobsQuery);
      
      const jobs = jobsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get all applications for company
      const applicationsRef = collection(db, 'jobApplications');
      const appsQuery = query(applicationsRef, where('companyId', '==', companyId));
      const appsSnapshot = await getDocs(appsQuery);
      
      const applications = appsSnapshot.docs.map(doc => doc.data());

      // Calculate analytics
      const totalJobs = jobs.length;
      const activeJobs = jobs.filter(job => job.status === 'active').length;
      const totalApplicants = applications.length;
      
      const statusCounts = applications.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      }, {});

      const topJobs = jobs
        .map(job => {
          const jobApplications = applications.filter(app => app.jobId === job.id);
          return {
            ...job,
            applicationCount: jobApplications.length
          };
        })
        .sort((a, b) => b.applicationCount - a.applicationCount)
        .slice(0, 5);

      return {
        totalJobs,
        activeJobs,
        totalApplicants,
        statusCounts,
        topJobs
      };
    } catch (error) {
      console.error('Error getting analytics:', error);
      return {
        totalJobs: 0,
        activeJobs: 0,
        totalApplicants: 0,
        statusCounts: {},
        topJobs: []
      };
    }
  }
};

// Match scoring algorithm
const calculateMatchScore = (studentData, jobData) => {
  let score = 0;
  const maxScore = 100;

  // Academic Performance (30%)
  if (studentData.academicPerformance) {
    const academicScore = (studentData.academicPerformance / 100) * 30;
    score += academicScore;
  }

  // Skills Match (40%)
  if (studentData.skills && jobData.requiredSkills) {
    const studentSkills = studentData.skills || [];
    const requiredSkills = jobData.requiredSkills || [];
    const matchedSkills = studentSkills.filter(skill => 
      requiredSkills.includes(skill)
    );
    const skillsScore = (matchedSkills.length / requiredSkills.length) * 40;
    score += skillsScore;
  }

  // Certificates (15%)
  if (studentData.certificates) {
    const certificateCount = studentData.certificates.length || 0;
    const certificatesScore = Math.min(certificateCount * 3, 15); // Max 5 certificates
    score += certificatesScore;
  }

  // Work Experience (15%)
  if (studentData.workExperience) {
    const experienceYears = studentData.workExperience.years || 0;
    const experienceScore = Math.min(experienceYears * 5, 15); // Max 3 years
    score += experienceScore;
  }

  return Math.round(Math.min(score, maxScore));
};

// Demo data for testing
export const demoCompanyService = {
  createDemoCompanyProfile: async (companyId, email) => {
    try {
      const companyRef = doc(db, 'companies', companyId);
      const demoProfile = {
        email: email,
        name: 'Your Company',
        industry: 'Technology',
        phone: '+266 1234 5678',
        address: 'Maseru, Lesotho',
        description: 'Leading technology solutions provider',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(companyRef, demoProfile);
      return demoProfile;
    } catch (error) {
      console.error('Error creating demo company profile:', error);
      throw error;
    }
  },

  createDemoJobs: async (companyId, companyName) => {
    try {
      const demoJobs = [
        {
          title: 'Software Developer',
          description: 'We are looking for a skilled Software Developer to join our team...',
          requirements: 'Bachelor\'s degree in Computer Science, 2+ years experience',
          requiredSkills: ['JavaScript', 'React', 'Node.js', 'Python'],
          location: 'Maseru, Lesotho',
          type: 'full-time',
          salary: 'Competitive',
          companyId: companyId,
          companyName: companyName,
          status: 'active'
        },
        {
          title: 'Marketing Manager',
          description: 'Seeking an experienced Marketing Manager to lead our marketing efforts...',
          requirements: 'Bachelor\'s degree in Marketing, 3+ years experience',
          requiredSkills: ['Digital Marketing', 'SEO', 'Social Media', 'Analytics'],
          location: 'Maseru, Lesotho',
          type: 'full-time',
          salary: 'Negotiable',
          companyId: companyId,
          companyName: companyName,
          status: 'active'
        }
      ];

      for (const job of demoJobs) {
        await jobsService.createJob(job);
      }

      return true;
    } catch (error) {
      console.error('Error creating demo jobs:', error);
      return false;
    }
  }
};

export default {
  companyProfileService,
  jobsService,
  applicantsService,
  analyticsService,
  demoCompanyService
};