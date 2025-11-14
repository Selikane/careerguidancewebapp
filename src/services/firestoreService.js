import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  addDoc,
  serverTimestamp,
  increment,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Removed emojis from log messages and comments. All comments are now clear and direct.

// User Management
export const createUserDocument = async (user, additionalData) => {
  if (!user) return;

  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    const { email } = user;
    const createdAt = new Date();

    try {
      await setDoc(userRef, {
        uid: user.uid,
        email,
        createdAt,
        ...additionalData
      });
    } catch (error) {
      console.error('Error creating user document:', error);
    }
  }

  return getUserDocument(user.uid);
};

export const getUserDocument = async (uid) => {
  if (!uid) return null;

  try {
    const userDocument = await getDoc(doc(db, 'users', uid));
    return userDocument.exists() ? userDocument.data() : null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};

export const updateUserDocument = async (uid, data) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user document:', error);
    throw error;
  }
};

// Institution Management
export const createInstitution = async (institutionData) => {
  try {
    const docRef = await addDoc(collection(db, 'institutions'), {
      ...institutionData,
      createdAt: serverTimestamp(),
      isActive: true,
      isApproved: false
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating institution:', error);
    throw error;
  }
};

export const getInstitutions = async () => {
  try {
    const q = query(
      collection(db, 'institutions'), 
      orderBy('name')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      createdAt: doc.data().createdAt || null
    }));
  } catch (error) {
    console.error('Error getting institutions:', error);
    throw error;
  }
};

export const getInstitutionById = async (institutionId) => {
  try {
    const docSnap = await getDoc(doc(db, 'institutions', institutionId));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  } catch (error) {
    console.error('Error getting institution:', error);
    throw error;
  }
};

export const updateInstitutionStatus = async (institutionId, status) => {
  try {
    await updateDoc(doc(db, 'institutions', institutionId), {
      isActive: status === 'active',
      statusUpdatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating institution status:', error);
    throw error;
  }
};

// Course Management
export const createCourse = async (courseData) => {
  try {
    const docRef = await addDoc(collection(db, 'courses'), {
      ...courseData,
      currentApplications: 0,
      createdAt: serverTimestamp(),
      isActive: true
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
};

export const getCourses = async (institutionId = null) => {
  try {
    let q;
    if (institutionId) {
      q = query(
        collection(db, 'courses'), 
        where('institutionId', '==', institutionId),
        where('isActive', '==', true),
        orderBy('name')
      );
    } else {
      q = query(
        collection(db, 'courses'), 
        where('isActive', '==', true),
        orderBy('name')
      );
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      createdAt: doc.data().createdAt || null,
      deadline: doc.data().deadline || null
    }));
  } catch (error) {
    console.error('Error getting courses:', error);
    throw error;
  }
};

export const getCourseById = async (courseId) => {
  try {
    const docSnap = await getDoc(doc(db, 'courses', courseId));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  } catch (error) {
    console.error('Error getting course:', error);
    throw error;
  }
};

// Application Management
export const createCourseApplication = async (applicationData) => {
  try {
    // Check if student already applied to this course
    const existingApps = await getStudentApplications(applicationData.studentId);
    const alreadyApplied = existingApps.some(app => 
      app.courseId === applicationData.courseId && 
      app.status !== 'rejected'
    );

    if (alreadyApplied) {
      throw new Error('You have already applied to this course');
    }

    // Check application limit per institution
    const institutionApps = existingApps.filter(app => 
      app.institutionId === applicationData.institutionId && 
      app.status !== 'rejected'
    );

    if (institutionApps.length >= 2) {
      throw new Error('Maximum of 2 applications per institution allowed');
    }

    const docRef = await addDoc(collection(db, 'courseApplications'), {
      ...applicationData,
      createdAt: serverTimestamp(),
      status: 'pending'
    });

    // Increment application count for the course
    await updateDoc(doc(db, 'courses', applicationData.courseId), {
      currentApplications: increment(1)
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating course application:', error);
    throw error;
  }
};

export const getStudentApplications = async (studentId) => {
  try {
    const q = query(
      collection(db, 'courseApplications'), 
      where('studentId', '==', studentId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      createdAt: doc.data().createdAt || null
    }));
  } catch (error) {
    console.error('Error getting student applications:', error);
    throw error;
  }
};

export const getInstitutionApplications = async (institutionId) => {
  try {
    const q = query(
      collection(db, 'courseApplications'), 
      where('institutionId', '==', institutionId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      createdAt: doc.data().createdAt || null
    }));
  } catch (error) {
    console.error('Error getting institution applications:', error);
    throw error;
  }
};

export const updateApplicationStatus = async (applicationId, status) => {
  try {
    await updateDoc(doc(db, 'courseApplications', applicationId), {
      status,
      updatedAt: serverTimestamp(),
      reviewedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    throw error;
  }
};

// Company Management
export const createCompany = async (companyData) => {
  try {
    const docRef = await addDoc(collection(db, 'companies'), {
      ...companyData,
      createdAt: serverTimestamp(),
      isActive: true,
      isApproved: false
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating company:', error);
    throw error;
  }
};

export const getCompanies = async () => {
  try {
    const q = query(
      collection(db, 'companies'), 
      orderBy('name')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      createdAt: doc.data().createdAt || null
    }));
  } catch (error) {
    console.error('Error getting companies:', error);
    throw error;
  }
};

export const updateCompanyStatus = async (companyId, status) => {
  try {
    await updateDoc(doc(db, 'companies', companyId), {
      isActive: status === 'active',
      statusUpdatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating company status:', error);
    throw error;
  }
};

// Job Management
export const createJob = async (jobData) => {
  try {
    const docRef = await addDoc(collection(db, 'jobs'), {
      ...jobData,
      createdAt: serverTimestamp(),
      isActive: true,
      status: 'active'
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating job:', error);
    throw error;
  }
};

export const getJobs = async (companyId = null) => {
  try {
    let q;
    if (companyId) {
      q = query(
        collection(db, 'jobs'), 
        where('companyId', '==', companyId),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'jobs'), 
        where('isActive', '==', true),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      createdAt: doc.data().createdAt || null,
      applicationDeadline: doc.data().applicationDeadline || null
    }));
  } catch (error) {
    console.error('Error getting jobs:', error);
    throw error;
  }
};

// Admin Functions
export const getPendingApprovals = async () => {
  try {
    const institutionsQuery = query(
      collection(db, 'institutions'), 
      where('isApproved', '==', false),
      where('isActive', '==', true)
    );
    const companiesQuery = query(
      collection(db, 'companies'), 
      where('isApproved', '==', false),
      where('isActive', '==', true)
    );

    const [institutionsSnapshot, companiesSnapshot] = await Promise.all([
      getDocs(institutionsQuery),
      getDocs(companiesQuery)
    ]);

    const institutions = institutionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      type: 'institution',
      createdAt: doc.data().createdAt || null
    }));

    const companies = companiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      type: 'company',
      createdAt: doc.data().createdAt || null
    }));

    return [...institutions, ...companies];
  } catch (error) {
    console.error('Error getting pending approvals:', error);
    throw error;
  }
};

export const approveEntity = async (entityType, entityId) => {
  try {
    const collectionName = entityType === 'institution' ? 'institutions' : 'companies';
    await updateDoc(doc(db, collectionName, entityId), {
      isApproved: true,
      approvedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error approving entity:', error);
    throw error;
  }
};

export const rejectEntity = async (entityType, entityId) => {
  try {
    const collectionName = entityType === 'institution' ? 'institutions' : 'companies';
    await updateDoc(doc(db, collectionName, entityId), {
      isActive: false,
      rejectedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error rejecting entity:', error);
    throw error;
  }
};

export const getUsersByType = async (userType) => {
  try {
    const q = query(
      collection(db, 'users'), 
      where('userType', '==', userType),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      createdAt: doc.data().createdAt || null
    }));
  } catch (error) {
    console.error('Error getting users by type:', error);
    throw error;
  }
};

export const getSystemStats = async () => {
  try {
    const [
      usersSnapshot,
      institutionsSnapshot,
      companiesSnapshot,
      jobsSnapshot,
      courseApplicationsSnapshot
    ] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(query(collection(db, 'institutions'), where('isActive', '==', true))),
      getDocs(query(collection(db, 'companies'), where('isActive', '==', true))),
      getDocs(query(collection(db, 'jobs'), where('isActive', '==', true))),
      getDocs(collection(db, 'courseApplications'))
    ]);

    return {
      totalUsers: usersSnapshot.size,
      totalInstitutions: institutionsSnapshot.size,
      totalCompanies: companiesSnapshot.size,
      jobPostings: jobsSnapshot.size,
      courseApplications: courseApplicationsSnapshot.size,
      activeApplications: courseApplicationsSnapshot.docs.filter(doc => 
        doc.data().status === 'pending'
      ).length
    };
  } catch (error) {
    console.error('Error getting system stats:', error);
    throw error;
  }
};

export const generateReport = async (reportType) => {
  try {
    // This would typically generate a PDF or CSV report
    // For now, we'll return a mock URL
    const reportData = {
      users: '/reports/users-report.pdf',
      applications: '/reports/applications-report.pdf',
      system: '/reports/system-report.pdf'
    };
    
    return reportData[reportType] || '/reports/default-report.pdf';
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};