import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useColorScheme, Alert, Modal, ActivityIndicator, Platform } from 'react-native';
import { Colors } from '../../constants/Colors';
import { User, Car, Shield, Bell, HelpCircle, LogOut, ChevronRight, Star, X, MapPin, Phone, Mail, Landmark, CreditCard, FileText, Search } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { driverApi } from '../../constants/api';

export default function ProfileScreen() {
    const colorScheme = (useColorScheme() ?? 'dark') as 'light' | 'dark';
    const theme = Colors[colorScheme];
    const { driver, logout } = useAuth();
    const [fullProfile, setFullProfile] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [activeSection, setActiveSection] = useState<string | null>(null);

    useEffect(() => {
        if (driver?.id) {
            fetchFullProfile();
        }
    }, [driver?.id]);

    const fetchFullProfile = async () => {
        setLoading(true);
        try {
            const response = await driverApi.getProfile(driver!.id);
            setFullProfile(response.data);
        } catch (error) {
            console.error('Error fetching full profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        const performLogout = async () => {
            try {
                console.log("Attempting logout...");
                await logout();
                console.log("Logout successful");
            } catch (error) {
                console.error("Logout failed:", error);
                Alert.alert("Error", "Failed to log out. Please try again.");
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm("Are you sure you want to log out?")) {
                performLogout();
            }
        } else {
            Alert.alert(
                "Log Out",
                "Are you sure you want to log out?",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Log Out",
                        style: "destructive",
                        onPress: performLogout
                    }
                ]
            );
        }
    };

    const menuItems = [
        { id: 'personal', icon: <User size={20} color={theme.tint} />, label: 'Personal Information' },
        { id: 'vehicle', icon: <Car size={20} color={theme.tint} />, label: 'Vehicle Details' },
        { id: 'payment', icon: <Landmark size={20} color={theme.tint} />, label: 'Bank & Payouts' },
        { id: 'security', icon: <Shield size={20} color={theme.tint} />, label: 'Security & Documents' },
        { id: 'support', icon: <HelpCircle size={20} color={theme.tint} />, label: 'Support & Help' },
    ];

    if (!driver) return null;

    const renderDetailModal = () => {
        if (!activeSection) return null;

        let title = "";
        let content = null;

        const profileData = fullProfile || driver;

        switch (activeSection) {
            case 'personal':
                title = "Personal Information";
                content = (
                    <View style={styles.modalContent}>
                        <DetailItem label="Full Name" value={profileData.name} icon={<User size={18} color={theme.icon} />} />
                        <DetailItem label="Email" value={profileData.email} icon={<Mail size={18} color={theme.icon} />} />
                        <DetailItem label="Phone" value={profileData.phone} icon={<Phone size={18} color={theme.icon} />} />
                        <DetailItem label="Home Address" value={profileData.home_address || 'Not provided'} icon={<MapPin size={18} color={theme.icon} />} />
                        <DetailItem label="NIC Number" value={profileData.nic_number || 'N/A'} icon={<FileText size={18} color={theme.icon} />} />
                    </View>
                );
                break;
            case 'vehicle':
                title = "Vehicle Details";
                content = (
                    <View style={styles.modalContent}>
                        <DetailItem label="Vehicle Type" value={profileData.vehicle_type} icon={<Car size={18} color={theme.icon} />} />
                        <DetailItem label="Vehicle Number" value={profileData.vehicle_number} icon={<FileText size={18} color={theme.icon} />} />
                        <DetailItem label="License Number" value={profileData.license_number || 'N/A'} icon={<FileText size={18} color={theme.icon} />} />
                        <DetailItem label="Verification Status" value={profileData.status} icon={<Shield size={18} color={theme.icon} />} />
                    </View>
                );
                break;
            case 'payment':
                title = "Bank & Payouts";
                content = (
                    <View style={styles.modalContent}>
                        <DetailItem label="Bank Name" value={profileData.bank_name || 'Not provided'} icon={<Landmark size={18} color={theme.icon} />} />
                        <DetailItem label="Branch" value={profileData.branch_name || 'Not provided'} icon={<Search size={18} color={theme.icon} />} />
                        <DetailItem label="Account Holder" value={profileData.account_holder_name || 'Not provided'} icon={<User size={18} color={theme.icon} />} />
                        <DetailItem label="Account Number" value={profileData.account_number || 'Not provided'} icon={<CreditCard size={18} color={theme.icon} />} />
                    </View>
                );
                break;
            case 'security':
                title = "Documents";
                content = (
                    <View style={styles.modalContent}>
                        <Text style={[styles.infoText, { color: theme.icon }]}>Your documents are securely stored and verified by our team.</Text>
                        <DetailItem label="License Front" value={profileData.license_front_image_url ? 'Uploaded ✓' : 'Pending'} icon={<FileText size={18} color={theme.icon} />} />
                        <DetailItem label="License Back" value={profileData.license_back_image_url ? 'Uploaded ✓' : 'Pending'} icon={<FileText size={18} color={theme.icon} />} />
                        <DetailItem label="NIC Front" value={profileData.nic_front_image_url ? 'Uploaded ✓' : 'Pending'} icon={<FileText size={18} color={theme.icon} />} />
                        <DetailItem label="Vehicle CR" value={profileData.vehicle_book_image_url ? 'Uploaded ✓' : 'Pending'} icon={<FileText size={18} color={theme.icon} />} />
                    </View>
                );
                break;
            case 'support':
                title = "Support & Help";
                content = (
                    <View style={styles.modalContent}>
                        <Text style={[styles.infoText, { color: theme.icon }]}>Need assistance? Contact our support team.</Text>
                        <TouchableOpacity style={[styles.supportButton, { backgroundColor: theme.tint }]}>
                            <Text style={styles.supportButtonText}>WhatsApp Support</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.supportButton, { backgroundColor: theme.card, marginTop: 12 }]}>
                            <Text style={[styles.supportButtonText, { color: theme.text }]}>Call Helpline</Text>
                        </TouchableOpacity>
                    </View>
                );
                break;
        }

        return (
            <Modal
                visible={!!activeSection}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setActiveSection(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalBox, { backgroundColor: theme.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>{title}</Text>
                            <TouchableOpacity onPress={() => setActiveSection(null)}>
                                <X size={24} color={theme.icon} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {loading && !fullProfile ? (
                                <ActivityIndicator size="large" color={theme.tint} style={{ marginVertical: 40 }} />
                            ) : content}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.profileSection}>
                <View style={[styles.profileImage, { backgroundColor: theme.card }]}>
                    <Text style={[styles.profileInitial, { color: theme.tint }]}>
                        {driver.name ? driver.name.charAt(0).toUpperCase() : 'D'}
                    </Text>
                </View>
                <Text style={[styles.name, { color: theme.text }]}>{driver.name}</Text>
                <View style={styles.ratingBadge}>
                    <Text style={styles.ratingText}>
                        <Star size={12} fill="#121212" color="#121212" /> {driver.rating || '0.0'} Driver
                    </Text>
                </View>
            </View>

            <View style={styles.menuContainer}>
                {menuItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[styles.menuItem, { backgroundColor: theme.card }]}
                        onPress={() => setActiveSection(item.id)}
                    >
                        <View style={styles.menuLeft}>
                            {item.icon}
                            <Text style={[styles.menuLabel, { color: theme.text }]}>{item.label}</Text>
                        </View>
                        <ChevronRight size={20} color={theme.icon} />
                    </TouchableOpacity>
                ))}

                <TouchableOpacity
                    style={[styles.logoutButton, { backgroundColor: 'rgba(255, 82, 82, 0.1)' }]}
                    onPress={handleLogout}
                >
                    <LogOut size={20} color={theme.error} />
                    <Text style={[styles.logoutText, { color: theme.error }]}>Log Out</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.footer}>
                <Text style={[styles.version, { color: theme.icon }]}>Tuk Driver v1.0.0</Text>
            </View>

            {renderDetailModal()}
        </ScrollView>
    );
}

function DetailItem({ label, value, icon }: { label: string, value: string, icon: any }) {
    const colorScheme = (useColorScheme() ?? 'dark') as 'light' | 'dark';
    const theme = Colors[colorScheme];

    return (
        <View style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
                {icon}
            </View>
            <View>
                <Text style={[styles.detailLabel, { color: theme.icon }]}>{label}</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{value}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
    },
    profileSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    profileInitial: {
        fontSize: 40,
        fontWeight: 'bold',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    ratingBadge: {
        backgroundColor: '#FFB300',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 8,
    },
    ratingText: {
        color: '#121212',
        fontSize: 12,
        fontWeight: 'bold',
    },
    menuContainer: {
        paddingHorizontal: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuLabel: {
        fontSize: 16,
        marginLeft: 15,
        fontWeight: '500',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        marginTop: 20,
        marginBottom: 40,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    footer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    version: {
        fontSize: 12,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalBox: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    modalContent: {
        paddingBottom: 40,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    detailIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 179, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    detailLabel: {
        fontSize: 12,
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    infoText: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 24,
    },
    supportButton: {
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    supportButtonText: {
        color: '#121212',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
