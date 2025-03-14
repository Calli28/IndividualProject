import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { View, Platform, Dimensions } from 'react-native';
import HomePage from './screens/HomePage';
import URLSearchPage from './screens/URLSearchPage';

const Tab = createBottomTabNavigator();
const screenWidth = Dimensions.get('window').width;

const BookmarksScreen = () => <View style={{ flex: 1, backgroundColor: '#1c2120' }} />;
const NotificationsScreen = () => <View style={{ flex: 1, backgroundColor: '#1c2120' }} />;
const ProfileScreen = () => <View style={{ flex: 1, backgroundColor: '#1c2120' }} />;

export default function App() {
    return (
        <NavigationContainer>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    tabBarIcon: ({ focused, color, size }) => {
                        let iconName;

                        switch (route.name) {
                            case 'Home':
                                iconName = 'home';
                                break;
                            case 'URL Search':
                                iconName = 'search';
                                break;
                            case 'Notifications':
                                iconName = 'bell';
                                break;
                            case 'Profile':
                                iconName = 'user';
                                break;
                        }

                        return (
                            <View style={{
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: focused ? 35 : 25,
                                width: focused ? 70 : 50,
                                height: focused ? 70 : 50,
                                backgroundColor: focused ? '#FFFFFF' : 'transparent',
                                marginBottom: focused ? -15 : 4,
                                marginTop: focused ? -25 : 0,
                                shadowColor: focused ? '#000' : 'transparent',
                                shadowOffset: {
                                    width: 0,
                                    height: 4,
                                },
                                shadowOpacity: focused ? 0.3 : 0,
                                shadowRadius: 6,
                                elevation: focused ? 8 : 0,
                                borderWidth: focused ? 3 : 0,
                                borderColor: '#1c2120',
                            }}>
                                <Feather 
                                    name={iconName} 
                                    size={focused ? 32 : 24} 
                                    color={focused ? '#3168d8' : '#000000'} 
                                    style={{
                                        opacity: focused ? 1 : 0.7
                                    }}
                                />
                            </View>
                        );
                    },
                    tabBarActiveTintColor: '#3168d8',
                    tabBarInactiveTintColor: '#000000',
                    tabBarStyle: {
                        backgroundColor: '#FFFFFF',
                        position: 'absolute',
                        bottom: 20,
                        left: 20,
                        right: 20,
                        elevation: 4,
                        borderRadius: 25,
                        height: 75,
                        paddingBottom: 15,
                        paddingTop: 15,
                        shadowColor: '#000',
                        shadowOffset: {
                            width: 0,
                            height: 4,
                        },
                        shadowOpacity: 0.25,
                        shadowRadius: 8,
                        borderTopWidth: 0,
                    },
                    tabBarLabelStyle: {
                        fontFamily: 'Poppins',
                        fontSize: 11,
                        fontWeight: '600',
                        marginTop: focused => focused ? 15 : 0,
                        marginBottom: 8,
                    },
                    tabBarItemStyle: {
                        paddingTop: 0,
                        height: 75,
                    },
                    headerShown: false,
                    tabBarShowLabel: true,
                })}
            >
                <Tab.Screen 
                    name="Home" 
                    component={HomePage}
                    options={{
                        tabBarLabel: 'HOME',
                    }}
                />
                <Tab.Screen 
                    name="URL Search" 
                    component={URLSearchPage}
                    options={{
                        tabBarLabel: 'URL CHECK',
                    }}
                />
                <Tab.Screen 
                    name="Notifications" 
                    component={NotificationsScreen}
                    options={{
                        tabBarLabel: 'ALERTS',
                    }}
                />
                <Tab.Screen 
                    name="Profile" 
                    component={ProfileScreen}
                    options={{
                        tabBarLabel: 'PROFILE',
                    }}
                />
            </Tab.Navigator>
        </NavigationContainer>
    );
}