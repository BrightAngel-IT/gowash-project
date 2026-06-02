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

export const driverApi = {
    getDashboard: (driverId: string) => api.get(`/drivers/${driverId}/dashboard`),
    getProfile: (driverId: string) => api.get(`/drivers/${driverId}/profile`),
    getHistory: (driverId: string) => api.get(`/drivers/${driverId}/history`),
    getAvailableJobs: () => api.get('/drivers/jobs/available'),
    updateStatus: (driverId: string, status: string) => api.patch(`/drivers/${driverId}/status`, { status }),
    acceptJob: (driverId: string, orderId: string) => api.post(`/drivers/${driverId}/accept-job`, { orderId }),
    updateRideStatus: (driverId: string, assignmentId: string, status: string) =>
        api.patch(`/drivers/${driverId}/ride-assignments/${assignmentId}/status`, { status }),
};   

export const authApi = {
    driverLogin: (email: string, password: string) =>
        api.post('/auth/driver/login', { email, password }),
    driverRegister: (data: {
        name: string;
        email: string;
        phone: string;
        password: string;
        confirmPassword: string;
        vehicleNumber: string;
        vehicleType: string;
        nicNumber: string;
        licenseNumber: string;
        homeAddress: string;
        bankName: string;
        branchName: string;
        accountHolderName: string;
        accountNumber: string;
        profileImage?: string;
        licenseFront?: string;
        licenseBack?: string;
        nicFront?: string;
        nicBack?: string;
        vehicleFront?: string;
        vehicleBack?: string;
        vehicleBook?: string;
    }) => api.post('/auth/driver/register', data),
};



export default api;

