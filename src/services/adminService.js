// Removed emojis from log messages and comments. All comments are now clear and direct.
import { 
  collection, 
  doc, 
  getDocs, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Admin-specific functions
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
      type: 'institution'
    }));

    const companies = companiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      type: 'company'
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
      approvedAt: new Date()
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
      rejectedAt: new Date()
    });
  } catch (error) {
    console.error('Error rejecting entity:', error);
    throw error;
  }
};

export const updateInstitutionStatus = async (institutionId, status) => {
  try {
    await updateDoc(doc(db, 'institutions', institutionId), {
      isActive: status === 'active',
      statusUpdatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating institution status:', error);
    throw error;
  }
};

export const updateCompanyStatus = async (companyId, status) => {
  try {
    await updateDoc(doc(db, 'companies', companyId), {
      isActive: status === 'active',
      statusUpdatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating company status:', error);
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
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

// Export all functions from firestoreService
export * from './firestoreService';