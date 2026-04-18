import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
// @ts-expect-error — getReactNativePersistence is exported from firebase/auth via the react-native package export condition at runtime.
import { Auth, getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { Database, getDatabase } from 'firebase/database';

import { firebaseConfig } from './firebaseConfig';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

const database: Database = getDatabase(app);

export { app, auth, database };
