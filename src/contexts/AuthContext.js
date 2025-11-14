import React, { createContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  applyActionCode
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

  // ADD PASSWORD RESET FUNCTION
  const resetPassword = async (email) => {
    try {
      // Check if it's an admin email
      if (isAdminEmail(email)) {
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

  // ADD RESEND VERIFICATION FUNCTION
  const resendVerificationEmail = async () => {
    try {
      if (!auth.currentUser) {
        throw new Error('No user is currently signed in.');
      }
      await sendEmailVerification(auth.currentUser);
    } catch (error) {
      throw new Error('Failed to send verification email: ' + error.message);
    }
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
        // CRITICAL: Check email verification status before setting user
        await firebaseUser.reload(); // Refresh to get latest email verification status
        
        if (!firebaseUser.emailVerified && !isAdminEmail(firebaseUser.email)) {
          // If email is not verified and not admin, don't set user and sign out
          console.log('❌ Email not verified, signing out user:', firebaseUser.email);
          await signOut(auth);
          setUser(null);
          setUserType(null);
          setUserData(null);
          setLoading(false);
          return;
        }

        // Only set user if email is verified or it's an admin account
        setUser(firebaseUser);
        
        try {
          // Fetch user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            // User document exists - use it
            const userData = userDoc.data();
            setUserType(userData.userType);
            setUserData(userData);
            console.log('User data loaded - Type:', userData.userType, 'Email:', firebaseUser.email, 'Verified:', firebaseUser.emailVerified);
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

      // Send email verification immediately after registration
      await sendEmailVerification(firebaseUser);

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

      // IMPORTANT: Sign out the user immediately after registration
      await signOut(auth);

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
      const firebaseUser = userCredential.user;
      
      // Check if email is verified (admin accounts are exempt)
      await firebaseUser.reload(); // Refresh to get latest verification status
      
      if (!firebaseUser.emailVerified && !isAdminEmail(email)) {
        // Sign out the user immediately since email is not verified
        await signOut(auth);
        throw new Error('Please verify your email address before logging in. Check your inbox for the verification email.');
      }
      
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
    resetPassword,
    resendVerificationEmail,
    promoteToAdmin,
    ensureAdminUserExists,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};