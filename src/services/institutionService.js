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
import { db } from '../config/firebase';

// Helper function to handle Firestore errors
const handleFirestoreError = (error, defaultMessage = 'Firestore operation failed') => {
  console.error(`${defaultMessage}:`, error);
  throw new Error(defaultMessage);
};

// Applications - UPDATED TO USE courseApplications COLLECTION
export const applicationsService = {
  getApplications: (institutionId, callback) => {
    try {
      console.log('🔍 Querying courseApplications for institution:', institutionId);
      
      const q = query(
        collection(db, 'courseApplications'), // CHANGED: Using courseApplications
        where('institutionId', '==', institutionId)
      );
      
      return onSnapshot(q, 
        (snapshot) => {
          console.log('📥 Course Applications snapshot received:', snapshot.docs?.length, 'documents');
          callback(snapshot);
        },
        (error) => {
          console.error('❌ Error in courseApplications listener:', error);
          callback({ docs: [] }); // Return empty array on error
        }
      );
    } catch (error) {
      console.error('❌ Error setting up courseApplications listener:', error);
      callback({ docs: [] });
      return () => {}; // Return no-op function
    }
  },

  // UPDATED: Now uses courseApplications collection
  updateApplicationStatus: async (applicationId, status, extraData = {}) => {
    try {
      const applicationRef = doc(db, 'courseApplications', applicationId); // CHANGED
      await updateDoc(applicationRef, {
        status,
        ...extraData,
        updatedAt: serverTimestamp()
      });
      console.log('✅ Course Application status updated:', applicationId, status);
    } catch (error) {
      console.error('❌ Error updating course application:', error);
      if (error.code === 'not-found') {
        console.log('Course Application not found, creating placeholder...');
        const applicationRef = doc(db, 'courseApplications', applicationId);
        await setDoc(applicationRef, {
          status,
          ...extraData,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          institutionId: 'placeholder-institution'
        });
      } else {
        handleFirestoreError(error, 'Failed to update course application status');
      }
    }
  },

  // UPDATED: Now uses courseApplications collection
  getApplicationById: async (applicationId) => {
    try {
      const applicationRef = doc(db, 'courseApplications', applicationId); // CHANGED
      const snapshot = await getDoc(applicationRef);
      return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
    } catch (error) {
      handleFirestoreError(error, 'Failed to fetch course application');
    }
  }
};

// Courses - REMAINS THE SAME (still uses courses collection)
export const coursesService = {
  getCourses: (institutionId, callback) => {
    try {
      const q = query(
        collection(db, 'courses'),
        where('institutionId', '==', institutionId)
      );
      
      return onSnapshot(q, 
        (snapshot) => {
          console.log('📚 Courses snapshot received:', snapshot.docs?.length, 'documents');
          callback(snapshot);
        },
        (error) => {
          console.error('❌ Error in courses listener:', error);
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
      const docRef = await addDoc(coursesRef, {
        ...courseData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('✅ Course added:', docRef.id);
      return docRef;
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
      console.log('✅ Course updated:', courseId);
    } catch (error) {
      handleFirestoreError(error, 'Failed to update course');
    }
  },

  deleteCourse: async (courseId) => {
    try {
      const courseRef = doc(db, 'courses', courseId);
      await deleteDoc(courseRef);
      console.log('✅ Course deleted:', courseId);
    } catch (error) {
      handleFirestoreError(error, 'Failed to delete course');
    }
  }
};

// Institution Profile - REMAINS THE SAME
export const institutionService = {
  getInstitution: (institutionId, callback) => {
    try {
      const institutionRef = doc(db, 'institutions', institutionId);
      
      return onSnapshot(institutionRef, 
        (snapshot) => {
          console.log('🏫 Institution snapshot received:', snapshot.exists());
          callback(snapshot);
        },
        (error) => {
          console.error('❌ Error in institution listener:', error);
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
      console.log('✅ Default institution created:', institutionId);
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
      console.log('✅ Institution profile updated:', institutionId);
    } catch (error) {
      handleFirestoreError(error, 'Failed to update institution profile');
    }
  }
};

// Admissions - REMAINS THE SAME
export const admissionsService = {
  publishAdmissions: async (institutionId, academicYear) => {
    try {
      const admissionsRef = collection(db, 'admissions');
      const docRef = await addDoc(admissionsRef, {
        institutionId,
        academicYear,
        publishedAt: serverTimestamp(),
        status: 'published',
        results: {}
      });
      console.log('✅ Admissions published:', docRef.id);
      return docRef;
    } catch (error) {
      handleFirestoreError(error, 'Failed to publish admissions');
    }
  },

  getAdmissionStats: async (institutionId) => {
    console.log('Warning: getAdmissionStats is redundant; stats calculated in component.');
    return { total: 0, admitted: 0, rejected: 0, pending: 0 };
  }
};

// Demo data for testing - UPDATED TO USE courseApplications COLLECTION
export const demoService = {
  createDemoData: async (institutionId, institutionName = 'Demo Institution') => {
    try {
      console.log('🚀 Creating demo data for institution:', institutionId);
      
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

      console.log('✅ Courses created:', createdCourses.length);

      // 2. Create demo applications in courseApplications collection
      const demoApplications = [
        {
          studentName: 'John Doe',
          studentEmail: 'john.doe@example.com',
          courseId: createdCourses[0].id,
          courseName: createdCourses[0].name,
          status: 'pending',
          applicationDate: new Date('2024-01-15'),
          institutionId,
          institutionName,
          faculty: createdCourses[0].faculty
        },
        {
          studentName: 'Jane Smith',
          studentEmail: 'jane.smith@example.com',
          courseId: createdCourses[1].id,
          courseName: createdCourses[1].name,
          status: 'admitted',
          applicationDate: new Date('2024-01-10'),
          institutionId,
          institutionName,
          faculty: createdCourses[1].faculty
        },
        {
          studentName: 'Mike Johnson',
          studentEmail: 'mike.johnson@example.com',
          courseId: createdCourses[2].id,
          courseName: createdCourses[2].name,
          status: 'rejected',
          applicationDate: new Date('2024-01-08'),
          institutionId,
          institutionName,
          faculty: createdCourses[2].faculty
        }
      ];

      // CHANGED: Using courseApplications collection instead of applications
      for (const application of demoApplications) {
        const applicationsRef = collection(db, 'courseApplications'); // CHANGED
        await addDoc(applicationsRef, {
          ...application,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      console.log('✅ Demo course applications created:', demoApplications.length);
      return true;
    } catch (error) {
      console.error('❌ Error creating demo data:', error);
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