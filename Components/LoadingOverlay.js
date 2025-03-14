import React from 'react';
import { StyleSheet, View, Modal, Image, Text, Animated } from 'react-native';

export default function LoadingOverlay({ visible, message }) {
    const [spinValue] = React.useState(new Animated.Value(0));

    React.useEffect(() => {
        if (visible) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(spinValue, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [visible]);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    if (!visible) return null;

    return (
        <Modal transparent visible={visible}>
            <View style={styles.container}>
                <View style={styles.content}>
                    <Animated.Image
                        source={require('../assets/logo.png')}
                        style={[styles.logo, { transform: [{ rotate: spin }] }]}
                    />
                    <Text style={styles.message}>{message || 'Loading...'}</Text>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        backgroundColor: '#1c2120',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    logo: {
        width: 80,
        height: 80,
        marginBottom: 15,
    },
    message: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: 'Poppins',
        textAlign: 'center',
    },
});