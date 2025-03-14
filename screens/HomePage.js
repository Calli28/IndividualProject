import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const HomePage = () => {
    const navigation = useNavigation();

    // Memoize navigation handlers
    const handleURLSearch = useCallback(() => {
        navigation.navigate('URLSearch');
    }, [navigation]);

    const handleTextSearch = useCallback(() => {
        navigation.navigate('TextSearch');
    }, [navigation]);

    // Memoize feature items
    const FeatureItem = useCallback(({ icon, title, subtitle, onPress }) => (
        <TouchableOpacity 
            style={styles.featureItem}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.featureIcon}>
                <Feather name={icon} size={24} color="#3168d8" />
            </View>
            <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{title}</Text>
                <Text style={styles.featureSubtitle}>{subtitle}</Text>
            </View>
            <Feather name="chevron-right" size={24} color="#666666" />
        </TouchableOpacity>
    ), []);

    // Memoize features data
    const features = useMemo(() => [
        {
            icon: 'link',
            title: 'URL Check',
            subtitle: 'Analyze articles from any URL',
            onPress: handleURLSearch
        },
        {
            icon: 'file-text',
            title: 'Text Check',
            subtitle: 'Analyze any pasted text',
            onPress: handleTextSearch
        }
    ], [handleURLSearch, handleTextSearch]);

    return (
        <LinearGradient 
            colors={['#1c2120', '#2b2f2e']} 
            style={styles.container}
            useAngle={true}
            angle={45}
        >
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>FACT CHECKER</Text>
                    <Text style={styles.headerSubtitle}>VERIFY ANY INFORMATION</Text>
                </View>

                <View style={styles.featuresContainer}>
                    {features.map((feature, index) => (
                        <FeatureItem
                            key={index}
                            icon={feature.icon}
                            title={feature.title}
                            subtitle={feature.subtitle}
                            onPress={feature.onPress}
                        />
                    ))}
                </View>

                <View style={styles.infoContainer}>
                    <Text style={styles.infoText}>
                        Select a method above to start fact-checking
                    </Text>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        padding: 20,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontFamily: 'Poppins',
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 14,
        fontFamily: 'Poppins',
        color: '#666666',
        marginTop: 5,
    },
    featuresContainer: {
        padding: 20,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2d3130',
        borderRadius: 12,
        padding: 20,
        marginBottom: 15,
    },
    featureIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(49, 104, 216, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureContent: {
        flex: 1,
        marginLeft: 15,
        marginRight: 10,
    },
    featureTitle: {
        fontSize: 18,
        fontFamily: 'Poppins',
        color: '#FFFFFF',
        fontWeight: '600',
    },
    featureSubtitle: {
        fontSize: 14,
        fontFamily: 'Poppins',
        color: '#666666',
        marginTop: 2,
    },
    infoContainer: {
        padding: 20,
        alignItems: 'center',
    },
    infoText: {
        fontSize: 14,
        fontFamily: 'Poppins',
        color: '#666666',
        textAlign: 'center',
    }
});

export default React.memo(HomePage);