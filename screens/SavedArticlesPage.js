import React, { useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    SafeAreaView,
    Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SavedArticlesContext } from '../context/SavedArticlesContext';
import { ToastContext } from '../App';

export default function SavedArticlesPage({ navigation }) {
    const { savedArticles, removeArticle } = useContext(SavedArticlesContext);
    const showToast = useContext(ToastContext);

    const getCredibilityColor = (score) => {
        if (score >= 70) return '#4CAF50';
        if (score >= 40) return '#FFB020';
        return '#FF4842';
    };

    const getCredibilityLabel = (score) => {
        if (score >= 70) return 'Verified True';
        if (score >= 40) return 'Potentially Misleading';
        return 'Likely False';
    };

    const handleRemoveArticle = async (articleId) => {
        try {
            await removeArticle(articleId);
            showToast('Article removed from saved');
        } catch (error) {
            console.error('Error removing article:', error);
            showToast('Failed to remove article', 'error');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Saved Articles</Text>
                <Text style={styles.headerSubtitle}>Your saved articles for later</Text>
            </View>

            <ScrollView 
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {savedArticles.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Feather name="bookmark" size={48} color="#666666" />
                        <Text style={styles.emptyStateText}>No saved articles yet</Text>
                        <Text style={styles.emptyStateSubtext}>
                            Articles you save will appear here
                        </Text>
                    </View>
                ) : (
                    savedArticles.map((article) => (
                        <TouchableOpacity
                            key={`${article.id}-${article.savedAt}`}
                            style={styles.articleCard}
                            onPress={() => navigation.navigate('ArticleDetail', { article })}
                        >
                            {article.imageUrl && (
                                <Image
                                    source={{ uri: article.imageUrl }}
                                    style={styles.articleImage}
                                />
                            )}
                            <View style={[
                                styles.articleContent,
                                !article.imageUrl && styles.articleContentNoImage
                            ]}>
                                <View style={styles.articleHeader}>
                                    <Text style={styles.articleSource}>{article.source}</Text>
                                    {article.credibilityScore !== undefined && (
                                        <View style={[
                                            styles.credibilityBadge,
                                            { backgroundColor: getCredibilityColor(article.credibilityScore) }
                                        ]}>
                                            <Text style={styles.credibilityScore}>
                                                {article.credibilityScore}%
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.articleTitle} numberOfLines={2}>
                                    {article.title}
                                </Text>
                                {article.credibilityScore !== undefined && (
                                    <Text style={[
                                        styles.credibilityLabel,
                                        { color: getCredibilityColor(article.credibilityScore) }
                                    ]}>
                                        {getCredibilityLabel(article.credibilityScore)}
                                    </Text>
                                )}
                                <Text style={styles.articleDescription} numberOfLines={3}>
                                    {article.description}
                                </Text>
                                <View style={styles.articleFooter}>
                                    <Text style={styles.timestamp}>{article.timestamp}</Text>
                                    <TouchableOpacity 
                                        style={styles.removeButton}
                                        onPress={() => handleRemoveArticle(article.id)}
                                    >
                                        <Feather 
                                            name="bookmark"
                                            size={20} 
                                            color="#3168d8"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
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
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyStateText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
        fontFamily: 'Poppins',
        marginTop: 16,
    },
    emptyStateSubtext: {
        color: '#666666',
        fontSize: 14,
        fontFamily: 'Poppins',
        marginTop: 8,
    },
    articleCard: {
        marginBottom: 20,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    articleImage: {
        width: '100%',
        height: 200,
    },
    articleContent: {
        padding: 15,
    },
    articleContentNoImage: {
        paddingTop: 20,
    },
    articleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    articleSource: {
        color: '#3168d8',
        fontSize: 14,
        fontFamily: 'Poppins',
        fontWeight: '600',
    },
    credibilityBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    credibilityScore: {
        color: '#FFFFFF',
        fontSize: 12,
        fontFamily: 'Poppins',
        fontWeight: '600',
    },
    credibilityLabel: {
        fontSize: 14,
        fontFamily: 'Poppins',
        marginTop: 5,
        marginBottom: 10,
    },
    articleTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        fontFamily: 'Poppins',
        marginBottom: 8,
    },
    articleDescription: {
        fontSize: 14,
        color: '#CCCCCC',
        fontFamily: 'Poppins',
        lineHeight: 20,
    },
    articleFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15,
    },
    timestamp: {
        color: '#666666',
        fontSize: 12,
        fontFamily: 'Poppins',
    },
    removeButton: {
        padding: 8,
    },
}); 