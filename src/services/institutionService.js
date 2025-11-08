// src/services/institutionService.js
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
import { db } from '../config/firebase'; // Updated path

// Helper function to handle Firestore errors
const handleFirestoreError = (error, defaultMessage = 'Firestore operation failed') => {
  console.error(`${defaultMessage}:`, error);
  throw new Error(defaultMessage);
};

// Applications
export const applicationsService = {
  getApplications: (institutionId, callback) => {
    try {
      const q = query(
        collection(db, 'applications'),
        where('institutionId', '==', institutionId),
        orderBy('applicationDate', 'desc')
      );
      
      return onSnapshot(q, 
        (snapshot) => {
          callback(snapshot);
        },
        (error) => {
          console.log('Applications collection might not exist yet:', error);
          callback({ docs: [] });
        }
      );
    } catch (error) {
      handleFirestoreError(error, 'Failed to fetch applications');
    }
  },

  updateApplicationStatus: async (applicationId, status) => {
    try {
      const applicationRef = doc(db, 'applications', applicationId);
      await updateDoc(applicationRef, {
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      if (error.code === 'not-found') {
        console.log('Application not found, creating new one...');
        const applicationRef = doc(db, 'applications', applicationId);
        await setDoc(applicationRef, {
          status,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          institutionId: 'demo-institution'
        });
      } else {
        handleFirestoreError(error, 'Failed to update application status');
      }
    }
  },

  getApplicationById: async (applicationId) => {
    try {
      const applicationRef = doc(db, 'applications', applicationId);
      const snapshot = await getDoc(applicationRef);
      return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
    } catch (error) {
      handleFirestoreError(error, 'Failed to fetch application');
    }
  }
};

// Courses
export const coursesService = {
  getCourses: (institutionId, callback) => {
    try {
      const q = query(
        collection(db, 'courses'),
        where('institutionId', '==', institutionId),
        orderBy('createdAt', 'desc')
      );
      
      return onSnapshot(q, 
        (snapshot) => {
          callback(snapshot);
        },
        (error) => {
          console.log('Courses collection might not exist yet:', error);
          callback({ docs: [] });
        }
      );
    } catch (error) {
      handleFirestoreError(error, 'Failed to fetch courses');
    }
  },

  addCourse: async (courseData) => {
    try {
      const coursesRef = collection(db, 'courses');
      return await addDoc(coursesRef, {
        ...courseData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, 'Failed to add course');
    }
  },

  updateCourse: async (courseId, courseData) => {
    try {
      const courseRef = doc(db, 'courses', courseId);
      await updateDoc(courseRef, {
        ...courseData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, 'Failed to update course');
    }
  },

  deleteCourse: async (courseId) => {
    try {
      const courseRef = doc(db, 'courses', courseId);
      await deleteDoc(courseRef);
    } catch (error) {
      handleFirestoreError(error, 'Failed to delete course');
    }
  }
};

// Institution Profile
export const institutionService = {
  getInstitution: (institutionId, callback) => {
    try {
      const institutionRef = doc(db, 'institutions', institutionId);
      
      return onSnapshot(institutionRef, 
        async (snapshot) => {
          if (!snapshot.exists()) {
            await institutionService.createDefaultInstitution(institutionId);
          } else {
            callback(snapshot);
          }
        },
        (error) => {
          console.log('Institution document error:', error);
        }
      );
    } catch (error) {
      handleFirestoreError(error, 'Failed to fetch institution');
    }
  },

  createDefaultInstitution: async (institutionId) => {
    try {
      const institutionRef = doc(db, 'institutions', institutionId);
      const defaultInstitution = {
        name: 'Your Institution Name',
        email: '',
        phone: '',
        address: '',
        website: '',
        type: 'university',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(institutionRef, defaultInstitution);
      return defaultInstitution;
    } catch (error) {
      handleFirestoreError(error, 'Failed to create institution profile');
    }
  },

  updateInstitution: async (institutionId, profileData) => {
    try {
      const institutionRef = doc(db, 'institutions', institutionId);
      await setDoc(institutionRef, {
        ...profileData,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, 'Failed to update institution profile');
    }
  }
};

// Admissions
export const admissionsService = {
  publishAdmissions: async (institutionId, academicYear) => {
    try {
      const admissionsRef = collection(db, 'admissions');
      return await addDoc(admissionsRef, {
        institutionId,
        academicYear,
        publishedAt: serverTimestamp(),
        status: 'published',
        results: {}
      });
    } catch (error) {
      handleFirestoreError(error, 'Failed to publish admissions');
    }
  },

  getAdmissionStats: async (institutionId) => {
    try {
      const applicationsRef = collection(db, 'applications');
      const q = query(
        applicationsRef,
        where('institutionId', '==', institutionId)
      );
      
      const snapshot = await getDocs(q);
      const applications = snapshot.docs.map(doc => doc.data());
      
      return {
        total: applications.length,
        admitted: applications.filter(app => app.status === 'admitted').length,
        rejected: applications.filter(app => app.status === 'rejected').length,
        pending: applications.filter(app => app.status === 'pending').length
      };
    } catch (error) {
      console.log('Error getting admission stats, returning defaults:', error);
      return {
        total: 0,
        admitted: 0,
        rejected: 0,
        pending: 0
      };
    }
  }
};

// Demo data for testing
export const demoService = {
  createDemoData: async (institutionId) => {
    try {
      // Create demo courses
      const demoCourses = [
        {
          name: 'Computer Science',
          faculty: 'Science & Technology',
          capacity: 50,
          duration: '4 years',
          requirements: 'High school diploma with mathematics and physics',
          fee: 2500,
          currentApplications: 12,
          institutionId
        },
        {
          name: 'Business Administration',
          faculty: 'Business School',
          capacity: 60,
          duration: '4 years',
          requirements: 'High school diploma with mathematics',
          fee: 2200,
          currentApplications: 8,
          institutionId
        },
        {
          name: 'Electrical Engineering',
          faculty: 'Engineering',
          capacity: 40,
          duration: '4 years',
          requirements: 'High school diploma with mathematics and physics',
          fee: 2800,
          currentApplications: 5,
          institutionId
        }
      ];

      for (const course of demoCourses) {
        await coursesService.addCourse(course);
      }

      // Create demo applications
      const demoApplications = [
        {
          studentName: 'John Doe',
          studentEmail: 'john.doe@example.com',
          courseName: 'Computer Science',
          status: 'pending',
          applicationDate: new Date('2024-01-15'),
          institutionId
        },
        {
          studentName: 'Jane Smith',
          studentEmail: 'jane.smith@example.com',
          courseName: 'Business Administration',
          status: 'admitted',
          applicationDate: new Date('2024-01-10'),
          institutionId
        },
        {
          studentName: 'Mike Johnson',
          studentEmail: 'mike.johnson@example.com',
          courseName: 'Electrical Engineering',
          status: 'rejected',
          applicationDate: new Date('2024-01-08'),
          institutionId
        }
      ];

      for (const application of demoApplications) {
        const applicationsRef = collection(db, 'applications');
        await addDoc(applicationsRef, {
          ...application,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      return true;
    } catch (error) {
      console.error('Error creating demo data:', error);
      return false;
    }
  }
};

export default {
  applicationsService,
  coursesService,
  institutionService,
  admissionsService,
  demoService
};