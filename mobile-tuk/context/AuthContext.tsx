import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, saveToken, getToken } from '../constants/api';

export type Driver = {
    id: string;
    userId: number;
    name: string;
    email: string;
    phone: string;
    vehicleNumber: string;
    vehicleType: string;
    status: string;
    rating: number;
    totalEarnings: number;
    nicNumber?: string;
    licenseNumber?: string;
    homeAddress?: string;
    bankName?: string;
    branchName?: string;
    accountHolderName?: string;
    accountNumber?: string;
    profileImageUrl?: string;
};

type AuthContextType = {
    driver: Driver | null;
    token: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    loginWithGoogle: (data: { token: string, user: any }) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [driver, setDriver] = useState<Driver | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // On mount, restore session from storage
    useEffect(() => {
        const restoreSession = async () => {
            try {
                const savedToken = await getToken();
                const savedDriver = await AsyncStorage.getItem('driver');
                if (savedToken && savedDriver) {
                    setToken(savedToken);
                    setDriver(JSON.parse(savedDriver));
                }
            } catch (e) {
                console.error('Failed to restore session:', e);
            } finally {
                setIsLoading(false);
            }
        };
        restoreSession();
    }, []);

    const login = async (email: string, password: string) => {
        const response = await authApi.driverLogin(email, password);
        const { token: newToken, driver: driverData } = response.data;

        await saveToken(newToken);
        await AsyncStorage.setItem('driver', JSON.stringify(driverData));

        setToken(newToken);
        setDriver(driverData);
    };

    const loginWithGoogle = async (data: { token: string, user: any }) => {
        const { token: newToken, user: driverData } = data;
        await saveToken(newToken);
        await AsyncStorage.setItem('driver', JSON.stringify(driverData));
        setToken(newToken);
        setDriver(driverData);
    };

    const logout = async () => {
        await AsyncStorage.multiRemove(['token', 'driver']);
        setToken(null);
        setDriver(null);
    };

    return (
        <AuthContext.Provider value={{ driver, token, isLoading, login, loginWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
