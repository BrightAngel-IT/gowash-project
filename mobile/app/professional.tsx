import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, Platform, Vibration, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing } from '@/constants/theme';
import api, { getUser, logout } from '@/constants/api';
import Animated, { FadeInDown, BounceIn } from 'react-native-reanimated';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfessionalDashboard() {
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [newOrder, setNewOrder] = useState<any>(null);
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const lastOrderId = useRef<number | null>(null);

    useEffect(() => {
        loadInitialData();
        const interval = setInterval(fetchOrders, 5000); // Poll faster (5s)
        return () => {
            clearInterval(interval);
            stopNotification();
        };
    }, []);

    const loadInitialData = async () => {
        const userData = await getUser();
        if (!userData || userData.role !== 'agent') {
            router.replace('/login');
            return;
        }
        setUser(userData);
        fetchOrders(userData.laundry_id);
    };

    const stopNotification = async () => {
        try {
            if (sound) {
                await sound.stopAsync();
                await sound.unloadAsync();
                setSound(null);
            }
            Vibration.cancel();
            Speech.stop();
        } catch (e) {
            console.error('Error stopping notification:', e);
        }
    };

    const playNotificationSound = async (order: any) => {
        try {
            await stopNotification(); // Safety clear

            // Play loud ringing sound (Looping)
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' }, // Use a distinct ringtone
                { shouldPlay: true, isLooping: true }
            );
            setSound(newSound);

            // Vibrate heavily (Pattern: wait 0ms, vibrate 1000ms, wait 1000ms...)
            Vibration.vibrate([0, 800, 400, 800], true);

            // Speak details once overlaid
            Speech.speak(`New order from ${order.customer_name}. Total ${order.total_price}`, {
                rate: 1.1,
            });
        } catch (e) {
            console.error('Error playing sound:', e);
        }
    };

    const fetchOrders = async (laundryId?: number) => {
        try {
            const currentLaundryId = laundryId || user?.laundry_id;
            if (!currentLaundryId) return;

            const res = await api.get(`/orders?laundryId=${currentLaundryId}`);
            const fetchedOrders = res.data;
            const pendingOrders = fetchedOrders.filter((o: any) => o.status === 'Pending');

            if (pendingOrders.length > 0) {
                const latest = pendingOrders[0];
                // Check if this specific order ID has already triggered a notification
                if (lastOrderId.current !== latest.id) {
                    setNewOrder(latest);
                    playNotificationSound(latest);
                    lastOrderId.current = latest.id;
                }
            }

            setOrders(fetchedOrders);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (orderId: number, status: string) => {
        try {
            stopNotification(); // Stop sound immediately
            await api.patch(`/orders/${orderId}/status`, { status });
            setNewOrder(null);
            fetchOrders();
            Alert.alert('Success', `Order #${orderId} ${status.toLowerCase()}ed.`);
        } catch (error) {
            console.error('Error updating status:', error);
            Alert.alert('Error', 'Failed to update order status.');
        }
    };

    const handleLogout = async () => {
        await logout();
        router.replace('/login');
    };

    const renderOrderItem = ({ item }: { item: any }) => (
        <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <View>
                    <Text style={styles.orderId}>Order #{item.id}</Text>
                    <Text style={styles.customerName}>{item.customer_name}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                </View>
            </View>

            <View style={styles.orderDetails}>
                <View style={styles.detailRow}>
                    <Ionicons name="shirt-outline" size={16} color={Colors.textSecondary} />
                    <Text style={styles.detailText}>{item.items} Items • {item.itemsList?.length > 0 ? 'Multi-Service' : (item.serviceName || 'Wash & Press')}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
                    <Text style={styles.detailText} numberOfLines={1}>{item.address}</Text>
                </View>

                {/* Item Breakdown List */}
                {item.itemsList && item.itemsList.length > 0 && (
                    <View style={styles.itemBreakdownBox}>
                        {item.itemsList.map((oi: any, idx: number) => (
                            <View key={idx} style={styles.itemBreakdownRow}>
                                <Text style={styles.breakdownText}>• {oi.item_name} ({oi.quantity}) {oi.pieces ? `(${oi.pieces} pc)` : ''}</Text>
                                <Text style={styles.breakdownSubtext}>LKR {oi.total_price}</Text>
                            </View>
                        ))}
                    </View>
                )}

                <View style={[styles.detailRow, { marginTop: 4 }]}>
                    <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
                    <Text style={styles.detailText}>{item.pickup_date} • {item.pickup_time}</Text>
                </View>
                {item.notes && (
                    <View style={[styles.detailRow, { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#EEF2F6' }]}>
                        <Ionicons name="document-text-outline" size={16} color={Colors.primary} />
                        <Text style={[styles.detailText, { color: Colors.text, fontWeight: '600' }]} numberOfLines={2}>{item.notes}</Text>
                    </View>
                )}
            </View>

            {item.status === 'Pending' && (
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.cancelBtn]}
                        onPress={() => handleUpdateStatus(item.id, 'Cancelled')}
                    >
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.confirmBtn]}
                        onPress={() => handleUpdateStatus(item.id, 'Confirmed')}
                    >
                        <Text style={styles.confirmBtnText}>Confirm Order</Text>
                    </TouchableOpacity>
                </View>
            )}

            {['Confirmed', 'Washing', 'Ready'].includes(item.status) && (
                <TouchableOpacity
                    style={styles.nextStepBtn}
                    onPress={() => {
                        const next = item.status === 'Confirmed' ? 'Washing' : 'Ready';
                        handleUpdateStatus(item.id, next);
                    }}
                >
                    <Text style={styles.nextStepText}>Mark as {item.status === 'Confirmed' ? 'Washing' : 'Ready'}</Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                </TouchableOpacity>
            )}
        </View>
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Pending': return '#F59E0B';
            case 'Confirmed': return '#10B981';
            case 'Washing': return '#3B82F6';
            case 'Ready': return '#8B5CF6';
            case 'Delivered': return '#059669';
            case 'Cancelled': return '#EF4444';
            default: return Colors.textSecondary;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Manager Panel</Text>
                    <Text style={styles.laundryName}>{user?.laundry_name || 'Central Laundry'}</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                    <Ionicons name="log-out-outline" size={24} color={Colors.error} />
                </TouchableOpacity>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{orders.filter(o => o.status === 'Pending').length}</Text>
                    <Text style={styles.statLabel}>Pending</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#E0F2FE' }]}>
                    <Text style={[styles.statValue, { color: '#0284C7' }]}>{orders.filter(o => ['Confirmed', 'Washing'].includes(o.status)).length}</Text>
                    <Text style={[styles.statLabel, { color: '#0284C7' }]}>Active</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#F0FDF4' }]}>
                    <Text style={[styles.statValue, { color: '#16A34A' }]}>{orders.filter(o => o.status === 'Delivered').length}</Text>
                    <Text style={[styles.statLabel, { color: '#16A34A' }]}>Success</Text>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Order Management</Text>

            {loading ? (
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderOrderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="receipt-outline" size={64} color={Colors.border} />
                            <Text style={styles.emptyText}>No orders assigned yet.</Text>
                        </View>
                    }
                />
            )}

            {/* Top-up Notification Modal (The 'Perfect' Acceptance UI) */}
            <Modal
                visible={!!newOrder}
                transparent={true}
                animationType="none"
            >
                <View style={styles.modalOverlay}>
                    <Animated.View entering={BounceIn.duration(800)} style={styles.notificationPopup}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <LinearGradient
                                colors={['#1e3a8a', '#1e40af']}
                                style={styles.popupHeaderGradient}
                            >
                                <View style={styles.bellPulseContainer}>
                                    <Animated.View entering={FadeInDown.delay(300)} style={styles.bellCircle}>
                                        <Ionicons name="notifications" size={32} color="#fff" />
                                    </Animated.View>
                                </View>
                                <Text style={styles.newOrderLabel}>NEW INCOMING ORDER</Text>
                                <Text style={styles.popupOrderId}>#{newOrder?.id}</Text>
                            </LinearGradient>

                            <View style={styles.popupContent}>
                                <Text style={styles.popupCustomer}>{newOrder?.customer_name}</Text>

                                <View style={styles.popupDataBox}>
                                    <View style={styles.popupDataRow}>
                                        <Ionicons name="shirt-outline" size={18} color={Colors.textSecondary} />
                                        <Text style={styles.popupDetails}>{newOrder?.items} Items • {newOrder?.serviceName || 'Wash & Press'}</Text>
                                    </View>
                                    <View style={styles.popupDataRow}>
                                        <Ionicons name="location-outline" size={18} color={Colors.textSecondary} />
                                        <Text style={styles.popupDetails} numberOfLines={1}>
                                            {newOrder?.address || 'No location provided'}
                                        </Text>
                                    </View>
                                    <View style={styles.popupDataRow}>
                                        <Ionicons name="time-outline" size={18} color={Colors.textSecondary} />
                                        <Text style={styles.popupDetails}>{newOrder?.pickup_date} @ {newOrder?.pickup_time}</Text>
                                    </View>
                                    {newOrder?.notes && (
                                        <View style={[styles.popupDataRow, { marginTop: 5, paddingTop: 5, borderTopWidth: 1, borderTopColor: '#E2E8F0' }]}>
                                            <Ionicons name="document-text-outline" size={18} color={Colors.primary} />
                                            <Text style={[styles.popupDetails, { color: Colors.text }]}>{newOrder?.notes}</Text>
                                        </View>
                                    )}
                                </View>

                                <Text style={styles.popupPriceLabel}>BILLING TOTAL</Text>
                                <Text style={styles.popupPrice}>LKR {newOrder?.total_price}.00</Text>
                            </View>

                            <View style={styles.popupActions}>
                                <TouchableOpacity
                                    style={[styles.popupBtn, styles.popupCancel]}
                                    onPress={() => handleUpdateStatus(newOrder.id, 'Cancelled')}
                                >
                                    <Text style={styles.popupCancelText}>Reject</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.popupBtn, styles.popupConfirm]}
                                    onPress={() => handleUpdateStatus(newOrder.id, 'Confirmed')}
                                >
                                    <LinearGradient
                                        colors={['#10B981', '#059669']}
                                        style={styles.actionGradient}
                                    >
                                        <Text style={styles.popupConfirmText}>Accept & Print</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                        <TouchableOpacity style={styles.closePopup} onPress={() => { stopNotification(); setNewOrder(null); }}>
                            <Ionicons name="close-circle" size={32} color="rgba(255,255,255,0.7)" />
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        paddingTop: 10,
        backgroundColor: '#fff',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        zIndex: 10,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: Colors.text,
        letterSpacing: -0.5,
    },
    laundryName: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: '700',
        marginTop: 2,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    logoutBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FEF2F2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        padding: 20,
        gap: 15,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 24,
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    statValue: {
        fontSize: 28,
        fontWeight: '900',
        color: '#F59E0B',
    },
    statLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 6,
        fontWeight: '600',
    },
    sectionTitle: {
        paddingHorizontal: 24,
        marginTop: 10,
        marginBottom: 20,
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 28,
        padding: 20,
        marginBottom: 20,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 15,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    orderId: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.text,
    },
    customerName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    orderDetails: {
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 20,
        gap: 10,
        marginBottom: 20,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    detailText: {
        fontSize: 14,
        color: '#475569',
        fontWeight: '500',
    },
    itemBreakdownBox: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 12,
        marginVertical: 4,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    itemBreakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    breakdownText: {
        fontSize: 13,
        color: '#0F172A',
        fontWeight: '700',
    },
    breakdownSubtext: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 14,
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmBtn: {
        backgroundColor: Colors.primary,
    },
    confirmBtnText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 14,
    },
    cancelBtn: {
        backgroundColor: '#F1F5F9',
    },
    cancelBtnText: {
        color: '#64748B',
        fontWeight: '800',
        fontSize: 14,
    },
    nextStepBtn: {
        flexDirection: 'row',
        backgroundColor: '#1E293B',
        paddingVertical: 16,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    nextStepText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 15,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 80,
    },
    emptyText: {
        marginTop: 16,
        color: Colors.textSecondary,
        fontSize: 18,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    notificationPopup: {
        backgroundColor: '#fff',
        width: '100%',
        borderRadius: 40,
        overflow: 'hidden',
        elevation: 24,
    },
    popupHeaderGradient: {
        padding: 30,
        alignItems: 'center',
        paddingBottom: 40,
    },
    bellPulseContainer: {
        marginBottom: 20,
    },
    bellCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    newOrderLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 2,
    },
    popupOrderId: {
        color: '#fff',
        fontSize: 32,
        fontWeight: '900',
        marginTop: 4,
    },
    popupContent: {
        padding: 30,
        alignItems: 'center',
        marginTop: -30,
        backgroundColor: '#fff',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
    },
    popupCustomer: {
        fontSize: 26,
        fontWeight: '900',
        color: '#0F172A',
        textAlign: 'center',
        marginBottom: 20,
    },
    popupDataBox: {
        width: '100%',
        backgroundColor: '#F8FAFC',
        padding: 20,
        borderRadius: 24,
        gap: 12,
        marginBottom: 24,
    },
    popupDataRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    popupDetails: {
        fontSize: 15,
        color: '#475569',
        fontWeight: '600',
    },
    popupPriceLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 1,
    },
    popupPrice: {
        fontSize: 36,
        fontWeight: '900',
        color: Colors.primary,
        marginTop: 4,
    },
    popupActions: {
        flexDirection: 'row',
        gap: 15,
        padding: 30,
        paddingTop: 0,
    },
    popupBtn: {
        flex: 1,
        borderRadius: 24,
        height: 64,
        overflow: 'hidden',
    },
    popupConfirm: {
        backgroundColor: '#10B981',
    },
    actionGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    popupConfirmText: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 16,
    },
    popupCancel: {
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    popupCancelText: {
        color: '#64748B',
        fontWeight: '900',
        fontSize: 16,
    },
    closePopup: {
        position: 'absolute',
        top: 25,
        right: 25,
    }
});
