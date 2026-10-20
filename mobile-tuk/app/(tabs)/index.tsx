import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, useColorScheme, ActivityIndicator, RefreshControl, Modal, Platform, Alert, Dimensions } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { Wallet, Navigation, Star, TrendingUp, Clock, Package, Store, AlertCircle, ChevronRight } from 'lucide-react-native';
import { driverApi, SOCKET_URL } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';
import io from 'socket.io-client';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDE_WIDTH = SCREEN_WIDTH - 80;
const BUTTON_WIDTH = 64;

function SwipeSlider({ onSwipeComplete, theme }: { onSwipeComplete: () => void, theme: any }) {
    const translateX = useSharedValue(0);

    const gesture = Gesture.Pan()
        .onUpdate((event) => {
            if (event.translationX > 0 && event.translationX < SLIDE_WIDTH - BUTTON_WIDTH) {
                translateX.value = event.translationX;
            }
        })
        .onEnd(() => {
            if (translateX.value > (SLIDE_WIDTH - BUTTON_WIDTH) * 0.7) {
                translateX.value = withSpring(SLIDE_WIDTH - BUTTON_WIDTH);
                runOnJS(onSwipeComplete)();
            } else {
                translateX.value = withSpring(0);
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    return (
        <View style={[styles.sliderContainer, { backgroundColor: theme.background }]}>
            <Text style={[styles.sliderText, { color: theme.icon }]}>Slide to Start Trip</Text>
            <GestureDetector gesture={gesture}>
                <Animated.View style={[styles.sliderButton, animatedStyle, { backgroundColor: theme.tint }]}>
                    <ChevronRight color="#fff" size={24} />
                </Animated.View>
            </GestureDetector>
        </View>
    );
}

export default function DashboardScreen() {
    const colorScheme = (useColorScheme() ?? 'dark') as 'light' | 'dark';
    const theme = Colors[colorScheme];
    const [isOnline, setIsOnline] = useState(true);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<any>(null);
    const [newJob, setNewJob] = useState<any>(null);
    const [isJobTaken, setIsJobTaken] = useState(false);
    const { driver } = useAuth();
    const driverId = driver?.id ?? '1';
    const socketRef = useRef<any>(null);
    const [driverLocation, setDriverLocation] = useState<Location.LocationObject | null>(null);

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return parseFloat(d.toFixed(1));
    };

    const requestLocationPermission = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Please allow location access to calculate distances.');
            return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setDriverLocation(location);
    };

    const openInGoogleMaps = (address: string, destLat?: number, destLng?: number, startLat?: number, startLng?: number) => {
        if (!address && (!destLat || !destLng)) {
            Alert.alert("Error", "Location not found for this job.");
            return;
        }
        
        if (startLat && startLng && destLat && destLng) {
            const url = `https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLng}&destination=${destLat},${destLng}`;
            if (Platform.OS === 'web') {
                window.open(url, '_blank');
            } else {
                Linking.openURL(url).catch(err => {
                    console.error("Failed to open map:", err);
                });
            }
            return;
        }

        const query = (destLat && destLng) ? `${destLat},${destLng}` : encodeURIComponent(address);
        
        const nativeUrl = Platform.select({
            ios: (destLat && destLng) ? `http://maps.apple.com/?daddr=${destLat},${destLng}&dirflg=d` : `maps://0,0?q=${encodeURIComponent(address)}`,
            android: (destLat && destLng) ? `google.navigation:q=${destLat},${destLng}` : `geo:0,0?q=${encodeURIComponent(address)}`,
            default: `https://www.google.com/maps/search/?api=1&query=${query}`
        });

        const webUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

        if (Platform.OS === 'web') {
            window.open(webUrl, '_blank');
            return;
        }

        Linking.openURL(nativeUrl).catch(err => {
            console.error("Native app not found, falling back to web:", err);
            Linking.openURL(webUrl);
        });
    };

    const handleUpdateAssignmentStatus = async (assignmentId: string, status: string) => {
        try {
            await driverApi.updateRideStatus(driverId, assignmentId, status);
            fetchDashboard();
            Alert.alert("Success", `Status updated to ${status.replace('_', ' ')}`);
        } catch (error) {
            console.error('Error updating assignment status:', error);
            Alert.alert("Error", "Failed to update status. Please try again.");
        }
    };

    const fetchDashboard = async () => {
        try {
            const [dashboardRes, historyRes] = await Promise.all([
                driverApi.getDashboard(driverId),
                driverApi.getHistory(driverId)
            ]);
            
            setData({
                ...dashboardRes.data,
                recentJobs: historyRes.data
            });
            setIsOnline(dashboardRes.data.driver.status === 'online');
        } catch (error) {
            console.error('Error fetching dashboard:', error);
            setData({
                driver: { name: 'Ravi', vehicle_info: 'WP-ABC-1234', status: 'online' },
                stats: { 
                    todayEarnings: 4250.00, 
                    ridesCompleted: 8, 
                    rating: 4.9, 
                    activeOrdersCount: 0,
                    activeOrders: []
                }
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
        socketRef.current = io(SOCKET_URL);

        socketRef.current.on('connect', () => {
            console.log('Driver connected to socket');
        });

        socketRef.current.on('new_driver_job', (job: any) => {
            console.log('New job received:', job);
            if (isOnline) {
                setNewJob(job);
                setIsJobTaken(false);
            }
        });

        socketRef.current.on('job_taken', (data: { orderId: number, driverId: number }) => {
            if (data.driverId.toString() === driver?.id?.toString()) return;

            setNewJob((prevJob: any) => {
                if (prevJob && prevJob.id === data.orderId) {
                    setIsJobTaken(true);
                    return null;
                }
                return prevJob;
            });
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [isOnline]);

    useEffect(() => {
        requestLocationPermission();
        const locInterval = setInterval(async () => {
            try {
                let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                setDriverLocation(location);
            } catch (e) {}
        }, 30000);

        return () => clearInterval(locInterval);
    }, []);

    const handleAcceptJob = async () => {
        if (!newJob) return;

        try {
            await driverApi.acceptJob(driverId, newJob.id);
            const isDelivery = newJob.status === 'Ready';
            const pickupAddress = isDelivery ? (newJob.laundry_address || newJob.laundryName) : newJob.address;
            
            // The destination for the FIRST leg is the pickup address (where the driver needs to go now)
            const destLat = isDelivery ? newJob.laundry_lat : newJob.customer_lat;
            const destLng = isDelivery ? newJob.laundry_lng : newJob.customer_lng;

            setNewJob(null);
            
            Alert.alert(
                "Success", 
                "You have accepted the job! Navigating to the pickup location...",
                [
                    { text: "Later", style: "cancel" },
                    { text: "Open Maps", onPress: () => openInGoogleMaps(pickupAddress, destLat, destLng) }
                ]
            );

            openInGoogleMaps(pickupAddress, destLat, destLng);
            fetchDashboard();
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to accept job. It might appear to be taken.");
        }
    };

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchDashboard();
    }, []);

    const toggleStatus = async (value: boolean) => {
        const newStatus = value ? 'online' : 'offline';
        setIsOnline(value);
        try {
            await driverApi.updateStatus(driverId, newStatus);
        } catch (error) {
            console.error('Error updating status:', error);
            setIsOnline(!value);
        }
    };

    if (loading && !refreshing) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={theme.tint} />
            </View>
        );
    }

    const { driverInfo, stats } = data
        ? { driverInfo: data.driver, stats: data.stats }
        : { driverInfo: null, stats: {} };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.greeting, { color: theme.text }]}>Hello, {driver?.name || driverInfo?.name || 'Driver'}!</Text>
                        <Text style={[styles.vehicle, { color: theme.icon }]}>{driver?.vehicleNumber || driverInfo?.vehicle_number || 'Vehicle'} • {driver?.vehicleType || 'Tuk Tuk'}</Text>
                    </View>
                    <View style={styles.statusContainer}>
                        <Text style={[styles.statusText, { color: isOnline ? theme.success : theme.icon }]}>
                            {isOnline ? 'ONLINE' : 'OFFLINE'}
                        </Text>
                        <Switch
                            value={isOnline}
                            onValueChange={toggleStatus}
                            trackColor={{ false: '#767577', true: theme.tint }}
                            thumbColor={isOnline ? '#fff' : '#f4f3f4'}
                        />
                    </View>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />
                    }
                >
                    {driver?.isProfileIncomplete && (
                        <TouchableOpacity 
                            style={styles.profileIncompleteBanner}
                            onPress={() => router.push({
                                pathname: '/complete-profile',
                                params: { 
                                    userId: driver.id,
                                    name: driver.name,
                                    email: driver.email
                                }
                            })}
                        >
                            <AlertCircle size={20} color="#fff" />
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text style={styles.bannerTitle}>Account Setup Required</Text>
                                <Text style={styles.bannerSubtitle}>Please provide your driver details to start taking jobs.</Text>
                            </View>
                            <View style={styles.bannerButton}>
                                <Text style={styles.bannerButtonText}>Complete</Text>
                            </View>
                        </TouchableOpacity>
                    )}

                    <LinearGradient
                        colors={['#FFB300', '#FF8F00']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.earningsCard}
                    >
                        <View style={styles.earningsInfo}>
                            <Text style={styles.earningsLabel}>Daily Earnings</Text>
                            <Text style={styles.earningsAmount}>LKR {stats.todayEarnings?.toLocaleString()}</Text>
                        </View>
                        <View style={styles.earningsStats}>
                            <View style={styles.statItem}>
                                <TrendingUp size={16} stroke="#fff" />
                                <Text style={styles.statText}>+12%</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Package size={16} stroke="#fff" />
                                <Text style={styles.statText}>{stats.ridesCompleted} Rides</Text>
                            </View>
                        </View>
                    </LinearGradient>

                    <View style={styles.statsRow}>
                        <View style={[styles.miniCard, { backgroundColor: theme.card }]}>
                            <Star color={theme.tint} size={20} fill={theme.tint} strokeWidth={0} />
                            <Text style={[styles.miniCardValue, { color: theme.text }]}>{stats.rating}</Text>
                            <Text style={[styles.miniCardLabel, { color: theme.icon }]}>Rating</Text>
                        </View>
                        <View style={[styles.miniCard, { backgroundColor: theme.card }]}>
                            <Clock color={theme.tint} size={20} strokeWidth={2} />
                            <Text style={[styles.miniCardValue, { color: theme.text }]}>5.2h</Text>
                            <Text style={[styles.miniCardLabel, { color: theme.icon }]}>Online</Text>
                        </View>
                        <View style={[styles.miniCard, { backgroundColor: theme.card }]}>
                            <Navigation color={theme.tint} size={20} strokeWidth={2} />
                            <Text style={[styles.miniCardValue, { color: theme.text }]}>42km</Text>
                            <Text style={[styles.miniCardLabel, { color: theme.icon }]}>Travelled</Text>
                        </View>
                    </View>

                    {isOnline && stats.activeOrdersCount > 0 && stats.activeOrders?.[0] && (() => {
                        const activeOrder = stats.activeOrders[0];
                        const isPickup = activeOrder.order_status === 'Pickup' || activeOrder.order_status === 'Pending';
                        const rideStatus = activeOrder.status;

                        return (
                            <View style={[styles.activeOrderCard, { backgroundColor: theme.card, borderColor: theme.tint }]}>
                                <View style={styles.activeHeader}>
                                    <View style={[styles.activeBadge, { backgroundColor: isPickup ? 'rgba(255, 179, 0, 0.1)' : 'rgba(16, 185, 129, 0.1)' }]}>
                                        <View style={[styles.pulseDot, { backgroundColor: isPickup ? '#FFB300' : '#10B981' }]} />
                                        <Text style={[styles.activeBadgeText, { color: isPickup ? '#FFB300' : '#10B981' }]}>
                                            {isPickup ? 'PICKUP' : 'DELIVERY'}
                                        </Text>
                                    </View>
                                    <Text style={[styles.orderId, { color: theme.icon }]}>#GW-{activeOrder.order_id}</Text>
                                </View>

                                <View style={styles.orderLocation}>
                                    <View style={styles.locationPoint}>
                                        <View style={[styles.dot, { backgroundColor: theme.tint }]} />
                                        <View style={[styles.line, { backgroundColor: theme.border }]} />
                                        <View style={[styles.dot, { backgroundColor: theme.success }]} />
                                    </View>
                                    <View style={styles.locationDetails}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.locationLabel, { color: theme.icon }]}>From</Text>
                                                <Text style={[styles.locationText, { color: theme.text }]} numberOfLines={1}>
                                                    {isPickup ? activeOrder.pickup_address : activeOrder.laundry_name}
                                                </Text>
                                            </View>
                                            {(() => {
                                                const destLat = isPickup ? (activeOrder.customer_lat || 6.9271) : (activeOrder.laundry_lat || 6.9147);
                                                const destLng = isPickup ? (activeOrder.customer_lng || 79.8612) : (activeOrder.laundry_lng || 79.8778);
                                                const dist = calculateDistance(
                                                    driverLocation?.coords.latitude || 6.9271,
                                                    driverLocation?.coords.longitude || 79.8612,
                                                    destLat,
                                                    destLng
                                                );
                                                return (
                                                    <View style={{ alignItems: 'flex-end' }}>
                                                        <Text style={[styles.miniCardValue, { fontSize: 14, marginTop: 0, color: theme.tint }]}>{dist} km</Text>
                                                        <Text style={[styles.miniCardLabel, { fontSize: 10, marginTop: 0 }]}>{Math.round(dist * 5)} mins</Text>
                                                    </View>
                                                );
                                            })()}
                                        </View>
                                        <View style={{ marginTop: 12 }}>
                                            <Text style={[styles.locationLabel, { color: theme.icon }]}>To</Text>
                                            <Text style={[styles.locationText, { color: theme.text }]} numberOfLines={1}>
                                                {isPickup ? activeOrder.laundry_name : activeOrder.pickup_address}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                 <View style={styles.actionRowCard}>
                                    <TouchableOpacity 
                                        style={[styles.miniButton, { backgroundColor: theme.background }]}
                                        onPress={() => {
                                            const headingToLaundry = isPickup ? (rideStatus === 'picked_up') : (rideStatus !== 'picked_up');
                                            if (headingToLaundry) {
                                                openInGoogleMaps(
                                                    activeOrder.laundry_address || activeOrder.laundry_name,
                                                    activeOrder.laundry_lat,
                                                    activeOrder.laundry_lng
                                                );
                                            } else {
                                                openInGoogleMaps(
                                                    activeOrder.pickup_address,
                                                    activeOrder.customer_lat,
                                                    activeOrder.customer_lng
                                                );
                                            }
                                        }}
                                    >
                                        <Navigation size={18} color={theme.tint} />
                                        <Text style={[styles.miniButtonText, { color: theme.text }]}>Map</Text>
                                    </TouchableOpacity>

                                    {rideStatus === 'assigned' && (
                                        <TouchableOpacity 
                                            style={[styles.mainButton, { backgroundColor: theme.tint }]}
                                            onPress={() => handleUpdateAssignmentStatus(activeOrder.id, 'arrived')}
                                        >
                                            <Text style={styles.mainButtonText}>I Have Arrived</Text>
                                        </TouchableOpacity>
                                    )}
                                    {rideStatus === 'arrived' && (
                                        <TouchableOpacity 
                                            style={[styles.mainButton, { backgroundColor: theme.tint, flex: 2.5 }]}
                                            onPress={() => {
                                                handleUpdateAssignmentStatus(activeOrder.id, 'picked_up');
                                                setTimeout(() => {
                                                    if (isPickup) {
                                                        // Explicitly route from Customer to Laundry
                                                        openInGoogleMaps(
                                                            activeOrder.laundry_address || activeOrder.laundry_name,
                                                            activeOrder.laundry_lat,
                                                            activeOrder.laundry_lng,
                                                            activeOrder.customer_lat,
                                                            activeOrder.customer_lng
                                                        );
                                                    } else {
                                                        // Explicitly route from Laundry to Customer
                                                        openInGoogleMaps(
                                                            activeOrder.pickup_address,
                                                            activeOrder.customer_lat,
                                                            activeOrder.customer_lng,
                                                            activeOrder.laundry_lat,
                                                            activeOrder.laundry_lng
                                                        );
                                                    }
                                                }, 1000);
                                            }}
                                        >
                                            <Text style={styles.mainButtonText}>Start Job</Text>
                                        </TouchableOpacity>
                                    )}
                                    {rideStatus === 'picked_up' && (
                                        <TouchableOpacity 
                                            style={[styles.mainButton, { backgroundColor: theme.tint }]}
                                            onPress={() => handleUpdateAssignmentStatus(activeOrder.id, 'delivered')}
                                        >
                                            <Text style={styles.mainButtonText}>{isPickup ? 'Dropped at Laundry' : 'Complete Order'}</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        );
                    })()}

                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Jobs</Text>
                        <TouchableOpacity onPress={() => router.push('/history')}>
                            <Text style={{ color: theme.tint }}>View All</Text>
                        </TouchableOpacity>
                    </View>

                    {data?.stats?.activeOrdersCount === 0 && (!data?.recentJobs || data.recentJobs.length === 0) && (
                        <View style={[styles.emptyJobsCard, { backgroundColor: theme.card }]}>
                            <Package size={32} color={theme.icon} style={{ marginBottom: 8 }} />
                            <Text style={{ color: theme.icon, fontSize: 14 }}>No recent jobs to show</Text>
                        </View>
                    )}

                    {data?.recentJobs?.slice(0, 3).map((job: any) => (
                        <TouchableOpacity 
                            key={job.assignment_id} 
                            style={[styles.jobItem, { backgroundColor: theme.card }]}
                            onPress={() => router.push('/history')}
                        >
                            <View style={[styles.jobIcon, { backgroundColor: `${theme.tint}15` }]}>
                                <Package size={20} color={theme.tint} />
                            </View>
                            <View style={styles.jobInfo}>
                                <Text style={[styles.jobTitle, { color: theme.text }]} numberOfLines={1}>
                                    {job.pickup_address}
                                </Text>
                                <Text style={[styles.jobTime, { color: theme.icon }]}>
                                    {new Date(job.completed_at || job.assigned_at).toLocaleDateString()}
                                </Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={[styles.jobPrice, { color: theme.success }]}>+LKR {job.delivery_fee}</Text>
                                <Text style={{ fontSize: 10, color: theme.icon }}>{job.ride_status}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Modal
                    visible={!!newJob}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setNewJob(null)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.jobModalContent}>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>New Delivery Request!</Text>
                                    <View style={styles.timerBadge}>
                                        <Clock size={14} stroke="#fff" />
                                        <Text style={styles.timerText}>Recieved just now</Text>
                                    </View>
                                </View>

                                <TouchableOpacity 
                                    style={styles.mapPlaceholder}
                                    onPress={() => {
                                        if (newJob?.status === 'Ready') {
                                            openInGoogleMaps(newJob?.laundry_address || newJob?.laundryName, newJob?.laundry_lat, newJob?.laundry_lng);
                                        } else {
                                            openInGoogleMaps(newJob?.address, newJob?.customer_lat, newJob?.customer_lng);
                                        }
                                    }}
                                >
                                    <View style={styles.routeLine}>
                                        <View style={[styles.routeDot, { backgroundColor: theme.tint }]} />
                                        <View style={styles.routeDash} />
                                        <View style={[styles.routeDot, { backgroundColor: theme.success }]} />
                                    </View>
                                    {(() => {
                                        const destLat = newJob?.status === 'Ready' ? newJob?.laundry_lat : newJob?.customer_lat;
                                        const destLng = newJob?.status === 'Ready' ? newJob?.laundry_lng : newJob?.customer_lng;
                                        const dist = calculateDistance(
                                            driverLocation?.coords.latitude || 6.9271,
                                            driverLocation?.coords.longitude || 79.8612,
                                            destLat || 6.9271,
                                            destLng || 79.8612
                                        );
                                        return (
                                            <Text style={styles.mapText}>{dist} km • {Math.round(dist * 5)} mins</Text>
                                        );
                                    })()}
                                    <Text style={[styles.mapLink, { color: theme.tint }]}>Click to preview route</Text>
                                </TouchableOpacity>

                                <View style={styles.jobDetailsContainer}>
                                    <View style={styles.jobDetailRow}>
                                        <View style={styles.detailIcon}>
                                            <Navigation size={20} stroke={theme.tint} />
                                        </View>
                                        <View style={styles.detailTextContainer}>
                                            <Text style={[styles.detailLabel, { color: theme.icon }]}>Pickup</Text>
                                            <Text style={[styles.detailValue, { color: theme.text }]} numberOfLines={2}>
                                                {newJob?.status === 'Ready' ? `${newJob?.laundryName} Branch` : newJob?.address}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.jobDetailRow}>
                                        <View style={styles.detailIcon}>
                                            <Store size={20} stroke={theme.success} />
                                        </View>
                                        <View style={styles.detailTextContainer}>
                                            <Text style={[styles.detailLabel, { color: theme.icon }]}>Drop Off</Text>
                                            <Text style={[styles.detailValue, { color: theme.text }]}>
                                                {newJob?.status === 'Ready' ? newJob?.address : `${newJob?.laundryName} Branch`}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.statsRowModal}>
                                        <View style={styles.statItemModal}>
                                            <Package size={18} stroke={theme.text} />
                                            <Text style={[styles.statValueModal, { color: theme.text }]}>{newJob?.items} Items</Text>
                                            <Text style={[styles.statLabelModal, { color: theme.icon }]}>~{(newJob?.items * 0.5).toFixed(1)} kg</Text>
                                        </View>
                                        <View style={styles.verticalDivider} />
                                        <View style={styles.statItemModal}>
                                            <Wallet size={18} stroke={theme.text} />
                                            <Text style={[styles.statValueModal, { color: theme.text }]}>LKR {newJob?.delivery_fee || 350}</Text>
                                            <Text style={[styles.statLabelModal, { color: theme.icon }]}>Earnings</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.declineButton]}
                                        onPress={() => setNewJob(null)}
                                    >
                                        <Text style={styles.declineText}>Decline</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.acceptButton, { backgroundColor: theme.tint }]}
                                        onPress={handleAcceptJob}
                                    >
                                        <Text style={styles.acceptText}>Accept Job</Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

                <Modal
                    visible={isJobTaken}
                    transparent={true}
                    animationType="fade"
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.alertBox, { backgroundColor: theme.card }]}>
                            <AlertCircle size={40} stroke={theme.error} />
                            <Text style={[styles.alertTitle, { color: theme.text }]}>Job Taken</Text>
                            <Text style={[styles.alertMessage, { color: theme.icon }]}>
                                This delivery request has successfully been accepted by another driver.
                            </Text>
                            <TouchableOpacity
                                style={[styles.closeAlertButton, { backgroundColor: theme.card }]}
                                onPress={() => setIsJobTaken(false)}
                            >
                                <Text style={[styles.closeAlertText, { color: theme.text }]}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    sliderContainer: {
        height: 54,
        borderRadius: 27,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        paddingHorizontal: 5,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    sliderButton: {
        width: BUTTON_WIDTH,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        left: 5,
    },
    sliderText: {
        fontSize: 14,
        fontWeight: 'bold',
        opacity: 0.6,
    },
    container: {
        flex: 1,
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    vehicle: {
        fontSize: 14,
        marginTop: 4,
    },
    statusContainer: {
        alignItems: 'center',
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    earningsCard: {
        borderRadius: 24,
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        elevation: 8,
        shadowColor: '#FFB300',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    earningsLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '600',
    },
    earningsAmount: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
        marginTop: 4,
    },
    profileIncompleteBanner: {
        backgroundColor: '#3b82f6',
        borderRadius: 18,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        elevation: 4,
    },
    bannerTitle: {
        color: '#fff',
        fontSize: 15,
        fontWeight: 'bold',
    },
    bannerSubtitle: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 12,
        marginTop: 2,
    },
    bannerButton: {
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    bannerButtonText: {
        color: '#3b82f6',
        fontSize: 11,
        fontWeight: 'bold',
    },
    earningsInfo: {
        flex: 1,
    },
    earningsStats: {
        alignItems: 'flex-end',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 8,
    },
    statText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    miniCard: {
        flex: 1,
        marginHorizontal: 4,
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
    },
    miniCardValue: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 8,
    },
    miniCardLabel: {
        fontSize: 12,
        marginTop: 2,
    },
    activeOrderCard: {
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        marginBottom: 25,
    },
    activeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    activeBadge: {
        backgroundColor: 'rgba(255, 179, 0, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    activeBadgeText: {
        color: '#FFB300',
        fontSize: 10,
        fontWeight: 'bold',
    },
    orderId: {
        fontSize: 12,
        fontWeight: '600',
    },
    orderLocation: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    locationPoint: {
        alignItems: 'center',
        marginRight: 15,
        paddingVertical: 4,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    line: {
        width: 2,
        height: 20,
        marginVertical: 4,
    },
    locationDetails: {
        flex: 1,
    },
    locationText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    locationLabel: {
        fontSize: 10,
        fontWeight: '600',
        marginBottom: 2,
    },
    actionRowCard: {
        flexDirection: 'row',
        gap: 12,
    },
    miniButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    miniButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    mainButton: {
        flex: 2.5,
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    jobItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 18,
        marginBottom: 12,
    },
    jobIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    jobInfo: {
        flex: 1,
    },
    jobTitle: {
        fontSize: 15,
        fontWeight: '600',
    },
    jobTime: {
        fontSize: 12,
        marginTop: 2,
    },
    jobPrice: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        padding: 20,
    },
    jobModalContent: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#121212',
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF3D00',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    timerText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    mapPlaceholder: {
        height: 120,
        backgroundColor: '#F5F5F5',
        borderRadius: 16,
        marginBottom: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    routeLine: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    routeDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    routeDash: {
        width: 60,
        height: 2,
        backgroundColor: '#ccc',
        marginHorizontal: 4,
    },
    mapText: {
        color: '#666',
        fontSize: 12,
        fontWeight: '600',
    },
    mapLink: {
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 4,
    },
    jobDetailsContainer: {
        marginBottom: 24,
    },
    jobDetailRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    detailIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    detailTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    detailLabel: {
        fontSize: 12,
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 15,
        fontWeight: '600',
    },
    statsRowModal: {
        flexDirection: 'row',
        backgroundColor: '#F9F9F9',
        borderRadius: 16,
        padding: 16,
        marginTop: 8,
    },
    statItemModal: {
        flex: 1,
        alignItems: 'center',
    },
    verticalDivider: {
        width: 1,
        backgroundColor: '#E0E0E0',
        marginHorizontal: 10,
    },
    statValueModal: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 4,
    },
    statLabelModal: {
        fontSize: 12,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    declineButton: {
        backgroundColor: '#F5F5F5',
        marginRight: 12,
    },
    declineText: {
        color: '#666',
        fontWeight: 'bold',
        fontSize: 16,
    },
    acceptButton: {
        elevation: 4,
    },
    acceptText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    alertBox: {
        padding: 30,
        borderRadius: 24,
        alignItems: 'center',
        marginHorizontal: 20,
    },
    alertTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    alertMessage: {
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    closeAlertButton: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    closeAlertText: {
        fontWeight: '600',
    },
    emptyJobsCard: {
        padding: 40,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'rgba(0,0,0,0.1)',
    },
});
