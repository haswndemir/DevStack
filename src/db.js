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
  orderBy 
} from 'firebase/firestore';

function getUserId() {
  const user = auth.currentUser;
  if (!user) throw new Error('Giriş yapılmamış');
  return user.uid;
}

// ==================== YER İMLERİ ====================
export async function addBookmark(data) {
  const uid = getUserId();
  const docRef = await addDoc(collection(db, 'bookmarks'), {
    ...data,
    userId: uid,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
  return { id: docRef.id, ...data };
}

export async function getBookmarks() {
  const uid = getUserId();
  const q = query(collection(db, 'bookmarks'), where('userId', '==', uid));
  const snap = await getDocs(q);
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return items.sort((a, b) => b.createdAt - a.createdAt);
}

export async function updateBookmark(id, data) {
  const docRef = doc(db, 'bookmarks', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Date.now()
  });
}

export async function deleteBookmark(id) {
  const docRef = doc(db, 'bookmarks', id);
  await deleteDoc(docRef);
}

// ==================== SNIPPETLAR ====================
export async function addSnippet(data) {
  const uid = getUserId();
  const docRef = await addDoc(collection(db, 'snippets'), {
    ...data,
    userId: uid,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
  return { id: docRef.id, ...data };
}

export async function getSnippets() {
  const uid = getUserId();
  const q = query(collection(db, 'snippets'), where('userId', '==', uid));
  const snap = await getDocs(q);
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return items.sort((a, b) => b.createdAt - a.createdAt);
}

export async function updateSnippet(id, data) {
  const docRef = doc(db, 'snippets', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Date.now()
  });
}

export async function deleteSnippet(id) {
  const docRef = doc(db, 'snippets', id);
  await deleteDoc(docRef);
}

// ==================== NOTLAR ====================
export async function addNote(data) {
  const uid = getUserId();
  const docRef = await addDoc(collection(db, 'notes'), {
    ...data,
    userId: uid,
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
  return { id: docRef.id, ...data };
}

export async function getNotes() {
  const uid = getUserId();
  const q = query(collection(db, 'notes'), where('userId', '==', uid));
  const snap = await getDocs(q);
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return items.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function updateNote(id, data) {
  const docRef = doc(db, 'notes', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Date.now()
  });
}

export async function deleteNote(id) {
  const docRef = doc(db, 'notes', id);
  await deleteDoc(docRef);
}
