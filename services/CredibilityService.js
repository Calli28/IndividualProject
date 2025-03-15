class CredibilityService {
    constructor() {
        // Training data for fake news detection
        this.trainingData = {
            fake: new Set([
                "you won't believe",
                "shocking revelation",
                "miracle cure",
                "conspiracy theory",
                "explosive truth",
                "secret they don't want you to know",
                "doctors hate this",
                "what they aren't telling you",
                "this one weird trick",
                "anonymous sources claim"
            ]),
            real: new Set([
                "according to research",
                "study shows",
                "evidence suggests",
                "experts say",
                "data indicates",
                "official statement",
                "research published",
                "sources confirmed",
                "analysis reveals",
                "statistics show"
            ])
        };

        // Source reputation scores
        this.sourceReputationScores = {
            // Tier 1: Most Reliable (90-95)
            'reuters.com': 95,
            'apnews.com': 95,
            'bloomberg.com': 92,
            'afp.com': 92,
            
            // Tier 2: Highly Reliable (85-89)
            'bbc.com': 89,
            'nytimes.com': 88,
            'washingtonpost.com': 88,
            'theguardian.com': 87,
            'wsj.com': 87,
            'economist.com': 87,
            
            // Tier 3: Generally Reliable (80-84)
            'npr.org': 84,
            'time.com': 83,
            'theatlantic.com': 82,
            'latimes.com': 82,
            
            // Fact-Checking Sites (90-95)
            'snopes.com': 93,
            'factcheck.org': 93,
            'politifact.com': 92
        };

        // Content analysis patterns
        this.contentPatterns = {
            clickbait: [
                'you won\'t believe',
                'shocking',
                'mind-blowing',
                'incredible',
                'amazing',
                'secret',
                'miracle',
                'hack',
                'they don\'t want you to know',
                'what happens next will'
            ],
            credible: [
                'according to',
                'research shows',
                'study finds',
                'evidence suggests',
                'data indicates',
                'experts say',
                'analysis reveals',
                'investigation found',
                'sources confirm',
                'reports indicate'
            ],
            balanced: [
                'however',
                'although',
                'nevertheless',
                'on the other hand',
                'conversely',
                'despite this',
                'in contrast',
                'alternatively',
                'while',
                'whereas'
            ]
        };

        // Sensational words commonly found in fake news
        this.sensationalWords = new Set([
            "shocking", "unbelievable", "breaking", "miracle", "exposed", 
            "scandal", "shocker", "horrifying", "destroyed", "epic", 
            "crisis", "deadly", "banned", "conspiracy", "secret", "revealed"
        ]);

        // Common English stopwords
        this.stopwords = new Set([
            "a", "an", "and", "are", "as", "at", "be", "by", "for", "from",
            "has", "he", "in", "is", "it", "its", "of", "on", "that", "the",
            "to", "was", "were", "will", "with", "the", "this", "but", "they",
            "have", "had", "what", "when", "where", "who", "which", "why", "how"
        ]);
    }

    preprocessText(text) {
        if (!text) return [];
        
        // Convert to lowercase
        text = text.toLowerCase();
        
        // Remove special characters and extra spaces
        text = text.replace(/[^\w\s]/g, ' ');
        text = text.replace(/\s+/g, ' ').trim();
        
        // Tokenize and remove stopwords
        const words = text.split(' ').filter(word => 
            word.length > 0 && !this.stopwords.has(word)
        );
        
        return words;
    }

    async calculateCredibilityScore(article) {
        try {
            if (!article.content) return 50;

            const text = article.content;
            const words = this.preprocessText(text);
            
            // Factor 1: Sensational Words Check
            const sensationalCount = words.filter(word => 
                this.sensationalWords.has(word)
            ).length;
            
            // Factor 2: Excessive Capitalization & Exclamation Marks
            const capitalWords = text.split(' ').filter(word => 
                word === word.toUpperCase() && word.length > 1
            ).length;
            const exclamationCount = (text.match(/!/g) || []).length;
            
            // Factor 3: Lexical Diversity (unique words / total words)
            const uniqueWords = new Set(words).size;
            const totalWords = words.length;
            const lexicalDiversity = totalWords > 0 ? uniqueWords / totalWords : 0;
            
            // Factor 4: Length of Article
            const lengthScore = Math.min(1, totalWords / 300);
            
            // Factor 5: Source Reputation
            const sourceScore = this.evaluateSourceReputation(article.source);
            
            // Calculate base credibility score
            let credibilityScore = 100;
            credibilityScore -= sensationalCount * 5;    // Reduce for sensational words
            credibilityScore -= capitalWords * 3;        // Reduce for excessive caps
            credibilityScore -= exclamationCount * 2;    // Reduce for exclamations
            credibilityScore += lexicalDiversity * 20;   // Reward diversity
            credibilityScore += lengthScore * 10;        // Reward length
            credibilityScore = (credibilityScore + sourceScore) / 2; // Average with source score

            // Ensure score is between 0 and 100
            credibilityScore = Math.max(0, Math.min(100, credibilityScore));

            // Round to nearest integer
            return Math.round(credibilityScore);

        } catch (error) {
            console.error('Error calculating credibility score:', error);
            return 50; // Default neutral score
        }
    }

    evaluateSourceReputation(source) {
        if (!source) return 50;
        const domain = source.toLowerCase();
        return this.sourceReputationScores[domain] || 50;
    }

    getCredibilityLabel(score) {
        if (score >= 80) return { 
            text: 'Highly Reliable', 
            color: '#4CAF50',
            details: 'This article appears to be from a credible source and contains well-balanced content.'
        };
        if (score >= 70) return { 
            text: 'Reliable', 
            color: '#8BC34A',
            details: 'This article shows good indicators of reliability but may have some minor issues.'
        };
        if (score >= 60) return { 
            text: 'Somewhat Reliable', 
            color: '#FFC107',
            details: 'This article has mixed indicators of credibility. Verify claims from other sources.'
        };
        if (score >= 40) return { 
            text: 'Questionable', 
            color: '#FF9800',
            details: 'This article shows several warning signs of potential misinformation.'
        };
        return { 
            text: 'Unreliable', 
            color: '#FF4842',
            details: 'This article shows strong indicators of being unreliable or fake news.'
        };
    }

    getAnalysisDetails(article) {
        const words = this.preprocessText(article.content);
        return {
            wordCount: words.length,
            uniqueWords: new Set(words).size,
            sensationalWordsFound: words.filter(word => this.sensationalWords.has(word)),
            exclamationCount: (article.content.match(/!/g) || []).length,
            capitalizedWordCount: article.content.split(' ')
                .filter(word => word === word.toUpperCase() && word.length > 1).length
        };
    }
}

module.exports = new CredibilityService();