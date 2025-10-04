import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const userRef = doc(db, 'users', username);
  const userSnap = await getDoc(userRef);
  return !userSnap.exists();
}

export async function registerUser(username: string, data: any) {
  const userRef = doc(db, 'users', username);
  await setDoc(userRef, data);
}
