import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Image, TouchableOpacity, ActivityIndicator, SafeAreaView, Linking, Platform, Dimensions, Modal, TouchableWithoutFeedback } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ToastContext } from '../App';
import { SavedArticlesContext } from '../context/SavedArticlesContext';
import CredibilityService from '../services/CredibilityService';
import NotificationService from '../services/NotificationService';

const { width } = Dimensions.get('window');

const INITIAL_LOAD_COUNT = 5;
const ITEMS_PER_PAGE = 5;

// Add formatDate as a utility function outside the component
const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 24 * 60 * 60 * 1000) {
        const hours = Math.floor(diff / (60 * 60 * 1000));
        return hours === 0 ? 'Just now' : `${hours}h ago`;
    }
    
    if (diff < 7 * 24 * 60 * 60 * 1000) {
        const days = Math.floor(diff / (24 * 60 * 60 * 1000));
        return `${days}d ago`;
    }
    
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
};

const HomePage = ({ navigation }) => {
    const [news, setNews] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [filteredNews, setFilteredNews] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [savedArticles, setSavedArticles] = useState([]);
    const [verifiedArticles, setVerifiedArticles] = useState({});
    const [credibilityResult, setCredibilityResult] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [initialArticles, setInitialArticles] = useState([]);
    const [isLoadingRest, setIsLoadingRest] = useState(false);

    const showToast = useContext(ToastContext);
    const savedArticlesContext = useContext(SavedArticlesContext);

    const fetchInitialArticles = async () => {
        try {
            const response = await fetch('http://192.168.0.170:3000/trending?limit=5');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            // Immediately display whatever we get
            setInitialArticles(data);
            setIsInitialLoading(false);
            
            // Load remaining articles after a delay
            setTimeout(() => {
                fetchRemainingArticles();
            }, 100);

        } catch (error) {
            console.error('Error fetching initial articles:', error);
            setInitialArticles([]);
            setIsInitialLoading(false);
        }
    };

    const fetchRemainingArticles = async () => {
        try {
            setIsLoadingRest(true);
            const response = await fetch('http://192.168.0.170:3000/trending?skip=5');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const remainingData = await response.json();
            const allArticles = [...initialArticles, ...remainingData];
            setNews(allArticles);
            setFilteredNews(allArticles);
            
        } catch (error) {
            console.error('Error fetching remaining articles:', error);
        } finally {
            setIsLoadingRest(false);
        }
    };

    useEffect(() => {
        fetchInitialArticles();
        loadSavedArticles();
        loadNotifications();
    }, []);

    const loadSavedArticles = async () => {
        try {
            const saved = await AsyncStorage.getItem('savedArticles');
            const verified = await AsyncStorage.getItem('verifiedArticles');
            if (saved) setSavedArticles(JSON.parse(saved));
            if (verified) setVerifiedArticles(JSON.parse(verified));
        } catch (error) {
            console.error('Error loading saved articles:', error);
        }
    };

    const loadNotifications = async () => {
        try {
            // Assuming you have a userId (you'll need to implement user authentication)
            const userId = 'default_user';
            const userNotifications = await NotificationService.getNotifications(userId);
            setNotifications(userNotifications);
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    };

    const handleSearch = (text) => {
        setSearchQuery(text);
        setCurrentPage(1);
        if (text) {
            const filtered = news.filter(article => 
                article.title.toLowerCase().includes(text.toLowerCase()) ||
                article.description.toLowerCase().includes(text.toLowerCase())
            );
            const sortedFiltered = filtered.sort((a, b) => {
                return new Date(b.publishedAt) - new Date(a.publishedAt);
            });
            setFilteredNews(sortedFiltered);
        } else {
            const sortedNews = [...news].sort((a, b) => {
                return new Date(b.publishedAt) - new Date(a.publishedAt);
            });
            setFilteredNews(sortedNews);
        }
    };

    const getCurrentArticles = () => {
        // If we have initial articles and haven't loaded the rest yet, show initial
        if (initialArticles.length > 0 && news.length === 0) {
            return initialArticles;
        }
        // Otherwise show from the full dataset
        return filteredNews.slice(0, currentPage * ITEMS_PER_PAGE);
    };

    const loadMoreArticles = () => {
        if (!isLoadingMore && currentPage * ITEMS_PER_PAGE < filteredNews.length) {
            setIsLoadingMore(true);
            setCurrentPage(prevPage => prevPage + 1);
            setTimeout(() => setIsLoadingMore(false), 300);
        }
    };

    const handleVerify = async (article) => {
        try {
            // Show loading state in the verify button
            const articleId = article.id;
            setVerifiedArticles(prev => ({
                ...prev,
                [articleId]: { isLoading: true }
            }));

            // First, check if we have content to analyze
            if (!article.content) {
                throw new Error('No content available to analyze');
            }

            const response = await fetch('http://192.168.0.170:3000/check-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    url: article.url,
                    content: article.content,
                    title: article.title,
                    source: article.source
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to verify article');
            }

            const credibilityScore = data.data.credibilityScore;
            
            // Add notification
            await addNotification(article, credibilityScore);

            // Update verification data
            const updatedVerified = {
                ...verifiedArticles,
                [article.id]: {
                    score: credibilityScore,
                    label: data.data.credibilityLabel,
                    details: data.data.analysisDetails,
                    timestamp: new Date().toISOString()
                }
            };

            setVerifiedArticles(updatedVerified);
            await AsyncStorage.setItem('verifiedArticles', JSON.stringify(updatedVerified));

        } catch (error) {
            console.error('Error verifying article:', error);
            // Update verification state to show error
            setVerifiedArticles(prev => ({
                ...prev,
                [article.id]: { 
                    error: 'Verification failed',
                    details: error.message
                }
            }));
            showToast('Failed to verify article', 'error');
        }
    };

    const addNotification = async (article, score) => {
        try {
            let type, title, message;
            
            if (score < 30) {
                type = 'FAKE_NEWS_ALERT';
                title = 'Fake News Alert';
                message = `The article "${article.title}" has been identified as potential fake news.`;
            } else if (score < 50) {
                type = 'SUSPICIOUS_NEWS_ALERT';
                title = 'Suspicious Content Alert';
                message = `The article "${article.title}" contains suspicious content. Please verify from other sources.`;
            } else if (score < 60) {
                type = 'CREDIBILITY_ALERT';
                title = 'Low Credibility Alert';
                message = `The article "${article.title}" has a low credibility score. Consider fact-checking.`;
            } else {
                return; // Don't create notification for higher scores
            }

            const newNotification = {
                id: Date.now().toString(),
                type,
                title,
                message,
                articleUrl: article.url,
                credibilityScore: score,
                timestamp: new Date().toISOString(),
                isRead: false
            };

            // Get existing notifications
            const storedNotifications = await AsyncStorage.getItem('notifications');
            const notifications = storedNotifications ? JSON.parse(storedNotifications) : [];
            
            // Add new notification at the beginning
            notifications.unshift(newNotification);
            
            // Save updated notifications
            await AsyncStorage.setItem('notifications', JSON.stringify(notifications));
        } catch (error) {
            console.error('Error adding notification:', error);
        }
    };

    const handleSaveArticle = async (article) => {
        try {
            if (savedArticlesContext.isArticleSaved(article.id)) {
                await savedArticlesContext.removeArticle(article.id);
                showToast('Article removed from saved');
            } else {
                const articleToSave = {
                    ...article,
                    savedAt: new Date().toISOString()
                };
                await savedArticlesContext.saveArticle(articleToSave);
                showToast('Article saved successfully');
            }
        } catch (error) {
            console.error('Error handling save:', error);
            showToast('Failed to save article', 'error');
        }
    };

    const handleArticlePress = (article) => {
        setSelectedArticle(article);
        setModalVisible(true);
    };

    const renderArticleModal = () => (
        <Modal
            animationType="fade"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
        >
            <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContent}>
                            {selectedArticle?.images?.[0] && (
                                <Image
                                    source={{ uri: selectedArticle.images[0].url }}
                                    style={styles.modalImage}
                                    resizeMode="cover"
                                />
                            )}
                            <ScrollView style={styles.modalScroll}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>{selectedArticle?.title}</Text>
                                    <View style={styles.modalMeta}>
                                        <Text style={styles.modalSource}>{selectedArticle?.source}</Text>
                                        <View style={styles.dot} />
                                        <Text style={styles.modalDate}>
                                            {selectedArticle && formatDate(selectedArticle.publishedAt)}
                                        </Text>
                                    </View>
                                </View>
                                
                                <Text style={styles.modalDescription}>
                                    {selectedArticle?.description}
                                </Text>

                                <TouchableOpacity 
                                    style={styles.readMoreButton}
                                    onPress={() => selectedArticle?.url && Linking.openURL(selectedArticle.url)}
                                >
                                    <LinearGradient
                                        colors={['#3168d8', '#2855b5']}
                                        style={styles.readMoreGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <Text style={styles.readMoreText}>READ FULL ARTICLE</Text>
                                        <Feather name="external-link" size={16} color="#FFFFFF" style={styles.readMoreIcon} />
                                    </LinearGradient>
                                </TouchableOpacity>
                            </ScrollView>
                            
                            <TouchableOpacity 
                                style={styles.closeButton}
                                onPress={() => setModalVisible(false)}
                            >
                                <Feather name="x" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );

    const renderVerificationStatus = (article) => {
        const verificationData = verifiedArticles[article.id];

        if (!verificationData) {
            return (
                <TouchableOpacity 
                    style={styles.verifyButton}
                    onPress={() => handleVerify(article)}
                >
                    <Feather name="check-circle" size={16} color="#FFFFFF" style={styles.verifyIcon} />
                    <Text style={styles.verifyButtonText}>VERIFY</Text>
                </TouchableOpacity>
            );
        }

        if (verificationData.isLoading) {
            return (
                <View style={styles.verifyingContainer}>
                    <ActivityIndicator color="#3168d8" size="small" />
                    <Text style={styles.verifyingText}>Verifying...</Text>
                </View>
            );
        }

        if (verificationData.error) {
            return (
                <TouchableOpacity 
                    style={styles.verifyErrorButton}
                    onPress={() => handleVerify(article)}
                >
                    <Feather name="alert-circle" size={16} color="#ff4444" style={styles.verifyIcon} />
                    <Text style={styles.verifyErrorText}>
                        {verificationData.details ? 'Content unavailable' : 'Try Again'}
                    </Text>
                </TouchableOpacity>
            );
        }

        return (
            <View style={[
                styles.credibilityContainer,
                { backgroundColor: verificationData.label?.color + '15' }
            ]}>
                <Text style={[
                    styles.credibilityScore,
                    { color: verificationData.label?.color }
                ]}>
                    {verificationData.score}% Credible
                </Text>
                <Text style={[
                    styles.credibilityLabel,
                    { color: verificationData.label?.color }
                ]}>
                    {verificationData.label?.text}
                </Text>
            </View>
        );
    };

    // Helper function to get background color based on score
    const getCredibilityColor = (score) => {
        if (score >= 80) return 'rgba(52, 199, 89, 0.1)'; // Green
        if (score >= 60) return 'rgba(49, 104, 216, 0.1)'; // Blue
        return 'rgba(255, 59, 48, 0.1)'; // Red
    };

    const renderNewsArticle = (article) => {
        const isSaved = savedArticles.some(saved => saved.id === article.id);
        
        return (
            <TouchableOpacity 
                key={article.id} 
                style={styles.articleCard}
                activeOpacity={0.9}
                onPress={() => handleArticlePress(article)}
            >
                <LinearGradient
                    colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                    style={styles.articleGradient}
                >
                    {article.images && article.images[0] && (
                        <View style={styles.imageContainer}>
                            <Image
                                source={{ uri: article.images[0].url }}
                                style={styles.articleImage}
                                resizeMode="cover"
                            />
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.8)']}
                                style={styles.imageOverlay}
                            />
                        </View>
                    )}
                    
                    <View style={[styles.articleContent, !article.images?.length && styles.articleContentNoImage]}>
                        <View style={styles.articleMeta}>
                            <View style={styles.sourceContainer}>
                                <Text style={styles.articleSource}>{article.source}</Text>
                                <View style={styles.dot} />
                                <Text style={styles.articleDate}>
                                    {formatDate(article.publishedAt)}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => handleSaveArticle(article)}
                                style={styles.saveButton}
                            >
                                <Feather 
                                    name="bookmark"
                                    size={20} 
                                    color={isSaved ? "#3168d8" : "rgba(255,255,255,0.2)"} 
                                />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.articleTitle}>{article.title}</Text>
                        
                        <Text numberOfLines={2} style={styles.articleDescription}>
                            {article.description}
                        </Text>
                        
                        {renderVerificationStatus(article)}
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    const renderLoadMoreButton = () => {
        if (news.length <= INITIAL_LOAD_COUNT) return null;
        
        const remainingCount = filteredNews.length - getCurrentArticles().length;
        if (remainingCount <= 0) return null;

        return (
            <TouchableOpacity 
                style={styles.loadMoreButton}
                onPress={loadMoreArticles}
                disabled={isLoadingMore}
            >
                {isLoadingMore ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                    <>
                        <Text style={styles.loadMoreText}>Load More</Text>
                        <Text style={styles.remainingCount}>
                            {remainingCount} articles remaining
                        </Text>
                    </>
                )}
            </TouchableOpacity>
        );
    };

    const processArticle = async (article) => {
        try {
            const credibilityScore = await CredibilityService.calculateCredibilityScore(article);
            const credibilityLabel = CredibilityService.getCredibilityLabel(credibilityScore);
            
            return {
                ...article,
                credibilityScore,
                credibilityLabel: credibilityLabel.text,
                credibilityColor: credibilityLabel.color
            };
        } catch (error) {
            console.error('Error processing article:', error);
            return article;
        }
    };

    const renderNotificationBadge = () => {
        const unreadCount = notifications.filter(n => !n.isRead).length;
        if (unreadCount === 0) return null;

        return (
            <View style={styles.notificationBadge}>
                <Text style={styles.notificationCount}>{unreadCount}</Text>
            </View>
        );
    };

    return (
        <LinearGradient colors={['#1c2120', '#2b2f2e']} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>TRENDING NEWS</Text>
                </View>

                <View style={styles.searchBarContainer}>
                    <View style={styles.searchBar}>
                        <Feather name="search" size={20} color="#666666" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search news articles..."
                            placeholderTextColor="#666666"
                            value={searchQuery}
                            onChangeText={handleSearch}
                        />
                    </View>
                </View>

                <ScrollView 
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {isInitialLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#3168d8" />
                        </View>
                    ) : (
                        <>
                            {getCurrentArticles().map((article) => (
                                <ArticleCard 
                                    key={article.id}
                                    article={article}
                                    onPress={() => handleArticlePress(article)}
                                    onVerify={() => handleVerify(article)}
                                    onSave={() => handleSaveArticle(article)}
                                    verificationData={verifiedArticles[article.id]}
                                    isSaved={savedArticlesContext.isArticleSaved(article.id)}
                                />
                            ))}
                            {isLoadingRest && (
                                <View style={styles.loadingMoreContainer}>
                                    <ActivityIndicator size="small" color="#666666" />
                                    <Text style={styles.loadingMoreText}>
                                        Loading more articles...
                                    </Text>
                                </View>
                            )}
                            {!isLoadingRest && news.length > INITIAL_LOAD_COUNT && (
                                <TouchableOpacity 
                                    style={styles.loadMoreButton}
                                    onPress={loadMoreArticles}
                                    disabled={isLoadingMore}
                                >
                                    {isLoadingMore ? (
                                        <ActivityIndicator color="#FFFFFF" size="small" />
                                    ) : (
                                        <>
                                            <Text style={styles.loadMoreText}>Load More</Text>
                                            <Text style={styles.remainingCount}>
                                                {filteredNews.length - getCurrentArticles().length} articles remaining
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </ScrollView>
                {renderArticleModal()}
                {renderNotificationBadge()}
            </SafeAreaView>
        </LinearGradient>
    );
};

const ArticleCard = React.memo(({ article, onPress, onVerify, onSave, verificationData, isSaved }) => {
    return (
        <TouchableOpacity 
            style={styles.articleCard}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <LinearGradient
                colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                style={styles.articleGradient}
            >
                {article.images && article.images[0] && (
                    <View style={styles.imageContainer}>
                        <Image
                            source={{ uri: article.images[0].url }}
                            style={styles.articleImage}
                            resizeMode="cover"
                        />
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.8)']}
                            style={styles.imageOverlay}
                        />
                    </View>
                )}
                
                <View style={[styles.articleContent, !article.images?.length && styles.articleContentNoImage]}>
                    <View style={styles.articleMeta}>
                        <View style={styles.sourceContainer}>
                            <Text style={styles.articleSource}>{article.source}</Text>
                            <View style={styles.dot} />
                            <Text style={styles.articleDate}>
                                {formatDate(article.publishedAt)}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={onSave}
                            style={styles.saveButton}
                        >
                            <Feather 
                                name="bookmark"
                                size={20} 
                                color={isSaved ? "#3168d8" : "rgba(255,255,255,0.2)"} 
                            />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.articleTitle}>{article.title}</Text>
                    
                    <Text numberOfLines={2} style={styles.articleDescription}>
                        {article.description}
                    </Text>
                    
                    {renderVerificationStatus(article)}
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: 'Poppins',
        letterSpacing: 0.5,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    searchBarContainer: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 50,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'Poppins',
    },
    content: {
        flex: 1,
        backgroundColor: '#1c2120',
    },
    articleCard: {
        marginBottom: 20,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
    },
    articleGradient: {
        borderRadius: 16,
    },
    imageContainer: {
        height: 200,
        width: '100%',
        position: 'relative',
        backgroundColor: '#2d3130',
    },
    articleImage: {
        height: '100%',
        width: '100%',
    },
    placeholderContainer: {
        height: '100%',
        width: '100%',
    },
    placeholderGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        color: 'rgba(255,255,255,0.2)',
        fontSize: 14,
        marginTop: 8,
        fontFamily: 'Poppins',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
    },
    articleContent: {
        padding: 20,
    },
    articleContentNoImage: {
        paddingTop: 25,
    },
    articleMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sourceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    articleSource: {
        fontSize: 14,
        color: '#3168d8',
        fontFamily: 'Poppins',
        fontWeight: '600',
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#666666',
        marginHorizontal: 8,
    },
    articleDate: {
        fontSize: 14,
        color: '#666666',
        fontFamily: 'Poppins',
    },
    articleTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 12,
        lineHeight: 28,
        fontFamily: 'Poppins',
    },
    articleDescription: {
        fontSize: 15,
        color: '#CCCCCC',
        marginBottom: 20,
        lineHeight: 22,
        fontFamily: 'Poppins',
    },
    verifyButton: {
        backgroundColor: '#3168d8',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-start',
    },
    verifyIcon: {
        marginRight: 8,
    },
    verifyButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'Poppins',
    },
    loader: {
        marginTop: 50,
    },
    noNewsText: {
        color: '#FFFFFF',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 50,
        fontFamily: 'Poppins',
    },
    loadMoreButton: {
        backgroundColor: '#3168d8',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginVertical: 20,
        marginHorizontal: 20,
    },
    loadMoreText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Poppins',
    },
    remainingCount: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 12,
        marginTop: 4,
        fontFamily: 'Poppins',
    },
    loadingContainer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxHeight: '80%',
        backgroundColor: '#2d3130',
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
    },
    modalImage: {
        width: '100%',
        height: 200,
    },
    modalScroll: {
        maxHeight: '100%',
    },
    modalHeader: {
        padding: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 12,
        lineHeight: 32,
        fontFamily: 'Poppins',
    },
    modalMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    modalSource: {
        fontSize: 14,
        color: '#3168d8',
        fontFamily: 'Poppins',
        fontWeight: '600',
    },
    modalDate: {
        fontSize: 14,
        color: '#666666',
        fontFamily: 'Poppins',
    },
    modalDescription: {
        fontSize: 16,
        color: '#FFFFFF',
        lineHeight: 24,
        paddingHorizontal: 20,
        paddingBottom: 20,
        fontFamily: 'Poppins',
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    readMoreButton: {
        margin: 20,
        borderRadius: 12,
        overflow: 'hidden',
    },
    readMoreGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    readMoreText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
        fontFamily: 'Poppins',
        marginRight: 8,
    },
    readMoreIcon: {
        marginLeft: 4,
    },
    saveButton: {
        padding: 10,
    },
    verifyingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(49,104,216,0.1)',
        padding: 12,
        borderRadius: 8,
        marginTop: 15,
    },
    verifyingText: {
        color: '#3168d8',
        fontSize: 14,
        marginLeft: 8,
        fontFamily: 'Poppins',
    },
    verifyErrorButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,59,48,0.1)',
        padding: 12,
        borderRadius: 8,
        marginTop: 15,
    },
    verifyErrorText: {
        color: '#ff4444',
        fontSize: 14,
        marginLeft: 8,
        fontFamily: 'Poppins',
    },
    credibilityContainer: {
        padding: 12,
        borderRadius: 8,
        marginTop: 15,
    },
    credibilityScore: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Poppins',
    },
    credibilityLabel: {
        fontSize: 14,
        marginTop: 4,
        fontFamily: 'Poppins',
        color: '#666666',
    },
    notificationBadge: {
        position: 'absolute',
        right: -6,
        top: -6,
        backgroundColor: '#FF4842',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationCount: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    loadingMoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        opacity: 0.7
    },
    loadingMoreText: {
        marginLeft: 10,
        color: '#666666',
        fontSize: 14,
        fontFamily: 'Poppins'
    }
});

export default HomePage;