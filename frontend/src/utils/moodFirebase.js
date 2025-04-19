// Utility for saving dynamic module data (mood, water intake, etc.) once per day per user in Firestore

/**
 * Get the mood for a user for today.
 * @param {string} userId
 * @returns {Promise<Array<string>|null>} returns emojis array or null if not found
 */
export async function getMoodForToday(userId) {
  if (!userId) return null;
  const today = new Date().toISOString().slice(0, 10);
  const docRef = doc(collection(db, 'moods'), `${userId}_${today}`);
  try {
    console.log('[getMoodForToday] userId:', userId, 'today:', today, 'docRef:', docRef.path);
    const docSnap = await getDoc(docRef);
    console.log('[getMoodForToday] docSnap.exists():', docSnap.exists());
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('[getMoodForToday] docSnap.data():', data);
      // Prefer new format: moods property (object of moods)
      if (data && typeof data.moods === 'object') {
        return data.moods;
      }
      // Fallback: old format (single emojis array)
      if (Array.isArray(data.emojis)) {
        // Try to infer the field label from the first emoji field (for backward compatibility)
        return { mood: data.emojis };
      }
      return null;
    }
    return null;
  } catch (error) {
    console.error('[getMoodForToday] error:', error);
    return null;
  }
}


import { db } from '../firebase'
import { collection, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

/**
 * Save data for a dynamic module (mood, water intake, etc.) for a user for today. Only allows one entry per user per date.
 * @param {string} userId
 * @param {Object} moods - key-value pairs of module field data
 * @returns {Promise<{success: boolean, updated: boolean, error?: any}>}
 */
export async function saveMoodForToday(userId, moods) {
  if (!userId) return { success: false, error: 'No userId' }
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const docRef = doc(collection(db, 'moods'), `${userId}_${today}`)
  try {
    console.log('[saveMoodForToday] userId:', userId, 'today:', today, 'docRef:', docRef.path, 'moods:', moods);
    const docSnap = await getDoc(docRef)
    let mergedMoods = { ...moods };
    let updated = false;
    if (docSnap.exists()) {
      // Merge with existing moods
      const existing = docSnap.data();
      if (existing && typeof existing.moods === 'object') {
        mergedMoods = { ...existing.moods, ...moods };
        updated = true;
      }
    }
    await setDoc(docRef, {
      userId,
      moods: mergedMoods,
      date: today,
      createdAt: serverTimestamp()
    });
    return { success: true, updated }
  } catch (error) {
    console.error('[saveMoodForToday] error:', error);
    return { success: false, error }
  }
}

