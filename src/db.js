// DevStack — Firebase Firestore Module
import { db, auth } from './firebase.js';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';

function getUserId() {
  const user = auth.currentUser;
  if (!user) throw new Error('Unauthorized');
  return user.uid;
}

// ==================== BOOKMARKS ====================
export async function addBookmark(data) {
  const uid = getUserId();
  const docRef = await addDoc(collection(db, 'bookmarks'), {
    ...data,
    userId: uid,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  return { id: docRef.id, ...data };
}

export async function getBookmarks() {
  const uid = getUserId();
  const q = query(collection(db, 'bookmarks'), where('userId', '==', uid));
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function updateBookmark(id, data) {
  const docRef = doc(db, 'bookmarks', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Date.now(),
  });
}

export async function deleteBookmark(id) {
  const docRef = doc(db, 'bookmarks', id);
  await deleteDoc(docRef);
}

// ==================== SNIPPETS ====================
export async function addSnippet(data) {
  const uid = getUserId();
  const docRef = await addDoc(collection(db, 'snippets'), {
    ...data,
    userId: uid,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  return { id: docRef.id, ...data };
}

export async function getSnippets() {
  const uid = getUserId();
  const q = query(collection(db, 'snippets'), where('userId', '==', uid));
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function updateSnippet(id, data) {
  const docRef = doc(db, 'snippets', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Date.now(),
  });
}

export async function deleteSnippet(id) {
  const docRef = doc(db, 'snippets', id);
  await deleteDoc(docRef);
}

// ==================== NOTES ====================
export async function addNote(data) {
  const uid = getUserId();
  const docRef = await addDoc(collection(db, 'notes'), {
    ...data,
    userId: uid,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  return { id: docRef.id, ...data };
}

export async function getNotes() {
  const uid = getUserId();
  const q = query(collection(db, 'notes'), where('userId', '==', uid));
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return items.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
}

export async function updateNote(id, data) {
  const docRef = doc(db, 'notes', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Date.now(),
  });
}

export async function deleteNote(id) {
  const docRef = doc(db, 'notes', id);
  await deleteDoc(docRef);
}

// ==================== NOTIFICATIONS ====================
export async function getNotifications() {
  try {
    const uid = getUserId();
    const q = query(collection(db, 'notifications'), where('userId', '==', uid), limit(50));
    const snap = await getDocs(q);
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  } catch (err) {
    console.warn('Could not fetch notifications from Firestore:', err.message);
    return [];
  }
}

export async function addNotification(data) {
  try {
    const uid = getUserId();
    const docRef = await addDoc(collection(db, 'notifications'), {
      ...data,
      userId: uid,
      read: false,
      timestamp: Date.now(),
    });
    return { id: docRef.id, ...data, read: false, timestamp: Date.now() };
  } catch (err) {
    console.warn('Could not add notification:', err.message);
    return null;
  }
}

export async function markNotificationAsRead(id) {
  try {
    const docRef = doc(db, 'notifications', id);
    await updateDoc(docRef, { read: true });
  } catch (err) {
    console.warn('Could not mark notification as read:', err.message);
  }
}

export async function deleteNotification(id) {
  try {
    const docRef = doc(db, 'notifications', id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Could not delete notification:', err.message);
  }
}
