import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, ActivityIndicator, Alert, RefreshControl, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { Colors } from '../../constants/Colors';
import { MapPin, Navigation, Clock, CreditCard, ChevronRight } from 'lucide-react-native';
import { driverApi } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';

export default function JobsScreen() {
    const colorScheme = (useColorScheme() ?? 'dark') as 'light' | 'dark';
    const theme = Colors[colorScheme];
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const { driver } = useAuth();
    const driverId = driver?.id ?? '1';

    const openInGoogleMaps = (address: string, lat?: number, lng?: number) => {
        if (!address && (!lat || !lng)) {
            Alert.alert("Error", "Location not found for this job.");
            return;
        }
        
        const query = (lat && lng) ? `${lat},${lng}` : encodeURIComponent(address);
        const nativeUrl = Platform.select({
            ios: (lat && lng) ? `http://maps.apple.com/?daddr=${lat},${lng}&dirflg=d` : `maps://0,0?q=${encodeURIComponent(address)}`,
            android: (lat && lng) ? `google.navigation:q=${lat},${lng}` : `geo:0,0?q=${encodeURIComponent(address)}`,
            default: `https://www.google.com/maps/search/?api=1&query=${query}`
        });

        const webUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
        
        if (Platform.OS === 'web') {
            window.open(webUrl, '_blank');
        } else {
            Linking.openURL(nativeUrl).catch(() => {
                Linking.openURL(webUrl);
            });
        }
    };

    const fetchJobs = async () => {
        try {
            const response = await driverApi.getAvailableJobs();
            setJobs(response.data);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            // Fallback mock data if API fails during development
            setJobs([
                {
                    id: '1',
                    customer_name: 'Sunil Perera',
                    service_name: 'Wash & Press',
                    address: '123, Galle Road, Colombo 03',
                    total_price: 450.00,
                    created_at: new Date().toISOString()
                }
            ]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchJobs();
    }, []);

    const handleAccept = async (orderId: string, address: string, lat?: number, lng?: number) => {
        try {
            await driverApi.acceptJob(driverId, orderId);
            
            Alert.alert(
                'Success', 
                'Job accepted successfully! Would you like to start navigation to the pickup location?',
                [
                    { text: "No", style: "cancel" },
                    { text: "Open Maps", onPress: () => openInGoogleMaps(address, lat, lng) }
                ]
            );
            
            fetchJobs(); // Refresh list
        } catch (error: any) {
            console.error('Error accepting job:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to accept job');
        }
    };

    if (loading && !refreshing) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={theme.tint} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>Nearby Requests</Text>
                <Text style={[styles.subtitle, { color: theme.icon }]}>
                    {jobs.length} {jobs.length === 1 ? 'request' : 'requests'} available now
                </Text>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />
                }
            >
                {jobs.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={[styles.emptyText, { color: theme.icon }]}>No requests available. Keep checking!</Text>
                    </View>
                ) : (
                    jobs.map((job) => (
                        <TouchableOpacity key={job.id} style={[styles.jobCard, { backgroundColor: theme.card }]}>
                            <View style={styles.cardHeader}>
                                <View style={styles.userInfo}>
                                    <View style={[styles.avatar, { backgroundColor: theme.background }]}>
                                        <Text style={[styles.avatarText, { color: theme.tint }]}>{job.customer_name?.[0] || 'U'}</Text>
                                    </View>
                                    <View>
                                        <Text style={[styles.customerName, { color: theme.text }]}>{job.customer_name}</Text>
                                        <Text style={[styles.serviceType, { color: theme.tint }]}>{job.service_name}</Text>
                                    </View>
                                </View>
                                <Text style={[styles.jobFee, { color: theme.success }]}>LKR {job.total_price}</Text>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.locationContainer}>
                                <MapPin size={18} color={theme.icon} />
                                <Text style={[styles.locationText, { color: theme.text }]} numberOfLines={1}>
                                    {job.address}
                                </Text>
                            </View>

                            <View style={styles.statsRow}>
                                <View style={styles.statLine}>
                                    <Navigation size={14} color={theme.icon} />
                                    <Text style={[styles.statText, { color: theme.icon }]}>~1.5 km</Text>
                                </View>
                                <View style={styles.statLine}>
                                    <Clock size={14} color={theme.icon} />
                                    <Text style={[styles.statText, { color: theme.icon }]}>Just now</Text>
                                </View>
                            </View>

                            <View style={styles.actionRow}>
                                <TouchableOpacity
                                    style={[styles.secondaryButton, { backgroundColor: theme.background }]}
                                    onPress={() => Alert.alert('Information', 'Feature to decline will be available in next update.')}
                                >
                                    <Text style={[styles.secondaryButtonText, { color: theme.error }]}>Decline</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.primaryButton, { backgroundColor: theme.tint }]}
                                    onPress={() => handleAccept(job.id, job.address, job.customer_lat, job.customer_lng)}
                                >
                                    <Text style={styles.primaryButtonText}>Accept Job</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
    },
    header: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 16,
        marginTop: 4,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    jobCard: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 15,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    customerName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    serviceType: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    jobFee: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(155, 161, 166, 0.1)',
        marginBottom: 15,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    locationText: {
        fontSize: 14,
        marginLeft: 8,
        flex: 1,
    },
    statsRow: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    statLine: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    statText: {
        fontSize: 12,
        marginLeft: 6,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    secondaryButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
    },
    secondaryButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    primaryButton: {
        flex: 2,
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#121212',
        fontSize: 14,
        fontWeight: 'bold',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
    },
});
