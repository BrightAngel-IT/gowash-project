import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing } from '@/constants/theme';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { getUser, logout as apiLogout } from '@/constants/api';

export default function ProfileScreen() {
    const router = useRouter();
    const [user, setUser] = React.useState<any>(null);
    const [stats, setStats] = React.useState({ orders: 0, spent: 0 });

    React.useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        const userData = await getUser();
        setUser(userData);

        // Mocking stats for now or could fetch from backend if endpoint exists
        setStats({ orders: 12, spent: 150 });
    };

    const handleLogout = async () => {
        await apiLogout();
        router.replace('/(auth)/welcome');
    };

    const menuGroups = [
        {
            title: 'Account',
            items: [
                { icon: 'person-outline', label: 'Edit Profile' },
                { icon: 'location-outline', label: 'Saved Addresses' },
                { icon: 'wallet-outline', label: 'Payment Methods' },
            ]
        },
        {
            title: 'Preferences',
            items: [
                { icon: 'notifications-outline', label: 'Notifications', type: 'switch', value: true },
                { icon: 'moon-outline', label: 'Dark Mode', type: 'switch', value: false },
                { icon: 'language-outline', label: 'Language', value: 'English' },
            ]
        },
        {
            title: 'Support',
            items: [
                { icon: 'help-circle-outline', label: 'Help Center' },
                { icon: 'document-text-outline', label: 'Privacy Policy' },
                { icon: 'log-out-outline', label: 'Log Out', color: Colors.error, action: handleLogout },
            ]
        }
    ];

    return (
        <View style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent}>

                    <View style={styles.header}>
                        <View style={styles.avatarContainer}>
                            <View style={[styles.avatar, { backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
                                <Text style={{ color: '#fff', fontSize: 32, fontWeight: '700' }}>
                                    {user?.name?.charAt(0) || 'U'}
                                </Text>
                            </View>
                            <TouchableOpacity style={styles.editBadge}>
                                <Ionicons name="camera" size={16} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.name}>{user?.name || 'Loading...'}</Text>
                        <Text style={styles.email}>{user?.email || ''}</Text>
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>{stats.orders}</Text>
                                <Text style={styles.statLabel}>Orders</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statNumber}>LKR {stats.spent}</Text>
                                <Text style={styles.statLabel}>Spent</Text>
                            </View>
                        </View>
                    </View>

                    {menuGroups.map((group, groupIndex) => (
                        <Animated.View
                            key={group.title}
                            entering={FadeInDown.delay(groupIndex * 100 + 200)}
                            style={styles.section}
                        >
                            <Text style={styles.sectionTitle}>{group.title}</Text>
                            <View style={styles.sectionContent}>
                                {group.items.map((item, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[styles.menuItem, index === group.items.length - 1 && styles.lastMenuItem]}
                                        onPress={item.action}
                                    >
                                        <View style={styles.menuItemLeft}>
                                            <View style={[styles.iconBox, { backgroundColor: (item.color || Colors.primary) + '15' }]}>
                                                <Ionicons name={item.icon as any} size={20} color={item.color || Colors.text} />
                                            </View>
                                            <Text style={[styles.menuItemLabel, { color: item.color || Colors.text }]}>{item.label}</Text>
                                        </View>

                                        {item.type === 'switch' ? (
                                            <Switch
                                                value={item.value as boolean}
                                                trackColor={{ false: Colors.border, true: Colors.primary }}
                                                thumbColor={'#fff'}
                                            />
                                        ) : item.value ? (
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <Text style={styles.valueText}>{item.value as string}</Text>
                                                <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
                                            </View>
                                        ) : (
                                            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </Animated.View>
                    ))}

                    <View style={{ height: 40 }} />
                    <Text style={styles.version}>Version 1.0.0</Text>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F9FC',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        padding: 30,
        backgroundColor: '#fff',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        marginBottom: 24,
        shadowColor: Colors.text,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 5,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Colors.primary,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    name: {
        ...Typography.h2,
        color: Colors.text,
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 24,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '80%',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.primary,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: Colors.border,
    },
    section: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginBottom: 12,
        marginLeft: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    sectionContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingHorizontal: 20,
        shadowColor: Colors.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 8,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    lastMenuItem: {
        borderBottomWidth: 0,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuItemLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    valueText: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginRight: 8,
    },
    version: {
        textAlign: 'center',
        color: Colors.textSecondary,
        fontSize: 12,
    }
});
