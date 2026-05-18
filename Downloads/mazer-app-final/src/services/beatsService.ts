import { db } from '../firebase';
import { collection, doc, addDoc, setDoc, getDocs, query, orderBy, deleteDoc, onSnapshot, DocumentData } from 'firebase/firestore';

export interface BeatData {
  id: string;
  name: string;
  genre: string;
  bpm: number;
  patterns: {
    kick: number[];
    snare: number[];
    hihat: number[];
    percussion: number[];
  };
  createdAt?: string;
  updatedAt?: string;
  userId: string;
}

export async function saveBeat(userId: string, beat: BeatData): Promise<string> {
  try {
    console.log('Saving beat to Firebase', beat);
    const beatsCollection = collection(db, 'users', userId, 'beats');
    const updatedAt = new Date().toISOString();
    
    if (beat.id) {
      const beatDoc = doc(db, 'users', userId, 'beats', beat.id);
      await setDoc(beatDoc, {
        ...beat,
        updatedAt,
      }, { merge: true });
      console.log('Beat saved successfully', beat.id);
      return beat.id;
    } else {
      const docRef = await addDoc(beatsCollection, {
        ...beat,
        createdAt: updatedAt,
        updatedAt,
      });
      console.log('Beat saved successfully', docRef.id);
      return docRef.id;
    }
  } catch (error) {
    console.error('Error saving beat', error);
    throw error;
  }
}

export async function getBeats(userId: string): Promise<BeatData[]> {
  try {
    const beatsCollection = collection(db, 'users', userId, 'beats');
    const q = query(beatsCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const beats = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as BeatData[];
    
    console.log('Retrieved beats from Firebase', beats.length);
    return beats;
  } catch (error) {
    console.error('Error fetching beats', error);
    throw error;
  }
}

export async function deleteBeat(userId: string, beatId: string): Promise<void> {
  try {
    console.log('Deleting beat from Firebase', beatId);
    const beatDoc = doc(db, 'users', userId, 'beats', beatId);
    await deleteDoc(beatDoc);
    console.log('Beat deleted successfully', beatId);
  } catch (error) {
    console.error('Error deleting beat', error);
    throw error;
  }
}

export function subscribeToBeats(userId: string, callback: (beats: BeatData[]) => void): () => void {
  try {
    console.log('Subscribing to beats for user', userId);
    const beatsCollection = collection(db, 'users', userId, 'beats');
    const q = query(beatsCollection, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const beats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as BeatData[];
      console.log('Beats updated from Firebase', beats.length);
      callback(beats);
    }, (error) => {
      console.error('Error in beats subscription', error);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('Error setting up beats subscription', error);
    throw error;
  }
}
