import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, Animated, Dimensions, TouchableOpacity } from 'react-native';
import * as Font from 'expo-font';

export default function OnboardingScreen({ navigation }) { // Receive navigation prop
    const [fontLoaded, setFontLoaded] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        async function loadFont() {
            await Font.loadAsync({
                "KrunchBold": require("../fonts/KrunchBold.ttf"),
                "NotoSerif": require("../fonts/NotoSerif.ttf"),
                "GlacialIndifference": require("../fonts/GlacialIndifference.otf"),
                "Poppins": require("../fonts/Poppins.otf"), // Add Poppins font
            });
            setFontLoaded(true);
        }

        loadFont();
    }, [fontLoaded]);

    useEffect(() => {
        if (currentPage === 2) {
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
        } else {
            glowAnim.setValue(0);
        }
    }, [currentPage]);

    if (!fontLoaded) {
        return null;
    }

    const handleScroll = Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        {
            useNativeDriver: false, listener: (event) => {
                const page = Math.round(event.nativeEvent.contentOffset.x / width);
                setCurrentPage(page);
            }
        }
    );

    const width = Dimensions.get('window').width;

    const navigateToLogin = () => {
        navigation.navigate('Login'); // Navigate to LoginScreen
    };

    const glowColor = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 1)'],
    });

    return (
        <View style={styles.container}>
            <Animated.ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            >
                <View style={{ width }}> {/* First Page */}
                    <View style={styles.logoContainer}>
                        <Image source={require("../assets/circle.png")} style={styles.glowImage} />
                        <Image source={require("../assets/logo.png")} style={styles.logo} />
                    </View>

                    <View style={styles.realityCheckContainer}>
                        <Text style={[styles.title, { fontFamily: "KrunchBold" }]}>REALITY</Text>
                        <Text style={[styles.subtitle, { fontFamily: "KrunchBold" }]}>CHECK</Text>
                    </View>

                    <Text style={styles.tagline}>No Cap. Just Facts.</Text>

                    <View style={styles.magnifierAndDescriptionContainer}>
                        <Text style={styles.description}>Quickly identify fake news</Text>
                        <Image source={require("../assets/magnify.png")} style={styles.magnifier} />
                        <Text style={styles.description}>with advanced AI detection</Text>
                    </View>
                </View>

                <View style={{ width }}> {/* Second Page */}
                    <View style={styles.logoContainer}>
                        <Image source={require("../assets/circle.png")} style={styles.glowImage} />
                        <Image source={require("../assets/logo.png")} style={styles.logo} />
                    </View>

                    <View style={styles.realityCheckContainer}>
                        <Text style={[styles.title, { fontFamily: "KrunchBold" }]}>REALITY</Text>
                        <Text style={[styles.subtitle, { fontFamily: "KrunchBold" }]}>CHECK</Text>
                    </View>

                    <Text style={styles.tagline}>No Cap. Just Facts.</Text>

                    <View style={styles.magnifierAndDescriptionContainer}>
                        <Text style={styles.description}>Analyze news sources</Text>
                        <Image source={require("../assets/tick.png")} style={styles.magnifier} />
                        <Text style={styles.description}>in real-time for accuracy</Text>
                    </View>
                </View>

                <View style={{ width }}> {/* Third Page */}
                    <View style={styles.logoContainer}>
                        <Image source={require("../assets/circle.png")} style={styles.glowImage} />
                        <Image source={require("../assets/logo.png")} style={styles.logo} />
                    </View>

                    <View style={styles.realityCheckContainer}>
                        <Text style={[styles.title, { fontFamily: "KrunchBold" }]}>REALITY</Text>
                        <Text style={[styles.subtitle, { fontFamily: "KrunchBold" }]}>CHECK</Text>
                    </View>

                    <Text style={styles.tagline}>No Cap. Just Facts.</Text>

                    <View style={styles.magnifierAndDescriptionContainer}>
                        <Text style={styles.description}>Stay informed</Text>
                        <View style={styles.notifImageContainer}>
                            <Image source={require("../assets/notif.png")} style={styles.notifMagnifier} />
                        </View>
                        <Text style={styles.description}>and stop the spread of misinformation</Text>
                    </View>

                    <TouchableOpacity style={styles.arrowContainer} onPress={navigateToLogin}>
                        <View style={styles.arrowWrapper}>
                            <Text style={styles.getStartedText}>GET STARTED</Text>
                            <Animated.Image
                                source={require("../assets/arrow.png")}
                                style={[styles.arrow, { tintColor: glowColor }]}
                            />
                        </View>
                    </TouchableOpacity>
                </View>
            </Animated.ScrollView>

            {currentPage < 2 && (
                <View style={styles.indicators}>
                    <View style={[styles.indicator, currentPage === 0 && styles.activeIndicator]} />
                    <View style={[styles.indicator, currentPage === 1 && styles.activeIndicator]} />
                    <View style={[styles.indicator, currentPage === 2 && styles.activeIndicator]} />
                </View>
            )}
            <StatusBar style="light" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#1c2120",
    },
    logoContainer: {
        position: 'absolute',
        top: '15%',
        left: '50%',
        transform: [
            { translateX: -50 },
            { translateY: -50 }
        ],
        alignItems: "center",
    },
    realityCheckContainer: {
        position: 'absolute',
        top: '24%',
        left: '40%',
        transform: [
            { translateX: -50 },
            { translateY: -50 }
        ],
        alignItems: "center",
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
    magnifierAndDescriptionContainer: {
        alignItems: "center",
        flexDirection: 'column',
        justifyContent: 'center',
        marginTop: 150,
        flex: 1,
    },
    magnifier: {
        width: 150,
        height: 150,
    },
    notifMagnifier: {
        width: 100,
        height: 100,
        left: 10,
    },
    notifImageContainer: {
        marginTop: 20,
        marginBottom: 20
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
        top: '29%',
        left: '50%',
        transform: [
            { translateX: -50 }
        ],
    },
    description: {
        fontSize: 20,
        color: "rgba(255, 255, 255, 0.8)",
        textAlign: "center",
        marginBottom: 10,
        fontFamily: "GlacialIndifference",
        textShadowColor: "#0901f3",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 15,
    },
    indicators: {
        flexDirection: "row",
        position: 'absolute',
        bottom: 40,
        left: '50%',
        transform: [
            { translateX: -50 }
        ],
    },
    indicator: {
        width: 15,
        height: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#FFFFFF",
        marginHorizontal: 5,
    },
    activeIndicator: {
        backgroundColor: 'white',
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
    getStartedText: {
        color: 'white',
        fontSize: 16,
        marginBottom: -90, // Adjust this to position the text above the arrow
        fontFamily: 'Poppins',
        textShadowColor: 'white', // White glow color
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 5, // Adjust glow radius as needed
    },
});