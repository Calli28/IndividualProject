import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Image, TextInput, TouchableOpacity, Animated } from 'react-native';
import * as Font from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import GlowingArrowButton from '../assets/arrow.png';
import bcrypt from 'react-native-bcrypt';
import LoadingOverlay from '../Components/LoadingOverlay';
import Notification from '../Components/Notification';

export default function SignInScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fontLoaded, setFontLoaded] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState({ visible: false, message: '', type: 'success' });
    const navigation = useNavigation();

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

    if (!fontLoaded) {
        return null;
    }

    const togglePasswordVisibility = () => {
        setIsPasswordVisible((prev) => !prev);
    };

    const navigateToSignUp = () => {
        navigation.navigate('SignUp');
    };

    const glowColor = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 1)'],
    });

    const handleSignIn = async () => {
        try {
            if (!email || !password) {
                setNotification({
                    visible: true,
                    message: 'Please fill in all fields',
                    type: 'error'
                });
                return;
            }

            setIsLoading(true);
            console.log('Attempting to login...');

            const response = await fetch('http://192.168.0.170:3000/api/login', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            });

            console.log('Response status:', response.status);
            
            const data = await response.json();
            console.log('Response data:', data);

            if (response.ok) {
                setNotification({
                    visible: true,
                    message: 'Login successful!',
                    type: 'success'
                });
                setTimeout(() => {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'HomePage' }],
                    });
                }, 1500);
            } else {
                setNotification({
                    visible: true,
                    message: data.message || 'Invalid credentials',
                    type: 'error'
                });
            }
        } catch (error) {
            console.error('Login error:', error);
            setNotification({
                visible: true,
                message: 'Login failed: Network error',
                type: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#1c2120', '#2b2f2e']}
            style={styles.container}
        >
            {/* Logo Section */}
            <View style={styles.logoContainer}>
                <Image source={require('../assets/circle.png')} style={styles.glowImage} />
                <Image source={require('../assets/logo.png')} style={styles.logo} />
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
                    <Text style={styles.textLabel}>EMAIL</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Email / Phone"
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

                {/* Forgot Password */}
                <TouchableOpacity style={styles.forgotPasswordButton}>
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                {/* Glowing Arrow Button */}
                <TouchableOpacity
                    style={styles.arrowContainer}
                    onPress={handleSignIn}
                >
                    <View style={styles.arrowWrapper}>
                        <Text style={styles.getStartedText}>SIGN IN</Text>
                        <Animated.Image
                            source={require('../assets/arrow.png')}
                            style={[styles.arrow, { tintColor: glowColor }]}
                        />
                    </View>
                </TouchableOpacity>
            </Animated.View>

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
                <Text style={styles.signUpText}>NOT A USER?</Text>
                <TouchableOpacity onPress={navigateToSignUp}>
                    <Text style={styles.signUpLink}>SIGN UP NOW!</Text>
                </TouchableOpacity>
            </View>

            <LoadingOverlay 
                visible={isLoading} 
                message="Signing in..."
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
        top: '14%',
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
        marginTop: 70,
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
    forgotPasswordButton: {
        alignSelf: 'flex-end',
        marginBottom: 20,
    },
    forgotPasswordText: {
        color: '#8f8e8e',
        fontSize: 14,
        fontFamily: 'Poppins',
    },
    registerButton: {
        width: '100%',
        height: 50,
        backgroundColor: '#3168d8',
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    registerText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'Poppins',
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
    arrowContainer: {
        alignItems: 'center',
        marginTop: 20,
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
});