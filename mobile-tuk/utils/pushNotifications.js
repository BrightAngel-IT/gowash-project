import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4facfe',
    });
  }

  if (Device.isDevice && Platform.OS !== 'web') {
    const messaging = require('@react-native-firebase/messaging').default;
    const { PermissionsAndroid } = require('react-native');

    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Notification permission denied by user');
        return null;
      }
    }

    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled && Platform.OS === 'ios') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    try {
      token = await messaging().getToken();
      console.log('FCM Token generated:', token);
    } catch (e) {
      console.log('Error generating push token', e);
      token = null;
    }
  } else {
    console.log('Must use physical device for Push Notifications, and not Web');
  }

  return token;
}

