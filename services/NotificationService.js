import AsyncStorage from '@react-native-async-storage/async-storage';

class NotificationService {
    constructor() {
        this.NOTIFICATION_TYPES = {
            FAKE_NEWS_ALERT: 'FAKE_NEWS_ALERT',
            SUSPICIOUS_NEWS_ALERT: 'SUSPICIOUS_NEWS_ALERT',
            CREDIBILITY_ALERT: 'CREDIBILITY_ALERT',
            NEW_FEATURE_ALERT: 'NEW_FEATURE_ALERT'
        };
    }

    async getNotifications() {
        try {
            const notifications = await AsyncStorage.getItem('notifications');
            return notifications ? JSON.parse(notifications) : [];
        } catch (error) {
            console.error('Error getting notifications:', error);
            return [];
        }
    }

    async addNotification(notification) {
        try {
            const notifications = await this.getNotifications();
            const newNotification = {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                isRead: false,
                ...notification
            };
            
            notifications.unshift(newNotification);
            await AsyncStorage.setItem('notifications', JSON.stringify(notifications));
            return newNotification;
        } catch (error) {
            console.error('Error adding notification:', error);
            throw error;
        }
    }

    async markAsRead(notificationId) {
        try {
            const notifications = await this.getNotifications();
            const updatedNotifications = notifications.map(notification =>
                notification.id === notificationId
                    ? { ...notification, isRead: true }
                    : notification
            );
            await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
            return updatedNotifications;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }

    async addCredibilityNotification(article, score) {
        let type, title, message;

        if (score < 30) {
            type = this.NOTIFICATION_TYPES.FAKE_NEWS_ALERT;
            title = 'Fake News Alert';
            message = `The article "${article.title}" has been identified as potential fake news.`;
        } else if (score < 50) {
            type = this.NOTIFICATION_TYPES.SUSPICIOUS_NEWS_ALERT;
            title = 'Suspicious Content Alert';
            message = `The article "${article.title}" contains suspicious content. Please verify from other sources.`;
        } else if (score < 60) {
            type = this.NOTIFICATION_TYPES.CREDIBILITY_ALERT;
            title = 'Low Credibility Alert';
            message = `The article "${article.title}" has a low credibility score. Consider fact-checking.`;
        } else {
            return; // Don't create notification for higher scores
        }

        return this.addNotification({
            type,
            title,
            message,
            articleUrl: article.url,
            credibilityScore: score
        });
    }

    async clearAll() {
        try {
            await AsyncStorage.setItem('notifications', JSON.stringify([]));
        } catch (error) {
            console.error('Error clearing notifications:', error);
            throw error;
        }
    }

    getNotificationIcon(type) {
        switch (type) {
            case this.NOTIFICATION_TYPES.FAKE_NEWS_ALERT:
                return 'alert-circle';
            case this.NOTIFICATION_TYPES.SUSPICIOUS_NEWS_ALERT:
                return 'alert-triangle';
            case this.NOTIFICATION_TYPES.CREDIBILITY_ALERT:
                return 'info';
            case this.NOTIFICATION_TYPES.NEW_FEATURE_ALERT:
                return 'gift';
            default:
                return 'bell';
        }
    }

    getNotificationColor(type) {
        switch (type) {
            case this.NOTIFICATION_TYPES.FAKE_NEWS_ALERT:
                return '#FF4842';
            case this.NOTIFICATION_TYPES.SUSPICIOUS_NEWS_ALERT:
                return '#FFA726';
            case this.NOTIFICATION_TYPES.CREDIBILITY_ALERT:
                return '#FFC107';
            case this.NOTIFICATION_TYPES.NEW_FEATURE_ALERT:
                return '#4CAF50';
            default:
                return '#666666';
        }
    }
}

// Export a singleton instance
export default new NotificationService(); 