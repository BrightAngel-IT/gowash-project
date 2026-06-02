
import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, Animated as RNAnimated, Platform, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight, FadeOutUp, BounceIn } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useIsFocused } from '@react-navigation/native';
import { Audio } from 'expo-av';
import io from 'socket.io-client';

import api, { getUser, SOCKET_URL } from '@/constants/api';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const scrollY = useRef(new RNAnimated.Value(0)).current;
  const [services, setServices] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [statusUpdate, setStatusUpdate] = useState<any>(null);
  const [driverAssigned, setDriverAssigned] = useState<any>(null);
  const [laundries, setLaundries] = useState<any[]>([]);
  const [sound, setSound] = useState<any>();
  const lastStatusRef = useRef<string | null>(null);
  const socketRef = useRef<any>(null);

  const openInGoogleMaps = (address: string) => {
    if (!address) {
      Alert.alert("Error", "Location information is missing.");
      return;
    }
    
    const encoded = encodeURIComponent(address);
    const nativeUrl = Platform.select({
      ios: `maps://0,0?q=${encoded}`,
      android: `geo:0,0?q=${encoded}`,
      default: `https://www.google.com/maps/search/?api=1&query=${encoded}`
    });

    const webUrl = `https://www.google.com/maps/search/?api=1&query=${encoded}`;

    if (Platform.OS === 'web') {
      window.open(webUrl, '_blank');
      return;
    }

    Linking.canOpenURL(nativeUrl).then(supported => {
      Linking.openURL(supported ? nativeUrl : webUrl);
    }).catch(() => {
      Linking.openURL(webUrl);
    });
  };

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (user) pollOrderStatus();
    }, 10000); // Poll every 10 seconds

    // Socket.io connection for user
    if (user && !socketRef.current) {
      socketRef.current = io(SOCKET_URL);

      socketRef.current.on('connect', () => {
        console.log(`User ${user.id} connected to socket`);
        socketRef.current.emit('join_room', `user_${user.id}`);
      });

      socketRef.current.on('driver_assigned', (data: any) => {
        console.log('Driver assigned:', data);
        setDriverAssigned(data);
        // Optionally play a sound
        playUpdateSound();
      });

      socketRef.current.on('order_status_update', (data: any) => {
        console.log('Order status update received:', data);
        setStatusUpdate(data);
        setActiveOrder(data);
        playUpdateSound();
      });
    }

    return () => {
      clearInterval(interval);
      if (sound) sound.unloadAsync();
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, sound]);

  const loadData = async () => {
    try {
      const userData = await getUser();
      setUser(userData);
      fetchServices();
      fetchLaundries();
      if (userData) {
        pollOrderStatus(userData.id);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const playUpdateSound = async () => {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' }
      );
      setSound(newSound);
      await newSound.playAsync();
    } catch (e) {
      console.error('Error playing update sound:', e);
    }
  };

  const pollOrderStatus = async (userId?: number) => {
    try {
      const currentUserId = userId || user?.id;
      if (!currentUserId) return;

      const res = await api.get(`/orders?userId=${currentUserId}&role=customer`);
      const active = res.data.find((o: any) => !['Delivered', 'Cancelled'].includes(o.status));

      if (active) {
        if (lastStatusRef.current && lastStatusRef.current !== active.status) {
          // Status Changed! Show notification
          setStatusUpdate(active);
          playUpdateSound();
        }
        lastStatusRef.current = active.status;
        setActiveOrder(active);
      } else {
        lastStatusRef.current = null;
        setActiveOrder(null);
      }
    } catch (error) {
      console.error('Error polling order:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await api.get('/services');
      setServices(res.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchLaundries = async () => {
    try {
      const res = await api.get('/laundries');
      setLaundries(res.data);
    } catch (error) {
      console.error('Error fetching laundries:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return '#F59E0B';
      case 'Confirmed': return '#10B981';
      case 'Washing': return '#3B82F6';
      case 'Ready': return '#8B5CF6';
      default: return Colors.primary;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#f8f9fa', '#e9ecef']}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hey there,</Text>
            <Text style={styles.username}>{user?.name || 'Friend'} 👋</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationBtn}
          >
            <Ionicons name="notifications-outline" size={24} color={Colors.text} />
            <View style={styles.badge} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Promo Banner */}
          <LinearGradient
            colors={Colors.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.banner}
          >
            <View style={styles.bannerContent}>
              <View style={styles.bannerTag}>
                <Text style={styles.bannerTagText}>LIMITED OFFER</Text>
              </View>
              <Text style={styles.bannerTitle}>30% OFF</Text>
              <Text style={styles.bannerSubtitle}>On your first order with GoWash. Premium care guaranteed.</Text>
              <TouchableOpacity style={styles.bannerButton} onPress={() => router.push('/(tabs)/explore')}>
                <Text style={styles.bannerButtonText}>Order Now</Text>
              </TouchableOpacity>
            </View>
            <Ionicons name="sparkles" size={120} color="rgba(255,255,255,0.15)" style={styles.bannerIcon} />
          </LinearGradient>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.placeholder}>What do you need handled today?</Text>
          </View>

          {/* Horizontal Categories */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Services</Text>
            <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.servicesScroll}>
            {services.map((service, index) => (
              <Animated.View
                key={service.id}
                entering={FadeInRight.delay(index * 100).springify()}
                style={styles.serviceCardWrapper}
              >
                <TouchableOpacity style={styles.serviceCardVertical} onPress={() => router.push('/(tabs)/explore')}>
                  <View style={[styles.iconCircle, { backgroundColor: service.color + '15' }]}>
                    <Ionicons name={service.icon as any} size={28} color={service.color} />
                  </View>
                  <Text style={styles.serviceNameVertical}>{service.name}</Text>
                  <Text style={styles.servicePrice}>{service.price}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>

          {/* New: Top Laundries Section */}
          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
            <Text style={styles.sectionTitle}>Nearby Laundries</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.servicesScroll}>
            {laundries.map((laundry, index) => (
              <TouchableOpacity
                key={laundry.id}
                style={styles.laundryQuickCard}
                onPress={() => router.push({ pathname: '/schedule', params: { laundryId: laundry.id, laundryName: laundry.name } })}
              >
                <Image
                  source={{ uri: laundry.image_url || 'https://images.unsplash.com/photo-1545173168-9f1947eebb9f?q=80&w=2071&auto=format&fit=crop' }}
                  style={styles.laundryQuickImage}
                />
                <View style={styles.laundryQuickInfo}>
                  <Text style={styles.laundryNameQuick} numberOfLines={1}>{laundry.name}</Text>
                  <Text style={styles.laundryAddressQuick} numberOfLines={1}>{laundry.address}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {activeOrder ? (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Current Order</Text>
              <Animated.View entering={FadeInDown.delay(600).duration(800)} style={styles.activeOrderCard}>
                <View style={styles.orderCardHeader}>
                  <View style={[styles.orderIcon, { backgroundColor: activeOrder.serviceColor || Colors.primary }]}>
                    <Ionicons name="shirt" size={24} color="#fff" />
                  </View>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderId}>Order #{activeOrder.id}</Text>
                    <Text style={[styles.orderStatus, { color: getStatusColor(activeOrder.status) }]}>{activeOrder.status}</Text>
                  </View>
                  <View style={[styles.timerBadge, { backgroundColor: getStatusColor(activeOrder.status) }]}>
                    <Ionicons name="time-outline" size={14} color="#FFF" />
                    <Text style={styles.timerText}>Processing</Text>
                  </View>
                </View>

                <View style={styles.progressContainer}>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: activeOrder.status === 'Washing' ? '40%' : activeOrder.status === 'Ready' ? '100%' : '20%',
                          backgroundColor: '#fff'
                        }
                      ]}
                    />
                  </View>
                </View>

                <TouchableOpacity style={styles.trackBtn} onPress={() => router.push('/(tabs)/orders')}>
                  <Text style={styles.trackBtnText}>View Details</Text>
                  <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
                </TouchableOpacity>
              </Animated.View>
            </>
          ) : null}

          {/* Recent Activity / Promotions */}
          <Text style={[styles.sectionTitle, { marginTop: 25 }]}>Special for you</Text>
          <View style={styles.promoRow}>
            <View style={[styles.promoCard, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="gift-outline" size={32} color="#1565C0" />
              <Text style={styles.promoText}>Refer a Friend</Text>
              <Text style={styles.promoSub}>Get LKR 100</Text>
            </View>
            <View style={[styles.promoCard, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="leaf-outline" size={32} color="#2E7D32" />
              <Text style={styles.promoText}>Eco Wash</Text>
              <Text style={styles.promoSub}>Save Water</Text>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Floating Action Button for New Order */}
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/explore')}
        >
          <LinearGradient
            colors={Colors.gradients.primary}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={30} color="#fff" />
            <Text style={styles.fabText}>New Order</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Driver Assigned Modal */}
        <Modal
          visible={!!driverAssigned}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setDriverAssigned(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.driverModalContent}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                <View style={styles.driverModalHeader}>
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    style={styles.successIconCircle}
                  >
                    <Ionicons name="checkmark" size={32} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.driverModalTitle}>Driver Found!</Text>
                  <Text style={styles.driverModalSub}>A driver is on their way to pick up your laundry.</Text>
                </View>

                <View style={styles.driverInfoCard}>
                  <View style={styles.driverAvatar}>
                    <Text style={styles.driverInitials}>{driverAssigned?.driver?.name?.charAt(0) || 'D'}</Text>
                  </View>
                  <View style={styles.driverTextInfo}>
                    <Text style={styles.driverName}>{driverAssigned?.driver?.name}</Text>
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={12} color="#F59E0B" />
                      <Text style={styles.ratingText}>4.9</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.callButton}>
                    <Ionicons name="call" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>

                <View style={styles.vehicleInfoSection}>
                  <View style={styles.vehicleDetail}>
                    <Text style={styles.vehicleLabel}>Vehicle</Text>
                    <Text style={styles.vehicleValue}>{driverAssigned?.driver?.vehicle_type || 'Tuk Tuk'}</Text>
                  </View>
                  <View style={styles.verticalLineMsg} />
                  <View style={styles.vehicleDetail}>
                    <Text style={styles.vehicleLabel}>Number</Text>
                    <Text style={styles.vehicleValue}>{driverAssigned?.driver?.vehicle_number}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.trackDriverBtn}
                  onPress={() => {
                    const destination = driverAssigned?.pickup_address || driverAssigned?.laundry_name;
                    openInGoogleMaps(destination);
                    setDriverAssigned(null);
                  }}
                >
                  <Text style={styles.trackDriverText}>Track Driver</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Status Update Modal (Top-up style) */}
        <Modal
          visible={!!statusUpdate}
          transparent={true}
          animationType="none"
        >
          <View style={styles.modalOverlay}>
            <Animated.View entering={BounceIn} style={styles.statusUpdatePopup}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <LinearGradient
                  colors={['#0ea5e9', '#0284c7']}
                  style={styles.popupHeader}
                >
                  <View style={styles.iconCirclePopup}>
                    <Ionicons name="notifications" size={32} color="#fff" />
                  </View>
                  <Text style={styles.popupTitle}>Order Update!</Text>
                </LinearGradient>

                <View style={styles.popupBody}>
                  <Text style={styles.orderIdLabel}>Order #{statusUpdate?.id}</Text>
                  <Text style={styles.statusChangeText}>Your order status is now:</Text>
                  <View style={[styles.statusBigBadge, { backgroundColor: getStatusColor(statusUpdate?.status) + '20' }]}>
                    <Text style={[styles.statusBigText, { color: getStatusColor(statusUpdate?.status) }]}>{statusUpdate?.status}</Text>
                  </View>
                  <Text style={styles.laundryNameLabel}>at {statusUpdate?.laundryName || 'GoWash Central'}</Text>

                  <TouchableOpacity
                    style={styles.gotItBtn}
                    onPress={() => setStatusUpdate(null)}
                  >
                    <Text style={styles.gotItText}>Got it!</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 10,
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: 'System',
  },
  username: {
    ...Typography.h2,
    color: Colors.text,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  banner: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    overflow: 'hidden',
    height: 180,
    justifyContent: 'center',
  },
  bannerContent: {
    zIndex: 2,
    width: '75%',
  },
  bannerTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  bannerTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  bannerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
    lineHeight: 20,
  },
  bannerButton: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignSelf: 'flex-start',
    shadowColor: "rgba(0,0,0,0.2)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  bannerButtonText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  bannerIcon: {
    position: 'absolute',
    right: -20,
    bottom: -20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  placeholder: {
    marginLeft: 10,
    color: Colors.textSecondary,
    fontSize: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  seeAll: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  servicesScroll: {
    paddingRight: 24,
  },
  serviceCardWrapper: {
    marginRight: 16,
  },
  serviceCardVertical: {
    width: 110,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceNameVertical: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  servicePrice: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  laundryQuickCard: {
    width: 160,
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginRight: 16,
    marginBottom: 10,
  },
  laundryQuickImage: {
    width: '100%',
    height: 100,
  },
  laundryQuickInfo: {
    padding: 12,
  },
  laundryNameQuick: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  laundryAddressQuick: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  activeOrderCard: {
    backgroundColor: Colors.primary, // Fallback
    borderRadius: 24,
    padding: 5, // Inner padding handle by children
    marginTop: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  orderCardHeader: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 19,
    borderTopRightRadius: 19,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  orderIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  progressContainer: {
    padding: 20,
    paddingTop: 15,
    backgroundColor: Colors.primary, // Match parent for smooth look
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    margin: 4,
    marginTop: 0,
    paddingVertical: 12,
    borderRadius: 20,
  },
  trackBtnText: {
    color: Colors.primary,
    fontWeight: '700',
    marginRight: 8,
    fontSize: 14,
  },
  promoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  promoCard: {
    width: '48%',
    padding: 20,
    borderRadius: 20,
    alignItems: 'flex-start',
  },
  promoText: {
    marginTop: 12,
    fontWeight: '700',
    fontSize: 16,
    color: Colors.text,
  },
  promoSub: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 32,
  },
  fabText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  statusUpdatePopup: {
    backgroundColor: '#fff',
    width: '100%',
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 10,
  },
  popupHeader: {
    padding: 24,
    alignItems: 'center',
  },
  iconCirclePopup: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  popupTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  popupBody: {
    padding: 24,
    alignItems: 'center',
  },
  orderIdLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  statusChangeText: {
    fontSize: 16,
    color: Colors.text,
    marginVertical: 12,
  },
  statusBigBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 15,
    marginVertical: 8,
  },
  statusBigText: {
    fontSize: 24,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  laundryNameLabel: {
    marginTop: 8,
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  gotItBtn: {
    marginTop: 24,
    backgroundColor: Colors.primary,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  gotItText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  driverModalContent: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 0,
    width: '100%',
    elevation: 5,
  },
  driverModalHeader: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 10,
  },
  successIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  driverModalSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  driverInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 20,
    marginVertical: 10,
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  driverInitials: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  driverTextInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10B981', // Green for call
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleInfoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 10,
  },
  vehicleDetail: {
    alignItems: 'center',
  },
  vehicleLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  vehicleValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  verticalLineMsg: {
    width: 1,
    height: '100%',
    backgroundColor: '#E5E7EB',
  },
  trackDriverBtn: {
    backgroundColor: Colors.primary,
    margin: 20,
    marginTop: 0,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  trackDriverText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

