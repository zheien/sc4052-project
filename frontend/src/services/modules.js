import { getDocs, collection, query, where, orderBy, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/firebase";

export async function fetchModules() {
  const q = query(
    collection(db, "modules"),
    where("enabled", "==", true),
    orderBy("order")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Delete a module by id from Firestore
export async function deleteModule(moduleId) {
  const moduleRef = doc(db, "modules", moduleId);
  await deleteDoc(moduleRef);
}
