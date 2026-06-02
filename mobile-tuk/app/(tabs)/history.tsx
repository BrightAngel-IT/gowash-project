import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    useColorScheme,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { CheckCircle2, Clock, XCircle, MapPin, Receipt, ChevronRight, Calendar } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { driverApi } from '../../constants/api';
import { LinearGradient } from 'expo-linear-gradient';

interface HistoryItem {
    assignment_id: number;
    ride_status: string;
    completed_at: string | null;
    assigned_at: string;
    order_id: number;
    pickup_address: string;
    total_price: string;
    delivery_fee: string;
    order_status: string;
    customer_name: string;
    laundry_name: string;
    laundry_address: string;
}

export default function HistoryScreen() {
    const colorScheme = (useColorScheme() ?? 'dark') as 'light' | 'dark';
    const theme = Colors[colorScheme];
    const { driver } = useAuth();
    
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchHistory = async () => {
        if (!driver?.id) return;
        try {
            const response = await driverApi.getHistory(driver.id);
            setHistory(response.data);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [driver?.id]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchHistory();
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'delivered': return theme.success;
            case 'cancelled': return theme.error;
            case 'assigned': return theme.tint;
            case 'picked_up': return '#3498db';
            default: return theme.icon;
        }
    };

    const getStatusIcon = (status: string) => {
        const size = 14;
        switch (status.toLowerCase()) {
            case 'delivered': return <CheckCircle2 size={size} color={theme.success} />;
            case 'cancelled': return <XCircle size={size} color={theme.error} />;
            default: return <Clock size={size} color={theme.tint} />;
        }
    };

    const renderHistoryItem = ({ item }: { item: HistoryItem }) => (
        <TouchableOpacity activeOpacity={0.7} style={[styles.historyItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.itemHeader}>
                <View style={styles.orderIdBadge}>
                    <Text style={styles.orderIdText}>#{item.order_id}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.ride_status)}15` }]}>
                    {getStatusIcon(item.ride_status)}
                    <Text style={[styles.statusText, { color: getStatusColor(item.ride_status) }]}>
                        {item.ride_status.charAt(0).toUpperCase() + item.ride_status.slice(1)}
                    </Text>
                </View>
            </View>

            <View style={styles.itemBody}>
                <View style={styles.locationRow}>
                    <MapPin size={16} color={theme.tint} style={styles.icon} />
                    <View style={styles.locationContent}>
                        <Text style={[styles.addressLabel, { color: theme.icon }]}>Pickup From</Text>
                        <Text style={[styles.addressText, { color: theme.text }]} numberOfLines={1}>
                            {item.pickup_address}
                        </Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                        <Calendar size={14} color={theme.icon} />
                        <Text style={[styles.infoText, { color: theme.icon }]}>
                            {formatDate(item.completed_at || item.assigned_at)}
                        </Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Receipt size={14} color={theme.icon} />
                        <Text style={[styles.infoText, { color: theme.text, fontWeight: '700' }]}>
                            LKR {item.delivery_fee}
                        </Text>
                    </View>
                </View>
            </View>
            
            <View style={styles.itemFooter}>
                <Text style={[styles.customerLabel, { color: theme.icon }]}>Customer: <Text style={{ color: theme.text, fontWeight: '600' }}>{item.customer_name}</Text></Text>
                <ChevronRight size={16} color={theme.icon} />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <LinearGradient
                colors={[theme.tint, theme.tint + 'CC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <Text style={styles.title}>Ride History</Text>
                <Text style={styles.subtitle}>Your performance and earnings</Text>
            </LinearGradient>

            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.tint} />
                </View>
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={(item) => item.assignment_id.toString()}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.tint} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconCircle}>
                                <Clock size={40} color={theme.icon} />
                            </View>
                            <Text style={[styles.emptyTitle, { color: theme.text }]}>No History Yet</Text>
                            <Text style={[styles.emptyText, { color: theme.icon }]}>
                                Your completed rides will appear here.
                            </Text>
                        </View>
                    }
                    renderItem={renderHistoryItem}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: 20,
        paddingBottom: 40,
    },
    historyItem: {
        padding: 16,
        borderRadius: 20,
        marginBottom: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    orderIdBadge: {
        backgroundColor: 'rgba(0,0,0,0.05)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    orderIdText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#666',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    itemBody: {
        marginBottom: 12,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    locationContent: {
        flex: 1,
    },
    icon: {
        marginTop: 4,
    },
    addressLabel: {
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    addressText: {
        fontSize: 15,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginVertical: 12,
    },
    infoGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoText: {
        fontSize: 12,
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.03)',
    },
    customerLabel: {
        fontSize: 12,
    },
    emptyContainer: {
        paddingTop: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});
