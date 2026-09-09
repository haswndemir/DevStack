// DevStack — Firebase Auth Module
import { auth, db } from './firebase.js';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  runTransaction 
} from 'firebase/firestore';

/**
 * Normalizes username for consistent, case-insensitive uniqueness check.
 */
export function normalizeUsername(username) {
  if (!username) return '';
  return username.trim().toLowerCase();
}

/**
 * Recovers or initializes a missing Firestore user profile for an existing Firebase Auth user (Zombie account recovery).
 */
export async function recoverUserProfile(user) {
  if (!user || !user.uid) return null;
  const userDocRef = doc(db, 'users', user.uid);
  
  try {
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      return userSnap.data();
    }

    // Profile missing: Create profile safely
    const fallbackUsername = (user.email ? user.email.split('@')[0] : 'user')
      .replace(/[^a-zA-Z0-9_]/g, '')
      .slice(0, 15) || 'user';
    const normalized = normalizeUsername(fallbackUsername);

    // Attempt to claim username in transaction
    const finalUsername = await runTransaction(db, async (transaction) => {
      const uRef = doc(db, 'usernames', normalized);
      const uSnap = await transaction.get(uRef);
      let targetUsername = fallbackUsername;

      if (uSnap.exists() && uSnap.data().uid !== user.uid) {
        // Conflict: Append random suffix
        targetUsername = `${fallbackUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
        const targetNorm = normalizeUsername(targetUsername);
        const altRef = doc(db, 'usernames', targetNorm);
        transaction.set(altRef, { uid: user.uid, createdAt: Date.now() });
      } else {
        transaction.set(uRef, { uid: user.uid, createdAt: Date.now() });
      }

      const profileData = {
        email: user.email || '',
        displayName: user.displayName || targetUsername,
        username: targetUsername,
        usernameNormalized: normalizeUsername(targetUsername),
        createdAt: Date.now()
      };
      transaction.set(userDocRef, profileData);
      return targetUsername;
    });

    return {
      email: user.email,
      displayName: user.displayName || finalUsername,
      username: finalUsername,
      createdAt: Date.now()
    };
  } catch (err) {
    console.warn('Profile recovery error (proceeding with auth user):', err);
    return null;
  }
}

/**
 * Registers a new user:
 * 1. Creates Firebase Auth user via createUserWithEmailAndPassword
 * 2. In atomic Firestore transaction: ensures normalized username uniqueness and creates user document
 * 3. If Firestore fails: executes rollback by deleting the created Auth user
 */
export async function registerUser(email, password, displayName, username) {
  const normUsername = normalizeUsername(username);
  if (!normUsername || normUsername.length < 3) {
    throw new Error('Kullanıcı adı en az 3 karakter olmalıdır.');
  }

  // Step 1: Create Firebase Auth user first (calling accounts:signUp)
  let userCredential;
  try {
    userCredential = await createUserWithEmailAndPassword(auth, email, password);
  } catch (authError) {
    throw authError;
  }

  const user = userCredential.user;

  // Step 2: Atomic Firestore reservation & profile creation
  try {
    await updateProfile(user, { displayName }).catch((e) => console.warn('updateProfile warning:', e));

    await runTransaction(db, async (transaction) => {
      const usernameDocRef = doc(db, 'usernames', normUsername);
      const usernameSnap = await transaction.get(usernameDocRef);

      if (usernameSnap.exists() && usernameSnap.data().uid !== user.uid) {
        throw new Error('USERNAME_TAKEN');
      }

      // Reserve username
      transaction.set(usernameDocRef, {
        uid: user.uid,
        username: username.trim(),
        createdAt: Date.now()
      });

      // Create user profile
      const userDocRef = doc(db, 'users', user.uid);
      transaction.set(userDocRef, {
        email,
        displayName: displayName.trim(),
        username: username.trim(),
        usernameNormalized: normUsername,
        createdAt: Date.now()
      });
    });

    return { ...user, username: username.trim() };
  } catch (firestoreError) {
    console.error('Registration Firestore transaction failed, initiating rollback:', firestoreError);

    // Rollback created Firebase Auth account
    try {
      await deleteUser(user);
      console.log('Rollback successful: temporary Auth user deleted.');
    } catch (rollbackError) {
      console.warn('Rollback deleteUser could not be completed:', rollbackError);
    }

    if (firestoreError.message === 'USERNAME_TAKEN') {
      throw new Error('Bu kullanıcı adı zaten kullanılıyor.');
    }

    // Check for client network/extension blocker
    const errStr = String(firestoreError?.message || firestoreError);
    if (errStr.includes('BLOCKED_BY_CLIENT') || errStr.includes('blocked') || firestoreError?.code === 'failed-precondition') {
      throw new Error('BLOCKED_BY_CLIENT');
    }

    throw new Error('REGISTRATION_FAILED');
  }
}

export async function loginUser(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function logoutUser() {
  await signOut(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null);
      return;
    }

    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        callback({ ...user, username: data.username, displayName: data.displayName || user.displayName });
      } else {
        // Zombie account recovery: User exists in Auth but missing Firestore doc
        const recovered = await recoverUserProfile(user);
        if (recovered) {
          callback({ ...user, username: recovered.username, displayName: recovered.displayName || user.displayName });
        } else {
          callback(user);
        }
      }
    } catch (error) {
      console.warn("Firestore profil çekme hatası (auth user ile devam ediliyor):", error);
      callback(user);
    }
  });
}

export function getCurrentUser() {
  return auth.currentUser;
}

export async function updateUserProfile(data) {
  const user = auth.currentUser;
  if (!user) throw new Error('Kullanıcı bulunamadı');

  const updates = {};

  if (data.username) {
    const norm = normalizeUsername(data.username);
    const userDocRef = doc(db, 'users', user.uid);

    await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userDocRef);
      const currentNorm = userSnap.exists() ? normalizeUsername(userSnap.data().username) : '';

      if (currentNorm !== norm) {
        const newUsernameRef = doc(db, 'usernames', norm);
        const newUsernameSnap = await transaction.get(newUsernameRef);
        if (newUsernameSnap.exists() && newUsernameSnap.data().uid !== user.uid) {
          throw new Error('Bu kullanıcı adı zaten kullanılıyor.');
        }

        // Release old username reservation if exists
        if (currentNorm) {
          transaction.delete(doc(db, 'usernames', currentNorm));
        }

        // Claim new
        transaction.set(newUsernameRef, {
          uid: user.uid,
          username: data.username.trim(),
          createdAt: Date.now()
        });

        updates.username = data.username.trim();
        updates.usernameNormalized = norm;
      }
    });
  }

  if (data.displayName) {
    await updateProfile(user, { displayName: data.displayName });
    updates.displayName = data.displayName;
  }

  if (Object.keys(updates).length > 0) {
    await updateDoc(doc(db, 'users', user.uid), updates);
  }
}

export async function changePassword(currentPassword, newPassword) {
  const user = auth.currentUser;
  if (!user) throw new Error('Kullanıcı bulunamadı');

  // Re-authenticate
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  
  // Update password
  await updatePassword(user, newPassword);
}
