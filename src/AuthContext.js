import React, { createContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail  // ADD THIS IMPORT
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isHardcodedAdminSession, setIsHardcodedAdminSession] = useState(false);

  // Hardcoded admin credentials - COMPLETELY BYPASSES FIREBASE
  const HARDCODED_ADMINS = [
    {
      email: 'systemadmin@gmail.com',
      password: 'admin',
      userType: 'admin',
      firstName: 'System',
      lastName: 'Administrator',
      uid: 'hardcoded-admin-001'
    },
    {
      email: 'admin@careerguidels.org',
      password: 'admin123456',
      userType: 'admin',
      firstName: 'Career',
      lastName: 'Admin',
      uid: 'hardcoded-admin-002'
    },
    {
      email: 'kabelo@admin.com',
      password: 'admin',
      userType: 'admin',
      firstName: 'Kabelo',
      lastName: 'Admin',
      uid: 'hardcoded-admin-003'
    }
  ];

  // Check if credentials match hardcoded admin
  const isHardcodedAdmin = (email, password) => {
    return HARDCODED_ADMINS.some(admin => 
      admin.email.toLowerCase() === email.toLowerCase() && 
      admin.password === password
    );
  };

  // Get hardcoded admin data
  const getHardcodedAdmin = (email) => {
    return HARDCODED_ADMINS.find(admin => 
      admin.email.toLowerCase() === email.toLowerCase()
    );
  };

  // Mock Firebase user object for hardcoded admins
  const createMockAdminUser = (adminData) => {
    return {
      uid: adminData.uid,
      email: adminData.email,
      displayName: `${adminData.firstName} ${adminData.lastName}`,
      emailVerified: true,
      isAnonymous: false,
      metadata: {},
      providerData: [],
      refreshToken: '',
      tenantId: null,
      delete: async () => {},
      getIdToken: async () => 'mock-admin-token',
      getIdTokenResult: async () => ({}),
      reload: async () => {},
      toJSON: () => ({})
    };
  };

  // Completely bypass Firebase for hardcoded admin login
  const loginHardcodedAdmin = async (email, password) => {
    console.log('🔐 Attempting hardcoded admin login for:', email);
    
    const admin = getHardcodedAdmin(email);
    if (!admin || admin.password !== password) {
      throw new Error('Invalid admin credentials');
    }

    // Create mock user object
    const mockUser = createMockAdminUser(admin);
    
    // Set admin session state
    setIsHardcodedAdminSession(true);
    setUser(mockUser);
    setUserType('admin');
    setUserData({
      uid: admin.uid,
      email: admin.email,
      userType: 'admin',
      firstName: admin.firstName,
      lastName: admin.lastName,
      isVerified: true,
      profileCompleted: true
    });

    // Store in localStorage for persistence
    localStorage.setItem('hardcodedAdminSession', JSON.stringify({
      email: admin.email,
      loginTime: new Date().toISOString()
    }));

    console.log('✅ Hardcoded admin login successful:', admin.email);
    return { user: mockUser };
  };

  // Logout for hardcoded admin
  const logoutHardcodedAdmin = () => {
    setIsHardcodedAdminSession(false);
    setUser(null);
    setUserType(null);
    setUserData(null);
    localStorage.removeItem('hardcodedAdminSession');
    console.log('✅ Hardcoded admin logged out');
  };

  // ADD PASSWORD RESET FUNCTION
  const resetPassword = async (email) => {
    try {
      // Check if it's a hardcoded admin email
      if (getHardcodedAdmin(email)) {
        throw new Error('Password reset is not available for administrator accounts. Please contact system administrator.');
      }

      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      let errorMessage = 'Failed to send reset email. ';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage += 'No user found with this email address.';
          break;
        case 'auth/invalid-email':
          errorMessage += 'Invalid email address.';
          break;
        case 'auth/too-many-requests':
          errorMessage += 'Too many attempts. Please try again later.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage += 'Password reset is not enabled. Please contact support.';
          break;
        default:
          errorMessage += 'Please try again.';
      }
      throw new Error(errorMessage);
    }
  };

  // Check for existing hardcoded admin session on page load
  useEffect(() => {
    const checkExistingHardcodedSession = () => {
      const storedSession = localStorage.getItem('hardcodedAdminSession');
      if (storedSession) {
        try {
          const session = JSON.parse(storedSession);
          const admin = getHardcodedAdmin(session.email);
          if (admin) {
            console.log('🔄 Restoring hardcoded admin session:', admin.email);
            const mockUser = createMockAdminUser(admin);
            setIsHardcodedAdminSession(true);
            setUser(mockUser);
            setUserType('admin');
            setUserData({
              uid: admin.uid,
              email: admin.email,
              userType: 'admin',
              firstName: admin.firstName,
              lastName: admin.lastName,
              isVerified: true,
              profileCompleted: true
            });
            setLoading(false);
            return true;
          }
        } catch (error) {
          console.log('❌ Error restoring hardcoded session:', error);
          localStorage.removeItem('hardcodedAdminSession');
        }
      }
      return false;
    };

    // First check for hardcoded admin session
    const hasHardcodedSession = checkExistingHardcodedSession();
    
    if (!hasHardcodedSession) {
      // Only setup Firebase listener if no hardcoded session exists
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
          
          try {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setUserType(userData.userType);
              setUserData(userData);
              console.log('Firebase user authenticated - Type:', userData.userType);
            } else {
              console.log('No user document found for Firebase user:', firebaseUser.email);
              setUserType('student');
              setUserData({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                userType: 'student'
              });
            }
          } catch (error) {
            console.error('Error fetching Firebase user data:', error);
            setUserType('student');
            setUserData({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              userType: 'student'
            });
          }
        } else {
          setUser(null);
          setUserType(null);
          setUserData(null);
        }
        setLoading(false);
      });

      return unsubscribe;
    }
  }, []);

  const register = async (email, password, userData) => {
    try {
      // Prevent registration with hardcoded admin emails
      if (getHardcodedAdmin(email)) {
        throw new Error('This email is reserved for system administrators. Please use a different email.');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      await setDoc(doc(db, 'users', firebaseUser.uid), {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        userType: userData.userType,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        institutionName: userData.institutionName || '',
        companyName: userData.companyName || '',
        phone: userData.phone || '',
        address: userData.address || '',
        website: userData.website || '',
        createdAt: serverTimestamp(),
        isVerified: false,
        profileCompleted: true
      });

      const displayName = userData.firstName && userData.lastName 
        ? `${userData.firstName} ${userData.lastName}`
        : userData.institutionName || userData.companyName || '';
      
      if (displayName) {
        await updateProfile(firebaseUser, {
          displayName: displayName
        });
      }

      setUser(firebaseUser);
      setUserType(userData.userType);
      setUserData({
        ...userData,
        uid: firebaseUser.uid,
        email: firebaseUser.email
      });

      return userCredential;
    } catch (error) {
      let errorMessage = 'Registration failed. Please try again.';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already registered. Please use a different email or login.';
          break;
        default:
          errorMessage = error.message || 'Registration failed. Please try again.';
      }
      
      throw new Error(errorMessage);
    }
  };

  const login = async (email, password) => {
    // FIRST check if it's a hardcoded admin - COMPLETELY BYPASS FIREBASE
    if (isHardcodedAdmin(email, password)) {
      return await loginHardcodedAdmin(email, password);
    }

    // If not hardcoded admin, use regular Firebase authentication
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (error) {
      let errorMessage = 'Login failed. Please check your credentials.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email. Please register first.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Invalid credentials. Please check your email and password.';
          break;
        default:
          errorMessage = error.message || 'Login failed. Please try again.';
      }
      
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    // Check if it's a hardcoded admin session
    if (isHardcodedAdminSession) {
      logoutHardcodedAdmin();
    } else {
      // Regular Firebase logout
      try {
        await signOut(auth);
      } catch (error) {
        throw new Error('Logout failed. Please try again.');
      }
    }
  };

  const value = {
    user,
    userType,
    userData,
    register,
    login,
    logout,
    resetPassword,  // ADD THIS TO THE CONTEXT VALUE
    loading,
    isHardcodedAdminSession
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};