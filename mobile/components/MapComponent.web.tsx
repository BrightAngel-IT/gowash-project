import React from 'react';
import { View, Text } from 'react-native';

export const MapView = ({ children, style }: any) => (
  <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#E2E8F0' }]}>
    <Text style={{ color: '#64748B', fontWeight: '600', padding: 20, textAlign: 'center' }}>
      Interactive Map is not supported on the web version. Please use the mobile app to select a precise location.
    </Text>
    {children}
  </View>
);

export const Marker = () => null;
