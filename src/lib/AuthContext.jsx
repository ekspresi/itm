import React, { useState, useEffect, useContext, createContext } from 'react';
import { auth } from './firebase'; // Importujemy nasz obiekt auth z firebase.js

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [authError, setAuthError] = useState('');
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            setUser(user);
            setIsLoggedIn(!!user);
            setIsAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const login = async (email, password) => {
        setAuthError('');
        try {
            await auth.signInWithEmailAndPassword(email, password);
        } catch (error) {
            setAuthError('Nieprawidłowy email lub hasło.');
        }
    };

    const logout = async () => {
        await auth.signOut();
    };

    const value = { user, isLoggedIn, authError, login, logout, isAuthLoading };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};