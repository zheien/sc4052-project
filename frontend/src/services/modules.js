import { getDocs, collection, query, where, orderBy } from "firebase/firestore";
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
