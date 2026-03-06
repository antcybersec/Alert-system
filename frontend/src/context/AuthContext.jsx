import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithCustomToken,
} from 'firebase/auth';
import { auth } from '../services/firebase'; // Ensure this points to your firebase config
import { getDatabase, ref, get, onValue } from 'firebase/database';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null); // 'citizen' or 'admin'
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let dbUnsubscribe = null;

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Clean up previous DB listener if exists
                if (dbUnsubscribe) {
                    dbUnsubscribe();
                    dbUnsubscribe = null;
                }

                const db = getDatabase(auth.app);
                const citizenRef = ref(db, `users/citizens/${user.uid}`);

                const syncProfile = async (authData) => {
                    try {
                        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
                        const res = await fetch(`${API_BASE_URL}/api/auth/sync-profile`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ uid: user.uid })
                        });
                        const result = await res.json();
                        if (res.ok && result.data) {
                            setUserRole(result.data.role || 'citizen');
                            setCurrentUser({ ...authData, ...result.data });
                        } else {
                            setUserRole('citizen');
                            setCurrentUser(authData);
                        }
                    } catch (err) {
                        setUserRole('citizen');
                        setCurrentUser(authData);
                    }
                    setLoading(false);
                };

                // Check Registry first for role resolution
                const registryRef = ref(db, `users/registry/${user.uid}`);
                const userQuery = onValue(registryRef, (snap) => {
                    const authData = user.toJSON();
                    if (snap.exists()) {
                        const regData = snap.val();
                        const role = regData.role || 'citizen';
                        const profilePath = role === 'admin' ? `users/admins/${user.uid}` : `users/citizens/${user.uid}`;

                        // Now listen to the actual profile node
                        const profileRef = ref(db, profilePath);
                        onValue(profileRef, (pSnap) => {
                            if (pSnap.exists()) {
                                const pData = pSnap.val();
                                setUserRole(role);
                                setCurrentUser({ ...authData, ...pData });
                                setLoading(false);
                            } else {
                                syncProfile(authData);
                            }
                        }, { onlyOnce: false });
                    } else {
                        syncProfile(authData);
                    }
                }, (error) => {
                    console.warn("Realtime registry fetch restricted, attempting API sync...");
                    syncProfile(user.toJSON());
                });

                dbUnsubscribe = userQuery;
            } else {
                if (dbUnsubscribe) {
                    dbUnsubscribe();
                    dbUnsubscribe = null;
                }
                setCurrentUser(null);
                setUserRole(null);
                setLoading(false);
            }
        });

        // Safety timeout to prevent infinite loading on network issues
        const safetyTier = setTimeout(() => {
            setLoading((prev) => {
                if (prev) {
                    console.warn("Auth initialization timed out (network issue?), forcing app load.");
                    // Fallback mechanism: If Firebase Auth knows the user, but DB is slow/blocked
                    if (auth.currentUser) {
                        console.log("Recovering from timeout using existing auth session.");
                        setCurrentUser({
                            uid: auth.currentUser.uid,
                            email: auth.currentUser.email,
                            displayName: auth.currentUser.displayName,
                            photoURL: auth.currentUser.photoURL,
                            role: 'citizen' // Default fallback
                        });
                        setUserRole('citizen');
                    }
                    return false;
                }
                return prev;
            });
        }, 15000);

        return () => {
            clearTimeout(safetyTier);
            unsubscribe();
            if (dbUnsubscribe) dbUnsubscribe();
        };
    }, []);

    const login = async (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const loginWithToken = (token) => {
        return signInWithCustomToken(auth, token);
    };

    const googleLogin = async () => {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
            await fetch(`${API_BASE_URL}/api/auth/google-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken: await result.user.getIdToken() })
            });
        } catch (e) {
            console.error("Backend Google Sync Error", e);
        }
        return result;
    };

    const register = async (userData) => {
        setLoading(true);
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            return { ...data, ...userData };

        } catch (error) {
            console.error("Backend Register Error:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        return signOut(auth);
    };

    const resetPassword = async (email) => {
        // Mock Implementation
        await new Promise(resolve => setTimeout(resolve, 800));
        return true;
    };

    const value = {
        currentUser,
        role: userRole,
        isAuthenticated: !!currentUser,
        login,
        loginWithToken,
        googleLogin,
        register,
        logout,
        resetPassword,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}