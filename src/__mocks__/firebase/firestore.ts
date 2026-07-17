type DocData = Record<string, unknown>;
type DocRef = { _docPath: string; _colPath: string };
type ColRef = { _colPath: string };
type SnapshotCallback = (snapshot: { docs: { data: () => DocData; id: string }[] }) => void;

const store = new Map<string, DocData>();
const colListeners = new Map<string, SnapshotCallback[]>();

function notifyListeners(colPath: string) {
  const callbacks = colListeners.get(colPath) ?? [];
  const prefix = colPath + '/';
  const docs = [...store.entries()]
    .filter(([k]) => k.startsWith(prefix) && !k.slice(prefix.length).includes('/'))
    .map(([k, v]) => ({
      data: () => ({ ...v }),
      id: k.slice(prefix.length),
    }));
  callbacks.forEach((cb) => cb({ docs }));
}

export function getFirestore() {
  return { _mock: true };
}

export function collection(_db: unknown, path: string): ColRef {
  return { _colPath: path };
}

export function doc(_db: unknown, path: string, id: string): DocRef {
  return { _docPath: `${path}/${id}`, _colPath: path };
}

export function onSnapshot(colRef: ColRef, callback: SnapshotCallback) {
  const key = colRef._colPath;
  if (!colListeners.has(key)) colListeners.set(key, []);
  colListeners.get(key)!.push(callback);
  notifyListeners(key);
  return () => {
    const arr = colListeners.get(key)!;
    const idx = arr.indexOf(callback);
    if (idx >= 0) arr.splice(idx, 1);
  };
}

export async function setDoc(docRef: DocRef, data: DocData) {
  store.set(docRef._docPath, { ...data });
  notifyListeners(docRef._colPath);
}

export async function deleteDoc(docRef: DocRef) {
  store.delete(docRef._docPath);
  notifyListeners(docRef._colPath);
}

export async function updateDoc(docRef: DocRef, patch: DocData) {
  const existing = store.get(docRef._docPath) ?? {};
  store.set(docRef._docPath, { ...existing, ...patch });
  notifyListeners(docRef._colPath);
}
