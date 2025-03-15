import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Alert,
    SafeAreaView
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotificationsScreen = ({ navigation }) => {
    const [notifications, setNotifications] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadNotifications = async () => {
        try {
            const storedNotifications = await AsyncStorage.getItem('notifications');
            if (storedNotifications) {
                const parsedNotifications = JSON.parse(storedNotifications);
                // Sort notifications by timestamp, newest first
                const sortedNotifications = parsedNotifications.sort((a, b) => 
                    new Date(b.timestamp) - new Date(a.timestamp)
                );
                setNotifications(sortedNotifications);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
            Alert.alert('Error', 'Failed to load notifications');
        }
    };

    useEffect(() => {
        loadNotifications();
        const unsubscribe = navigation.addListener('focus', () => {
            loadNotifications();
        });
        return unsubscribe;
    }, [navigation]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadNotifications();
        setRefreshing(false);
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor(diff / (1000 * 60));

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'FAKE_NEWS_ALERT':
                return 'alert-circle';
            case 'SUSPICIOUS_NEWS_ALERT':
                return 'alert-triangle';
            case 'CREDIBILITY_ALERT':
                return 'info';
            case 'NEW_FEATURE_ALERT':
                return 'gift';
            default:
                return 'bell';
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'FAKE_NEWS_ALERT':
                return '#FF4842';
            case 'SUSPICIOUS_NEWS_ALERT':
                return '#FFA726';
            case 'CREDIBILITY_ALERT':
                return '#FFC107';
            case 'NEW_FEATURE_ALERT':
                return '#4CAF50';
            default:
                return '#666666';
        }
    };

    const handleNotificationPress = async (notification) => {
        try {
            const notifications = await AsyncStorage.getItem('notifications');
            if (notifications) {
                const parsedNotifications = JSON.parse(notifications);
                const updatedNotifications = parsedNotifications.map(n => 
                    n.id === notification.id ? { ...n, isRead: true } : n
                );
                await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
                setNotifications(updatedNotifications);
            }
            
            if (notification.articleUrl) {
                navigation.navigate('ArticleView', { url: notification.articleUrl });
            }
        } catch (error) {
            console.error('Error handling notification:', error);
            Alert.alert('Error', 'Failed to update notification');
        }
    };

    const renderNotification = ({ item }) => (
        <TouchableOpacity 
            style={[
                styles.notificationItem,
                !item.isRead && styles.unreadNotification
            ]}
            onPress={() => handleNotificationPress(item)}
        >
            <View style={[
                styles.iconContainer, 
                { backgroundColor: getNotificationColor(item.type) + '15' }
            ]}>
                <Feather 
                    name={getNotificationIcon(item.type)} 
                    size={22} 
                    color={getNotificationColor(item.type)} 
                />
            </View>
            <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                    <Text style={styles.notificationTitle}>
                        {item.title}
                    </Text>
                    <Text style={styles.notificationDate}>
                        {formatTimestamp(item.timestamp)}
                    </Text>
                </View>
                <Text style={styles.notificationMessage}>
                    {item.message}
                </Text>
                {item.credibilityScore !== undefined && (
                    <View style={styles.notificationFooter}>
                        <View style={styles.credibilityBadge}>
                            <Text style={styles.credibilityText}>
                                Credibility Score: {item.credibilityScore}
                            </Text>
                        </View>
                    </View>
                )}
            </View>
            {!item.isRead && <View style={styles.unreadDot} />}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Notifications</Text>
            </View>
            <FlatList
                data={notifications}
                renderItem={renderNotification}
                keyExtractor={(item) => item.id}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#3168D8"
                    />
                }
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Feather name="bell-off" size={48} color="#666666" />
                        <Text style={styles.emptyText}>No notifications yet</Text>
                    </View>
                )}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1c2120',
    },
    header: {
        padding: 20,
        paddingTop: 40,
        backgroundColor: '#1c2120',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: 'Poppins',
    },
    notificationItem: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        marginHorizontal: 12,
        marginVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)'
    },
    unreadNotification: {
        backgroundColor: 'rgba(49, 104, 216, 0.15)',
        borderColor: 'rgba(49, 104, 216, 0.3)'
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14
    },
    notificationContent: {
        flex: 1,
        paddingRight: 10
    },
    notificationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.2,
        flex: 1,
        marginRight: 8
    },
    notificationDate: {
        fontSize: 12,
        color: '#666666',
        fontWeight: '500'
    },
    notificationMessage: {
        fontSize: 14,
        color: '#CCCCCC',
        marginBottom: 8,
        lineHeight: 20
    },
    notificationFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8
    },
    credibilityBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: 'rgba(49, 104, 216, 0.15)'
    },
    credibilityText: {
        fontSize: 12,
        color: '#3168D8',
        fontWeight: '600'
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#3168D8',
        position: 'absolute',
        top: 14,
        right: 14,
        borderWidth: 2,
        borderColor: '#1c2120'
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666666',
        fontWeight: '500',
        letterSpacing: 0.3
    }
});

export default NotificationsScreen;