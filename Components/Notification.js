import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, Animated } from 'react-native';

export default function Notification({ visible, message, type = 'success', onClose }) {
    const slideAnim = React.useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
            }).start();

            // Auto hide after 3 seconds
            const timer = setTimeout(() => {
                handleClose();
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    const handleClose = () => {
        Animated.timing(slideAnim, {
            toValue: -100,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            onClose && onClose();
        });
    };

    if (!visible) return null;

    return (
        <Modal transparent visible={visible}>
            <Animated.View 
                style={[
                    styles.container,
                    { transform: [{ translateY: slideAnim }] }
                ]}
            >
                <View style={[styles.content, styles[type]]}>
                    <Text style={styles.message}>{message}</Text>
                    <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                        <Text style={styles.closeText}>×</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 8,
        margin: 10,
        marginTop: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        minWidth: '90%',
    },
    success: {
        backgroundColor: '#4CAF50',
    },
    error: {
        backgroundColor: '#f44336',
    },
    message: {
        color: '#ffffff',
        fontSize: 16,
        fontFamily: 'Poppins',
        flex: 1,
    },
    closeButton: {
        marginLeft: 10,
    },
    closeText: {
        color: '#ffffff',
        fontSize: 24,
        fontWeight: 'bold',
    },
}); 