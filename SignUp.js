import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TextInput, TouchableOpacity } from 'react-native';
import * as Font from 'expo-font';

export default function SignUpScreen() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fontLoaded, setFontLoaded] = useState(false);

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

    if (!fontLoaded) {
        return null;
    }

    return (
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                <Image source={require('./assets/circle.png')} style={styles.glowImage} />
                <Image source={require('./assets/logo.png')} style={styles.logo} />
            </View>

            <View style={styles.realityCheckContainer}>
                <Text style={[styles.title, { fontFamily: "KrunchBold" }]}>REALITY</Text>
                <Text style={[styles.subtitle, { fontFamily: "KrunchBold" }]}>CHECK</Text>
            </View>

            <Text style={[styles.tagline, { fontFamily: "NotoSerif" }]}>No Cap. Just Facts.</Text>

            <View style={styles.inputContainer}>
                <Text style={[styles.label, { fontFamily: "Poppins" }]}>FIRST NAME</Text>
                <View style={styles.glowBorder} />
                <TextInput
                    style={styles.input}
                    placeholder="First Name"
                    placeholderTextColor="#4d4c4c"
                    value={firstName}
                    onChangeText={setFirstName}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={[styles.label, { fontFamily: "Poppins" }]}>LAST NAME</Text>
                <View style={styles.glowBorder} />
                <TextInput
                    style={styles.input}
                    placeholder="Last Name"
                    placeholderTextColor="#4d4c4c"
                    value={lastName}
                    onChangeText={setLastName}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={[styles.label, { fontFamily: "Poppins" }]}>EMAIL (OPTIONAL)</Text>
                <View style={styles.glowBorder} />
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#4d4c4c"
                    value={email}
                    onChangeText={setEmail}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={[styles.label, { fontFamily: "Poppins" }]}>PASSWORD</Text>
                <View style={styles.glowBorder} />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#4d4c4c"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
            </View>

            <TouchableOpacity style={styles.registerButton}>
                <Text style={styles.registerText}>REGISTER</Text>
            </TouchableOpacity>

            <View style={styles.signInContainer}>
                <Text style={styles.signInText}>IF YOU'RE A USER</Text>
                <TouchableOpacity>
                    <Text style={styles.signInLink}>SIGN IN!</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1c2120',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    logoContainer: {
        position: 'absolute',
        top: '15%',
        alignItems: 'center',
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
    realityCheckContainer: {
        position: 'absolute',
        top: '41%',
        alignItems: 'center',
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
    },
    tagline: {
        fontSize: 12,
        color: "#FFFFFF",
        position: 'absolute',
        top: '30%',
    },
    inputContainer: {
        width: '80%',
        marginTop: 20,
        alignItems: 'flex-start',
        position: 'relative',
    },
    label: {
        color: '#8f8e8e',
        marginBottom: 5,
    },
    input: {
        width: '100%',
        height: 40,
        paddingHorizontal: 10,
        color: '#FFFFFF',
        backgroundColor: 'transparent',
    },
    glowBorder: {
        position: 'absolute',
        width: '100%',
        height: 40,
        borderLeftWidth: 2,
        borderRightWidth: 2,
        borderColor: '#3168d8',
        shadowColor: '#3168d8',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 10,
        borderTopWidth: 0,
        borderBottomWidth: 0,
    },
    registerButton: {
        width: '80%',
        height: 50,
        backgroundColor: '#3168d8',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 30,
    },
    registerText: {
        color: '#FFFFFF',
        fontSize: 16,
    },
    signInContainer: {
        flexDirection: 'row',
        marginTop: 20,
    },
    signInText: {
        color: '#FFFFFF',
    },
    signInLink: {
        color: '#3168d8',
        marginLeft: 5,
    },
});