import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export const createAdminUser = async () => {
  try {
    const adminEmail = 'admin@careerguidels.org';
    const adminPassword = 'admin123456';

    // Try to create admin user in Firebase Authentication
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      const user = userCredential.user;
      
      // Create admin user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        userType: 'admin',
        firstName: 'System',
        lastName: 'Administrator',
        createdAt: serverTimestamp(),
        isVerified: true,
        profileCompleted: true
      });
      
      console.log('✅ Admin user created successfully!');
      console.log('Email: admin@careerguidels.org');
      console.log('Password: admin123456');
      console.log('User ID:', user.uid);
      
      return user;
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('ℹ️ Admin user already exists in Authentication');
        
        // Try to sign in to ensure the Firestore document exists
        try {
          const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
          const user = userCredential.user;
          
          // Check if Firestore document exists
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (!userDoc.exists()) {
            // Create the admin document if it doesn't exist
            await setDoc(doc(db, 'users', user.uid), {
              uid: user.uid,
              email: user.email,
              userType: 'admin',
              firstName: 'System',
              lastName: 'Administrator',
              createdAt: serverTimestamp(),
              isVerified: true,
              profileCompleted: true
            });
            console.log('✅ Admin document created for existing user');
          } else {
            console.log('ℹ️ Admin document already exists');
            const userData = userDoc.data();
            console.log('Current user type:', userData.userType);
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
    console.log('Admin creation process completed');
  }
};