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
    Modal,
    Image,
    Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, Mail, Lock, Truck, ChevronRight, User } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import api, { saveToken } from '../constants/api';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
    const colorScheme = (useColorScheme() ?? 'dark') as 'light' | 'dark';
    const theme = Colors[colorScheme];
    const { login, loginWithGoogle } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [showGooglePicker, setShowGooglePicker] = useState(false);

    const handleGoogleSignIn = async (userEmail: string, userName: string) => {
        setShowGooglePicker(false);
        setIsLoading(true);
        try {
            const backendResponse = await api.post('/auth/google', {
                email: userEmail,
                name: userName,
                googleId: `google-sim-${userEmail}`,
                role: 'agent'
            });

            if (backendResponse.data.token) {
                const user = backendResponse.data.user;
                if (user.role !== 'agent') {
                    Alert.alert('Access Denied', 'This account is not registered as a driver.');
                    return;
                }
                await loginWithGoogle({ token: backendResponse.data.token, user: user });
                router.replace('/(tabs)');
            }
        } catch (error: any) {
            Alert.alert('Login Error', error.response?.data?.message || 'Failed to authenticate.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Missing Fields', 'Please enter your email and password.');
            return;
        }

        setIsLoading(true);
        try {
            await login(email.trim(), password.trim());
            router.replace('/(tabs)');
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Login failed. Please try again.';
            Alert.alert('Login Failed', msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        setShowGooglePicker(true);
    };

    const isDark = colorScheme === 'dark';

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar barStyle="light-content" />
            
            <Modal
                transparent
                visible={showGooglePicker}
                animationType="fade"
                onRequestClose={() => setShowGooglePicker(false)}
            >
                <Pressable 
                    style={styles.modalOverlay} 
                    onPress={() => setShowGooglePicker(false)}
                >
                    <View style={styles.pickerContainer}>
                        <View style={styles.pickerHeader}>
                             <View style={styles.googleIconCircle}>
                                <Text style={styles.googleG}>G</Text>
                             </View>
                            <Text style={styles.pickerTitle}>Choose an account</Text>
                            <Text style={styles.pickerSubtitle}>to continue to GoWash Professional</Text>
                        </View>
                        
                        <View style={styles.accountList}>
                            <TouchableOpacity 
                                style={styles.accountItem}
                                onPress={() => handleGoogleSignIn('lakshanumayanha6789@gmail.com', 'Lakshan Umayanha')}
                            >
                                <View style={[styles.avatarCircle, { backgroundColor: '#FFB300' }]}>
                                    <Text style={styles.avatarText}>L</Text>
                                </View>
                                <View style={styles.accountInfo}>
                                    <Text style={styles.accountName}>Lakshan Umayanha</Text>
                                    <Text style={styles.accountEmail}>lakshanumayanha6789@gmail.com</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.accountItem}
                                onPress={() => handleGoogleSignIn('demo.driver@gmail.com', 'Demo Driver')}
                            >
                                <View style={[styles.avatarCircle, { backgroundColor: '#4285F4' }]}>
                                    <Text style={styles.avatarText}>D</Text>
                                </View>
                                <View style={styles.accountInfo}>
                                    <Text style={styles.accountName}>Demo Driver</Text>
                                    <Text style={styles.accountEmail}>demo.driver@gmail.com</Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.addAccountBtn}>
                            <User size={18} color="#5F6368" />
                            <Text style={styles.addAccountText}>Use another account</Text>
                        </TouchableOpacity>

                        <View style={styles.pickerFooter}>
                            <Text style={styles.footerInfo}>
                                To continue, Google will share your name, email address, profile picture and language preference with GoWash.
                            </Text>
                        </View>
                    </View>
                </Pressable>
            </Modal>

            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Hero gradient header */}
                <LinearGradient
                    colors={['#1A1A1A', '#2A1F00', '#3D2B00']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.hero}
                >
                    {/* Decorative glow rings */}
                    <View style={styles.glowRing1} />
                    <View style={styles.glowRing2} />

                    <View style={styles.logoWrapper}>
                        <LinearGradient
                            colors={['#FFB300', '#FF8F00']}
                            style={styles.logoCircle}
                        >
                            <Truck size={40} color="#fff" strokeWidth={2} />
                        </LinearGradient>
                    </View>

                    <Text style={styles.heroTitle}>GoWash Driver</Text>
                    <Text style={styles.heroSubtitle}>Your ride partner for laundry deliveries</Text>

                    {/* Stats strip */}
                    <View style={styles.statsStrip}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>4.9★</Text>
                            <Text style={styles.statLabel}>Avg Rating</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>2K+</Text>
                            <Text style={styles.statLabel}>Deliveries</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>LKR 3K</Text>
                            <Text style={styles.statLabel}>Daily Avg</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Login card */}
                <View style={[styles.card, { backgroundColor: isDark ? '#1C1C1C' : '#FFFFFF' }]}>
                    <Text style={[styles.welcomeText, { color: theme.text }]}>Welcome back</Text>
                    <Text style={[styles.signInText, { color: theme.icon }]}>Sign in to continue driving</Text>

                    {/* Email field */}
                    <View style={[
                        styles.inputGroup,
                        {
                            borderColor: emailFocused ? theme.tint : theme.border,
                            backgroundColor: isDark ? '#252525' : '#F8F9FA',
                        }
                    ]}>
                        <Mail size={18} color={emailFocused ? theme.tint : theme.icon} />
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="Email address"
                            placeholderTextColor={theme.icon}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            returnKeyType="next"
                            onFocus={() => setEmailFocused(true)}
                            onBlur={() => setEmailFocused(false)}
                        />
                    </View>

                    {/* Password field */}
                    <View style={[
                        styles.inputGroup,
                        {
                            borderColor: passwordFocused ? theme.tint : theme.border,
                            backgroundColor: isDark ? '#252525' : '#F8F9FA',
                        }
                    ]}>
                        <Lock size={18} color={passwordFocused ? theme.tint : theme.icon} />
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="Password"
                            placeholderTextColor={theme.icon}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            returnKeyType="done"
                            onSubmitEditing={handleLogin}
                            onFocus={() => setPasswordFocused(true)}
                            onBlur={() => setPasswordFocused(false)}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            {showPassword
                                ? <EyeOff size={18} color={theme.icon} />
                                : <Eye size={18} color={theme.icon} />
                            }
                        </TouchableOpacity>
                    </View>

                    {/* Forgot Password link */}
                    <TouchableOpacity 
                        onPress={() => router.push('/forgot-password')}
                        style={{ alignSelf: 'flex-end', marginBottom: 15 }}
                    >
                        <Text style={{ color: theme.tint, fontSize: 13, fontWeight: '600' }}>Forgot Password?</Text>
                    </TouchableOpacity>

                    {/* Demo hint */}
                    <View style={[styles.hintBox, { backgroundColor: isDark ? '#2A2A2A' : '#FFF8E1', borderColor: '#FFB30030' }]}>
                        <Text style={[styles.hintTitle, { color: theme.tint }]}>Demo Credentials</Text>
                        <Text style={[styles.hintText, { color: theme.icon }]}>Email: ravi@driver.com</Text>
                        <Text style={[styles.hintText, { color: theme.icon }]}>Password: driver123</Text>
                    </View>

                    {/* Login button */}
                    <TouchableOpacity
                        onPress={handleLogin}
                        disabled={isLoading}
                        activeOpacity={0.85}
                        style={styles.loginBtnWrapper}
                    >
                        <LinearGradient
                            colors={isLoading ? ['#A0741A', '#A0741A'] : ['#FFB300', '#FF8F00']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.loginBtn}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Text style={styles.loginBtnText}>Sign In</Text>
                                    <ChevronRight size={20} color="#1A1A1A" strokeWidth={2.5} />
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Google Login button */}
                    <TouchableOpacity
                        onPress={handleGoogleLogin}
                        disabled={isLoading}
                        activeOpacity={0.85}
                        style={[styles.loginBtnWrapper, { marginTop: 15 }]}
                    >
                        <View style={[styles.loginBtn, { backgroundColor: '#fff' }]}>
                            <Text style={[styles.loginBtnText, { color: '#333' }]}>Continue with Google</Text>
                        </View>
                    </TouchableOpacity>

                    <Text style={[styles.footer, { color: theme.icon }]}>
                        Only authorized GoWash drivers can log in.
                    </Text>

                    {/* Sign Up link */}
                    <View style={styles.signUpRow}>
                        <Text style={[styles.signUpText, { color: theme.icon }]}>New driver?</Text>
                        <TouchableOpacity onPress={() => router.push('/register')}>
                            <Text style={[styles.signUpLink, { color: theme.tint }]}> Create Account</Text>
                        </TouchableOpacity>
                    </View>
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
        overflow: 'hidden',
        position: 'relative',
    },
    glowRing1: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: '#FFB30010',
        top: -80,
        right: -80,
    },
    glowRing2: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#FFB30018',
        bottom: -60,
        left: -40,
    },
    logoWrapper: {
        marginBottom: 20,
        shadowColor: '#FFB300',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 12,
    },
    logoCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroTitle: {
        fontSize: 30,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    heroSubtitle: {
        fontSize: 14,
        color: '#9BA1A6',
        marginTop: 6,
        textAlign: 'center',
    },
    statsStrip: {
        flexDirection: 'row',
        marginTop: 28,
        backgroundColor: 'rgba(255,179,0,0.08)',
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,179,0,0.15)',
        width: '100%',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFB300',
    },
    statLabel: {
        fontSize: 11,
        color: '#9BA1A6',
        marginTop: 3,
    },
    statDivider: {
        width: 1,
        backgroundColor: 'rgba(255,179,0,0.2)',
    },
    card: {
        flex: 1,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        marginTop: -20,
        paddingHorizontal: 28,
        paddingTop: 36,
        paddingBottom: 48,
        // shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    welcomeText: {
        fontSize: 26,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    signInText: {
        fontSize: 14,
        marginTop: 4,
        marginBottom: 28,
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 14,
        gap: 12,
    },
    input: {
        flex: 1,
        fontSize: 15,
        padding: 0,
    },
    hintBox: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        marginBottom: 24,
        marginTop: 4,
    },
    hintTitle: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 4,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    hintText: {
        fontSize: 13,
        lineHeight: 20,
        fontFamily: 'monospace',
    },
    loginBtnWrapper: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#FFB300',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
    },
    loginBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 6,
    },
    loginBtnText: {
        color: '#1A1A1A',
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    footer: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 24,
        lineHeight: 18,
    },
    signUpRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    signUpText: {
        fontSize: 14,
    },
    signUpLink: {
        fontSize: 14,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    pickerContainer: {
        backgroundColor: '#FFFFFF',
        width: '100%',
        borderRadius: 20,
        padding: 24,
        elevation: 10,
    },
    pickerHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    googleIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f8f9fa',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    googleG: {
        fontSize: 24,
        fontWeight: '900',
        color: '#4285F4',
    },
    pickerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#202124',
        textAlign: 'center',
    },
    pickerSubtitle: {
        fontSize: 14,
        color: '#5F6368',
        marginTop: 4,
        textAlign: 'center',
    },
    accountList: {
        marginVertical: 16,
    },
    accountItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f3f4',
    },
    avatarCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    accountInfo: {
        flex: 1,
    },
    accountName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3C4043',
    },
    accountEmail: {
        fontSize: 12,
        color: '#70757A',
    },
    addAccountBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12,
    },
    addAccountText: {
        fontSize: 14,
        color: '#3C4043',
        fontWeight: '500',
    },
    pickerFooter: {
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#f1f3f4',
        paddingTop: 16,
    },
    footerInfo: {
        fontSize: 11,
        color: '#5F6368',
        lineHeight: 16,
    }
});
