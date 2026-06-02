import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';



import api, { getUser } from '@/constants/api';
import { useFocusEffect } from '@react-navigation/native';

const tabs = ['Active', 'History'];

export default function OrdersScreen() {
    const [activeTab, setActiveTab] = useState('Active');
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useFocusEffect(
        React.useCallback(() => {
            fetchOrders();
        }, [activeTab])
    );

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const user = await getUser();
            if (user) {
                const response = await api.get(`/orders?userId=${user.id}`);
                setOrders(response.data);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter((order: any) => {
        if (activeTab === 'Active') return !['Delivered', 'Cancelled'].includes(order.status);
        return ['Delivered', 'Cancelled'].includes(order.status);
    });

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
                <Text style={styles.title}>My Orders</Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.activeTab]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filteredOrders}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item, index }) => (
                    <Animated.View
                        entering={FadeInDown.delay(index * 100).duration(500)}
                        layout={Layout.springify()}
                        style={styles.card}
                    >
                        <View style={styles.cardHeader}>
                            <View style={styles.typeContainer}>
                                <View style={[styles.iconBox, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                                    <Ionicons name="shirt" size={20} color={getStatusColor(item.status)} />
                                </View>
                                <View>
                                    <Text style={styles.orderType}>{item.serviceName}</Text>
                                    <Text style={styles.orderDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
                                </View>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.cardFooter}>
                            <View style={styles.footerItem}>
                                <Ionicons name="basket-outline" size={16} color={Colors.textSecondary} />
                                <Text style={styles.footerText}>{item.items} Items</Text>
                            </View>
                            <Text style={styles.price}>LKR {item.total_price}</Text>
                        </View>

                        {item.status === 'Active' || item.status === 'Washing' ? (
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: '60%', backgroundColor: Colors.primary }]} />
                            </View>
                        ) : null}
                    </Animated.View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="basket-outline" size={64} color={Colors.textSecondary} />
                        <Text style={styles.emptyText}>No orders found</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F9FC',
    },
    header: {
        padding: 24,
        paddingBottom: 16,
        backgroundColor: '#fff',
    },
    title: {
        ...Typography.h1,
        color: Colors.text,
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginBottom: 16,
        backgroundColor: '#fff',
        paddingBottom: 16,
    },
    tab: {
        marginRight: 24,
        paddingBottom: 8,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: Colors.primary,
    },
    tabText: {
        fontSize: 16,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    activeTabText: {
        color: Colors.primary,
    },
    list: {
        padding: 24,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowColor: Colors.text,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    typeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    orderType: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
    orderDate: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginBottom: 16,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerText: {
        marginLeft: 6,
        color: Colors.textSecondary,
        fontSize: 14,
    },
    price: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    progressBar: {
        height: 4,
        backgroundColor: Colors.border,
        borderRadius: 2,
        marginTop: 10,
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 16,
        color: Colors.textSecondary,
        fontSize: 16,
    }
});
