import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import api from '@/constants/api';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Image } from 'expo-image';

export default function ExploreLaundriesScreen() {
  const router = useRouter();
  const [laundries, setLaundries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLaundries();
  }, []);

  const fetchLaundries = async () => {
    try {
      const res = await api.get('/laundries');
      setLaundries(res.data);
    } catch (error) {
      console.error('Error fetching laundries:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderLaundryItem = ({ item, index }: { item: any, index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
      <TouchableOpacity
        style={styles.laundryCard}
        onPress={() => router.push({ pathname: '/schedule', params: { laundryId: item.id, laundryName: item.name } })}
      >
        <Image
          source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1545173168-9f1947eebb9f?q=80&w=2071&auto=format&fit=crop' }}
          style={styles.laundryImage}
        />
        <View style={styles.laundryInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.laundryName}>{item.name}</Text>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#FFB800" />
              <Text style={styles.ratingText}>4.8</Text>
            </View>
          </View>
          <Text style={styles.laundryAddress} numberOfLines={1}>
            <Ionicons name="location-outline" size={12} color={Colors.textSecondary} /> {item.address}
          </Text>
          <View style={styles.tagRow}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>Open: {item.opening_time}</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: '#E8F5E9' }]}>
              <Text style={[styles.tagText, { color: '#2E7D32' }]}>Eco Friendly</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Select laundry</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="options-outline" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color={Colors.textSecondary} />
        <Text style={styles.placeholder}>Find a professional laundry nearby</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={laundries}
          renderItem={renderLaundryItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    ...Typography.h2,
    fontSize: 24,
    color: Colors.text,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  placeholder: {
    marginLeft: 10,
    color: Colors.textSecondary,
    fontSize: 15,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  laundryCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  laundryImage: {
    width: '100%',
    height: 160,
  },
  laundryInfo: {
    padding: 16,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  laundryName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFB800',
    marginLeft: 4,
  },
  laundryAddress: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    backgroundColor: '#F0F4F8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4A5568',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

