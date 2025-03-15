import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { View, Text, StyleSheet, Platform } from 'react-native';
import HomePage from './screens/HomePage';
import SignInScreen from './screens/SignIn';
import SignUpScreen from './screens/SignUp';
import OnboardingScreen from './screens/Onboarding';
import NotificationsPage from './screens/NotificationsPage';
import SavedArticlesPage from './screens/SavedArticlesPage';
import ProfilePage from './screens/ProfilePage';
import { SavedArticlesProvider } from './context/SavedArticlesContext';
import { createStackNavigator } from '@react-navigation/stack';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Create ToastContext
export const ToastContext = React.createContext();

// Toast Provider Component
const ToastProvider = ({ children }) => {
    const [toast, setToast] = React.useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    return (
        <ToastContext.Provider value={showToast}>
            {children}
            {toast && (
                <View style={[styles.toast, toast.type === 'error' && styles.toastError]}>
                    <Text style={styles.toastText}>{toast.message}</Text>
                </View>
            )}
        </ToastContext.Provider>
    );
};

// Auth Navigator
function AuthStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
        </Stack.Navigator>
    );
}

export default function App() {
    return (
        <SavedArticlesProvider>
            <ToastProvider>
                <NavigationContainer>
                    <Tab.Navigator
                        screenOptions={{
                            headerShown: false,
                            tabBarStyle: styles.tabBar,
                            tabBarShowLabel: false,
                        }}
                    >
                        <Tab.Screen 
                            name="Home" 
                            component={HomePage}
                            options={{
                                tabBarIcon: ({ focused }) => (
                                    <View style={styles.iconContainer}>
                                        <Feather 
                                            name="home" 
                                            size={24} 
                                            color={focused ? '#3168d8' : '#666666'} 
                                        />
                                        <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
                                            HOME
                                        </Text>
                                    </View>
                                ),
                            }}
                        />
                        <Tab.Screen 
                            name="Notifications" 
                            component={NotificationsPage}
                            options={{
                                tabBarIcon: ({ focused }) => (
                                    <View style={styles.iconContainer}>
                                        <Feather 
                                            name="bell" 
                                            size={24} 
                                            color={focused ? '#3168d8' : '#666666'} 
                                        />
                                        <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
                                            ALERTS
                                        </Text>
                                    </View>
                                ),
                            }}
                        />
                        <Tab.Screen 
                            name="SavedArticles" 
                            component={SavedArticlesPage}
                            options={{
                                tabBarIcon: ({ focused }) => (
                                    <View style={styles.iconContainer}>
                                        <Feather 
                                            name="bookmark" 
                                            size={24} 
                                            color={focused ? '#3168d8' : '#666666'} 
                                        />
                                        <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
                                            SAVED
                                        </Text>
                                    </View>
                                ),
                            }}
                        />
                        <Tab.Screen 
                            name="Profile" 
                            component={ProfilePage}
                            options={{
                                tabBarIcon: ({ focused }) => (
                                    <View style={styles.iconContainer}>
                                        <Feather 
                                            name="user" 
                                            size={24} 
                                            color={focused ? '#3168d8' : '#666666'} 
                                        />
                                        <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
                                            PROFILE
                                        </Text>
                                    </View>
                                ),
                            }}
                        />
                    </Tab.Navigator>
                </NavigationContainer>
            </ToastProvider>
        </SavedArticlesProvider>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        height: Platform.OS === 'ios' ? 90 : 75,
        backgroundColor: '#1c2120',
        borderTopWidth: 0,
        elevation: 25,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: Platform.OS === 'ios' ? 30 : 15,
        paddingTop: 15,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
    },
    tabLabel: {
        fontSize: 11,
        marginTop: 4,
        fontFamily: 'Poppins',
        color: '#666666',
    },
    tabLabelFocused: {
        color: '#3168d8',
        fontWeight: '600',
    },
    toast: {
        position: 'absolute',
        bottom: 100,
        left: 20,
        right: 20,
        backgroundColor: '#4CAF50',
        padding: 16,
        borderRadius: 8,
        elevation: 5,
    },
    toastError: {
        backgroundColor: '#f44336',
    },
    toastText: {
        color: '#FFFFFF',
        textAlign: 'center',
        fontSize: 14,
        fontFamily: 'Poppins',
    },
});