import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '@/constants/theme';
import api from '@/constants/api';
import Animated, { FadeInRight } from 'react-native-reanimated';

const timeSlots = [
    '08:00 AM - 10:00 AM',
    '10:00 AM - 12:00 PM',
    '02:00 PM - 04:00 PM',
    '04:00 PM - 06:00 PM',
];

const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: d.getDate(),
        full: d.toISOString().split('T')[0],
    };
});

export default function EditOrderScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [catalogItems, setCatalogItems] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // state to keep track of quantities: { [itemId]: quantity }
    const [basket, setBasket] = useState<{ [key: string]: number }>({});
    
    // logistics state
    const [address, setAddress] = useState('');
    const [notes, setNotes] = useState('');
    const [pickupDate, setPickupDate] = useState(dates[0].full);
    const [pickupTime, setPickupTime] = useState(timeSlots[0]);
    const [customerCoords, setCustomerCoords] = useState<{lat: number, lng: number} | null>(null);

    useEffect(() => {
        fetchOrderAndCatalog();
    }, [id]);

    const fetchOrderAndCatalog = async () => {
        try {
            // 1. Fetch Order Details
            const orderRes = await api.get(`/orders/${id}`);
            const fetchedOrder = orderRes.data;
            
            if (fetchedOrder.status !== 'Pending') {
                Alert.alert('Cannot Edit', 'Only pending orders can be edited.');
                router.back();
                return;
            }

            setOrder(fetchedOrder);
            
            // Set logistics
            setAddress(fetchedOrder.address || '');
            setNotes(fetchedOrder.notes || '');
            setPickupDate(fetchedOrder.pickup_date || dates[0].full);
            setPickupTime(fetchedOrder.pickup_time || timeSlots[0]);
            setCustomerCoords({ lat: fetchedOrder.customer_lat, lng: fetchedOrder.customer_lng });

            // Fetch services
            const svcsRes = await api.get('/services');
            setServices(svcsRes.data);
            setSelectedServiceId(fetchedOrder.service_id);

            // Fetch catalog
            await fetchCatalog(fetchedOrder.laundry_id, fetchedOrder.service_id, fetchedOrder.itemsList);

        } catch (error) {
            console.error('Error fetching data for edit:', error);
            Alert.alert('Error', 'Failed to load order data.');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const fetchCatalog = async (laundryId: number, serviceId: number, initialItemsList: any[] = []) => {
        try {
            const catalogRes = await api.get(`/item-prices?laundryId=${laundryId}&serviceId=${serviceId}`);
            
            let items = catalogRes.data;
            if (!items || items.length === 0) {
                 items = [
                    { id: 'shirt', name: 'Shirt', current_price: 150, category: 'Tops', icon: 'shirt-outline' },
                    { id: 'trouser', name: 'Trouser', current_price: 150, category: 'Bottoms', icon: 'body-outline' },
                    { id: 'dress', name: 'Dress', current_price: 350, category: 'Dresses', icon: 'woman-outline' },
                    { id: 'bedsheet', name: 'Bed Sheet', current_price: 300, category: 'Household', icon: 'bed-outline' }
                ];
            }
            setCatalogItems(items);

            const initialBasket: { [key: string]: number } = {};
            if (initialItemsList && initialItemsList.length > 0) {
                initialItemsList.forEach((item: any) => {
                    const slugFromName = item.item_name.toLowerCase().replace(/\s+/g, '_');
                    const match = catalogItems.find(c => 
                        c.id.toString() === item.item_id.toString() ||
                        c.name.toLowerCase().replace(/\s+/g, '_') === slugFromName ||
                        c.name.toLowerCase().replace(/\s+/g, '_') === item.item_id
                    );
                    if (match) {
                        initialBasket[match.id] = item.quantity;
                    } else {
                        initialBasket[item.item_id] = item.quantity;
                    }
                });
            }
            setBasket(initialBasket);
        } catch(e) {
            console.log(e);
        }
    };

    const changeService = (newServiceId: number) => {
        if (newServiceId === selectedServiceId) return;
        
        Alert.alert(
            "Change Service",
            "Changing the service will clear your current items. Continue?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Yes", onPress: async () => {
                    setSelectedServiceId(newServiceId);
                    setBasket({});
                    await fetchCatalog(order.laundry_id, newServiceId, []);
                }}
            ]
        );
    };

    const updateItemCount = (itemId: string | number, delta: number) => {
        setBasket(prev => {
            const currentCount = prev[itemId] || 0;
            const nextCount = Math.max(0, currentCount + delta);
            const newState = { ...prev };
            if (nextCount === 0) {
                delete newState[itemId];
            } else {
                newState[itemId] = nextCount;
            }
            return newState;
        });
    };

    const calculateTotals = () => {
        if (!order) return { itemsTotal: 0, newGrandTotal: 0, totalItemsCount: 0, oldItemsTotal: 0 };
        
        let newItemsTotal = 0;
        let totalItemsCount = 0;

        // Calculate new items total
        Object.entries(basket).forEach(([itemId, qty]) => {
            if (qty > 0) {
                const catalogItem = catalogItems.find(i => i.id.toString() === itemId.toString());
                if (catalogItem) {
                    newItemsTotal += (catalogItem.current_price * qty);
                    totalItemsCount += qty;
                } else {
                    // If item is not in catalog but was in old order, try to find its old price
                    const oldItem = order.itemsList?.find((i: any) => i.item_id.toString() === itemId.toString() || i.item_id === itemId);
                    if (oldItem) {
                        const price = parseFloat(oldItem.price_per_unit);
                        if (!isNaN(price)) {
                            newItemsTotal += (price * qty);
                        }
                        totalItemsCount += qty;
                    }
                }
            }
        });

        // New grand total is simply the new items total + delivery fee
        const newGrandTotal = newItemsTotal + parseFloat(order.delivery_fee || 0);

        return { newItemsTotal, oldItemsTotal: 0, newGrandTotal, totalItemsCount };
    };

    const handleSaveChanges = async () => {
        const { newGrandTotal, totalItemsCount } = calculateTotals();

        if (totalItemsCount === 0) {
            Alert.alert('Empty Order', 'Please add at least one item to your order.');
            return;
        }

        setSaving(true);
        try {
            const orderItemsFormatted: any[] = [];
            
            Object.entries(basket).forEach(([itemId, qty]) => {
                const catalogItem = catalogItems.find(i => i.id.toString() === itemId.toString());
                
                let itemName = catalogItem ? catalogItem.name : itemId;
                let pricePerUnit = catalogItem ? catalogItem.current_price : 0;
                
                // Fallback to old item data if not in catalog
                if (!catalogItem) {
                    const oldItem = order.itemsList.find((i: any) => i.item_id.toString() === itemId.toString());
                    if (oldItem) {
                        itemName = oldItem.item_name;
                        pricePerUnit = oldItem.price_per_unit;
                    }
                }

                orderItemsFormatted.push({
                    serviceId: order.service_id,
                    itemId: itemId,
                    itemName: itemName,
                    quantity: qty,
                    pricePerUnit: pricePerUnit,
                    totalPrice: pricePerUnit * qty,
                    pieces: null
                });
            });

            const updateData = {
                items: totalItemsCount,
                totalPrice: newGrandTotal,
                orderItems: orderItemsFormatted,
                deliveryFee: order.delivery_fee,
                pickupDate,
                pickupTime,
                address,
                notes,
                customerLat: customerCoords?.lat,
                customerLng: customerCoords?.lng,
                serviceId: selectedServiceId
            };

            await api.put(`/orders/${id}`, updateData);
            
            Alert.alert('Success', 'Order updated successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);

        } catch (error: any) {
            console.error('Failed to update order:', error);
            Alert.alert('Update Failed', error.response?.data?.message || 'Something went wrong.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </SafeAreaView>
        );
    }

    const { newItemsTotal, newGrandTotal, totalItemsCount } = calculateTotals();
    const categories = Array.from(new Set(catalogItems.map(i => i.category || 'Items')));

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="close" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Edit Items</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                
                <Animated.View entering={FadeInRight} style={styles.logisticsContainer}>
                    <Text style={styles.sectionHeading}>Order Details</Text>
                    
                    <Text style={styles.subLabel}>Pickup Date</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateList}>
                        {dates.map((d, i) => (
                            <TouchableOpacity key={i} style={[styles.dateCard, pickupDate === d.full && styles.dateCardActive]} onPress={() => setPickupDate(d.full)}>
                                <Text style={[styles.dateDay, pickupDate === d.full && styles.textWhite]}>{d.day}</Text>
                                <Text style={[styles.dateNum, pickupDate === d.full && styles.textWhite]}>{d.date}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={[styles.subLabel, { marginTop: 20 }]}>Pickup Time Slot</Text>
                    <View style={styles.timeGrid}>
                        {timeSlots.map((t, i) => (
                            <TouchableOpacity key={i} style={[styles.timeBox, pickupTime === t && styles.timeBoxActive]} onPress={() => setPickupTime(t)}>
                                <Text style={[styles.timeText, pickupTime === t && styles.textWhite]}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={[styles.subLabel, { marginTop: 20 }]}>Delivery Address</Text>
                    <View style={styles.inputBox}>
                        <Ionicons name="location-outline" size={20} color={Colors.textSecondary} />
                        <TextInput style={styles.input} value={address} onChangeText={setAddress} multiline placeholder="Enter detailed address" />
                    </View>

                    <Text style={[styles.subLabel, { marginTop: 20 }]}>Additional Notes</Text>
                    <View style={styles.inputBox}>
                        <Ionicons name="chatbubble-outline" size={20} color={Colors.textSecondary} />
                        <TextInput style={styles.input} value={notes} onChangeText={setNotes} multiline placeholder="Any special instructions..." />
                    </View>
                </Animated.View>

                <Text style={[styles.sectionHeading, { marginTop: 10 }]}>Select Service</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 20}}>
                    {services.map((svc) => (
                        <TouchableOpacity 
                            key={svc.id} 
                            style={[styles.serviceCard, selectedServiceId === svc.id && styles.serviceCardActive]}
                            onPress={() => changeService(svc.id)}
                        >
                            <Text style={[styles.serviceCardText, selectedServiceId === svc.id && styles.textWhite]}>{svc.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Text style={[styles.sectionHeading, { marginTop: 10 }]}>Items</Text>

                {categories.map(cat => (
                    <Animated.View key={cat} entering={FadeInRight} style={styles.catGroup}>
                        <Text style={styles.catHeader}>{cat}</Text>
                        {catalogItems.filter(item => (item.category || 'Items') === cat).map(item => {
                            const count = basket[item.id] || 0;
                            const unitPrice = Math.round(item.current_price);
                            return (
                                <View key={item.id} style={styles.itemRow}>
                                    <View style={styles.itemMain}>
                                        <View style={styles.itemIconCircle}>
                                            <Ionicons name={(item.icon || 'shirt-outline') as any} size={20} color={Colors.primary} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.itemName}>{item.name}</Text>
                                            <Text style={styles.itemPrice}>LKR {unitPrice}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.stepper}>
                                        <TouchableOpacity onPress={() => updateItemCount(item.id, -1)} style={[styles.stepBtn, count === 0 && { opacity: 0.3 }]} disabled={count === 0}>
                                            <Ionicons name="remove" size={18} color={Colors.text} />
                                        </TouchableOpacity>
                                        <Text style={styles.stepCount}>{count}</Text>
                                        <TouchableOpacity onPress={() => updateItemCount(item.id, 1)} style={styles.stepBtn}>
                                            <Ionicons name="add" size={18} color={Colors.text} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })}
                    </Animated.View>
                ))}
            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.footerPriceRow}>
                    <View>
                        <Text style={styles.footerTotalLabel}>NEW ESTIMATED TOTAL</Text>
                        <Text style={styles.footerTotalPrice}>LKR {newGrandTotal}</Text>
                    </View>
                    <View style={styles.itemBadge}>
                        <Text style={styles.itemBadgeText}>{totalItemsCount} ITEMS</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                    onPress={handleSaveChanges}
                    disabled={saving}
                >
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F7F9FC' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F9FC' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    backBtn: { padding: 8, marginLeft: -8 },
    title: { ...Typography.h3, color: Colors.text },
    scrollContent: { padding: 20, paddingBottom: 120 },
    catGroup: { marginBottom: 24 },
    catHeader: { fontSize: 13, fontWeight: '900', color: Colors.textSecondary, textTransform: 'uppercase', marginBottom: 12, marginLeft: 4 },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderRadius: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    itemMain: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    itemIconCircle: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F0F4FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    itemName: { fontSize: 16, fontWeight: '700', color: Colors.text },
    itemPrice: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600', marginTop: 2 },
    stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 4, borderRadius: 10 },
    stepBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
    stepCount: { minWidth: 28, textAlign: 'center', fontSize: 16, fontWeight: '700', color: Colors.primary },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    footerPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    footerTotalLabel: { fontSize: 11, fontWeight: '800', color: Colors.textSecondary, letterSpacing: 0.5 },
    footerTotalPrice: { fontSize: 24, fontWeight: '900', color: Colors.text },
    itemBadge: { backgroundColor: Colors.primary + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
    itemBadgeText: { color: Colors.primary, fontSize: 12, fontWeight: '800' },
    saveBtn: { backgroundColor: Colors.primary, padding: 16, borderRadius: 14, alignItems: 'center' },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    logisticsContainer: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    sectionHeading: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 16 },
    subLabel: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary, marginBottom: 10 },
    dateList: { flexDirection: 'row' },
    dateCard: { width: 60, height: 80, borderRadius: 16, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: '#F1F5F9' },
    dateCardActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    dateDay: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
    dateNum: { fontSize: 18, fontWeight: '800', color: Colors.text },
    textWhite: { color: '#fff' },
    timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    timeBox: { width: '48%', padding: 14, borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center' },
    timeBoxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    serviceCard: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F8FAFC', marginRight: 10, borderWidth: 1, borderColor: '#F1F5F9' },
    serviceCardActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    serviceCardText: { fontSize: 14, fontWeight: '600', color: Colors.text },
    timeText: { fontSize: 13, fontWeight: '600', color: Colors.text },
    inputBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F8FAFC', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#F1F5F9' },
    input: { flex: 1, marginLeft: 10, fontSize: 14, color: Colors.text, minHeight: 40, textAlignVertical: 'top' }
});
