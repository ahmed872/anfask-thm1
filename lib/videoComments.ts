// lib/videoComments.ts

import { db } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  orderBy,
  query
} from 'firebase/firestore';

export interface VideoComment {
  id?: string;
  name: string;
  email: string;
  message: string;
  timestamp?: any;
}

// إضافة تعليق جديد
export async function addVideoComment(comment: Omit<VideoComment, 'id' | 'timestamp'>) {
  const col = collection(db, 'videoComments');
  await addDoc(col, {
    ...comment,
    timestamp: serverTimestamp()
  });
}

// جلب كل التعليقات مرتبة من الأحدث للأقدم
export async function getAllVideoComments(): Promise<VideoComment[]> {
  const col = collection(db, 'videoComments');
  const q = query(col, orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);

  return snap.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as Omit<VideoComment, 'id'>)
  }));
}
