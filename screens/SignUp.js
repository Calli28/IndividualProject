import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Image, TextInput, TouchableOpacity, Animated, ActivityIndicator, Platform } from 'react-native';
import * as Font from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import LoadingOverlay from '../Components/LoadingOverlay';
import Notification from '../Components/Notification';

export default function SignUpScreen() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fontLoaded, setFontLoaded] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const navigation = useNavigation();
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState({ visible: false, message: '', type: 'success' });
    const spinAnim = useRef(new Animated.Value(0)).current;

    // Animation values
    const inputOpacity = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        async function loadFont() {
            await Font.loadAsync({
                "KrunchBold": require("../fonts/KrunchBold.ttf"),
                "NotoSerif": require("../fonts/NotoSerif.ttf"),
                "GlacialIndifference": require("../fonts/GlacialIndifference.otf"),
                "Poppins": require("../fonts/Poppins.otf"),
            });
            setFontLoaded(true);
        }
        loadFont();

        // Fade-in animation for input fields
        Animated.timing(inputOpacity, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(glowAnim, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    useEffect(() => {
        if (isLoading) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(spinAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            spinAnim.setValue(0);
        }
    }, [isLoading]);

    if (!fontLoaded) {
        return null;
    }

    const togglePasswordVisibility = () => {
        setIsPasswordVisible((prev) => !prev);
    };

    const navigateToLogin = () => {
        navigation.navigate('Login');
    };

    const glowColor = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 1)'],
    });

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    const handleRegister = async () => {
        try {
            if (!firstName || !lastName || !email || !password) {
                setNotification({
                    visible: true,
                    message: 'Please fill in all required fields',
                    type: 'error'
                });
                return;
            }

            setIsLoading(true);

            const response = await fetch('http://192.168.0.170:3000/api/register', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    email,
                    password,
                }),
            });

            const data = await response.json();

            if (response.status === 409) {  // HTTP 409 Conflict - User exists
                setNotification({
                    visible: true,
                    message: 'User already exists. Please sign in.',
                    type: 'error'
                });
                setTimeout(() => {
                    navigation.navigate('Login');
                }, 2000);
            } else if (response.ok) {
                setNotification({
                    visible: true,
                    message: 'Registration successful!',
                    type: 'success'
                });
                setTimeout(() => {
                    navigation.navigate('Login');
                }, 1500);
            } else {
                setNotification({
                    visible: true,
                    message: data.message || 'Registration failed',
                    type: 'error'
                });
            }
        } catch (error) {
            console.error('Registration error:', error);
            setNotification({
                visible: true,
                message: 'Registration failed: Network error',
                type: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LinearGradient colors={['#1c2120', '#2b2f2e']} style={styles.container}>
            <View style={styles.logoContainer}>
                <Image source={require("../assets/circle.png")} style={styles.glowImage} />
                <Image source={require("../assets/logo.png")} style={styles.logo} />
            </View>

            {/* Title Section */}
            <View style={styles.realityCheckContainer}>
                <Text style={[styles.title, { fontFamily: "KrunchBold" }]}>REALITY</Text>
                <Text style={[styles.subtitle, { fontFamily: "KrunchBold" }]}>CHECK</Text>
            </View>
            <Text style={[styles.tagline, { fontFamily: "NotoSerif" }]}>No Cap. Just Facts.</Text>

            {/* Input Fields */}
            <Animated.View style={[styles.formContainer, { opacity: inputOpacity }]}>
                <View style={styles.inputContainer}>
                    <Text style={styles.textLabel}>FIRST NAME</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="First Name"
                        placeholderTextColor="#4d4c4c"
                        value={firstName}
                        onChangeText={setFirstName}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.textLabel}>LAST NAME</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Last Name"
                        placeholderTextColor="#4d4c4c"
                        value={lastName}
                        onChangeText={setLastName}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.textLabel}>EMAIL</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="#4d4c4c"
                        value={email}
                        onChangeText={setEmail}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.textLabel}>PASSWORD</Text>
                    <View style={styles.passwordInputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#4d4c4c"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!isPasswordVisible}
                        />
                        <TouchableOpacity
                            style={styles.eyeIconContainer}
                            onPress={togglePasswordVisibility}
                        >
                            <Image
                                source={
                                    isPasswordVisible
                                        ? require('../assets/eye-open.png')
                                        : require('../assets/eye-close.png')
                                }
                                style={styles.eyeIcon}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Glowing Arrow Button */}
                <TouchableOpacity
                    style={styles.arrowContainer}
                    onPress={handleRegister}
                >
                    <View style={styles.arrowWrapper}>
                        <Text style={styles.getStartedText}>REGISTER</Text>
                        <Animated.Image
                            source={require('../assets/arrow.png')}
                            style={[styles.arrow, { tintColor: glowColor }]}
                        />
                    </View>
                </TouchableOpacity>
            </Animated.View>

            {/* Sign In Link */}
            <View style={styles.signUpContainer}>
                <Text style={styles.signUpText}>IF YOU'RE A USER</Text>
                <TouchableOpacity onPress={navigateToLogin}>
                    <Text style={styles.signUpLink}>SIGN IN!</Text>
                </TouchableOpacity>
            </View>

            <LoadingOverlay 
                visible={isLoading} 
                message="Creating your account..."
            />
            
            <Notification
                visible={notification.visible}
                message={notification.message}
                type={notification.type}
                onClose={() => setNotification({ ...notification, visible: false })}
            />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    logoContainer: {
        position: 'absolute',
        top: '15%',
        left: '55%',
        transform: [{ translateX: -50 }, { translateY: -50 }],
        alignItems: 'center',
    },
    realityCheckContainer: {
        position: 'absolute',
        top: '24%',
        left: '45%',
        transform: [{ translateX: -50 }, { translateY: -50 }],
        alignItems: 'center',
    },
    glowImage: {
        width: 100,
        height: 100,
        position: 'absolute',
    },
    logo: {
        width: 100,
        height: 100,
    },
    title: {
        fontSize: 48,
        fontWeight: '600',
        color: '#3168d8',
        textShadowColor: '#A020F0',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    subtitle: {
        fontSize: 48,
        fontWeight: '600',
        color: '#7900ff',
        textShadowColor: '#A020F0',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
        marginBottom: 290,
    },
    tagline: {
        fontSize: 12,
        color: '#FFFFFF',
        fontFamily: 'NotoSerif',
        position: 'absolute',
        top: '28%',
        left: '55%',
        transform: [{ translateX: -50 }],
    },
    formContainer: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 190,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 15,
    },
    textLabel: {
        fontFamily: 'Poppins',
        color: '#8f8e8e',
        fontSize: 14,
        marginBottom: 5,
        textAlign: 'left',
    },
    input: {
        width: '100%',
        height: 45,
        paddingHorizontal: 10,
        color: '#FFFFFF',
        backgroundColor: '#2b2f2e',
        borderRadius: 5,
        borderColor: '#3168d8',
        borderWidth: 1,
        textAlign: 'left',
    },
    passwordInputContainer: {
        position: 'relative',
        width: '100%',
    },
    eyeIconContainer: {
        position: 'absolute',
        right: 10,
        top: '50%',
        transform: [{ translateY: -12 }],
    },
    eyeIcon: {
        width: 24,
        height: 24,
    },
    arrowContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
    arrowWrapper: {
        alignItems: 'center',
    },
    arrow: {
        width: 150,
        height: 150,
    },
    getStartedText: {
        color: 'white',
        fontSize: 16,
        marginBottom: -90,
        fontFamily: 'Poppins',
        textShadowColor: 'white',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 5,
    },
    signUpContainer: {
        flexDirection: 'row',
        marginTop: 20,
    },
    signUpText: {
        color: '#8f8e8e',
        fontFamily: 'Poppins',
    },
    signUpLink: {
        color: '#3168d8',
        marginLeft: 5,
        fontWeight: 'bold',
        fontFamily: 'Poppins',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },
    loadingLogo: {
        width: 100,
        height: 100,
        marginBottom: 20,
    },
    loadingText: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'Poppins',
        marginTop: 10,
    },
});