import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SavedArticlesContext = createContext();

export const SavedArticlesProvider = ({ children }) => {
    const [savedArticles, setSavedArticles] = useState([]);

    useEffect(() => {
        loadSavedArticles();
    }, []);

    const loadSavedArticles = async () => {
        try {
            const saved = await AsyncStorage.getItem('savedArticles');
            if (saved) {
                setSavedArticles(JSON.parse(saved));
            }
        } catch (error) {
            console.error('Error loading saved articles:', error);
        }
    };

    const saveArticle = async (article) => {
        try {
            const updatedArticles = [...savedArticles, { ...article, savedAt: new Date().toISOString() }];
            await AsyncStorage.setItem('savedArticles', JSON.stringify(updatedArticles));
            setSavedArticles(updatedArticles);
            return true;
        } catch (error) {
            console.error('Error saving article:', error);
            return false;
        }
    };

    const removeArticle = async (articleId) => {
        try {
            const updatedArticles = savedArticles.filter(article => article.id !== articleId);
            await AsyncStorage.setItem('savedArticles', JSON.stringify(updatedArticles));
            setSavedArticles(updatedArticles);
            return true;
        } catch (error) {
            console.error('Error removing article:', error);
            return false;
        }
    };

    const isArticleSaved = (articleId) => {
        return savedArticles.some(article => article.id === articleId);
    };

    return (
        <SavedArticlesContext.Provider 
            value={{
                savedArticles,
                saveArticle,
                removeArticle,
                isArticleSaved,
            }}
        >
            {children}
        </SavedArticlesContext.Provider>
    );
};

// Create a custom hook for using the context
export const useSavedArticles = () => {
    const context = useContext(SavedArticlesContext);
    if (context === undefined) {
        throw new Error('useSavedArticles must be used within a SavedArticlesProvider');
    }
    return context;
}; 