import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  Timestamp,
  orderBy,
  serverTimestamp,
  updateDoc,
  deleteField
} from 'firebase/firestore';
// Add user to active users list for a room
export async function addActiveUser(room: 'male' | 'female', username: string) {
  const userRef = doc(db, 'activeUsers', `${room}_${username}`);
  await setDoc(userRef, {
    room,
    username,
    lastActive: serverTimestamp()
  });
}

// Remove user from active users list for a room
export async function removeActiveUser(room: 'male' | 'female', username: string) {
  const userRef = doc(db, 'activeUsers', `${room}_${username}`);
  await deleteDoc(userRef);
}

// Get count of active users in a room (last 3 minutes)
export async function getActiveUsersCount(room: 'male' | 'female') {
  const col = collection(db, 'activeUsers');
  const now = Date.now();
  const threeMinAgo = new Date(now - 3 * 60 * 1000);
  const q = query(col, where('room', '==', room));
  const snap = await getDocs(q);
  let count = 0;
  snap.forEach(docSnap => {
    const data = docSnap.data();
    if (data.lastActive && data.lastActive.toDate && data.lastActive.toDate() > threeMinAgo) {
      count++;
    }
  });
  return count;
}

// Escape HTML to prevent XSS
export function escapeHTML(str: string) {
  return str.replace(/[&<>'"/]/g, (tag) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#39;',
    '/': '&#x2F;'
  }[tag] || tag));
}

// Get today's date string (YYYY-MM-DD)
export function getTodayString() {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

// Add a chat message for a room and day
export async function addChatMessage(room: 'male' | 'female', username: string, text: string) {
  const today = getTodayString();
  // Store message under chat/{room}/messages
  const col1 = collection(db, `chat/${room}/messages`);
  const col2 = collection(db, 'chatMessages');
  const message = {
    room,
    username: escapeHTML(username),
    text: escapeHTML(text),
    timestamp: serverTimestamp()
  };
  await Promise.all([
    addDoc(col1, message),
    addDoc(col2, message)
  ]);
}

// Get all messages for today for a room
export async function getTodayMessages(room: 'male' | 'female') {
  const today = getTodayString();
  // Fetch messages from chat/{room}/messages
  const col = collection(db, `chat/${room}/messages`);
  const q = query(col, orderBy('timestamp', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(doc => doc.data());
}

// Delete all previous days' messages for a room (run once per day)
export async function deleteOldMessages(room: 'male' | 'female') {
  // Correct path: chat/{room}/messages
  const chatsCol = collection(db, `chat/${room}/messages`);
  const today = getTodayString();
  const q = query(chatsCol);
  const snap = await getDocs(q);
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    if (data.timestamp && data.timestamp.toDate) {
      const messageDate = data.timestamp.toDate();
      if (messageDate.toISOString().slice(0, 10) !== today) {
        await deleteDoc(doc(db, `chat/${room}/messages`, docSnap.id));
      }
    }
  }
}


