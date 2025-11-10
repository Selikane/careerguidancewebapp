import { 
  collection, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
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
      // Removed orderBy to prevent runtime index errors. Client-side sorting is preferred.
      const q = query(
        collection(db, 'applications'),
        where('institutionId', '==', institutionId)
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

  // FIX: Added 'extraData' parameter to save institutionName or other application data
  updateApplicationStatus: async (applicationId, status, extraData = {}) => {
    try {
      const applicationRef = doc(db, 'applications', applicationId);
      await updateDoc(applicationRef, {
        status,
        ...extraData, // Merge the extra data (like institutionName)
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      if (error.code === 'not-found') {
        console.log('Application not found, attempting to create one with placeholder data...');
        const applicationRef = doc(db, 'applications', applicationId);
        await setDoc(applicationRef, {
          status,
          ...extraData,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          institutionId: 'placeholder-institution'
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
      // Removed orderBy to prevent runtime index errors. Client-side sorting is preferred.
      const q = query(
        collection(db, 'courses'),
        where('institutionId', '==', institutionId)
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
      // Returns DocumentReference which includes the new ID
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
      
      // Removed the internal createDefaultInstitution call to prevent potential recursion/auth race conditions.
      // The component handles the non-existence check and creation via the setup wizard.
      return onSnapshot(institutionRef, 
        (snapshot) => {
          callback(snapshot);
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
    // NOTE: This function uses getDocs which is a one-time read, but the component uses onSnapshot for applications, 
    // so this service function is now redundant as the component calculates stats from the live snapshot.
    console.log('Warning: getAdmissionStats is redundant; stats calculated in component.');
    return { total: 0, admitted: 0, rejected: 0, pending: 0 };
  }
};

// Demo data for testing
export const demoService = {
  // FIX: Added institutionName to correctly link demo applications
  createDemoData: async (institutionId, institutionName = 'Demo Institution') => {
    try {
      const coursesToCreate = [
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
      
      const createdCourses = [];
      // 1. Create courses and collect their generated IDs
      for (const course of coursesToCreate) {
        const docRef = await coursesService.addCourse(course);
        createdCourses.push({ id: docRef.id, ...course });
      }

      // 2. Create demo applications using the collected Course IDs
      const demoApplications = [
        {
          studentName: 'John Doe',
          studentEmail: 'john.doe@example.com',
          courseId: createdCourses[0].id, // FIX: Use ID for filtering
          courseName: createdCourses[0].name,
          status: 'pending',
          applicationDate: new Date('2024-01-15'),
          institutionId,
          institutionName // FIX: Added institutionName
        },
        {
          studentName: 'Jane Smith',
          studentEmail: 'jane.smith@example.com',
          courseId: createdCourses[1].id, // FIX: Use ID for filtering
          courseName: createdCourses[1].name,
          status: 'admitted',
          applicationDate: new Date('2024-01-10'),
          institutionId,
          institutionName
        },
        {
          studentName: 'Mike Johnson',
          studentEmail: 'mike.johnson@example.com',
          courseId: createdCourses[2].id, // FIX: Use ID for filtering
          courseName: createdCourses[2].name,
          status: 'rejected',
          applicationDate: new Date('2024-01-08'),
          institutionId,
          institutionName
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