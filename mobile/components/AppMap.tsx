import React from 'react';
import MapView, { Marker as RNMarker, MapViewProps } from 'react-native-maps';

export default function AppMap(props: MapViewProps) {
    return <MapView {...props} />;
}

export function Marker(props: any) {
    return <RNMarker {...props} />;
}
