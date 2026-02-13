import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth'
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

export async function createUserWithRole(email, password, fullName, role) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  const user = userCredential.user

  await updateProfile(user, {
    displayName: fullName
  })

  const actionCodeSettings = {
    url: `${window.location.origin}/login`,
    handleCodeInApp: true,
    iOS: {
      bundleId: 'com.clinicmanagement.app'
    },
    android: {
      packageName: 'com.clinicmanagement.app',
      installApp: true,
      minimumVersion: '12'
    },
    dynamicLinkDomain: import.meta.env.VITE_FIREBASE_DYNAMIC_LINK_DOMAIN || undefined
  }

  await sendEmailVerification(user, actionCodeSettings)

  // Store user data in appropriate collection based on role
  const collectionName = role === 'patient' ? 'patientData' : 'staffData'
  await setDoc(doc(db, collectionName, user.uid), {
    uid: user.uid,
    email: user.email,
    fullName: fullName,
    role: role,
    emailVerified: false,
    createdAt: new Date().toISOString(),
    lastLogin: null,
    verificationEmailSent: new Date().toISOString()
  })

  return user
}

export async function signInUser(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  const user = userCredential.user

  if (user.uid) {
    // Check if the user document exists in staffData or patientData
    const staffDocRef = doc(db, 'staffData', user.uid)
    const patientDocRef = doc(db, 'patientData', user.uid)
    
    const staffDoc = await getDoc(staffDocRef)
    const patientDoc = await getDoc(patientDocRef)
    
    if (staffDoc.exists()) {
      // Update lastLogin for staff users
      await updateDoc(staffDocRef, {
        lastLogin: new Date().toISOString()
      })
    } else if (patientDoc.exists()) {
      // Update lastLogin for patient users
      await updateDoc(patientDocRef, {
        lastLogin: new Date().toISOString()
      })
    }
    // If neither exists, don't create any document - user data should have been created during signup
  }

  return user
}

export async function resetUserPassword(email) {
  return await sendPasswordResetEmail(auth, email)
}

export async function resendUserVerificationEmail(user) {
  const actionCodeSettings = {
    url: `${window.location.origin}/login`,
    handleCodeInApp: true,
    iOS: {
      bundleId: 'com.clinicmanagement.app'
    },
    android: {
      packageName: 'com.clinicmanagement.app',
      installApp: true,
      minimumVersion: '12'
    },
    dynamicLinkDomain: import.meta.env.VITE_FIREBASE_DYNAMIC_LINK_DOMAIN || undefined
  }
  
  return await sendEmailVerification(user, actionCodeSettings)
}

export async function fetchUserRoleFromFirestore(uid) {
  try {
    // Check staffData collection first (for doctors and receptionists)
    const staffDoc = await getDoc(doc(db, 'staffData', uid))
    if (staffDoc.exists()) {
      return staffDoc.data().role
    }
    
    // Check patientData collection (for patients)
    const patientDoc = await getDoc(doc(db, 'patientData', uid))
    if (patientDoc.exists()) {
      return patientDoc.data().role
    }
    
    return null
  } catch (error) {
    console.error('Error fetching user role:', error)
    return null
  }
}


