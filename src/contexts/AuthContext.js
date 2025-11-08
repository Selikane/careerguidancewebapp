import React, { createContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp, 
  updateDoc
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // List of admin emails - you can add more here
  const adminEmails = [
    'admin@careerguidels.org',
    'administrator@careerguidels.org',
    'superadmin@careerguidels.org',
    'kabelo@admin.com',
    'test@admin.com'
  ];

  const isAdminEmail = (email) => {
    return adminEmails.includes(email.toLowerCase());
  };

  const createUserDocument = async (firebaseUser, userType = 'student') => {
    const userData = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      userType: userType,
      firstName: userType === 'admin' ? 'System' : (firebaseUser.displayName || 'User'),
      lastName: userType === 'admin' ? 'Administrator' : '',
      createdAt: serverTimestamp(),
      isVerified: firebaseUser.emailVerified || userType === 'admin',
      profileCompleted: userType === 'admin'
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), userData);
    return userData;
  };

  // Function to ensure admin user exists (called from App.js)
  const ensureAdminUserExists = async () => {
    try {
      // Try to create admin user directly
      const adminEmail = 'admin@careerguidels.org';
      const adminPassword = 'admin123456';
      
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
        const user = userCredential.user;
        
        // Create admin document
        await createUserDocument(user, 'admin');
        console.log('✅ Admin user created successfully!');
        return user;
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          console.log('ℹ️ Admin user already exists in Authentication');
          // Try to sign in to ensure document exists
          try {
            const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
            const user = userCredential.user;
            
            // Check if document exists
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (!userDoc.exists()) {
              await createUserDocument(user, 'admin');
              console.log('✅ Admin document created for existing user');
            } else {
              console.log('ℹ️ Admin document already exists');
            }
            
            // Sign out after ensuring document exists
            await signOut(auth);
            return user;
          } catch (signInError) {
            console.log('❌ Error signing in as admin:', signInError.message);
          }
        } else {
          console.log('❌ Error creating admin:', error.message);
        }
      }
    } catch (error) {
      console.log('Admin creation attempt completed');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        try {
          // Fetch user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            // User document exists - use it
            const userData = userDoc.data();
            setUserType(userData.userType);
            setUserData(userData);
            console.log('User data loaded - Type:', userData.userType, 'Email:', firebaseUser.email);
          } else {
            // User document doesn't exist - create one based on email
            console.log('User document not found, creating new user document for:', firebaseUser.email);
            
            // Determine user type based on email
            let userType = 'student';
            if (isAdminEmail(firebaseUser.email)) {
              userType = 'admin';
              console.log('🔑 Admin email detected, creating admin user');
            }
            
            // Create the user document
            const newUserData = await createUserDocument(firebaseUser, userType);
            
            setUserType(userType);
            setUserData(newUserData);
            
            console.log(`✅ New ${userType} user document created for:`, firebaseUser.email);
            
            // If it's an institution or company email, also create the respective document
            if (userType === 'institution' && newUserData.institutionName) {
              await setDoc(doc(db, 'institutions', firebaseUser.uid), {
                name: newUserData.institutionName,
                email: firebaseUser.email,
                adminId: firebaseUser.uid,
                isActive: true,
                isApproved: false,
                createdAt: serverTimestamp()
              });
            }
            
            if (userType === 'company' && newUserData.companyName) {
              await setDoc(doc(db, 'companies', firebaseUser.uid), {
                name: newUserData.companyName,
                email: firebaseUser.email,
                adminId: firebaseUser.uid,
                isActive: true,
                isApproved: false,
                createdAt: serverTimestamp()
              });
            }
          }
        } catch (error) {
          console.error('❌ Error handling user data:', error);
          // Fallback: create basic student user
          const fallbackUserData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            userType: 'student'
          };
          setUserType('student');
          setUserData(fallbackUserData);
        }
      } else {
        // No user logged in
        setUser(null);
        setUserType(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const register = async (email, password, userData) => {
    try {
      // Prevent registering admin accounts through normal registration
      if (isAdminEmail(email)) {
        throw new Error('Admin accounts cannot be created through registration. Please contact system administrator.');
      }

      // Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Create user document in Firestore
      await createUserDocument(firebaseUser, userData.userType);

      // Update user profile with display name
      const displayName = userData.firstName && userData.lastName 
        ? `${userData.firstName} ${userData.lastName}`
        : userData.institutionName || userData.companyName || '';
      
      if (displayName) {
        await updateProfile(firebaseUser, {
          displayName: displayName
        });
      }

      // Create additional records based on user type
      if (userData.userType === 'institution' && userData.institutionName) {
        await setDoc(doc(db, 'institutions', firebaseUser.uid), {
          name: userData.institutionName,
          email: email,
          phone: userData.phone || '',
          address: userData.address || '',
          website: userData.website || '',
          description: '',
          adminId: firebaseUser.uid,
          isActive: true,
          isApproved: false,
          createdAt: serverTimestamp()
        });
      }

      if (userData.userType === 'company' && userData.companyName) {
        await setDoc(doc(db, 'companies', firebaseUser.uid), {
          name: userData.companyName,
          email: email,
          phone: userData.phone || '',
          address: userData.address || '',
          website: userData.website || '',
          industry: '',
          description: '',
          adminId: firebaseUser.uid,
          isActive: true,
          isApproved: false,
          createdAt: serverTimestamp()
        });
      }

      // Update local state
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
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format. Please check your email.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please use at least 6 characters.';
          break;
        default:
          errorMessage = error.message || 'Registration failed. Please try again.';
      }
      
      throw new Error(errorMessage);
    }
  };

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // The onAuthStateChanged listener will handle user document creation/loading
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
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format.';
          break;
        default:
          errorMessage = error.message || 'Login failed. Please try again.';
      }
      
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      throw new Error('Logout failed. Please try again.');
    }
  };

  // Function to manually promote a user to admin (for super admin use)
  const promoteToAdmin = async (userId) => {
    if (!user || userData.userType !== 'admin') {
      throw new Error('Only administrators can promote users to admin.');
    }

    try {
      await updateDoc(doc(db, 'users', userId), {
        userType: 'admin',
        promotedAt: serverTimestamp(),
        promotedBy: user.uid
      });
    } catch (error) {
      throw new Error('Failed to promote user to admin.');
    }
  };

  const value = {
    user,
    userType,
    userData,
    register,
    login,
    logout,
    promoteToAdmin,
    ensureAdminUserExists, // Export this function
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};