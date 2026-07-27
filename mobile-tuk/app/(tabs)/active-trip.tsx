import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, Linking, Platform } from 'react-native';
import { Navigation, Clock, Package, MapPin, Search } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { driverApi } from '../../constants/api';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from 'react-native';
import SwipeSlider from '../../components/SwipeSlider';
import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';

const { height, width } = Dimensions.get('window');

export default function ActiveTrip() {
    const colorScheme = (useColorScheme() ?? 'dark') as 'light' | 'dark';
    const theme = Colors[colorScheme];
    const { driver } = useAuth();
    const driverId = driver?.id ?? '1';

    const [loading, setLoading] = useState(true);
    const [activeOrder, setActiveOrder] = useState<any>(null);
    const [driverLocation, setDriverLocation] = useState<Location.LocationObject | null>(null);

    const fetchActiveTrip = async () => {
        try {
            const res = await driverApi.getDashboard(driverId);
            if (res.data?.stats?.activeOrders && res.data.stats.activeOrders.length > 0) {
                setActiveOrder(res.data.stats.activeOrders[0]);
            } else {
                setActiveOrder(null);
            }
        } catch (error) {
            console.error('Failed to fetch active trip:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchActiveTrip();
            requestLocationPermission();
        }, [])
    );

    const requestLocationPermission = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
            let location = await Location.getCurrentPositionAsync({});
            setDriverLocation(location);
        }
    };

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        if (!lat1 || !lon1 || !lat2 || !lon2) return '0.0';
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; 
        return d.toFixed(1);
    };

    const openInGoogleMaps = (label: string, lat: number, lng: number) => {
        const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${lat},${lng}`;
        const labelEncoded = encodeURIComponent(label);
        const url = Platform.select({
            ios: `${scheme}${labelEncoded}@${latLng}`,
            android: `${scheme}${latLng}(${labelEncoded})`,
            default: `https://www.google.com/maps/search/?api=1&query=${latLng}`,
        });

        Linking.canOpenURL(url as string).then(supported => {
            if (supported) {
                Linking.openURL(url as string);
            } else {
                Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latLng}`);
            }
        });
    };

    const handleUpdateAssignmentStatus = async (assignmentId: number, status: string) => {
        try {
            await driverApi.updateRideStatus(driverId, assignmentId.toString(), status);
            fetchActiveTrip(); // Refresh to get updated status
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.tint} />
            </View>
        );
    }

    if (!activeOrder) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <View style={{ padding: 30, backgroundColor: theme.card, borderRadius: 100, marginBottom: 20 }}>
                    <Search size={40} color={theme.icon} />
                </View>
                <Text style={{ color: theme.text, fontSize: 20, fontWeight: 'bold' }}>No Active Trip</Text>
                <Text style={{ color: theme.icon, fontSize: 14, marginTop: 10 }}>Wait for incoming requests.</Text>
            </View>
        );
    }

    const isPickup = activeOrder.order_status === 'Pickup' || activeOrder.order_status === 'Pending';
    const rideStatus = activeOrder.status;

    const headingToLaundry = isPickup ? (rideStatus === 'picked_up') : (rideStatus !== 'picked_up');
    const isHeadingToPickup = rideStatus === 'assigned' || rideStatus === 'arrived';

    const targetAddress = headingToLaundry 
        ? (activeOrder.laundry_address || activeOrder.laundry_name) 
        : activeOrder.pickup_address;
        
    const targetLat = headingToLaundry ? activeOrder.laundry_lat : (activeOrder.customer_lat || 6.9271);
    const targetLng = headingToLaundry ? activeOrder.laundry_lng : (activeOrder.customer_lng || 79.8612);

    const distString = calculateDistance(
        driverLocation?.coords.latitude || 6.9271,
        driverLocation?.coords.longitude || 79.8612,
        targetLat,
        targetLng
    );
    const dist = parseFloat(distString);

    const headerText = isHeadingToPickup 
        ? (isPickup ? 'Pick Up Items from Customer' : 'Pick Up Items from Laundry')
        : (isPickup ? 'Deliver to Laundry' : 'Deliver to Customer');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.card }]}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Active Trip</Text>
                <Text style={[styles.orderId, { color: theme.icon }]}>#GW-{activeOrder.order_id}</Text>
            </View>

            <View style={styles.content}>
                <View style={[styles.statusBanner, { backgroundColor: isHeadingToPickup ? 'rgba(255, 179, 0, 0.1)' : 'rgba(16, 185, 129, 0.1)' }]}>
                    <View style={[styles.pulseDot, { backgroundColor: isHeadingToPickup ? '#FFB300' : '#10B981' }]} />
                    <Text style={[styles.statusText, { color: isHeadingToPickup ? '#FFB300' : '#10B981' }]}>
                        {headerText}
                    </Text>
                </View>

                <View style={[styles.locationCard, { backgroundColor: theme.card }]}>
                    <View style={styles.locationHeader}>
                        <MapPin color={theme.tint} size={24} />
                        <Text style={[styles.locationLabel, { color: theme.icon }]}>
                            {isHeadingToPickup ? 'Navigate to Pickup' : 'Navigate to Drop-off'}
                        </Text>
                    </View>
                    <Text style={[styles.addressText, { color: theme.text }]}>{targetAddress}</Text>
                    
                    <View style={styles.distanceRow}>
                        <View style={styles.distanceMetric}>
                            <Text style={[styles.metricValue, { color: theme.tint }]}>{dist} km</Text>
                            <Text style={[styles.metricLabel, { color: theme.icon }]}>Distance</Text>
                        </View>
                        <View style={styles.distanceMetric}>
                            <Text style={[styles.metricValue, { color: theme.tint }]}>{Math.round(dist * 5)} mins</Text>
                            <Text style={[styles.metricLabel, { color: theme.icon }]}>Est. Time</Text>
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={[styles.mapButton, { backgroundColor: theme.tint }]}
                        onPress={() => openInGoogleMaps(targetAddress, targetLat, targetLng)}
                    >
                        <Navigation size={20} color="#fff" style={{ marginRight: 8 }}/>
                        <Text style={styles.mapButtonText}>Open in Google Maps</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.actionContainer}>
                    {rideStatus === 'assigned' && (
                        <SwipeSlider 
                            theme={theme} 
                            text="Slide when Arrived" 
                            onSwipeComplete={() => handleUpdateAssignmentStatus(activeOrder.id, 'arrived')} 
                        />
                    )}
                    {rideStatus === 'arrived' && (
                        <SwipeSlider 
                            theme={theme} 
                            text="Slide to Start Trip" 
                            onSwipeComplete={() => handleUpdateAssignmentStatus(activeOrder.id, 'picked_up')} 
                        />
                    )}
                    {rideStatus === 'picked_up' && (
                        <SwipeSlider 
                            theme={theme} 
                            text={isPickup ? "Slide to Complete Dropoff" : "Slide to Complete Delivery"} 
                            onSwipeComplete={() => handleUpdateAssignmentStatus(activeOrder.id, 'delivered')} 
                        />
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    orderId: {
        fontSize: 16,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    pulseDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 12,
    },
    statusText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    locationCard: {
        padding: 20,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        marginBottom: 40,
    },
    locationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    locationLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    addressText: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    distanceRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        paddingTop: 16,
        marginBottom: 20,
    },
    distanceMetric: {
        alignItems: 'center',
    },
    metricValue: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    metricLabel: {
        fontSize: 12,
    },
    mapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
    },
    mapButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    actionContainer: {
        marginTop: 'auto',
        marginBottom: 30,
    }
});
