// Removed emojis from log messages and comments. All comments are now clear and direct.

import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export const initializeSampleData = async () => {
  try {
    // Check if sample data already exists
    const institutions = await getInstitutions();
    if (institutions.length > 0) {
      console.log('Sample data already exists');
      return;
    }

    console.log('Creating sample data for Career Guidance Lesotho...');

    // Create sample institutions in Lesotho
    const institution1 = await addDoc(collection(db, 'institutions'), {
      name: 'Limkokwing University of Creative Technology',
      email: 'info@limkokwing.ac.ls',
      phone: '+266 2231 3785',
      address: 'Maseru, Lesotho',
      description: 'A leading international university focusing on creative education and innovation',
      website: 'https://www.limkokwing.ac.ls',
      isActive: true,
      isApproved: true,
      createdAt: serverTimestamp()
    });

    const institution2 = await addDoc(collection(db, 'institutions'), {
      name: 'National University of Lesotho',
      email: 'info@nul.ls',
      phone: '+266 2234 0600',
      address: 'Roma, Maseru, Lesotho',
      description: 'The premier institution of higher learning in Lesotho offering diverse programs',
      website: 'https://www.nul.ls',
      isActive: true,
      isApproved: true,
      createdAt: serverTimestamp()
    });

    const institution3 = await addDoc(collection(db, 'institutions'), {
      name: 'Lesotho College of Education',
      email: 'admissions@lce.ac.ls',
      phone: '+266 2232 1567',
      address: 'Maseru, Lesotho',
      description: 'Leading teacher training institution in Lesotho',
      website: 'https://www.lce.ac.ls',
      isActive: true,
      isApproved: true,
      createdAt: serverTimestamp()
    });

    // Create sample courses for Limkokwing
    await addDoc(collection(db, 'courses'), {
      name: 'Bachelor of Business in Information Technology',
      institutionId: institution1.id,
      institutionName: 'Limkokwing University of Creative Technology',
      faculty: 'Information Technology',
      duration: '3 years',
      requirements: 'Mathematics and English with minimum C grade, Computer Studies preferred',
      capacity: 50,
      currentApplications: 0,
      description: 'Combines business principles with IT skills for modern digital enterprises',
      isActive: true,
      deadline: new Date('2024-12-31'),
      createdAt: serverTimestamp()
    });

    await addDoc(collection(db, 'courses'), {
      name: 'Bachelor of Design in Graphic Design',
      institutionId: institution1.id,
      institutionName: 'Limkokwing University of Creative Technology',
      faculty: 'Creative Arts',
      duration: '3 years',
      requirements: 'Art/Design background preferred, portfolio review required',
      capacity: 30,
      currentApplications: 0,
      description: 'Develop creative skills in visual communication, branding, and digital design',
      isActive: true,
      deadline: new Date('2024-12-31'),
      createdAt: serverTimestamp()
    });

    await addDoc(collection(db, 'courses'), {
      name: 'Bachelor of Business Administration',
      institutionId: institution1.id,
      institutionName: 'Limkokwing University of Creative Technology',
      faculty: 'Business',
      duration: '3 years',
      requirements: 'Mathematics and English with minimum C grade',
      capacity: 60,
      currentApplications: 0,
      description: 'Comprehensive business management education with entrepreneurial focus',
      isActive: true,
      deadline: new Date('2024-12-31'),
      createdAt: serverTimestamp()
    });

    // Create sample courses for NUL
    await addDoc(collection(db, 'courses'), {
      name: 'Bachelor of Science in Computer Science',
      institutionId: institution2.id,
      institutionName: 'National University of Lesotho',
      faculty: 'Science and Technology',
      duration: '4 years',
      requirements: 'Mathematics and Physical Science with minimum B grade',
      capacity: 60,
      currentApplications: 0,
      description: 'Comprehensive computer science and programming education with research focus',
      isActive: true,
      deadline: new Date('2024-12-31'),
      createdAt: serverTimestamp()
    });

    await addDoc(collection(db, 'courses'), {
      name: 'Bachelor of Commerce',
      institutionId: institution2.id,
      institutionName: 'National University of Lesotho',
      faculty: 'Business',
      duration: '4 years',
      requirements: 'Mathematics and English with minimum C grade',
      capacity: 80,
      currentApplications: 0,
      description: 'Traditional commerce education with accounting and finance specializations',
      isActive: true,
      deadline: new Date('2024-12-31'),
      createdAt: serverTimestamp()
    });

    // Create sample courses for LCE
    await addDoc(collection(db, 'courses'), {
      name: 'Bachelor of Education',
      institutionId: institution3.id,
      institutionName: 'Lesotho College of Education',
      faculty: 'Education',
      duration: '4 years',
      requirements: 'English with minimum C grade, teaching aptitude',
      capacity: 100,
      currentApplications: 0,
      description: 'Professional teacher training program for secondary education',
      isActive: true,
      deadline: new Date('2024-12-31'),
      createdAt: serverTimestamp()
    });

    // Create sample companies in Lesotho
    const company1 = await addDoc(collection(db, 'companies'), {
      name: 'Standard Bank Lesotho',
      email: 'careers@standardbank.co.ls',
      phone: '+266 2231 3555',
      address: 'Kingsway, Maseru, Lesotho',
      industry: 'Finance',
      description: 'Leading financial services provider in Lesotho',
      website: 'https://www.standardbank.co.ls',
      isActive: true,
      isApproved: true,
      createdAt: serverTimestamp()
    });

    const company2 = await addDoc(collection(db, 'companies'), {
      name: 'Vodacom Lesotho',
      email: 'recruitment@vodacom.co.ls',
      phone: '+266 2231 2700',
      address: 'Pioneer Road, Maseru, Lesotho',
      industry: 'Telecommunications',
      description: 'Premier telecommunications company in Lesotho',
      website: 'https://www.vodacom.co.ls',
      isActive: true,
      isApproved: true,
      createdAt: serverTimestamp()
    });

    const company3 = await addDoc(collection(db, 'companies'), {
      name: 'Lesotho Government',
      email: 'psc@gov.ls',
      phone: '+266 2231 2575',
      address: 'Government Complex, Maseru, Lesotho',
      industry: 'Government',
      description: 'Public service employment opportunities',
      website: 'https://www.gov.ls',
      isActive: true,
      isApproved: true,
      createdAt: serverTimestamp()
    });

    // Create sample jobs - Use the company IDs we just created
    await addDoc(collection(db, 'jobs'), {
      title: 'IT Support Specialist',
      companyId: company1.id,
      companyName: 'Standard Bank Lesotho',
      location: 'Maseru, Lesotho',
      industry: 'Finance',
      type: 'Full-time',
      salary: 'M12,000 - M18,000',
      requirements: 'IT Diploma, 2+ years experience, networking knowledge',
      description: 'Provide technical support for banking systems and infrastructure',
      applicationDeadline: new Date('2024-06-30'),
      isActive: true,
      status: 'active',
      createdAt: serverTimestamp()
    });

    await addDoc(collection(db, 'jobs'), {
      title: 'Marketing Officer',
      companyId: company2.id,
      companyName: 'Vodacom Lesotho',
      location: 'Maseru, Lesotho',
      industry: 'Telecommunications',
      type: 'Full-time',
      salary: 'M10,000 - M15,000',
      requirements: 'Marketing degree, 1+ years experience, creative skills',
      description: 'Develop and implement marketing campaigns for telecom products',
      applicationDeadline: new Date('2024-07-15'),
      isActive: true,
      status: 'active',
      createdAt: serverTimestamp()
    });

    await addDoc(collection(db, 'jobs'), {
      title: 'Administrative Assistant',
      companyId: company3.id,
      companyName: 'Lesotho Government',
      location: 'Maseru, Lesotho',
      industry: 'Government',
      type: 'Full-time',
      salary: 'M8,000 - M12,000',
      requirements: 'Diploma in Office Administration, computer skills',
      description: 'Provide administrative support in government ministries',
      applicationDeadline: new Date('2024-06-20'),
      isActive: true,
      status: 'active',
      createdAt: serverTimestamp()
    });

    console.log('Sample data for Career Guidance Lesotho created successfully!');
  } catch (error) {
    console.error('Error creating sample data:', error);
  }
};

// Helper functions
const getInstitutions = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'institutions'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting institutions:', error);
    return [];
  }
};