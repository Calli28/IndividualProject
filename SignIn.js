import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Image, TextInput, TouchableOpacity, Animated, Easing } from 'react-native';
import * as Font from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation

export default function SignInScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fontLoaded, setFontLoaded] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const navigation = useNavigation(); // Get the navigation object

    // Animation values
    const logoScale = useRef(new Animated.Value(1)).current;
    const inputOpacity = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;
    const eyeRotation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        async function loadFont() {
            await Font.loadAsync({
                "KrunchBold": require("./fonts/KrunchBold.ttf"),
                "NotoSerif": require("./fonts/NotoSerif.ttf"),
                "GlacialIndifference": require("./fonts/GlacialIndifference.otf"),
                "Poppins": require("./fonts/Poppins.otf"),
            });
            setFontLoaded(true);
        }
        loadFont();
    }, []);

    // Logo bounce animation
    useEffect(() => {
        Animated.sequence([
            Animated.timing(logoScale, {
                toValue: 1.2,
                duration: 1000,
                easing: Easing.elastic(1.5),
                useNativeDriver: true,
            }),
            Animated.timing(logoScale, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    // Fade-in animation for input fields
    useEffect(() => {
        Animated.timing(inputOpacity, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();
    }, []);

    // Glow animation for the arrow
    const glowColor = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 1)'],
    });

    // Eye icon rotation animation
    const eyeRotate = eyeRotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(prev => !prev);
        Animated.timing(eyeRotation, {
            toValue: isPasswordVisible ? 0 : 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    if (!fontLoaded) {
        return null;
    }

    const navigateToSignUp = () => {
        navigation.navigate('SignUp'); // Navigate to SignUpScreen
    };

    return (
        <LinearGradient
            colors={['#1c2120', '#2b2f2e']}
            style={styles.container}
        >
            {/* Logo Section */}
            <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}>
                <Image source={require('./assets/circle.png')} style={styles.glowImage} />
                <Image source={require('./assets/logo.png')} style={styles.logo} />
            </Animated.View>

            {/* Title Section */}
            <View style={styles.realityCheckContainer}>
                <Text style={[styles.title, { fontFamily: "KrunchBold" }]}>REALITY</Text>
                <Text style={[styles.subtitle, { fontFamily: "KrunchBold" }]}>CHECK</Text>
            </View>
            <Text style={[styles.tagline, { fontFamily: "NotoSerif" }]}>No Cap. Just Facts.</Text>

            {/* Input Fields */}
            <Animated.View style={[styles.formContainer, { opacity: inputOpacity }]}>
                <View style={styles.inputContainer}>
                    <Text style={styles.textLabel}>USERNAME</Text>
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
                            <Animated.Image
                                source={isPasswordVisible ? require('./assets/eye-open.png') : require('./assets/eye-close.png')}
                                style={[styles.eyeIcon, { transform: [{ rotate: eyeRotate }] }]}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Forgot Password */}
                <TouchableOpacity style={styles.forgotPasswordButton}>
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.arrowContainer}>
                    <View style={styles.arrowWrapper}>
                        <Text style={styles.getStartedText}>SIGN IN</Text>
                        <Animated.Image
                            source={require("./assets/arrow.png")}
                            style={[styles.arrow, { tintColor: glowColor }]}
                        />
                    </View>
                </TouchableOpacity>
            </Animated.View>

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
                <Text style={styles.signUpText}>NOT A USER?</Text>
                <TouchableOpacity onPress={navigateToSignUp}> {/* Add onPress */}
                    <Text style={styles.signUpLink}>SIGN UP NOW!</Text>
                </TouchableOpacity>
            </View>
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
        top: '8%',
        left: '43%',
        transform: [{ translateX: -50 }, { translateY: -50 }],
        alignItems: "center",
    },
    realityCheckContainer: {
        position: 'absolute',
        top: '24%',
        left: '45%',
        transform: [{ translateX: -50 }, { translateY: -50 }],
        alignItems: "center",
    },
    arrowContainer: {
        position: 'absolute',
        bottom: 40,
        left: '50%',
        transform: [{ translateX: -75 }],
    },
    arrowWrapper: {
        alignItems: 'center',
    },
    arrow: {
        width: 150,
        height: 150,
    },
    glowImage: {
        width: 100,
        height: 100,
        position: "absolute",
    },
    logo: {
        width: 100,
        height: 100,
    },
    title: {
        fontSize: 48,
        fontWeight: "600",
        color: "#3168d8",
        textShadowColor: "#A020F0",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    subtitle: {
        fontSize: 48,
        fontWeight: "600",
        color: "#7900ff",
        textShadowColor: "#A020F0",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
        marginBottom: 290,
    },
    tagline: {
        fontSize: 12,
        color: "#FFFFFF",
        fontFamily: "NotoSerif",
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
        fontFamily: "Poppins",
        color: "#8f8e8e",
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
        fontFamily: "Poppins",
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
    signUpContainer: {
        flexDirection: 'row',
        marginTop: 20,
    },
    signUpText: {
        color: '#8f8e8e',
        fontFamily: "Poppins",
    },
    signUpLink: {
        color: '#3168d8',
        marginLeft: 5,
        fontWeight: 'bold',
        fontFamily: "Poppins",
    },
});
