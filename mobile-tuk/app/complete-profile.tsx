import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    useColorScheme,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Phone, Truck, CreditCard, Home, User, ChevronRight } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import api, { saveToken } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';

export default function CompleteProfileScreen() {
    const colorScheme = (useColorScheme() ?? 'dark') as 'light' | 'dark';
    const theme = Colors[colorScheme];
    const router = useRouter();
    const { loginWithGoogle, driver } = useAuth();
    const { userId, name: paramName, email: paramEmail } = useLocalSearchParams();

    const currentName = (paramName as string) || driver?.name || '';
    const currentEmail = (paramEmail as string) || driver?.email || '';
    const currentUserId = (userId as string) || driver?.id || '';

    const [phone, setPhone] = useState('');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [vehicleType, setVehicleType] = useState('Tuk Tuk');
    const [nicNumber, setNicNumber] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');
    const [homeAddress, setHomeAddress] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async () => {
        if (!phone || !vehicleNumber || !nicNumber || !licenseNumber) {
            Alert.alert('Required Fields', 'Please fill in all mandatory fields.');
            return;
        }

        setIsLoading(true);
        try {
            const response = await api.post('/auth/complete-driver-profile', {
                userId: currentUserId, 
                phone, 
                vehicleNumber, 
                vehicleType, 
                nicNumber, 
                licenseNumber, 
                homeAddress
            });

            const { token, driver } = response.data;
            await loginWithGoogle({ token, user: driver });

            setIsSubmitted(true);
            setTimeout(() => {
                router.replace('/(tabs)');
            }, 3000);
        } catch (error: any) {
            Alert.alert('Submission Error', error.response?.data?.message || 'Something went wrong.');
        } finally {
            setIsLoading(false);
        }
    };

    const isDark = colorScheme === 'dark';

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar barStyle="light-content" />
            
            {isSubmitted ? (
                <View style={[styles.successContainer, { backgroundColor: theme.background }]}>
                    <LinearGradient
                        colors={['#FFB300', '#FF8F00']}
                        style={styles.successIconCircle}
                    >
                        <ChevronRight size={48} color="#1A1A1A" />
                    </LinearGradient>
                    <Text style={[styles.successTitle, { color: theme.text }]}>Application Received!</Text>
                    <Text style={[styles.successSubtitle, { color: theme.icon }]}>
                        Thank you, {currentName}. Your details have been submitted for verification. 
                        We will notify you once your account is activated.
                    </Text>
                    <ActivityIndicator color={theme.tint} style={{ marginTop: 30 }} />
                    <Text style={{ color: theme.icon, marginTop: 10, fontSize: 12 }}>Redirecting you to dashboard...</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    <LinearGradient
                        colors={['#1A1A1A', '#2A1F00', '#3D2B00']}
                        style={styles.hero}
                    >
                        <Text style={styles.heroTitle}>Complete Account</Text>
                        <Text style={styles.heroSubtitle}>Account: {currentEmail}</Text>
                    </LinearGradient>

                    <View style={[styles.card, { backgroundColor: isDark ? '#1C1C1C' : '#FFFFFF' }]}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Personal Details</Text>

                        <View style={[styles.inputGroup, { backgroundColor: isDark ? '#252525' : '#F8F9FA', opacity: 0.7 }]}>
                            <User size={18} color={theme.icon} />
                            <TextInput
                                style={[styles.input, { color: theme.text }]}
                                value={currentName}
                                editable={false}
                                placeholder="Name"
                            />
                        </View>

                        <View style={[styles.inputGroup, { backgroundColor: isDark ? '#252525' : '#F8F9FA', opacity: 0.7 }]}>
                            <CreditCard size={18} color={theme.icon} />
                            <TextInput
                                style={[styles.input, { color: theme.text }]}
                                value={currentEmail}
                                editable={false}
                                placeholder="Email"
                            />
                        </View>

                        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 10 }]}>Driver Information</Text>

                    <View style={[styles.inputGroup, { backgroundColor: isDark ? '#252525' : '#F8F9FA' }]}>
                        <Phone size={18} color={theme.icon} />
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="Phone Number"
                            placeholderTextColor={theme.icon}
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={[styles.inputGroup, { backgroundColor: isDark ? '#252525' : '#F8F9FA' }]}>
                        <Truck size={18} color={theme.icon} />
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="Vehicle Number (e.g., ABC-1234)"
                            placeholderTextColor={theme.icon}
                            value={vehicleNumber}
                            onChangeText={setVehicleNumber}
                            autoCapitalize="characters"
                        />
                    </View>

                    <View style={[styles.inputGroup, { backgroundColor: isDark ? '#252525' : '#F8F9FA' }]}>
                        <User size={18} color={theme.icon} />
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="NIC Number"
                            placeholderTextColor={theme.icon}
                            value={nicNumber}
                            onChangeText={setNicNumber}
                        />
                    </View>

                    <View style={[styles.inputGroup, { backgroundColor: isDark ? '#252525' : '#F8F9FA' }]}>
                        <CreditCard size={18} color={theme.icon} />
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="License Number"
                            placeholderTextColor={theme.icon}
                            value={licenseNumber}
                            onChangeText={setLicenseNumber}
                        />
                    </View>

                    <View style={[styles.inputGroup, { backgroundColor: isDark ? '#252525' : '#F8F9FA' }]}>
                        <Home size={18} color={theme.icon} />
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="Home Address"
                            placeholderTextColor={theme.icon}
                            value={homeAddress}
                            onChangeText={setHomeAddress}
                            multiline
                        />
                    </View>

                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={isLoading}
                        style={styles.btnWrapper}
                    >
                        <LinearGradient
                            colors={['#FFB300', '#FF8F00']}
                            style={styles.btn}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#1A1A1A" />
                            ) : (
                                <>
                                    <Text style={styles.btnText}>Submit Application</Text>
                                    <ChevronRight size={20} color="#1A1A1A" />
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        )}
    </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    scroll: {
        flexGrow: 1,
    },
    hero: {
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    heroSubtitle: {
        fontSize: 14,
        color: '#9BA1A6',
        marginTop: 6,
        textAlign: 'center',
    },
    card: {
        flex: 1,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        marginTop: -20,
        paddingHorizontal: 28,
        paddingTop: 36,
        paddingBottom: 48,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 20,
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 16,
        gap: 12,
    },
    input: {
        flex: 1,
        fontSize: 15,
    },
    btnWrapper: {
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: 20,
    },
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 6,
    },
    btnText: {
        color: '#1A1A1A',
        fontSize: 17,
        fontWeight: '800',
    },
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    successIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
        elevation: 10,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 15,
    },
    successSubtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
    }
});
