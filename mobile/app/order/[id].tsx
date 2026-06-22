import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '@/constants/theme';
import api from '@/constants/api';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function OrderDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    const fetchOrderDetails = async () => {
        try {
            const res = await api.get(`/orders/${id}`);
            setOrder(res.data);
        } catch (error) {
            console.error('Error fetching order details:', error);
            Alert.alert('Error', 'Failed to load order details');
        } finally {
            setLoading(false);
        }
    };

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

    if (loading) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </SafeAreaView>
        );
    }

    if (!order) {
        return (
            <SafeAreaView style={styles.center}>
                <Text style={styles.errorText}>Order not found</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const itemsList = order.itemsList || [];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backIconBtn}>
                    <Ionicons name="chevron-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Order #{order.id}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Animated.View entering={FadeInDown.delay(100)} style={styles.card}>
                    <View style={styles.rowBetween}>
                        <Text style={styles.sectionTitle}>Status</Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{order.status}</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={18} color={Colors.textSecondary} />
                        <Text style={styles.infoText}>Pickup: {order.pickup_date} at {order.pickup_time}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="location-outline" size={18} color={Colors.textSecondary} />
                        <Text style={styles.infoText} numberOfLines={2}>{order.address}</Text>
                    </View>
                    {order.notes && (
                        <View style={styles.infoRow}>
                            <Ionicons name="document-text-outline" size={18} color={Colors.textSecondary} />
                            <Text style={styles.infoText}>{order.notes}</Text>
                        </View>
                    )}
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(200)} style={styles.card}>
                    <Text style={styles.sectionTitle}>Items</Text>
                    <View style={styles.divider} />
                    {itemsList.length > 0 ? (
                        itemsList.map((item: any, index: number) => (
                            <View key={index} style={styles.itemRow}>
                                <View style={styles.itemLeft}>
                                    <Text style={styles.itemName}>{item.item_name}</Text>
                                    <Text style={styles.itemMeta}>Qty: {item.quantity} x LKR {item.price_per_unit}</Text>
                                </View>
                                <Text style={styles.itemTotal}>LKR {item.total_price}</Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.noItemsText}>No specific items found.</Text>
                    )}
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(300)} style={styles.card}>
                    <Text style={styles.sectionTitle}>Payment Summary</Text>
                    <View style={styles.divider} />
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Delivery Fee</Text>
                        <Text style={styles.summaryValue}>LKR {order.delivery_fee || 0}</Text>
                    </View>
                    <View style={[styles.summaryRow, { marginTop: 8 }]}>
                        <Text style={styles.grandTotalLabel}>Total Paid</Text>
                        <Text style={styles.grandTotalValue}>LKR {order.total_price}</Text>
                    </View>
                </Animated.View>
            </ScrollView>

            {order.status === 'Pending' && (
                <View style={styles.footer}>
                    <TouchableOpacity 
                        style={styles.editBtn}
                        onPress={() => router.push(`/order/${order.id}/edit`)}
                    >
                        <Ionicons name="create-outline" size={20} color="#fff" />
                        <Text style={styles.editBtnText}>Edit Order Items</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F9FC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F9FC' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    backIconBtn: { padding: 8, marginLeft: -8 },
    title: { ...Typography.h2, color: Colors.text },
    scrollContent: { padding: 20, paddingBottom: 100 },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 12, fontWeight: '700' },
    divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingRight: 20 },
    infoText: { fontSize: 14, color: Colors.textSecondary, marginLeft: 10, lineHeight: 20 },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    itemLeft: { flex: 1 },
    itemName: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 4 },
    itemMeta: { fontSize: 13, color: Colors.textSecondary },
    itemTotal: { fontSize: 15, fontWeight: '700', color: Colors.text },
    noItemsText: { color: Colors.textSecondary, fontStyle: 'italic' },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryLabel: { fontSize: 14, color: Colors.textSecondary },
    summaryValue: { fontSize: 14, fontWeight: '600', color: Colors.text },
    grandTotalLabel: { fontSize: 16, fontWeight: '700', color: Colors.text },
    grandTotalValue: { fontSize: 18, fontWeight: '800', color: Colors.primary },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    editBtn: { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12 },
    editBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 8 },
    errorText: { fontSize: 16, color: Colors.text, marginBottom: 16 },
    backBtn: { padding: 12, backgroundColor: Colors.primary, borderRadius: 8 },
    backBtnText: { color: '#fff', fontWeight: '600' }
});
