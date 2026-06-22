// DevStack — Firebase Auth Module
import { auth, db } from './firebase.js';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { doc, getDoc, setDoc, query, collection, where, getDocs, updateDoc } from 'firebase/firestore';

export async function registerUser(email, password, displayName, username) {
  // Check if username is taken
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('username', '==', username));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    throw new Error('Bu kullanıcı adı zaten kullanılıyor.');
  }

  // Create auth user
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Update Auth Profile
  await updateProfile(user, { displayName });

  // Store extra user info in Firestore
  await setDoc(doc(db, 'users', user.uid), {
    email,
    displayName,
    username,
    createdAt: Date.now()
  });

  return { ...user, username };
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
    try {
      if (user) {
        // Fetch extra data from Firestore
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          callback({ ...user, username: data.username, displayName: data.displayName || user.displayName });
        } else {
          callback(user);
        }
      } else {
        callback(null);
      }
    } catch (error) {
      console.error("Auth state change error:", error);
      callback(null);
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
  
  // Check username uniqueness if changed
  if (data.username) {
    const docRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().username !== data.username) {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', data.username));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        throw new Error('Bu kullanıcı adı zaten kullanılıyor.');
      }
      updates.username = data.username;
    }
  }

  if (data.displayName) {
    await updateProfile(user, { displayName: data.displayName });
    updates.displayName = data.displayName;
  }

  // Update Firestore
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
