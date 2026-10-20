import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import Constants from 'expo-constants';

// Use production URL if not in development
const isDev = __DEV__;
const debuggerHost = Constants.expoConfig?.hostUri;
const ip = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';

export const SOCKET_URL = `https://gowashbackend.nilmaalliance.com`;

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
