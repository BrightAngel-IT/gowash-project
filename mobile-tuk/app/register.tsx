import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Pressable,
    StyleSheet,
    useColorScheme,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    TextInput as RNTextInput,
    Image,
    Keyboard,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Eye, EyeOff, Mail, Lock, Truck, User,
    Phone, ChevronRight, ChevronLeft, CheckCircle, Car,
    CreditCard, MapPin, Search, Landmark, Camera, Upload,
    Image as ImageIcon
} from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import { authApi } from '../constants/api';
import * as ImagePicker from 'expo-image-picker';

// ─── Constants ────────────────────────────────────────────────────────────────
const VEHICLE_TYPES = ['Tuk Tuk', 'Motorbike', 'Car', 'Van'];

// ─── Components ───────────────────────────────────────────────────────────────

function StepIndicator({ step, total, tint }: { step: number; total: number; tint: string }) {
    return (
        <View style={styles.stepRow}>
            {Array.from({ length: total }).map((_, i) => {
                const s = i + 1;
                return (
                    <React.Fragment key={s}>
                        <View style={[
                            styles.stepDot,
                            {
                                backgroundColor: step >= s ? tint : '#333',
                                width: step === s ? 24 : 8,
                            }
                        ]} />
                        {s < total && <View style={[styles.stepLine, { backgroundColor: step > s ? tint : '#333' }]} />}
                    </React.Fragment>
                );
            })}
        </View>
    );
}

function InputField({
    icon,
    placeholder,
    value,
    onChangeText,
    secureTextEntry,
    keyboardType,
    autoCapitalize,
    returnKeyType,
    onSubmitEditing,
    inputRef,
    rightElement,
    focused,
    onFocus,
    onBlur,
    tint,
    border,
    bgColor,
    textColor,
    iconColor,
}: any) {
    return (
        <View style={[
            styles.inputGroup,
            { borderColor: focused ? tint : border, backgroundColor: bgColor }
        ]}>
            {React.cloneElement(icon, { color: focused ? tint : iconColor, size: 18, strokeWidth: 1.8 })}
            <TextInput
                ref={inputRef}
                style={[styles.input, { color: textColor }]}
                placeholder={placeholder}
                placeholderTextColor={iconColor}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize ?? 'none'}
                returnKeyType={returnKeyType ?? 'next'}
                onSubmitEditing={onSubmitEditing}
                onFocus={onFocus}
                onBlur={onBlur}
            />
            {rightElement}
        </View>
    );
}

function ImageUploadBox({ label, value, onUpload, tint, textColor, cardBg, border }: any) {
    return (
        <View style={styles.uploadBoxContainer}>
            <Text style={[styles.uploadLabel, { color: textColor }]}>{label}</Text>
            <TouchableOpacity
                onPress={onUpload}
                style={[
                    styles.uploadBox,
                    {
                        backgroundColor: cardBg,
                        borderColor: value ? tint : border,
                        borderStyle: value ? 'solid' : 'dashed'
                    }
                ]}
            >
                {value ? (
                    <View style={styles.previewContainer}>
                        <Image source={{ uri: value }} style={styles.previewImage} />
                        <View style={styles.changeOverlay}>
                            <Camera size={20} color="#fff" />
                            <Text style={styles.changeText}>Change</Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.uploadPlaceholder}>
                        <Upload size={24} color={tint} />
                        <Text style={[styles.uploadText, { color: tint }]}>Upload Photo</Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function RegisterScreen() {
    const colorScheme = (useColorScheme() ?? 'dark') as 'light' | 'dark';
    const theme = Colors[colorScheme];
    const isDark = colorScheme === 'dark';

    // Form Navigation
    const [step, setStep] = useState(1);
    const totalSteps = 4;

    // Step 1: Account
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Step 2: Verification Numbers
    const [nicNumber, setNicNumber] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [vehicleType, setVehicleType] = useState('Tuk Tuk');

    // Step 3: Document Images
    const [profileImage, setProfileImage] = useState('');
    const [licenseFront, setLicenseFront] = useState('');
    const [licenseBack, setLicenseBack] = useState('');
    const [nicFront, setNicFront] = useState('');
    const [nicBack, setNicBack] = useState('');
    const [vehicleFront, setVehicleFront] = useState('');
    const [vehicleBack, setVehicleBack] = useState('');
    const [vehicleBook, setVehicleBook] = useState('');

    // Step 4: Address & Payouts
    const [homeAddress, setHomeAddress] = useState('');
    const [bankName, setBankName] = useState('');
    const [branchName, setBranchName] = useState('');
    const [accountHolderName, setAccountHolderName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');

    // UI States
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [focused, setFocused] = useState('');

    // Refs
    const emailRef = useRef<RNTextInput>(null);
    const phoneRef = useRef<RNTextInput>(null);
    const passwordRef = useRef<RNTextInput>(null);
    const confirmRef = useRef<RNTextInput>(null);
    const nicRef = useRef<RNTextInput>(null);
    const licenseRef = useRef<RNTextInput>(null);
    const vehicleRef = useRef<RNTextInput>(null);
    const bankRef = useRef<RNTextInput>(null);
    const branchRef = useRef<RNTextInput>(null);
    const holderRef = useRef<RNTextInput>(null);
    const accNumberRef = useRef<RNTextInput>(null);

    const cardBg = isDark ? '#1C1C1C' : '#FFFFFF';
    const inputBg = isDark ? '#252525' : '#F8F9FA';

    // ── Image Upload Simulation ──
    // ── Image Upload Handling ──
    const handleImageUpload = async (setter: any, name: string) => {
        const uploadOption = async (mode: 'camera' | 'gallery') => {
            try {
                let result;
                if (mode === 'camera') {
                    const { status } = await ImagePicker.requestCameraPermissionsAsync();
                    if (status !== 'granted') {
                        Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
                        return;
                    }
                    result = await ImagePicker.launchCameraAsync({
                        mediaTypes: 'images',
                        allowsEditing: true,
                        aspect: [4, 3],
                        quality: 0.5,
                        base64: true,
                    });
                } else {
                    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (status !== 'granted') {
                        Alert.alert('Permission Denied', 'Gallery permission is required to select photos.');
                        return;
                    }
                    result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: 'images',
                        allowsEditing: true,
                        aspect: [4, 3],
                        quality: 0.5,
                        base64: true,
                    });
                }

                if (!result.canceled && result.assets && result.assets.length > 0) {
                    // Using base64 data URI for easy transmission/display
                    const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
                    setter(base64Img);
                }
            } catch (error) {
                console.log('Image picker error:', error);
                Alert.alert('Error', 'Failed to pick image');
            }
        };

        if (Platform.OS === 'web') {
            // On web, direct camera access might vary, standard file picker is safer
            uploadOption('gallery');
            return;
        }

        Alert.alert(
            `Upload ${name}`,
            'Choose an option',
            [
                {
                    text: 'Take Photo',
                    onPress: () => uploadOption('camera'),
                },
                {
                    text: 'Choose from Gallery',
                    onPress: () => uploadOption('gallery'),
                },
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
            ]
        );
    };

    // ── Validations ──

    const webAlert = (title: string, message: string) => {
        if (Platform.OS === 'web') {
            window.alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    const validateStep1 = () => {
        if (!name.trim()) {
            webAlert('Required', 'Please enter your full name.');
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            webAlert('Invalid Email', 'Please enter a valid email address.');
            return false;
        }
        if (phone.trim().length < 9) {
            webAlert('Invalid Phone', 'Please enter a valid phone number.');
            return false;
        }
        if (password.length < 6) {
            webAlert('Weak Password', 'Password must be at least 6 characters.');
            return false;
        }
        if (password !== confirmPassword) {
            webAlert('Mismatch', 'Passwords do not match.');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        if (!nicNumber.trim()) { webAlert('Required', 'Please enter your NIC number.'); return false; }
        if (!licenseNumber.trim()) { webAlert('Required', 'Please enter your Driving License number.'); return false; }
        if (!vehicleNumber.trim()) { webAlert('Required', 'Please enter your Vehicle Number.'); return false; }
        return true;
    };

    const validateStep3 = () => {
        if (!licenseFront || !licenseBack || !vehicleFront || !vehicleBack || !vehicleBook) {
            webAlert('Required', 'Please upload all required vehicle and license documents.');
            return false;
        }
        return true;
    };

    const handleNext = () => {
        Keyboard.dismiss();
        if (step === 1) {
            if (validateStep1()) {
                setStep(2);
            }
        } else if (step === 2) {
            if (validateStep2()) {
                setStep(3);
            }
        } else if (step === 3) {
            if (validateStep3()) {
                setStep(4);
            }
        }
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
        else router.back();
    };

    const handleRegister = async () => {
        Keyboard.dismiss();
        if (!accountNumber.trim() || !bankName.trim()) {
            webAlert('Required', 'Bank details are essential for ride payouts.');
            return;
        }

        setIsLoading(true);
        try {
            await authApi.driverRegister({
                name: name.trim(),
                email: email.trim().toLowerCase(),
                phone: phone.trim(),
                password,
                confirmPassword,
                vehicleNumber: vehicleNumber.trim().toUpperCase(),
                vehicleType,
                nicNumber: nicNumber.trim(),
                licenseNumber: licenseNumber.trim(),
                homeAddress: homeAddress.trim(),
                bankName: bankName.trim(),
                branchName: branchName.trim(),
                accountHolderName: accountHolderName.trim() || name.trim(),
                accountNumber: accountNumber.trim(),
                profileImage,
                licenseFront,
                licenseBack,
                nicFront,
                nicBack,
                vehicleFront,
                vehicleBack,
                vehicleBook
            });
            setSuccess(true);
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Registration failed. Please try again.';
            webAlert('Registration Failed', msg);
        } finally {
            setIsLoading(false);
        }
    };

    // ── Success Screen ──
    if (success) {
        return (
            <View style={[styles.successContainer, { backgroundColor: '#121212' }]}>
                <LinearGradient colors={['#1A1A1A', '#2A1F00', '#3D2B00']} style={StyleSheet.absoluteFillObject} />
                <View style={{ pointerEvents: 'none', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1 }}>
                    <Truck size={400} color="#FFB300" />
                </View>
                <ScrollView contentContainerStyle={styles.successScroll}>
                    <View style={styles.successContent}>
                        <LinearGradient colors={['#FFB300', '#FF8F00']} style={styles.successIcon}>
                            <CheckCircle size={48} color="#fff" strokeWidth={2} />
                        </LinearGradient>
                        <Text style={styles.successTitle}>Application Submitted!</Text>
                        <Text style={styles.successSubtitle}>
                            Your driver profile is now under review for verification.{'\n'}
                            This usually takes 24-48 hours.
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.replace('/login')}
                            style={styles.successBtnWrapper}
                            activeOpacity={0.85}
                        >
                            <LinearGradient colors={['#FFB300', '#FF8F00']} style={styles.successBtn}>
                                <Text style={styles.successBtnText}>Back to Login</Text>
                                <ChevronRight size={20} color="#1A1A1A" strokeWidth={2.5} />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar barStyle="light-content" />
            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingBottom: 100 }]}
                keyboardShouldPersistTaps="always"
                showsVerticalScrollIndicator={false}
            >

                <LinearGradient colors={['#1A1A1A', '#2A1F00', '#3D2B00']} style={styles.hero}>
                    <View style={styles.glowRing1} />
                    <View style={styles.glowRing2} />

                    <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                        <ChevronLeft size={22} color="#FFB300" strokeWidth={2.5} />
                        <Text style={styles.backText}>{step === 1 ? 'Back to Login' : 'Back'}</Text>
                    </TouchableOpacity>

                    <Text style={styles.heroTitle}>Professional Driver</Text>
                    <Text style={styles.heroSubtitle}>Complete verification to start earning</Text>

                    <StepIndicator step={step} total={totalSteps} tint={theme.tint} />
                </LinearGradient>

                <View style={[styles.card, { backgroundColor: cardBg }]}>

                    {step === 1 && (
                        <>
                            <Text style={[styles.stepTitle, { color: theme.text }]}>Step 1: Account Setup</Text>
                            <InputField
                                icon={<User />} placeholder="Full Name" value={name} onChangeText={setName}
                                autoCapitalize="words" onSubmitEditing={() => emailRef.current?.focus()}
                                focused={focused === 'name'} onFocus={() => setFocused('name')} onBlur={() => setFocused('')}
                                tint={theme.tint} border={theme.border} bgColor={inputBg} textColor={theme.text} iconColor={theme.icon}
                            />
                            <InputField
                                inputRef={emailRef} icon={<Mail />} placeholder="Email Address" value={email} onChangeText={setEmail}
                                keyboardType="email-address" onSubmitEditing={() => phoneRef.current?.focus()}
                                focused={focused === 'email'} onFocus={() => setFocused('email')} onBlur={() => setFocused('')}
                                tint={theme.tint} border={theme.border} bgColor={inputBg} textColor={theme.text} iconColor={theme.icon}
                            />
                            <InputField
                                inputRef={phoneRef} icon={<Phone />} placeholder="Phone Number" value={phone} onChangeText={setPhone}
                                keyboardType="phone-pad" onSubmitEditing={() => passwordRef.current?.focus()}
                                focused={focused === 'phone'} onFocus={() => setFocused('phone')} onBlur={() => setFocused('')}
                                tint={theme.tint} border={theme.border} bgColor={inputBg} textColor={theme.text} iconColor={theme.icon}
                            />
                            <InputField
                                inputRef={passwordRef} icon={<Lock />} placeholder="Password (min 6 chars)" value={password} onChangeText={setPassword}
                                secureTextEntry={!showPassword} onSubmitEditing={() => confirmRef.current?.focus()}
                                focused={focused === 'password'} onFocus={() => setFocused('password')} onBlur={() => setFocused('')}
                                tint={theme.tint} border={theme.border} bgColor={inputBg} textColor={theme.text} iconColor={theme.icon}
                                rightElement={
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOff size={18} color={theme.icon} /> : <Eye size={18} color={theme.icon} />}
                                    </TouchableOpacity>
                                }
                            />
                            <InputField
                                inputRef={confirmRef} icon={<Lock />} placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword}
                                secureTextEntry={!showPassword} onSubmitEditing={handleNext}
                                focused={focused === 'confirm'} onFocus={() => setFocused('confirm')} onBlur={() => setFocused('')}
                                tint={theme.tint} border={theme.border} bgColor={inputBg} textColor={theme.text} iconColor={theme.icon}
                            />
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <Text style={[styles.stepTitle, { color: theme.text }]}>Step 2: Vehicle & Verification</Text>
                            <InputField
                                icon={<Search />} placeholder="NIC Number (e.g. 199XXXXXXX)" value={nicNumber} onChangeText={setNicNumber}
                                autoCapitalize="characters" onSubmitEditing={() => licenseRef.current?.focus()}
                                focused={focused === 'nic'} onFocus={() => setFocused('nic')} onBlur={() => setFocused('')}
                                tint={theme.tint} border={theme.border} bgColor={inputBg} textColor={theme.text} iconColor={theme.icon}
                            />
                            <InputField
                                inputRef={licenseRef} icon={<Car />} placeholder="Driving License Number" value={licenseNumber} onChangeText={setLicenseNumber}
                                autoCapitalize="characters" onSubmitEditing={() => vehicleRef.current?.focus()}
                                focused={focused === 'license'} onFocus={() => setFocused('license')} onBlur={() => setFocused('')}
                                tint={theme.tint} border={theme.border} bgColor={inputBg} textColor={theme.text} iconColor={theme.icon}
                            />
                            <InputField
                                inputRef={vehicleRef} icon={<Truck />} placeholder="Vehicle Number (e.g. WP ABC-1234)" value={vehicleNumber} onChangeText={setVehicleNumber}
                                autoCapitalize="characters" onSubmitEditing={handleNext}
                                focused={focused === 'vehicle'} onFocus={() => setFocused('vehicle')} onBlur={() => setFocused('')}
                                tint={theme.tint} border={theme.border} bgColor={inputBg} textColor={theme.text} iconColor={theme.icon}
                            />
                            <Text style={[styles.label, { color: theme.icon }]}>Select Vehicle Type</Text>
                            <View style={styles.vehicleGrid}>
                                {VEHICLE_TYPES.map(type => (
                                    <TouchableOpacity
                                        key={type}
                                        onPress={() => setVehicleType(type)}
                                        style={[styles.vehicleChip, {
                                            backgroundColor: vehicleType === type ? theme.tint + '22' : inputBg,
                                            borderColor: vehicleType === type ? theme.tint : theme.border
                                        }]}
                                    >
                                        <Text style={{ color: vehicleType === type ? theme.tint : theme.text, fontWeight: vehicleType === type ? '700' : '400' }}>{type}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    )}

                    {step === 3 && (
                        <>
                            <Text style={[styles.stepTitle, { color: theme.text }]}>Step 3: Document Upload</Text>
                            <Text style={[styles.stepSubtitle, { color: theme.icon, marginBottom: 20 }]}>Please upload clear photos of your documents</Text>

                            <View style={styles.uploadGrid}>
                                <ImageUploadBox label="Profile Photo" value={profileImage} onUpload={() => handleImageUpload(setProfileImage, 'Profile Photo')} tint={theme.tint} textColor={theme.text} cardBg={inputBg} border={theme.border} />
                                <ImageUploadBox label="License (Front)" value={licenseFront} onUpload={() => handleImageUpload(setLicenseFront, 'License Front')} tint={theme.tint} textColor={theme.text} cardBg={inputBg} border={theme.border} />
                                <ImageUploadBox label="License (Back)" value={licenseBack} onUpload={() => handleImageUpload(setLicenseBack, 'License Back')} tint={theme.tint} textColor={theme.text} cardBg={inputBg} border={theme.border} />
                                <ImageUploadBox label="NIC (Front)" value={nicFront} onUpload={() => handleImageUpload(setNicFront, 'NIC Front')} tint={theme.tint} textColor={theme.text} cardBg={inputBg} border={theme.border} />
                                <ImageUploadBox label="NIC (Back)" value={nicBack} onUpload={() => handleImageUpload(setNicBack, 'NIC Back')} tint={theme.tint} textColor={theme.text} cardBg={inputBg} border={theme.border} />
                                <ImageUploadBox label="Vehicle Plate (Front)" value={vehicleFront} onUpload={() => handleImageUpload(setVehicleFront, 'Vehicle Front')} tint={theme.tint} textColor={theme.text} cardBg={inputBg} border={theme.border} />
                                <ImageUploadBox label="Vehicle Plate (Back)" value={vehicleBack} onUpload={() => handleImageUpload(setVehicleBack, 'Vehicle Back')} tint={theme.tint} textColor={theme.text} cardBg={inputBg} border={theme.border} />
                                <ImageUploadBox label="Vehicle Book (CR)" value={vehicleBook} onUpload={() => handleImageUpload(setVehicleBook, 'Vehicle Book')} tint={theme.tint} textColor={theme.text} cardBg={inputBg} border={theme.border} />
                            </View>
                        </>
                    )}

                    {step === 4 && (
                        <>
                            <Text style={[styles.stepTitle, { color: theme.text }]}>Step 4: Payout Details</Text>
                            <InputField
                                icon={<MapPin />} placeholder="Home Address" value={homeAddress} onChangeText={setHomeAddress}
                                autoCapitalize="words" onSubmitEditing={() => bankRef.current?.focus()}
                                focused={focused === 'address'} onFocus={() => setFocused('address')} onBlur={() => setFocused('')}
                                tint={theme.tint} border={theme.border} bgColor={inputBg} textColor={theme.text} iconColor={theme.icon}
                            />
                            <Text style={[styles.label, { color: theme.icon, marginTop: 10 }]}>Bank Account Information</Text>
                            <InputField
                                inputRef={bankRef} icon={<Landmark />} placeholder="Bank Name" value={bankName} onChangeText={setBankName}
                                autoCapitalize="words" onSubmitEditing={() => branchRef.current?.focus()}
                                focused={focused === 'bank'} onFocus={() => setFocused('bank')} onBlur={() => setFocused('')}
                                tint={theme.tint} border={theme.border} bgColor={inputBg} textColor={theme.text} iconColor={theme.icon}
                            />
                            <InputField
                                inputRef={branchRef} icon={<Search />} placeholder="Branch Name" value={branchName} onChangeText={setBranchName}
                                autoCapitalize="words" onSubmitEditing={() => holderRef.current?.focus()}
                                focused={focused === 'branch'} onFocus={() => setFocused('branch')} onBlur={() => setFocused('')}
                                tint={theme.tint} border={theme.border} bgColor={inputBg} textColor={theme.text} iconColor={theme.icon}
                            />
                            <InputField
                                inputRef={holderRef} icon={<User />} placeholder="Account Holder Name" value={accountHolderName} onChangeText={setAccountHolderName}
                                autoCapitalize="words" onSubmitEditing={() => accNumberRef.current?.focus()}
                                focused={focused === 'holder'} onFocus={() => setFocused('holder')} onBlur={() => setFocused('')}
                                tint={theme.tint} border={theme.border} bgColor={inputBg} textColor={theme.text} iconColor={theme.icon}
                            />
                            <InputField
                                inputRef={accNumberRef} icon={<CreditCard />} placeholder="Account Number" value={accountNumber} onChangeText={setAccountNumber}
                                keyboardType="number-pad" onSubmitEditing={handleRegister}
                                focused={focused === 'accNo'} onFocus={() => setFocused('accNo')} onBlur={() => setFocused('')}
                                tint={theme.tint} border={theme.border} bgColor={inputBg} textColor={theme.text} iconColor={theme.icon}
                            />
                        </>
                    )}

                    <Pressable
                        onPress={step < totalSteps ? handleNext : handleRegister}
                        disabled={isLoading}
                        hitSlop={20}
                        style={({ pressed }) => [
                            styles.primaryBtnWrapper,
                            { opacity: (pressed || isLoading) ? 0.6 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }
                        ]}
                    >
                        <LinearGradient colors={['#FFB300', '#FF8F00']} style={styles.primaryBtn}>
                            {isLoading ? <ActivityIndicator color="#1A1A1A" /> : (
                                <>
                                    <Text style={styles.primaryBtnText}>{step < totalSteps ? 'Next Step' : 'Finish Registration'}</Text>
                                    <ChevronRight size={18} color="#1A1A1A" strokeWidth={2.5} />
                                </>
                            )}
                        </LinearGradient>
                    </Pressable>

                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    scroll: { flexGrow: 1 },
    hero: { padding: 30, paddingTop: 60, alignItems: 'center', overflow: 'hidden' },
    glowRing1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#FFB30010', top: -50, right: -50 },
    glowRing2: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: '#FFB30018', bottom: -40, left: -30 },
    backBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginBottom: 20 },
    backText: { color: '#FFB300', fontWeight: '600', marginLeft: 5 },
    heroTitle: { fontSize: 28, fontWeight: '800', color: '#FFF' },
    heroSubtitle: { fontSize: 14, color: '#9BA1A6', marginTop: 5 },
    stepRow: { flexDirection: 'row', alignItems: 'center', marginTop: 25 },
    stepDot: { height: 8, borderRadius: 4, marginHorizontal: 2 },
    stepLine: { width: 30, height: 2 },
    card: {
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        marginTop: -25,
        padding: 30,
        paddingBottom: 60
    },
    stepTitle: { fontSize: 20, fontWeight: '700', marginBottom: 10 },
    stepSubtitle: { fontSize: 13 },
    inputGroup: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 15, paddingHorizontal: 15, paddingVertical: 12, marginBottom: 15 },
    input: { flex: 1, marginLeft: 10, fontSize: 15 },
    label: { fontSize: 13, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase' },
    vehicleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    vehicleChip: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10, borderWidth: 1.5 },
    primaryBtnWrapper: {
        borderRadius: 15,
        overflow: 'hidden',
        marginTop: 30,
        marginBottom: 20,
        zIndex: 999,
        elevation: 5
    },
    primaryBtn: { paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
    primaryBtnText: { color: '#1A1A1A', fontSize: 16, fontWeight: '800' },
    successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    successContent: { alignItems: 'center', padding: 40 },
    successIcon: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
    successTitle: { fontSize: 24, fontWeight: '800', color: '#FFF', textAlign: 'center' },
    successSubtitle: { fontSize: 15, color: '#9BA1A6', textAlign: 'center', marginTop: 10, marginBottom: 30 },
    successBtnWrapper: { width: 200, borderRadius: 10, overflow: 'hidden' },
    successBtn: { paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 },
    successBtnText: { fontWeight: '700' },
    // Upload Styles
    uploadGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 15 },
    uploadBoxContainer: { width: '47%', marginBottom: 5 },
    uploadLabel: { fontSize: 12, fontWeight: '600', marginBottom: 5 },
    uploadBox: { height: 100, borderRadius: 12, borderWidth: 1.5, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    previewContainer: { width: '100%', height: '100%' },
    previewImage: { width: '100%', height: '100%' },
    changeOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 30, backgroundColor: 'rgba(0,0,0,0.6)', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 },
    changeText: { color: '#fff', fontSize: 10, fontWeight: '600' },
    uploadPlaceholder: { alignItems: 'center' },
    uploadText: { fontSize: 11, fontWeight: '700', marginTop: 5 },
    successScroll: {
        flexGrow: 1,
        justifyContent: 'center',
    },
});
