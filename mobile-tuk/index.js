import { Platform } from 'react-native';
import 'expo-router/entry';

if (Platform.OS !== 'web') {
    const messaging = require('@react-native-firebase/messaging').default;
    const notifee = require('@notifee/react-native').default;
    const { AndroidImportance, AndroidCategory, AndroidVisibility, EventType } = require('@notifee/react-native');

    // Register background handler early to ensure it runs headlessly
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
        console.log('Message handled in the HEADLESS background!', remoteMessage);
        const { data } = remoteMessage;
        
        const channelId = await notifee.createChannel({
            id: 'new_job_channel',
            name: 'New Delivery Requests',
            importance: AndroidImportance.HIGH,
            sound: 'ringtone',
            vibration: true,
        });

        await notifee.displayNotification({
            title: data?.title || 'New Delivery Request!',
            body: data?.body || 'You have a new job ready for pickup.',
            data: data || {},
            android: {
                channelId,
                importance: AndroidImportance.HIGH,
                category: AndroidCategory.CALL,
                visibility: AndroidVisibility.PUBLIC,
                pressAction: { id: 'default', launchActivity: 'default' },
                fullScreenAction: { id: 'default', launchActivity: 'default' },
            },
        });
    });

    notifee.onBackgroundEvent(async ({ type, detail }) => {
        const { notification } = detail;
        if (type === EventType.PRESS) {
            console.log('User pressed notification in background', notification);
        }
    });
}
