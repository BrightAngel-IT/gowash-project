import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '@/constants/api';
import { Colors, Typography } from '@/constants/theme';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

export default function ServicesScreen() {
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await api.get('/services');
      setServices(res.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>All Services</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {services.map((service, index) => (
              <Animated.View key={service.id} entering={FadeInDown.delay(index * 50).duration(400)} style={styles.gridItemWrapper}>
                <TouchableOpacity 
                  style={styles.serviceCard} 
                  onPress={() => router.push('/(tabs)/explore')}
                >
                  <LinearGradient 
                    colors={[service.color, service.color + 'B0']} 
                    style={[styles.iconCircle, { shadowColor: service.color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name={service.icon as any} size={28} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  
                  {/* Right arrow for detail indicator requested by user */}
                  <View style={styles.arrowContainer}>
                     <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </ScrollView>
      )}
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItemWrapper: {
    width: '48%',
    marginBottom: 16,
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    height: 140,
    justifyContent: 'center',
    position: 'relative',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  arrowContainer: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 4,
  }
});
