import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { Navigation, Clock, Package, MapPin, ChevronDown } from 'lucide-react-native';
import SwipeSlider from './SwipeSlider'; // We will move SwipeSlider to components folder too

const { height, width } = Dimensions.get('window');

interface ActiveJobOverlayProps {
    visible: boolean;
    activeOrder: any;
    theme: any;
    driverLocation: any;
    calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => string;
    openInGoogleMaps: (label: string, lat: number, lng: number, destLat?: number, destLng?: number) => void;
    handleUpdateAssignmentStatus: (orderId: number, status: string) => void;
    onMinimize: () => void;
}

export default function ActiveJobOverlay({
    visible,
    activeOrder,
    theme,
    driverLocation,
    calculateDistance,
    openInGoogleMaps,
    handleUpdateAssignmentStatus,
    onMinimize
}: ActiveJobOverlayProps) {
    if (!visible || !activeOrder) return null;

    const isPickup = activeOrder.order_status === 'Pickup' || activeOrder.order_status === 'Pending';
    const rideStatus = activeOrder.status;

    // PickMe / Uber Flow Logic:
    // 1. Heading to Pickup (assigned) -> Show ONLY Pickup Location
    // 2. Arrived at Pickup (arrived) -> Show ONLY Pickup Location + Slide to start
    // 3. Heading to Dropoff (picked_up) -> Show ONLY Dropoff Location

    const headingToLaundry = isPickup ? (rideStatus === 'picked_up') : (rideStatus !== 'picked_up');
    const isHeadingToPickup = rideStatus === 'assigned' || rideStatus === 'arrived';
    const isHeadingToDropoff = rideStatus === 'picked_up';

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
        <Modal visible={visible} transparent={true} animationType="slide">
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={[styles.header, { backgroundColor: theme.card }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity onPress={onMinimize} style={{ padding: 8, marginRight: 8, backgroundColor: theme.background, borderRadius: 20 }}>
                            <ChevronDown size={24} color={theme.text} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: theme.text }]}>Active Trip</Text>
                    </View>
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
                                onSwipeComplete={() => {
                                    handleUpdateAssignmentStatus(activeOrder.id, 'picked_up');
                                }} 
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
        </Modal>
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
