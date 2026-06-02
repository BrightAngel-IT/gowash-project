import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    ScrollView,
    Alert,
    Keyboard
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import api from '@/constants/api';

const { width, height } = Dimensions.get('window');

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1 = Email entry, 2 = OTP entry, 3 = Password reset

    const handleForgot = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email.');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/auth/forgot-password', { email });
            Alert.alert('OTP Sent', res.data.message);
            setStep(2);
        } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length < 4) {
            Alert.alert('Error', 'Please enter a valid OTP.');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/auth/verify-otp', { email, otp });
            Alert.alert('Success', res.data.message);
            setStep(3);
        } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Invalid or expired OTP.');
        } finally {
            setLoading(false);
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

        setLoading(true);
        try {
            const res = await api.post('/auth/reset-password', { email, newPassword, otp });
            Alert.alert('Success', res.data.message, [
                { text: 'Login', onPress: () => router.push('/(auth)/login') }
            ]);
        } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    const getSubtitle = () => {
        if (step === 1) return 'Enter your email to receive a recovery code.';
        if (step === 2) return `Enter the 6-digit code sent to ${email}.`;
        return 'Enter your new password below.';
    };

    const getTitle = () => {
        if (step === 1) return 'Forgot Password';
        if (step === 2) return 'Verify Account';
        return 'Reset Password';
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <LinearGradient
                colors={['#4c669f', '#3b5998', '#192f6a']}
                style={styles.background}
            />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.contentContainer}>
                    <Animated.View entering={FadeInUp.delay(200).duration(1000)} style={styles.header}>
                        <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                        <Text style={styles.title}>{getTitle()}</Text>
                        <Text style={styles.subtitle}>{getSubtitle()}</Text>
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(400).duration(1000)} style={styles.formContainer}>
                        {step === 1 && (
                            <>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="mail-outline" size={20} color="#fff" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Email"
                                        placeholderTextColor="rgba(255,255,255,0.7)"
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                    />
                                </View>
                                <TouchableOpacity style={styles.buttonPrimary} onPress={handleForgot} disabled={loading}>
                                    <Text style={styles.buttonTextPrimary}>{loading ? 'Sending...' : 'Send Code'}</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="key-outline" size={20} color="#fff" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter OTP"
                                        placeholderTextColor="rgba(255,255,255,0.7)"
                                        value={otp}
                                        onChangeText={setOtp}
                                        keyboardType="number-pad"
                                        maxLength={6}
                                        style={[styles.input, { letterSpacing: 8, textAlign: 'center', fontSize: 24 }]}
                                    />
                                </View>
                                <TouchableOpacity style={styles.buttonPrimary} onPress={handleVerifyOtp} disabled={loading}>
                                    <Text style={styles.buttonTextPrimary}>{loading ? 'Verifying...' : 'Verify OTP'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleForgot} disabled={loading}>
                                    <Text style={styles.resendText}>Didn't receive a code? <Text style={{ fontWeight: 'bold' }}>Resend</Text></Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {step === 3 && (
                            <>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="lock-closed-outline" size={20} color="#fff" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="New Password"
                                        placeholderTextColor="rgba(255,255,255,0.7)"
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        secureTextEntry
                                    />
                                </View>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="lock-closed-outline" size={20} color="#fff" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Confirm Password"
                                        placeholderTextColor="rgba(255,255,255,0.7)"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry
                                    />
                                </View>
                                <TouchableOpacity style={styles.buttonPrimary} onPress={handleReset} disabled={loading}>
                                    <Text style={styles.buttonTextPrimary}>{loading ? 'Resetting...' : 'Update Password'}</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </Animated.View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: height,
    },
    contentContainer: {
        padding: 30,
        justifyContent: 'center',
        paddingTop: 60,
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        marginBottom: 50,
    },
    backButton: {
        marginBottom: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 10,
        lineHeight: 22,
    },
    formContainer: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 15,
        marginBottom: 20,
        paddingHorizontal: 15,
        height: 60,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        height: '100%',
    },
    buttonPrimary: {
        backgroundColor: '#fff',
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
        marginBottom: 30,
    },
    buttonTextPrimary: {
        color: '#192f6a',
        fontSize: 18,
        fontWeight: 'bold',
    },
    resendText: {
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        fontSize: 14,
    }
});
