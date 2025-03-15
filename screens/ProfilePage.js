import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Switch,
    ScrollView,
    Platform,
    Image,
    useColorScheme
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfilePage() {
    const systemColorScheme = useColorScheme();
    const [notifications, setNotifications] = useState(true);
    const [offlineMode, setOfflineMode] = useState(false);
    const [darkMode, setDarkMode] = useState(systemColorScheme === 'dark');

    const userStats = {
        articlesAnalyzed: 145,
        fakeNewsDetected: 37,
        alertsSent: 28,
        accuracy: 94
    };

    const toggleDarkMode = async (value) => {
        setDarkMode(value);
        await AsyncStorage.setItem('darkMode', value.toString());
    };

    // Get theme colors based on mode
    const theme = {
        background: darkMode ? '#1c2120' : '#FFFFFF',
        text: darkMode ? '#FFFFFF' : '#1A1A1A',
        subText: darkMode ? '#CCCCCC' : '#666666',
        card: darkMode ? 'rgba(255,255,255,0.08)' : '#F8F9FA',
        border: darkMode ? 'rgba(255,255,255,0.1)' : '#EEEEEE',
        accent: '#3168d8',
        switchTrack: darkMode ? '#666666' : '#E0E0E0',
        switchThumb: darkMode ? '#FFFFFF' : '#3168d8',
    };

    const renderSettingItem = (icon, title, value, onToggle) => (
        <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
            <View style={styles.settingLeft}>
                <Feather name={icon} size={22} color={theme.subText} />
                <Text style={[styles.settingText, { color: theme.text }]}>{title}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: theme.switchTrack, true: theme.accent }}
                thumbColor={value ? theme.switchThumb : '#f4f3f4'}
                ios_backgroundColor={theme.switchTrack}
            />
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
                </View>

                <View style={[styles.profileSection, { backgroundColor: theme.card }]}>
                    <Image
                        source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }}
                        style={styles.profileImage}
                    />
                    <Text style={[styles.userName, { color: theme.text }]}>Sarah Johnson</Text>
                    <Text style={[styles.userEmail, { color: theme.subText }]}>sarah.johnson@example.com</Text>
                </View>

                <View style={styles.statsContainer}>
                    {Object.entries(userStats).map(([key, value], index) => (
                        <View key={key} style={[styles.statItem, { backgroundColor: theme.card }]}>
                            <Text style={[styles.statNumber, { color: theme.accent }]}>{value}</Text>
                            <Text style={[styles.statLabel, { color: theme.subText }]}>
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                            </Text>
                        </View>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Settings</Text>
                    {renderSettingItem('bell', 'Notifications', notifications, setNotifications)}
                    {renderSettingItem('download', 'Offline Mode', offlineMode, setOfflineMode)}
                    {renderSettingItem('moon', 'Dark Mode', darkMode, toggleDarkMode)}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <TouchableOpacity style={styles.aboutItem}>
                        <View style={styles.aboutLeft}>
                            <Feather name="info" size={22} color="#666666" />
                            <Text style={styles.aboutText}>About RealityCheck</Text>
                        </View>
                        <Feather name="chevron-right" size={22} color="#666666" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.aboutItem}>
                        <View style={styles.aboutLeft}>
                            <Feather name="shield" size={22} color="#666666" />
                            <Text style={styles.aboutText}>Privacy Policy</Text>
                        </View>
                        <Feather name="chevron-right" size={22} color="#666666" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.aboutItem}>
                        <View style={styles.aboutLeft}>
                            <Feather name="help-circle" size={22} color="#666666" />
                            <Text style={styles.aboutText}>Help & Support</Text>
                        </View>
                        <Feather name="chevron-right" size={22} color="#666666" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.logoutButton}>
                    <Feather name="log-out" size={20} color="#FF4842" />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingTop: Platform.OS === 'android' ? 40 : 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        fontFamily: 'Poppins',
    },
    profileSection: {
        alignItems: 'center',
        padding: 20,
        marginHorizontal: 20,
        borderRadius: 16,
        marginBottom: 20,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
    },
    userName: {
        fontSize: 24,
        fontWeight: '600',
        fontFamily: 'Poppins',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        fontFamily: 'Poppins',
    },
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 10,
        justifyContent: 'space-between',
    },
    statItem: {
        width: '48%',
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '700',
        fontFamily: 'Poppins',
    },
    statLabel: {
        fontSize: 12,
        fontFamily: 'Poppins',
        marginTop: 5,
        textTransform: 'capitalize',
    },
    section: {
        marginHorizontal: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        fontFamily: 'Poppins',
        marginBottom: 15,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingText: {
        fontSize: 16,
        fontFamily: 'Poppins',
        marginLeft: 15,
    },
    aboutItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    aboutLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    aboutText: {
        fontSize: 16,
        color: '#FFFFFF',
        fontFamily: 'Poppins',
        marginLeft: 15,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 20,
        marginVertical: 30,
        padding: 15,
        backgroundColor: 'rgba(255,72,66,0.1)',
        borderRadius: 12,
    },
    logoutText: {
        fontSize: 16,
        color: '#FF4842',
        fontFamily: 'Poppins',
        fontWeight: '600',
        marginLeft: 10,
    },
}); 