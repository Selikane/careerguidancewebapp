// src/services/studentService.js
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
import { db, storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Safe callback wrapper
const safeCallback = (callback, data) => {
  if (typeof callback === 'function') {
    callback(data);
  }
};

// Student Applications
const studentApplicationsService = {
  // Get all applications for a student
  getStudentApplications: (studentId, callback) => {
    try {
      const q = query(
        collection(db, 'courseApplications'),
        where('studentId', '==', studentId),
        orderBy('applicationDate', 'desc')
      );
      
      return onSnapshot(q, 
        (snapshot) => {
          safeCallback(callback, snapshot);
        },
        (error) => {
          console.log('Applications collection might not exist yet:', error);
          safeCallback(callback, { docs: [] });
        }
      );
    } catch (error) {
      console.error('Error setting up applications listener:', error);
      safeCallback(callback, { docs: [] });
    }
  },

  // Apply for a course
  applyForCourse: async (applicationData) => {
    try {
      // Check if student has already applied to 2 courses at this institution
      const applicationsRef = collection(db, 'courseApplications');
      const q = query(
        applicationsRef,
        where('studentId', '==', applicationData.studentId),
        where('institutionId', '==', applicationData.institutionId)
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.size >= 2) {
        throw new Error('You can only apply to a maximum of 2 courses per institution');
      }

      // Check if already applied to this course
      const existingApplication = snapshot.docs.find(doc => 
        doc.data().courseId === applicationData.courseId
      );

      if (existingApplication) {
        throw new Error('You have already applied to this course');
      }

      // Create application
      const result = await addDoc(applicationsRef, {
        ...applicationData,
        applicationDate: serverTimestamp(),
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return result;
    } catch (error) {
      console.error('Error applying for course:', error);
      throw error;
    }
  },

  // Withdraw application
  withdrawApplication: async (applicationId) => {
    try {
      const applicationRef = doc(db, 'courseApplications', applicationId);
      await deleteDoc(applicationRef);
    } catch (error) {
      console.error('Error withdrawing application:', error);
      throw error;
    }
  }
};

// Job Applications
const jobApplicationsService = {
  // Apply for a job
  applyForJob: async (applicationData) => {
    try {
      const applicationsRef = collection(db, 'jobApplications');
      const result = await addDoc(applicationsRef, {
        ...applicationData,
        applicationDate: serverTimestamp(),
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return result;
    } catch (error) {
      console.error('Error applying for job:', error);
      throw error;
    }
  },

  // Get student's job applications
  getStudentJobApplications: (studentId, callback) => {
    try {
      const q = query(
        collection(db, 'jobApplications'),
        where('studentId', '==', studentId),
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
      console.error('Error setting up job applications listener:', error);
      safeCallback(callback, { docs: [] });
    }
  }
};

// Student Profile
const studentProfileService = {
  // Get student profile
  getStudentProfile: (studentId, callback) => {
    try {
      const studentRef = doc(db, 'students', studentId);
      
      return onSnapshot(studentRef, 
        (snapshot) => {
          safeCallback(callback, snapshot);
        },
        (error) => {
          console.log('Student profile error:', error);
          safeCallback(callback, { exists: () => false });
        }
      );
    } catch (error) {
      console.error('Error setting up student profile listener:', error);
      safeCallback(callback, { exists: () => false });
    }
  },

  // Update student profile
  updateStudentProfile: async (studentId, profileData) => {
    try {
      const studentRef = doc(db, 'students', studentId);
      await setDoc(studentRef, {
        ...profileData,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating student profile:', error);
      throw error;
    }
  },

  // Upload document
  uploadDocument: async (studentId, file, documentType) => {
    try {
      // Create unique filename
      const fileExtension = file.name.split('.').pop();
      const fileName = `${documentType}_${studentId}_${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, `students/${studentId}/documents/${fileName}`);
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Update student profile with document reference
      const studentRef = doc(db, 'students', studentId);
      await updateDoc(studentRef, {
        [`documents.${documentType}`]: {
          url: downloadURL,
          fileName: file.name,
          uploadedAt: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });

      return downloadURL;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  }
};

// Courses and Jobs
const coursesService = {
  // Get all available courses
  getAvailableCourses: (callback) => {
    try {
      const q = query(
        collection(db, 'courses'),
        orderBy('createdAt', 'desc')
      );
      
      return onSnapshot(q, 
        (snapshot) => {
          safeCallback(callback, snapshot);
        },
        (error) => {
          console.log('Courses collection might not exist yet:', error);
          safeCallback(callback, { docs: [] });
        }
      );
    } catch (error) {
      console.error('Error setting up courses listener:', error);
      safeCallback(callback, { docs: [] });
    }
  },

  // Get course by ID
  getCourseById: async (courseId) => {
    try {
      const courseRef = doc(db, 'courses', courseId);
      const snapshot = await getDoc(courseRef);
      return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
    } catch (error) {
      console.error('Error getting course:', error);
      throw error;
    }
  }
};

const jobsService = {
  // Get all available jobs
  getAvailableJobs: (callback) => {
    try {
      const q = query(
        collection(db, 'jobs'),
        where('status', '==', 'active'),
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

  // Get job matches based on student profile
  getJobMatches: async (studentId) => {
    try {
      // Get student profile to determine matches
      const studentRef = doc(db, 'students', studentId);
      const studentSnapshot = await getDoc(studentRef);
      
      if (!studentSnapshot.exists()) {
        return [];
      }

      const studentData = studentSnapshot.data();
      
      // Get all active jobs
      const jobsRef = collection(db, 'jobs');
      const q = query(jobsRef, where('status', '==', 'active'));
      const jobsSnapshot = await getDocs(q);
      
      const jobs = jobsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Simple matching algorithm
      const matches = jobs.map(job => {
        let matchScore = 50; // Base score
        
        // Add points based on skills match
        if (studentData.skills && job.requiredSkills) {
          const studentSkills = studentData.skills || [];
          const requiredSkills = job.requiredSkills || [];
          const matchedSkills = studentSkills.filter(skill => 
            requiredSkills.includes(skill)
          );
          matchScore += (matchedSkills.length / requiredSkills.length) * 30;
        }
        
        // Add points for education level
        if (studentData.educationLevel && job.minEducation) {
          const educationLevels = ['high_school', 'diploma', 'bachelors', 'masters', 'phd'];
          const studentLevel = educationLevels.indexOf(studentData.educationLevel);
          const requiredLevel = educationLevels.indexOf(job.minEducation);
          
          if (studentLevel >= requiredLevel) {
            matchScore += 20;
          }
        }

        return {
          ...job,
          matchScore: Math.min(Math.round(matchScore), 100)
        };
      });

      return matches.sort((a, b) => b.matchScore - a.matchScore);
    } catch (error) {
      console.error('Error getting job matches:', error);
      return [];
    }
  }
};

// Notifications
const notificationsService = {
  // Get student notifications
  getStudentNotifications: (studentId, callback) => {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('studentId', '==', studentId),
        orderBy('createdAt', 'desc')
      );
      
      return onSnapshot(q, 
        (snapshot) => {
          safeCallback(callback, snapshot);
        },
        (error) => {
          console.log('Notifications collection might not exist yet:', error);
          safeCallback(callback, { docs: [] });
        }
      );
    } catch (error) {
      console.error('Error setting up notifications listener:', error);
      safeCallback(callback, { docs: [] });
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }
};

// Demo data for testing
const demoStudentService = {
  createDemoStudentProfile: async (studentId, email) => {
    try {
      const studentRef = doc(db, 'students', studentId);
      const demoProfile = {
        email: email,
        firstName: 'Student',
        lastName: 'User',
        phone: '+266 1234 5678',
        address: 'Maseru, Lesotho',
        educationLevel: 'bachelors',
        skills: ['JavaScript', 'React', 'Node.js', 'Python'],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(studentRef, demoProfile);
      return demoProfile;
    } catch (error) {
      console.error('Error creating demo student profile:', error);
      throw error;
    }
  }
};

// Export all services
export {
  studentApplicationsService,
  jobApplicationsService,
  studentProfileService,
  coursesService,
  jobsService,
  notificationsService,
  demoStudentService
};

// Default export for backward compatibility
export default {
  studentApplicationsService,
  jobApplicationsService,
  studentProfileService,
  coursesService,
  jobsService,
  notificationsService,
  demoStudentService
};