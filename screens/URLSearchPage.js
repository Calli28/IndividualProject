import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Image
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ToastContext } from '../App';
import { SavedArticlesContext } from '../context/SavedArticlesContext';

export default function URLSearchPage() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const showToast = useContext(ToastContext);
    const savedArticlesContext = useContext(SavedArticlesContext);

    const handleVerify = async () => {
        if (!url) {
            showToast('Please enter a URL', 'error');
            return;
        }

        setLoading(true);
        try {
            // Simulate API call - replace with your actual fake news detection API
            await new Promise(resolve => setTimeout(resolve, 1500));
            const mockResult = {
                id: Date.now().toString(),
                title: "Climate Change Report Raises Concerns",
                source: "NewsDaily",
                imageUrl: "https://picsum.photos/800/400",
                timestamp: new Date().toLocaleString(),
                url: url,
                credibilityScore: 35,
                factCheckSummary: "This article contains several misleading claims and unverified statistics.",
                warningFlags: [
                    "Misleading headlines",
                    "Unverified sources",
                    "Manipulated data",
                    "Emotional language"
                ],
                verifiedFacts: [
                    "Original source not cited",
                    "Claims contradict official records",
                    "Images are out of context"
                ],
                recommendedSources: [
                    "Reuters Fact Check",
                    "Associated Press",
                    "Official Government Data"
                ]
            };
            setResult(mockResult);
        } catch (error) {
            console.error('Error:', error);
            showToast('Failed to analyze article', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getCredibilityColor = (score) => {
        if (score >= 70) return '#4CAF50';
        if (score >= 40) return '#FFB020';
        return '#FF4842';
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Fact Check</Text>
                    <Text style={styles.headerSubtitle}>Verify news articles for misinformation</Text>
                </View>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Paste article URL here"
                        placeholderTextColor="#666666"
                        value={url}
                        onChangeText={setUrl}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    <TouchableOpacity 
                        style={styles.verifyButton}
                        onPress={handleVerify}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.verifyButtonText}>Analyze Article</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {result && (
                    <View style={styles.resultContainer}>
                        <Image
                            source={{ uri: result.imageUrl }}
                            style={styles.articleImage}
                        />
                        <View style={styles.articleContent}>
                            <View style={styles.credibilitySection}>
                                <Text style={styles.sectionTitle}>Credibility Score</Text>
                                <View style={[styles.credibilityBadge, { backgroundColor: getCredibilityColor(result.credibilityScore) }]}>
                                    <Text style={styles.credibilityScore}>{result.credibilityScore}%</Text>
                                </View>
                                <Text style={[styles.credibilityLabel, { color: getCredibilityColor(result.credibilityScore) }]}>
                                    {result.credibilityScore >= 70 ? 'Likely True' : 
                                     result.credibilityScore >= 40 ? 'Potentially Misleading' : 
                                     'Likely False'}
                                </Text>
                            </View>

                            <View style={styles.warningSection}>
                                <Text style={styles.sectionTitle}>Warning Flags</Text>
                                {result.warningFlags.map((flag, index) => (
                                    <View key={index} style={styles.flagItem}>
                                        <Feather name="alert-triangle" size={16} color="#FFB020" />
                                        <Text style={styles.flagText}>{flag}</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.factsSection}>
                                <Text style={styles.sectionTitle}>Fact Check Results</Text>
                                {result.verifiedFacts.map((fact, index) => (
                                    <View key={index} style={styles.factItem}>
                                        <Feather name="x-circle" size={16} color="#FF4842" />
                                        <Text style={styles.factText}>{fact}</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.sourcesSection}>
                                <Text style={styles.sectionTitle}>Recommended Sources</Text>
                                {result.recommendedSources.map((source, index) => (
                                    <View key={index} style={styles.sourceItem}>
                                        <Feather name="check-circle" size={16} color="#4CAF50" />
                                        <Text style={styles.sourceText}>{source}</Text>
                                    </View>
                                ))}
                            </View>

                            <TouchableOpacity 
                                style={styles.saveButton}
                                onPress={() => {
                                    if (savedArticlesContext.isArticleSaved(result.id)) {
                                        savedArticlesContext.removeArticle(result.id);
                                        showToast('Analysis removed from saved');
                                    } else {
                                        savedArticlesContext.saveArticle(result);
                                        showToast('Analysis saved successfully');
                                    }
                                }}
                            >
                                <Feather 
                                    name="bookmark"
                                    size={20} 
                                    color={savedArticlesContext.isArticleSaved(result.id) ? "#3168d8" : "rgba(255,255,255,0.2)"} 
                                />
                                <Text style={styles.saveButtonText}>
                                    {savedArticlesContext.isArticleSaved(result.id) ? 'Saved' : 'Save Analysis'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1c2120',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: 'Poppins',
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#666666',
        fontFamily: 'Poppins',
        marginTop: 4,
    },
    inputContainer: {
        marginHorizontal: 20,
        marginTop: 20,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 15,
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'Poppins',
        marginBottom: 15,
    },
    verifyButton: {
        backgroundColor: '#3168d8',
        borderRadius: 12,
        padding: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    verifyButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Poppins',
    },
    resultContainer: {
        margin: 20,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    articleImage: {
        width: '100%',
        height: 200,
    },
    articleContent: {
        padding: 20,
    },
    credibilitySection: {
        alignItems: 'center',
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        fontFamily: 'Poppins',
        marginBottom: 15,
    },
    credibilityBadge: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        marginVertical: 10,
    },
    credibilityScore: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: 'Poppins',
    },
    credibilityLabel: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Poppins',
    },
    warningSection: {
        marginBottom: 25,
    },
    flagItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    flagText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'Poppins',
        marginLeft: 10,
    },
    factsSection: {
        marginBottom: 25,
    },
    factItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    factText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'Poppins',
        marginLeft: 10,
    },
    sourcesSection: {
        marginBottom: 25,
    },
    sourceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    sourceText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'Poppins',
        marginLeft: 10,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(49,104,216,0.1)',
        borderRadius: 12,
        padding: 15,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Poppins',
        marginLeft: 10,
    },
}); 