// Removed emojis from log messages and comments. All comments are now clear and direct.
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

export const applicantsService = {
  // Get real-time updates for company applicants
  getCompanyApplicants: (companyId, callback) => {
    try {
      const q = query(
        collection(db, 'jobApplications'),
        where('companyId', '==', companyId),
        orderBy('applicationDate', 'desc')
      );
      return onSnapshot(
        q,
        (snapshot) => {
          if (callback) callback(snapshot);
        },
        (error) => {
          console.error('Error fetching applicants:', error);
          if (callback) callback(null);
        }
      );
    } catch (error) {
      console.error('Error setting up applicants listener:', error);
      if (callback) callback(null);
    }
  },

  // Get qualified applicants for a specific job
  getQualifiedApplicants: async (jobId) => {
    try {
      // Fetch qualified applicants for a job
      const snapshot = await db.collection('jobApplications')
        .where('jobId', '==', jobId)
        .orderBy('applicationDate', 'desc')
        .get();

      const applicants = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Add match score calculation
      const applicantsWithScores = applicants.map(applicant => ({
        ...applicant,
        matchScore: calculateMatchScore(applicant)
      }));

      return applicantsWithScores.sort((a, b) => b.matchScore - a.matchScore);
    } catch (error) {
      console.error('Error getting qualified applicants:', error);
      return [];
    }
  },

  // Update applicant status
  updateApplicantStatus: async (applicationId, status) => {
    try {
      await db.collection('jobApplications').doc(applicationId).update({
        status: status,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error('Error updating applicant status:', error);
      throw error;
    }
  },

  // Get applicants for a specific job
  getJobApplicants: (jobId, callback) => {
    return db.collection('jobApplications')
      .where('jobId', '==', jobId)
      .orderBy('applicationDate', 'desc')
      .onSnapshot(
        (snapshot) => {
          if (callback) callback(snapshot);
        },
        (error) => {
          console.error('Error fetching job applicants:', error);
          if (callback) callback(null);
        }
      );
  }
};

// Simple match score calculation
const calculateMatchScore = (applicant) => {
  let score = 50; // Base score
  // For demo, return a random score between 60-95
  score = Math.floor(Math.random() * 36) + 60;
  return Math.min(100, score);
};