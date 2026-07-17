type AuthUser = { uid: string; email: string };
type AuthCallback = (user: AuthUser | null) => void;

const TEST_USER: AuthUser = {
  uid: 'test-uid-playwright',
  email: 'test@playwright.local',
};

const listeners: AuthCallback[] = [];

export function getAuth() {
  return { _mock: true };
}

export function onAuthStateChanged(_auth: unknown, callback: AuthCallback) {
  listeners.push(callback);
  // Emit logged-in user asynchronously so React can mount first
  setTimeout(() => callback(TEST_USER), 0);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

export function isSignInWithEmailLink() {
  return false;
}

export function signInWithEmailLink() {
  return Promise.resolve({} as never);
}

export function sendSignInLinkToEmail() {
  return Promise.resolve();
}

export function signOut() {
  return Promise.resolve();
}
