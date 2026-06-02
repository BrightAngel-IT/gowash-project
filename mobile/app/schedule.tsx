import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, TextInput, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import Animated, { FadeInDown, FadeInRight, BounceIn, Layout, FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import api, { getUser } from '@/constants/api';
import * as Location from 'expo-location';
import AppMap, { Marker } from '@/components/AppMap';

const { width } = Dimensions.get('window');

const STEPS = ['Services', 'Items', 'Logistics', 'Review'];

const ADDONS = [
    { id: 'stain', name: 'Stain Removal', price: 200, icon: 'color-filter-outline' },
    { id: 'perfume', name: 'Extra Fragrance', price: 100, icon: 'rose-outline' },
    { id: 'eco', name: 'Eco-Friendly Detergent', price: 150, icon: 'leaf-outline' },
    { id: 'fabric', name: 'Premium Softener', price: 100, icon: 'water-outline' },
];

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

const LAUNDRY_ITEMS = [
    { id: 'shirt', name: 'Shirt', icon: 'shirt-outline', basePrice: 150, category: 'Tops' },
    { id: 'tshirt', name: 'T-Shirt', icon: 'shirt', basePrice: 100, category: 'Tops' },
    { id: 'blouse', name: 'Blouse', icon: 'woman-outline', basePrice: 150, category: 'Tops' },
    { id: 'trouser', name: 'Trouser', icon: 'body-outline', basePrice: 150, category: 'Bottoms' },
    { id: 'jeans', name: 'Jeans', icon: 'body', basePrice: 200, category: 'Bottoms' },
    { id: 'shorts', name: 'Shorts', icon: 'browsers-outline', basePrice: 100, category: 'Bottoms' },
    { id: 'saree', name: 'Saree', icon: 'color-palette-outline', basePrice: 500, category: 'Dresses' },
    { id: 'dress', name: 'Dress', icon: 'woman-outline', basePrice: 350, category: 'Dresses' },
    { id: 'suit', name: 'Suit (2Pcs)', icon: 'briefcase-outline', basePrice: 800, category: 'Formal' },
    { id: 'jacket', name: 'Jacket', icon: 'snow-outline', basePrice: 600, category: 'Formal' },
    { id: 'bedsheet', name: 'Bed Sheet', icon: 'bed-outline', basePrice: 300, category: 'Household' },
    { id: 'towel', name: 'Towel', icon: 'layers-outline', basePrice: 150, category: 'Household' },
    { id: 'curtain', name: 'Curtain (m)', icon: 'browsers-outline', basePrice: 400, category: 'Premium' },
    { id: 'rug', name: 'Rug/Carpet', icon: 'grid-outline', basePrice: 1200, category: 'Premium' },
    { id: 'shoes', name: 'Shoes', icon: 'footsteps-outline', basePrice: 1500, category: 'Premium' },
    { id: 'suit_leather', name: 'Leather Jacket', icon: 'layers-outline', basePrice: 3000, category: 'Premium' },
    { id: 'underwear', name: 'Underwear', icon: 'shield-outline', basePrice: 50, category: 'Others' },
    { id: 'socks', name: 'Socks', icon: 'footsteps-outline', basePrice: 50, category: 'Others' },
];

export default function AdvancedScheduleScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { laundryId, laundryName } = params;

    const [currentStep, setCurrentStep] = useState(0);
    const [selectedDate, setSelectedDate] = useState(dates[0].full);
    const [selectedTime, setSelectedTime] = useState(timeSlots[0]);
    const [services, setServices] = useState<any[]>([]);
    const [activeServiceId, setActiveServiceId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [laundry, setLaundry] = useState<any>(null);
    const [serviceItemPrices, setServiceItemPrices] = useState<{ [key: number]: any[] }>({});



    // Advanced State
    const [basket, setBasket] = useState<{ [key: number]: { [key: string]: number } }>({});
    const [piecesBasket, setPiecesBasket] = useState<{ [key: string]: string }>({});
    const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
    const [address, setAddress] = useState('123, Green Valley, Colombo 03');
    const [notes, setNotes] = useState('');
    const [isLocating, setIsLocating] = useState(false);
    const [customerCoords, setCustomerCoords] = useState<{lat: number, lng: number}>({lat: 6.9271, lng: 79.8612});

    const handleMapPress = async (e: any) => {
        const { coordinate } = e.nativeEvent;
        setCustomerCoords({ lat: coordinate.latitude, lng: coordinate.longitude });
        try {
            let reverseGeocode = await Location.reverseGeocodeAsync({
                latitude: coordinate.latitude,
                longitude: coordinate.longitude,
            });

            if (reverseGeocode.length > 0) {
                const addr = reverseGeocode[0];
                const fullAddress = `${addr.name || ''} ${addr.street || ''}, ${addr.city || ''}, ${addr.region || ''}, ${addr.postalCode || ''}`.trim();
                const cleaned = fullAddress.split(',').map(s => s.trim()).filter(Boolean).join(', ');
                setAddress(cleaned);
            }
        } catch (error) {
            console.log('Map press reverse geocode error:', error);
        }
    };

    useEffect(() => {
        fetchServices();
        fetchLaundry();
    }, [laundryId]);

    useEffect(() => {
        if (activeServiceId && !serviceItemPrices[activeServiceId]) {
            fetchDynamicItems(activeServiceId);
        }
    }, [activeServiceId]);


    const fetchDynamicItems = async (sId: number) => {
        if (!laundryId) return;
        try {
            const res = await api.get(`/item-prices?laundryId=${laundryId}&serviceId=${sId}`);
            if (res.data && res.data.length > 0) {
                setServiceItemPrices(prev => ({ ...prev, [sId]: res.data }));
            } else {
                setServiceItemPrices(prev => ({ 
                    ...prev, 
                    [sId]: LAUNDRY_ITEMS.map(i => ({
                        id: i.id,
                        name: i.name,
                        icon: i.icon,
                        current_price: i.basePrice,
                        category: i.category
                    }))
                }));
            }
        } catch (error) {
            console.error('Error fetching dynamic items:', error);
        }
    };



    const fetchLaundry = async () => {
        if (!laundryId) return;
        try {
            const res = await api.get(`/laundries/${laundryId}`);
            setLaundry(res.data);
        } catch (error) {
            console.error('Error fetching laundry:', error);
        }
    };

    const fetchServices = async () => {
        try {
            const res = await api.get('/services');
            setServices(res.data);
            if (res.data.length > 0) {
                setActiveServiceId(res.data[0].id);
            }
        } catch (error) {
            console.error('Error fetching services:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFetchLocation = async () => {
        try {
            setIsLocating(true);
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Please allow location access to fetch your current address.');
                setIsLocating(false);
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setCustomerCoords({
                lat: location.coords.latitude,
                lng: location.coords.longitude
            });

            let reverseGeocode = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });

            if (reverseGeocode.length > 0) {
                const addr = reverseGeocode[0];
                const fullAddress = `${addr.name || ''} ${addr.street || ''}, ${addr.city || ''}, ${addr.region || ''}, ${addr.postalCode || ''}`.trim();
                const cleaned = fullAddress.split(',').map(s => s.trim()).filter(Boolean).join(', ');
                setAddress(cleaned);
            }
        } catch (error) {
            console.error('Error fetching location:', error);
            Alert.alert('Error', 'Could not fetch your location. Please type it manually.');
        } finally {
            setIsLocating(false);
        }
    };

    const toggleService = (id: number) => {
        setBasket(prev => {
            if (prev[id]) {
                const newState = { ...prev };
                delete newState[id];
                return newState;
            }
            return { ...prev, [id]: {} };
        });
        setActiveServiceId(id);
    };

    const toggleAddon = (addonId: string) => {
        setSelectedAddons(prev =>
            prev.includes(addonId) ? prev.filter(id => id !== addonId) : [...prev, addonId]
        );
    };

    const updateItemCount = (itemId: string | number, delta: number) => {
        if (!activeServiceId) return;
        setBasket(prev => {
            const serviceItems = { ...(prev[activeServiceId] || {}) };
            const currentCount = serviceItems[itemId] || 0;
            const nextCount = Math.max(0, currentCount + delta);
            if (nextCount === 0) delete serviceItems[itemId];
            else serviceItems[itemId] = nextCount;
            return { ...prev, [activeServiceId]: serviceItems };
        });
    };

    const getServiceFactor = (service: any) => {
        if (!service) return 1.0;
        const name = service.name.toLowerCase();
        if (name.includes('dry')) return 2.5;
        if (name.includes('express')) return 2.0;
        if (name.includes('only press') || name.includes('iron')) return 0.8;
        if (name.includes('only wash')) return 0.7;
        if (name.includes('curtain')) return 1.5;
        if (name.includes('carpet')) return 2.0;
        if (name.includes('shoe')) return 1.2;
        if (name.includes('leather')) return 3.0;
        return 1.0;
    };

    const calculateTotals = () => {
        let itemsTotal = 0;
        let totalItemsCount = 0;
        const breakdown: any[] = [];

        Object.entries(basket).forEach(([sId, items]) => {
            const service = services.find(s => s.id === parseInt(sId));
            if (!service || Object.keys(items).length === 0) return;
            const factor = getServiceFactor(service);
            let serviceTotal = 0;
            const itemDetails: any[] = [];
            const sPrices = serviceItemPrices[service.id] || [];
            Object.entries(items).forEach(([iId, qty]) => {
                const item = sPrices.find(i => i.id.toString() === iId.toString());
                if (!item) return;
                const unitPrice = Math.round(item.current_price);
                const sub = unitPrice * qty;
                serviceTotal += sub;
                totalItemsCount += qty;
                const pcs = piecesBasket[`${service.id}-${item.id}`];
                itemDetails.push({ id: item.id, name: item.name, qty, unitPrice, sub, unit: item.current_unit, pieces: pcs });
            });


            itemsTotal += serviceTotal;
            breakdown.push({ name: service.name, total: serviceTotal, items: itemDetails, id: service.id });
        });

        const addonsTotal = selectedAddons.reduce((sum, id) => sum + (ADDONS.find(a => a.id === id)?.price || 0), 0);
        const serviceFee = itemsTotal > 0 ? 150 : 0;
        
        // Dynamic Delivery Fee Calculation (Client-side estimation)
        let deliveryFee = itemsTotal > 0 ? 250 : 0;
        if (customerCoords && laundry?.lat && laundry?.lng) {
            const R = 6371;
            const dLat = (laundry.lat - customerCoords.lat) * Math.PI / 180;
            const dLon = (laundry.lng - customerCoords.lng) * Math.PI / 180;
            const a = 
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(customerCoords.lat * Math.PI / 180) * Math.cos(laundry.lat * Math.PI / 180) * 
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;
            deliveryFee = Math.max(150, Math.round(distance * 100));
        }

        const grandTotal = itemsTotal + addonsTotal + serviceFee + deliveryFee;

        return { itemsTotal, addonsTotal, serviceFee, deliveryFee, grandTotal, totalItemsCount, breakdown };
    };

    const { itemsTotal, addonsTotal, serviceFee, deliveryFee, grandTotal, totalItemsCount, breakdown } = calculateTotals();

    const handleNext = () => {
        if (currentStep === 0 && Object.keys(basket).length === 0) {
            Alert.alert('Selection Required', 'Please select at least one service category.');
            return;
        }
        if (currentStep === 1 && totalItemsCount === 0) {
            Alert.alert('Empty Basket', 'Please add some clothes to your selected services.');
            return;
        }
        if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
        else handlePlaceOrder();
    };

    const handlePlaceOrder = async () => {
        setSubmitting(true);
        try {
            const user = await getUser();
            if (!user) { router.push('/login'); return; }

            const orderItemsFormatted: any[] = [];
            breakdown.forEach(s => {
                s.items.forEach((i: any) => {
                    orderItemsFormatted.push({
                        serviceId: s.id,
                        itemId: i.id || i.name.toLowerCase(),
                        itemName: i.name,
                        quantity: i.qty,
                        pricePerUnit: i.unitPrice,
                        totalPrice: i.sub,
                        pieces: i.pieces ? parseInt(i.pieces) : null
                    });
                });
            });

            const addonsNames = selectedAddons.map(id => ADDONS.find(a => a.id === id)?.name).join(', ');
            const summary = breakdown.map(s => `${s.name}: ${s.items.map((i: any) => `${i.name}x${i.qty}${i.pieces ? ` (${i.pieces} pc)` : ''}`).join(', ')}`).join(' | ');

            const orderData = {
                userId: user.id,
                laundryId: laundryId ? parseInt(laundryId as string) : 1,
                items: totalItemsCount,
                totalPrice: grandTotal,
                pickupDate: selectedDate,
                pickupTime: selectedTime,
                address,
                customerName: user.name,
                notes: `${notes} [Items: ${summary}] [Add-ons: ${addonsNames || 'None'}]`,
                orderItems: orderItemsFormatted,
                deliveryFee: deliveryFee,
                customerLat: customerCoords?.lat,
                customerLng: customerCoords?.lng
            };

            await api.post('/orders', orderData);
            setShowSuccessModal(true);
        } catch (error: any) {
            console.error('Order error:', error.response?.data || error.message);
            const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Unknown error';
            Alert.alert('Order Failed', `Server Error: ${errorMsg}\n\n${JSON.stringify(error.response?.data)}`);
        } finally {
            setSubmitting(false);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0: // Service Selection
                return (
                    <Animated.View entering={FadeInRight} exiting={SlideOutLeft} style={styles.stepContainer}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.stepTitle}>Which services do you need?</Text>
                            <Text style={styles.stepSubtitle}>Select all required services for your order.</Text>
                            <View style={styles.servicesGrid}>
                                {services.map((s, i) => {
                                    const isSelected = basket[s.id] !== undefined;
                                    return (
                                        <TouchableOpacity
                                            key={i}
                                            style={[styles.serviceBox, isSelected && styles.serviceBoxActive]}
                                            onPress={() => toggleService(s.id)}
                                        >
                                            <LinearGradient
                                                colors={isSelected ? [s.color, s.color + 'CC'] : ['#FFFFFF', '#F8FAFC']}
                                                style={styles.serviceGradient}
                                            >
                                                <Ionicons name={s.icon as any} size={32} color={isSelected ? '#fff' : s.color} />
                                                <Text style={[styles.serviceBoxName, isSelected && styles.textWhite]}>{s.name}</Text>
                                                <Text style={[styles.serviceBoxPrice, isSelected && styles.textWhite]} numberOfLines={1}>{s.description}</Text>
                                                {isSelected && <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.checkIcon} />}
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <View style={styles.addonsSection}>
                                <Text style={styles.sectionLabel}>Order Add-ons (Optional)</Text>
                                {ADDONS.map((a, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={[styles.addonRow, selectedAddons.includes(a.id) && styles.addonRowActive]}
                                        onPress={() => toggleAddon(a.id)}
                                    >
                                        <View style={styles.addonInfo}>
                                            <Ionicons name={a.icon as any} size={20} color={selectedAddons.includes(a.id) ? Colors.primary : Colors.textSecondary} />
                                            <Text style={[styles.addonName, selectedAddons.includes(a.id) && styles.textPrimary]}>{a.name}</Text>
                                        </View>
                                        <Text style={styles.addonPrice}>+ LKR {a.price}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </Animated.View>
                );
            case 1: // Item Selection
                const currentPrices = serviceItemPrices[activeServiceId!] || [];
                const cats = Array.from(new Set(currentPrices.map(i => i.category)));
                return (
                    <Animated.View entering={FadeInRight} exiting={SlideOutLeft} style={styles.stepContainer}>
                        <View style={styles.activeServicePicker}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {Object.keys(basket).map((sId) => {
                                    const s = services.find(sv => sv.id === parseInt(sId));
                                    const isActive = activeServiceId === s.id;
                                    return (
                                        <TouchableOpacity
                                            key={sId}
                                            style={[styles.serviceTab, isActive && styles.serviceTabActive]}
                                            onPress={() => setActiveServiceId(s.id)}
                                        >
                                            <Text style={[styles.tabText, isActive && styles.textWhite]}>{s?.name}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {currentPrices.length === 0 ? (
                                <View style={{ padding: 40, alignItems: 'center' }}>
                                    <ActivityIndicator color={Colors.primary} />
                                    <Text style={{ marginTop: 10, color: Colors.textSecondary }}>Loading items...</Text>
                                </View>
                            ) : cats.map(cat => (
                                <View key={cat} style={styles.catGroup}>
                                    <Text style={styles.catHeader}>{cat}</Text>
                                    {currentPrices.filter(li => li.category === cat).map(item => {
                                        const count = basket[activeServiceId!]?.[item.id] || 0;
                                        const unitPrice = Math.round(item.current_price);
                                        return (
                                            <View key={item.id} style={styles.itemRow}>
                                                <View style={styles.itemMain}>
                                                    <View style={styles.itemIconCircle}><Ionicons name={item.icon as any} size={20} color={Colors.primary} /></View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.itemName}>{item.name}</Text>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                            <Text style={styles.itemPrice}>
                                                                LKR {unitPrice} 
                                                                <Text style={{ fontSize: 10, color: Colors.textSecondary }}> / {item.current_unit === 'kg' ? 'KG' : 'PC'}</Text>
                                                            </Text>
                                                        </View>
                                                        
                                                        {item.current_unit === 'kg' && count > 0 && (
                                                            <Animated.View entering={FadeInDown.duration(400)} style={styles.piecesBadge}>
                                                                <Ionicons name="apps-outline" size={14} color={Colors.primary} />
                                                                <TextInput
                                                                    style={styles.piecesInputNew}
                                                                    placeholder="Total pieces?"
                                                                    placeholderTextColor="#94A3B8"
                                                                    keyboardType="number-pad"
                                                                    value={piecesBasket[`${activeServiceId}-${item.id}`] || ''}
                                                                    onChangeText={(val) => setPiecesBasket(prev => ({ ...prev, [`${activeServiceId}-${item.id}`]: val }))}
                                                                />
                                                                <View style={styles.pcTag}><Text style={styles.pcTagText}>PC</Text></View>
                                                            </Animated.View>
                                                        )}
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
                                </View>
                            ))}
                        </ScrollView>
                    </Animated.View>
                );


            case 2: // Logistics
                return (
                    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                        <Animated.View entering={FadeInRight} exiting={SlideOutLeft} style={styles.stepContainer}>
                            <Text style={styles.stepTitle}>Select Schedule & Address</Text>

                        <Text style={styles.subLabel}>Choose Pickup Date</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateList}>
                            {dates.map((d, i) => (
                                <TouchableOpacity key={i} style={[styles.dateCard, selectedDate === d.full && styles.dateCardActive]} onPress={() => setSelectedDate(d.full)}>
                                    <Text style={[styles.dateDay, selectedDate === d.full && styles.textWhite]}>{d.day}</Text>
                                    <Text style={[styles.dateNum, selectedDate === d.full && styles.textWhite]}>{d.date}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={[styles.subLabel, { marginTop: 20 }]}>Choose Time Slot</Text>
                        <View style={styles.timeGrid}>
                            {timeSlots.map((t, i) => (
                                <TouchableOpacity key={i} style={[styles.timeBox, selectedTime === t && styles.timeBoxActive]} onPress={() => setSelectedTime(t)}>
                                    <Text style={[styles.timeText, selectedTime === t && styles.textWhite]}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 8 }}>
                            <Text style={styles.subLabel}>Pickup Address</Text>
                            <TouchableOpacity onPress={handleFetchLocation} disabled={isLocating} style={styles.fetchLocationBtn}>
                                {isLocating ? (
                                    <ActivityIndicator size="small" color={Colors.primary} />
                                ) : (
                                    <>
                                        <Ionicons name="navigate-outline" size={14} color={Colors.primary} style={{ marginRight: 4 }} />
                                        <Text style={styles.fetchLocationText}>Fetch Current</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                        <View style={styles.inputBox}>
                            <Ionicons name="location-outline" size={20} color={Colors.textSecondary} />
                            <TextInput style={styles.input} value={address} onChangeText={setAddress} multiline placeholder="Enter detailed address" />
                        </View>

                        <View style={styles.mapContainer}>
                            <AppMap
                                style={styles.map}
                                region={{
                                    latitude: customerCoords.lat,
                                    longitude: customerCoords.lng,
                                    latitudeDelta: 0.01,
                                    longitudeDelta: 0.01,
                                }}
                                onPress={handleMapPress}
                            >
                                <Marker
                                    coordinate={{
                                        latitude: customerCoords.lat,
                                        longitude: customerCoords.lng
                                    }}
                                    draggable
                                    onDragEnd={handleMapPress}
                                />
                            </AppMap>
                            <Text style={styles.mapHint}>Tap or drag pin to set exact location</Text>
                        </View>

                        <Text style={[styles.subLabel, { marginTop: 20 }]}>Additional Instructions</Text>
                        <View style={styles.inputBox}>
                            <Ionicons name="chatbubble-outline" size={20} color={Colors.textSecondary} />
                            <TextInput style={styles.input} value={notes} onChangeText={setNotes} multiline placeholder="Eg: Door code, Careful with silk items" />
                        </View>
                    </Animated.View>
                    </ScrollView>
                );
            case 3: // Review
                return (
                    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                        <Animated.View entering={FadeInRight} style={styles.stepContainer}>
                            <View style={styles.reviewHeader}>
                                <Ionicons name="receipt-outline" size={32} color={Colors.primary} />
                                <Text style={styles.reviewTitle}>Order Summary</Text>
                            </View>

                            <View style={styles.receiptCard}>
                                <Text style={styles.receiptStore}>{laundryName || 'GoWash Central'}</Text>
                                <View style={styles.receiptDivider} />

                                {breakdown.map((s, i) => (
                                    <View key={i} style={styles.receiptService}>
                                        <Text style={styles.receiptServiceName}>{s.name}</Text>
                                        {s.items.map((it: any, ii: number) => (
                                            <View key={ii} style={styles.receiptItem}>
                                                <View>
                                                    <Text style={styles.receiptItemName}>{it.name} x {it.qty} {it.unit === 'kg' ? 'KG' : ''}</Text>
                                                    {it.pieces && <Text style={styles.receiptItemPcs}>({it.pieces} pieces)</Text>}
                                                </View>
                                                <Text style={styles.receiptItemPrice}>LKR {it.sub}</Text>
                                            </View>
                                        ))}
                                    </View>
                                ))}

                                {selectedAddons.length > 0 && (
                                    <View style={styles.receiptService}>
                                        <Text style={styles.receiptServiceName}>Add-ons</Text>
                                        {selectedAddons.map(id => {
                                            const a = ADDONS.find(ad => ad.id === id);
                                            return (
                                                <View key={id} style={styles.receiptItem}>
                                                    <Text style={styles.receiptItemName}>{a?.name}</Text>
                                                    <Text style={styles.receiptItemPrice}>LKR {a?.price}</Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                )}

                                <View style={styles.receiptDivider} />
                                <View style={styles.receiptTotalRow}><Text style={styles.receiptLabel}>Items Subtotal</Text><Text style={styles.receiptValue}>LKR {itemsTotal + addonsTotal}</Text></View>
                                <View style={styles.receiptTotalRow}><Text style={styles.receiptLabel}>Service Fee</Text><Text style={styles.receiptValue}>LKR {serviceFee}</Text></View>
                                <View style={styles.receiptTotalRow}><Text style={styles.receiptLabel}>Delivery Charge</Text><Text style={styles.receiptValue}>LKR {deliveryFee}</Text></View>
                                <View style={[styles.receiptTotalRow, { marginTop: 10 }]}><Text style={styles.receiptGrandLabel}>Total Payable</Text><Text style={styles.receiptGrandValue}>LKR {grandTotal}.00</Text></View>
                            </View>

                            <View style={styles.logisticSummary}>
                                <View style={styles.logRow}><Ionicons name="calendar" size={16} color={Colors.textSecondary} /><Text style={styles.logText}>{selectedDate} • {selectedTime}</Text></View>
                                <View style={styles.logRow}><Ionicons name="location" size={16} color={Colors.textSecondary} /><Text style={styles.logText} numberOfLines={1}>{address}</Text></View>
                            </View>
                        </Animated.View>
                    </ScrollView>
                );
        }
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

    return (
        <SafeAreaView style={styles.container}>
            {/* Advance Header with Progress */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => currentStep === 0 ? router.back() : setCurrentStep(currentStep - 1)} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <View style={styles.progressContainer}>
                    <Text style={styles.laundryHeaderLabel}>{laundry?.name || laundryName || 'Schedule Order'}</Text>
                    <View style={styles.progressBarBg}>
                        <Animated.View layout={Layout.springify()} style={[styles.progressBarFill, { width: `${((currentStep + 1) / STEPS.length) * 100}%` }]} />
                    </View>
                </View>
                <View style={{ width: 44 }} />
            </View>

            <View style={{ flex: 1 }}>{renderStepContent()}</View>

            {/* Sticky Action Footer */}
            <View style={styles.footer}>
                <View style={styles.footerPriceRow}>
                    <View>
                        <Text style={styles.footerTotalLabel}>ESTIMATED TOTAL</Text>
                        <Text style={styles.footerTotalPrice}>LKR {grandTotal}.00</Text>
                    </View>
                    <View style={styles.itemBadge}>
                        <Text style={styles.itemBadgeText}>{totalItemsCount} ITEMS</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.nextBtn, submitting && { opacity: 0.7 }]}
                    onPress={handleNext}
                    disabled={submitting}
                >
                    <LinearGradient colors={['#4c669f', '#3b5998']} style={styles.nextGradient}>
                        <Text style={styles.nextBtnText}>{currentStep === STEPS.length - 1 ? 'Place Secure Order' : 'Continue'}</Text>
                        {submitting ? <ActivityIndicator color="#fff" style={{ marginLeft: 10 }} /> : <Ionicons name="arrow-forward" size={20} color="#fff" />}
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Advance Success Modal */}
            <Modal visible={showSuccessModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <Animated.View entering={BounceIn} style={styles.successPopup}>
                        <LinearGradient colors={['#10B981', '#059669']} style={styles.successHeader}>
                            <View style={styles.successIconCircle}><Ionicons name="checkmark-sharp" size={60} color="#fff" /></View>
                            <Text style={styles.successTitle}>Order Placed!</Text>
                            <Text style={styles.successSubtitle}>Ref: #GW-{Math.floor(Math.random() * 9000) + 1000}</Text>
                        </LinearGradient>
                        <View style={styles.successBody}>
                            <Text style={styles.successMsg}>Your professional laundry order has been scheduled. Our agent will contact you shortly for pickup.</Text>
                            <TouchableOpacity style={styles.finalBtn} onPress={() => router.replace('/(tabs)')}>
                                <Text style={styles.finalBtnText}>Go to Dashboard</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
    progressContainer: { flex: 1, marginHorizontal: 20 },
    laundryHeaderLabel: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 6, textAlign: 'center' },
    progressBarBg: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, marginBottom: 8 },
    progressBarFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
    stepIndicator: { fontSize: 12, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
    stepContainer: { flex: 1, padding: 24 },
    stepTitle: { fontSize: 24, fontWeight: '900', color: Colors.text, marginBottom: 8 },
    stepSubtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 24, lineHeight: 20 },
    servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginBottom: 30 },
    serviceBox: { width: (width - 68) / 2.2, borderRadius: 24, height: 140, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
    serviceBoxActive: { transform: [{ scale: 1.02 }] },
    serviceGradient: { flex: 1, padding: 16, justifyContent: 'flex-end' },
    serviceBoxName: { fontSize: 13, fontWeight: '800', color: Colors.text, marginTop: 10 },
    serviceBoxPrice: { fontSize: 10, color: Colors.textSecondary, marginTop: 4 },
    checkIcon: { position: 'absolute', top: 15, right: 15 },
    textWhite: { color: '#fff' },
    addonsSection: { marginTop: 10 },
    sectionLabel: { fontSize: 14, fontWeight: '800', color: Colors.textSecondary, textTransform: 'uppercase', marginBottom: 15 },
    addonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, backgroundColor: '#F8FAFC', borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#F1F5F9' },
    addonRowActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '05' },
    addonInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    addonName: { fontSize: 15, fontWeight: '700', color: Colors.text },
    addonPrice: { fontSize: 14, fontWeight: '800', color: Colors.primary },
    textPrimary: { color: Colors.primary },
    activeServicePicker: { marginBottom: 20 },
    serviceTab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F1F5F9', marginRight: 10 },
    serviceTabActive: { backgroundColor: Colors.primary },
    tabText: { fontWeight: '700', color: Colors.textSecondary },
    catGroup: { marginBottom: 30 },
    catHeader: { fontSize: 13, fontWeight: '900', color: Colors.textSecondary, textTransform: 'uppercase', marginBottom: 15, marginLeft: 5 },
    itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderRadius: 20, marginBottom: 10, borderWidth: 1, borderColor: '#F1F5F9', elevation: 2, shadowColor: '#000', shadowOpacity: 0.02 },
    itemMain: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    itemIconCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F0F4FF', justifyContent: 'center', alignItems: 'center' },
    itemName: { fontSize: 16, fontWeight: '700', color: Colors.text },
    itemPrice: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
    stepper: { flexDirection: 'row', alignItems: 'center', gap: 15, backgroundColor: '#F8FAFC', padding: 5, borderRadius: 12 },
    stepBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 1 },
    stepCount: { minWidth: 20, textAlign: 'center', fontSize: 16, fontWeight: '800', color: Colors.primary },
    subLabel: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 12 },
    dateList: { marginBottom: 20 },
    dateCard: { width: 65, height: 85, borderRadius: 20, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: '#F1F5F9' },
    dateCardActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    dateDay: { fontSize: 12, color: Colors.textSecondary, marginBottom: 5 },
    dateNum: { fontSize: 20, fontWeight: '900', color: Colors.text },
    timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    timeBox: { width: (width - 60) / 2, padding: 18, borderRadius: 18, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center' },
    timeBoxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    timeText: { fontWeight: '700', color: Colors.textSecondary },
    inputBox: { flexDirection: 'row', padding: 18, backgroundColor: '#F8FAFC', borderRadius: 20, borderWidth: 1, borderColor: '#F1F5F9', gap: 12 },
    input: { flex: 1, fontSize: 15, color: Colors.text, minHeight: 40, textAlignVertical: 'top' },
    mapContainer: { height: 200, borderRadius: 20, overflow: 'hidden', marginTop: 15, borderWidth: 1, borderColor: '#F1F5F9' },
    map: { flex: 1 },
    mapHint: { position: 'absolute', bottom: 10, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 12, fontSize: 12, fontWeight: '700', color: Colors.textSecondary, elevation: 4 },
    fetchLocationBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary + '10', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    fetchLocationText: { fontSize: 12, color: Colors.primary, fontWeight: '700' },
    reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
    reviewTitle: { fontSize: 22, fontWeight: '900', color: Colors.text },
    receiptCard: { backgroundColor: '#fff', borderRadius: 32, padding: 24, elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, marginBottom: 24, borderStyle: 'dashed', borderWidth: 1, borderColor: '#E2E8F0' },
    receiptStore: { fontSize: 18, fontWeight: '900', color: Colors.primary, textAlign: 'center', marginBottom: 15 },
    receiptDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 15 },
    receiptService: { marginBottom: 20 },
    receiptServiceName: { fontSize: 14, fontWeight: '900', color: '#64748B', textTransform: 'uppercase', marginBottom: 10 },
    receiptItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    receiptItemName: { fontSize: 15, color: Colors.text, fontWeight: '500' },
    receiptItemPrice: { fontSize: 15, fontWeight: '700', color: Colors.text },
    receiptTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    receiptLabel: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
    receiptValue: { fontSize: 14, fontWeight: '700', color: Colors.text },
    receiptGrandLabel: { fontSize: 18, fontWeight: '900', color: Colors.text },
    receiptGrandValue: { fontSize: 22, fontWeight: '900', color: Colors.primary },
    logisticSummary: { gap: 10 },
    logRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    logText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
    footer: { padding: 24, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F1F5F9', elevation: 20 },
    footerPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
    footerTotalLabel: { fontSize: 12, fontWeight: '800', color: Colors.textSecondary },
    footerTotalPrice: { fontSize: 28, fontWeight: '900', color: Colors.text },
    itemBadge: { backgroundColor: Colors.primary + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    itemBadgeText: { fontSize: 11, fontWeight: '900', color: Colors.primary },
    nextBtn: { borderRadius: 22, overflow: 'hidden', elevation: 8, shadowColor: Colors.primary, shadowOpacity: 0.3, shadowRadius: 15, shadowOffset: { width: 0, height: 6 } },
    nextGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, gap: 12 },
    nextBtnText: { color: '#fff', fontSize: 18, fontWeight: '900' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    successPopup: { backgroundColor: '#fff', width: '100%', borderRadius: 40, overflow: 'hidden' },
    successHeader: { padding: 40, alignItems: 'center' },
    successIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    successTitle: { fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 5 },
    successSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '700' },
    successBody: { padding: 30, alignItems: 'center' },
    successMsg: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 30 },
    finalBtn: { width: '100%', paddingVertical: 20, backgroundColor: '#10B981', borderRadius: 20, alignItems: 'center' },
    finalBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
    piecesBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginTop: 10,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    piecesInputNew: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text,
        marginLeft: 8,
        width: 100,
        height: 24,
        padding: 0,
    },
    pcTag: {
        backgroundColor: Colors.primary + '15',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        marginLeft: 4,
    },
    pcTagText: {
        fontSize: 9,
        fontWeight: '900',
        color: Colors.primary,
    },
    receiptItemPcs: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', fontStyle: 'italic' }
});
