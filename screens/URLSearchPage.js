import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, SafeAreaView, ScrollView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const RESULTS_PER_PAGE = 5; // Number of results to show per page

const URLSearchPage = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [question, setQuestion] = useState('');
  const [questionResult, setQuestionResult] = useState(null);
  const [articleContent, setArticleContent] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Optimize article content storage
  const trimmedContent = useMemo(() => {
    return articleContent.slice(0, 5000); // Limit content length
  }, [articleContent]);

  // Paginate question results
  const paginatedResults = useMemo(() => {
    if (!questionResult?.relatedFacts) return [];
    return questionResult.relatedFacts.slice(0, currentPage * RESULTS_PER_PAGE);
  }, [questionResult, currentPage]);

  const clearAllData = () => {
    setUrl('');
    setQuestion('');
    setQuestionResult(null);
    setArticleContent('');
    setResult(null);
    setError(null);
    setCurrentPage(1);
  };

  const handleUrlChange = (text) => {
    setUrl(text);
    if (result || questionResult || question) {
      clearAllData();
    }
  };

  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  const handleURLCheck = async () => {
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      // Clear previous results
      setResult(null);
      setQuestion('');
      setQuestionResult(null);
      setArticleContent('');
      
      let formattedUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        formattedUrl = 'https://' + url;
      }

      console.log('Checking URL:', formattedUrl);

      const response = await fetch('http://192.168.0.170:3000/check-url', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: formattedUrl
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received data:', {
        hasContent: !!data.content,
        contentLength: data.content?.length,
        hasKeywords: Array.isArray(data.keywords),
        keywordsCount: data.keywords?.length,
        score: data.credibilityScore
      });

      // Ensure data has required properties
      const processedData = {
        ...data,
        keywords: data.keywords || [],
        insights: data.insights || [],
        contentPreview: data.contentPreview || '',
        credibilityScore: data.credibilityScore || 0
      };

      setArticleContent(processedData.content || processedData.contentPreview || '');
      setResult(processedData);
      setCurrentPage(1);

    } catch (err) {
      console.error('Error checking URL:', err);
      setError(err.message || 'Failed to analyze URL. Please try again.');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionSubmit = async () => {
    if (!question || !articleContent) {
        setError('Please enter a question and analyze an article first');
        return;
    }

    try {
        setIsLoading(true);
        setError(null);
        setQuestionResult(null);

        console.log('Sending question request:', {
            question,
            contentLength: articleContent.length
        });

        const response = await fetch('http://192.168.0.170:3000/ask-article', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                question: question.trim(),
                articleContent: articleContent
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received answer:', {
            hasAnswer: !!data.answer,
            confidence: data.confidence,
            excerptCount: data.relevantExcerpts?.length
        });

        setQuestionResult(data);
        
    } catch (err) {
        console.error('Error asking question:', err);
        setError(err.message || 'Failed to process question. Please try again.');
        setQuestionResult(null);
    } finally {
        setIsLoading(false);
    }
  };

  const renderCredibilityScore = (score) => (
    <View style={styles.scoreContainer}>
      <View style={styles.scoreCircle}>
        <Text style={styles.scoreText}>{score}</Text>
      </View>
      <Text style={styles.scoreLabel}>
        Credibility Score
      </Text>
    </View>
  );

  const renderInsights = (insights) => (
    <View style={styles.insightsContainer}>
      <Text style={styles.sectionTitle}>INSIGHTS</Text>
      {insights.map((insight, index) => (
        <View key={index} style={styles.insightItem}>
          <Feather name="info" size={16} color="#3168d8" style={styles.insightIcon} />
          <Text style={styles.insightText}>{insight}</Text>
        </View>
      ))}
    </View>
  );

  const renderRelatedArticles = (articles) => (
    <View style={styles.relatedContainer}>
      <Text style={styles.sectionTitle}>RELATED COVERAGE</Text>
      {articles.map((article, index) => (
        <View key={index} style={styles.relatedItem}>
          <Feather name="link" size={16} color="#666666" style={styles.relatedIcon} />
          <View style={styles.relatedContent}>
            <Text style={styles.relatedTitle}>{article.title}</Text>
            <Text style={styles.relatedSource}>{article.source}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderResults = () => {
    if (!result) return null;

    return (
      <View style={styles.resultContainer}>
        <View style={styles.credibilitySection}>
          <Text style={styles.sectionTitle}>CREDIBILITY SCORE</Text>
          <View style={styles.credibilityBadge}>
            <Text style={styles.credibilityScore}>
              {result.credibilityScore}%
            </Text>
          </View>
        </View>

        {result.keywords && result.keywords.length > 0 && (
          <View style={styles.keywordsSection}>
            <Text style={styles.sectionTitle}>KEY TOPICS</Text>
            <View style={styles.keywordsContainer}>
              {result.keywords.map((keyword, index) => (
                <View key={index} style={styles.keywordBadge}>
                  <Text style={styles.keywordText}>{keyword}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {result.insights && result.insights.length > 0 && (
          <View style={styles.insightsSection}>
            <Text style={styles.sectionTitle}>INSIGHTS</Text>
            {result.insights.map((insight, index) => (
              <View key={index} style={styles.insightItem}>
                <Feather name="info" size={16} color="#3168d8" />
                <Text style={styles.insightText}>{insight}</Text>
              </View>
            ))}
          </View>
        )}

        {result.contentPreview && (
          <View style={styles.previewSection}>
            <Text style={styles.sectionTitle}>CONTENT PREVIEW</Text>
            <Text style={styles.previewText}>
              {result.contentPreview.slice(0, 200)}...
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderQuestionSection = () => {
    if (!result) return null;

    return (
        <View style={styles.questionSection}>
            <Text style={styles.sectionTitle}>ASK ABOUT THIS ARTICLE</Text>
            
            <View style={styles.questionInputContainer}>
                <TextInput
                    style={styles.questionInput}
                    placeholder="Ask a question about the article..."
                    placeholderTextColor="#666666"
                    value={question}
                    onChangeText={setQuestion}
                    multiline={false}
                    returnKeyType="send"
                    onSubmitEditing={handleQuestionSubmit}
                />
                <TouchableOpacity 
                    style={styles.askButton}
                    onPress={handleQuestionSubmit}
                    disabled={isLoading || !question}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Feather name="send" size={20} color="#FFFFFF" />
                    )}
                </TouchableOpacity>
            </View>

            {questionResult && (
                <View style={styles.answerContainer}>
                    <Text style={styles.answerText}>{questionResult.answer}</Text>
                    
                    <View style={styles.confidenceBadge}>
                        <Text style={styles.confidenceScore}>
                            {questionResult.confidence}%
                        </Text>
                        <Text style={styles.confidenceLabel}>
                            Answer Confidence
                        </Text>
                    </View>

                    {questionResult.relevantExcerpts?.map((excerpt, index) => (
                        <View key={index} style={styles.excerptContainer}>
                            <Text style={styles.excerptText}>• {excerpt}</Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
  };

  return (
    <LinearGradient colors={['#1c2120', '#2b2f2e']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>URL CHECK</Text>
          <Text style={styles.headerSubtitle}>VERIFY ANY ARTICLE</Text>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={true}
          removeClippedSubviews={true} // Performance optimization
        >
          <View style={styles.inputContainer}>
            <Feather name="link" size={20} color="#666666" style={styles.linkIcon} />
            <TextInput
              style={styles.urlInput}
              placeholder="Paste article URL here..."
              placeholderTextColor="#666666"
              value={url}
              onChangeText={handleUrlChange}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {url.length > 0 && (
              <TouchableOpacity onPress={() => setUrl('')} style={styles.clearButton}>
                <Feather name="x" size={20} color="#666666" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity 
            style={styles.checkButton}
            onPress={handleURLCheck}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Feather name="check-circle" size={20} color="#FFFFFF" style={styles.checkIcon} />
                <Text style={styles.checkButtonText}>CHECK ARTICLE</Text>
              </>
            )}
          </TouchableOpacity>

          {error && (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={20} color="#ff6b6b" style={styles.errorIcon} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {renderQuestionSection()}

          <View style={styles.bottomSpacer} />
        </ScrollView>
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
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#3168d8',
    fontFamily: 'Poppins',
    marginTop: 5,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    height: 60,
  },
  linkIcon: {
    marginRight: 10,
  },
  urlInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins',
  },
  clearButton: {
    padding: 5,
  },
  checkButton: {
    backgroundColor: '#3168d8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  checkIcon: {
    marginRight: 10,
  },
  checkButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,107,107,0.1)',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  errorIcon: {
    marginRight: 10,
  },
  errorText: {
    color: '#ff6b6b',
    marginLeft: 10,
    flex: 1,
    fontFamily: 'Poppins',
  },
  resultContainer: {
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 15,
  },
  scoreContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3168d8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  scoreText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'Poppins',
  },
  scoreLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins',
  },
  insightsContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    color: '#3168d8',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins',
    marginBottom: 10,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  insightIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  insightText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins',
    flex: 1,
  },
  relatedContainer: {
    marginTop: 20,
  },
  relatedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  relatedIcon: {
    marginRight: 10,
  },
  relatedContent: {
    flex: 1,
  },
  relatedTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins',
    marginBottom: 5,
  },
  relatedSource: {
    color: '#666666',
    fontSize: 12,
    fontFamily: 'Poppins',
  },
  questionSection: {
    marginTop: 20,
    padding: 15,
  },
  questionInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d3130',
    borderRadius: 10,
    marginTop: 10,
    padding: 5,
  },
  questionInput: {
    flex: 1,
    color: '#FFFFFF',
    fontFamily: 'Poppins',
    fontSize: 16,
    padding: 10,
  },
  askButton: {
    backgroundColor: '#3168d8',
    borderRadius: 8,
    padding: 10,
    marginLeft: 10,
  },
  answerContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#2d3130',
    borderRadius: 10,
  },
  answerText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins',
    fontSize: 16,
    lineHeight: 24,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 8,
    backgroundColor: '#1c2120',
    borderRadius: 8,
  },
  confidenceScore: {
    color: '#3168d8',
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confidenceLabel: {
    color: '#666666',
    fontFamily: 'Poppins',
    fontSize: 14,
    marginLeft: 8,
  },
  excerptContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#1c2120',
    borderRadius: 8,
  },
  excerptText: {
    color: '#CCCCCC',
    fontFamily: 'Poppins',
    fontSize: 14,
    lineHeight: 20,
  },
  credibilityBadge: {
    backgroundColor: 'rgba(49,104,216,0.1)',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  credibilityScore: {
    color: '#3168d8',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Poppins',
  },
  credibilityLabel: {
    color: '#3168d8',
    fontSize: 12,
    fontFamily: 'Poppins',
  },
  bottomSpacer: {
    height: 100,
  },
  loadMoreButton: {
    backgroundColor: 'rgba(49,104,216,0.1)',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  loadMoreText: {
    color: '#3168d8',
    fontSize: 14,
    fontFamily: 'Poppins',
  },
  factItem: {
    marginTop: 8,
  },
  factText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins',
    lineHeight: 20,
  },
  credibilitySection: {
    marginBottom: 20,
  },
  keywordsSection: {
    marginBottom: 20,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  keywordBadge: {
    backgroundColor: 'rgba(49,104,216,0.1)',
    padding: 8,
    borderRadius: 8,
    marginRight: 5,
    marginBottom: 5,
  },
  keywordText: {
    color: '#3168d8',
    fontSize: 12,
    fontFamily: 'Poppins',
  },
  insightsSection: {
    marginBottom: 20,
  },
  previewSection: {
    marginBottom: 20,
  },
  previewText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins',
  },
});

export default URLSearchPage; 