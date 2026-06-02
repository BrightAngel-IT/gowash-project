import React from 'react';
import { View, Text } from 'react-native';

export default function AppMap(props: any) {
    return (
        <View style={[{ backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' }, props.style]}>
            <Text style={{ color: '#64748b', fontWeight: 'bold' }}>Map is not supported on Web</Text>
            {props.children}
        </View>
    );
}

export function Marker(props: any) {
    return null;
}
