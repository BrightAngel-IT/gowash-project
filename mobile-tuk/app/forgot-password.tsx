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
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, Key, ChevronRight, ArrowLeft } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import api from '../constants/api';

export default function ForgotPasswordScreen() {
    const colorScheme = (useColorScheme() ?? 'dark') as 'light' | 'dark';
    const theme = Colors[colorScheme];

    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(1); // 1 = Email, 2 = OTP, 3 = Reset

    const handleForgot = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await api.post('/auth/forgot-password', { email: email.trim() });
            Alert.alert('OTP Sent', res.data.message);
            setStep(2);
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Something went wrong.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length < 4) {
            Alert.alert('Error', 'Please enter a valid OTP.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await api.post('/auth/verify-otp', { email: email.trim(), otp });
            Alert.alert('Success', res.data.message);
            setStep(3);
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Invalid or expired OTP.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = async () => {
        if (!newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await api.post('/auth/reset-password', { email: email.trim(), newPassword, otp });
            Alert.alert('Success', res.data.message, [
                { text: 'Login', onPress: () => router.replace('/login') }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Something went wrong.');
        } finally {
            setIsLoading(false);
        }
    };

    const isDark = colorScheme === 'dark';

    const renderHeader = () => {
        let title = "Forgot Password";
        let sub = "Enter your email for recovery";
        
        if (step === 2) {
            title = "Verify OTP";
            sub = `Enter the 6-digit code sent to\n${email}`;
        } else if (step === 3) {
            title = "New Password";
            sub = "Set a strong password to secure your account";
        }

        return (
            <LinearGradient
                colors={['#1A1A1A', '#2A1F00', '#3D2B00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.hero}
            >
                <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#FFB300" />
                </TouchableOpacity>
                <Text style={styles.heroTitle}>{title}</Text>
                <Text style={styles.heroSubtitle}>{sub}</Text>
            </LinearGradient>
        );
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar barStyle="light-content" />
            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {renderHeader()}

                <View style={[styles.card, { backgroundColor: isDark ? '#1C1C1C' : '#FFFFFF' }]}>
                    {step === 1 && (
                        <>
                            <View style={[styles.inputGroup, { backgroundColor: isDark ? '#252525' : '#F8F9FA' }]}>
                                <Mail size={18} color={theme.icon} />
                                <TextInput
                                    style={[styles.input, { color: theme.text }]}
                                    placeholder="Email address"
                                    placeholderTextColor={theme.icon}
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>

                            <TouchableOpacity
                                onPress={handleForgot}
                                disabled={isLoading}
                                activeOpacity={0.85}
                                style={styles.btnWrapper}
                            >
                                <LinearGradient
                                    colors={isLoading ? ['#A0741A', '#A0741A'] : ['#FFB300', '#FF8F00']}
                                    style={styles.btn}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <>
                                            <Text style={styles.btnText}>Send Code</Text>
                                            <ChevronRight size={20} color="#1A1A1A" />
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <View style={[styles.inputGroup, { backgroundColor: isDark ? '#252525' : '#F8F9FA' }]}>
                                <Key size={18} color={theme.icon} />
                                <TextInput
                                    style={[styles.input, { color: theme.text, letterSpacing: 10, textAlign: 'center', fontWeight: 'bold' }]}
                                    placeholder="000000"
                                    placeholderTextColor={theme.icon}
                                    value={otp}
                                    onChangeText={setOtp}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                />
                            </View>

                            <TouchableOpacity
                                onPress={handleVerifyOtp}
                                disabled={isLoading}
                                activeOpacity={0.85}
                                style={styles.btnWrapper}
                            >
                                <LinearGradient
                                    colors={isLoading ? ['#A0741A', '#A0741A'] : ['#FFB300', '#FF8F00']}
                                    style={styles.btn}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <>
                                            <Text style={styles.btnText}>Verify OTP</Text>
                                            <ChevronRight size={20} color="#1A1A1A" />
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={handleForgot} disabled={isLoading} style={{ marginTop: 20 }}>
                                <Text style={{ color: theme.icon, textAlign: 'center', fontSize: 13 }}>
                                    Didn't get code? <Text style={{ color: theme.tint, fontWeight: '700' }}>Resend</Text>
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <View style={[styles.inputGroup, { backgroundColor: isDark ? '#252525' : '#F8F9FA' }]}>
                                <Lock size={18} color={theme.icon} />
                                <TextInput
                                    style={[styles.input, { color: theme.text }]}
                                    placeholder="New Password"
                                    placeholderTextColor={theme.icon}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    secureTextEntry
                                />
                            </View>

                            <View style={[styles.inputGroup, { backgroundColor: isDark ? '#252525' : '#F8F9FA' }]}>
                                <Lock size={18} color={theme.icon} />
                                <TextInput
                                    style={[styles.input, { color: theme.text }]}
                                    placeholder="Confirm Password"
                                    placeholderTextColor={theme.icon}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                />
                            </View>

                            <TouchableOpacity
                                onPress={handleReset}
                                disabled={isLoading}
                                activeOpacity={0.85}
                                style={styles.btnWrapper}
                            >
                                <LinearGradient
                                    colors={isLoading ? ['#A0741A', '#A0741A'] : ['#FFB300', '#FF8F00']}
                                    style={styles.btn}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <>
                                            <Text style={styles.btnText}>Update Password</Text>
                                            <ChevronRight size={20} color="#1A1A1A" />
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </ScrollView>
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
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        padding: 10,
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
        paddingHorizontal: 20,
        lineHeight: 20,
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
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
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
        marginTop: 10,
    },
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 6,
    },
    btnText: {
        color: '#1A1A1A',
        fontSize: 17,
        fontWeight: '800',
    },
});
