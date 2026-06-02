import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import Constants from 'expo-constants';

// For physical devices on Wi-Fi, we dynamically detect your machine's local IP from the Expo manifest.
// This ensures that the connection survives IP changes when you switch networks.
const debuggerHost = Constants.expoConfig?.hostUri;
const ip = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';

export const SOCKET_URL = __DEV__
    ? `http://${ip}:5005`
    : 'https://gowashbackend.nilmaalliance.com';
const BASE_URL = `${SOCKET_URL}/api`;

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const saveToken = async (token: string) => {
    try {
        await AsyncStorage.setItem('token', token);
    } catch (error) {
        console.error('Error saving token:', error);
    }
};

export const getToken = async () => {
    try {
        return await AsyncStorage.getItem('token');
    } catch (error) {
        console.error('Error getting token:', error);
        return null;
    }
};

export const saveUser = async (user: any) => {
    try {
        await AsyncStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
        console.error('Error saving user:', error);
    }
};

export const getUser = async () => {
    try {
        const user = await AsyncStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    } catch (error) {
        console.error('Error getting user:', error);
        return null;
    }
};

export const logout = async () => {
    try {
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
    } catch (error) {
        console.error('Error during logout:', error);
    }
};

export default api;
