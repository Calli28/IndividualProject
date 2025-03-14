const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const pool = require('./dbConfig');
const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;
const fetch = require('node-fetch');
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: 'your-api-key' }); // Replace with your API key

const app = express();
const parser = new Parser({
    customFields: {
        item: [
            ['media:content', 'media'],
            ['media:thumbnail', 'thumbnail'],
            ['enclosure', 'enclosure']
        ]
    }
});

// Configure CORS properly
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Accept']
}));

// Ensure JSON parsing is configured
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Log all requests
app.use((req, res, next) => {
    console.log('Received request:', req.method, req.url);
    next();
});

// Test endpoint
app.get('/test', (req, res) => {
    res.json({ message: 'Server is running' });
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        console.log('Login attempt:', req.body);
        const { email, password } = req.body;

        // Query the database
        const user = await pool.query(
            'SELECT * FROM users_t WHERE email = $1',
            [email]
        );

        if (user.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        res.json({
            message: 'Login successful',
            user: {
                id: user.rows[0].id,
                firstName: user.rows[0].first_name,
                lastName: user.rows[0].last_name,
                email: user.rows[0].email
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Comprehensive list of news sources from around the world
const newsSources = [
    // Global News Agencies
    {
        name: 'Reuters',
        url: 'https://www.reuters.com/world',
        rss: 'https://www.reutersagency.com/feed/?best-topics=all&post_type=best'
    },
    {
        name: 'Associated Press',
        url: 'https://apnews.com',
        rss: 'https://feeds.apnews.com/rss/world'
    },
    {
        name: 'AFP',
        url: 'https://www.afp.com/en',
        rss: 'https://www.afp.com/en/news/feed'
    },

    // North America
    {
        name: 'New York Times',
        url: 'https://www.nytimes.com/section/world',
        rss: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml'
    },
    {
        name: 'Washington Post',
        url: 'https://www.washingtonpost.com/world',
        rss: 'http://feeds.washingtonpost.com/rss/world'
    },
    {
        name: 'Wall Street Journal',
        url: 'https://www.wsj.com/news/world',
        rss: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml'
    },
    {
        name: 'CBC News',
        url: 'https://www.cbc.ca/news/world',
        rss: 'https://www.cbc.ca/cmlink/rss-world'
    },

    // Europe
    {
        name: 'BBC News',
        url: 'https://www.bbc.com/news',
        rss: 'http://feeds.bbci.co.uk/news/world/rss.xml'
    },
    {
        name: 'The Guardian',
        url: 'https://www.theguardian.com/international',
        rss: 'https://www.theguardian.com/international/rss'
    },
    {
        name: 'Deutsche Welle',
        url: 'https://www.dw.com/en/',
        rss: 'https://rss.dw.com/rdf/rss-en-all'
    },
    {
        name: 'France 24',
        url: 'https://www.france24.com/en/',
        rss: 'https://www.france24.com/en/rss'
    },
    {
        name: 'EuroNews',
        url: 'https://www.euronews.com',
        rss: 'https://www.euronews.com/rss'
    },

    // Asia
    {
        name: 'Al Jazeera',
        url: 'https://www.aljazeera.com',
        rss: 'https://www.aljazeera.com/xml/rss/all.xml'
    },
    {
        name: 'South China Morning Post',
        url: 'https://www.scmp.com',
        rss: 'https://www.scmp.com/rss/91/feed'
    },
    {
        name: 'The Japan Times',
        url: 'https://www.japantimes.co.jp',
        rss: 'https://www.japantimes.co.jp/feed/'
    },
    {
        name: 'The Times of India',
        url: 'https://timesofindia.indiatimes.com',
        rss: 'https://timesofindia.indiatimes.com/rssfeeds/296589292.cms'
    },
    {
        name: 'The Straits Times',
        url: 'https://www.straitstimes.com',
        rss: 'https://www.straitstimes.com/news/world/rss.xml'
    },

    // Australia & Pacific
    {
        name: 'ABC News Australia',
        url: 'https://www.abc.net.au/news',
        rss: 'https://www.abc.net.au/news/feed/45910/rss.xml'
    },
    {
        name: 'New Zealand Herald',
        url: 'https://www.nzherald.co.nz',
        rss: 'https://www.nzherald.co.nz/rss/world'
    },

    // Africa
    {
        name: 'News24',
        url: 'https://www.news24.com',
        rss: 'https://feeds.24.com/articles/news24/World/rss'
    },
    {
        name: 'AllAfrica',
        url: 'https://allafrica.com',
        rss: 'https://allafrica.com/tools/headlines/rdf/latest/headlines.rdf'
    },

    // Middle East
    {
        name: 'The Jerusalem Post',
        url: 'https://www.jpost.com',
        rss: 'https://www.jpost.com/rss/rssfeed.aspx'
    },
    {
        name: 'Arab News',
        url: 'https://www.arabnews.com',
        rss: 'https://www.arabnews.com/rss.xml'
    },

    // Latin America
    {
        name: 'Buenos Aires Times',
        url: 'https://www.batimes.com.ar',
        rss: 'https://www.batimes.com.ar/feed/rss'
    },
    {
        name: 'The Rio Times',
        url: 'https://www.riotimesonline.com',
        rss: 'https://www.riotimesonline.com/feed/'
    },

    // Technology News
    {
        name: 'TechCrunch',
        url: 'https://techcrunch.com',
        rss: 'https://techcrunch.com/feed/'
    },
    {
        name: 'The Verge',
        url: 'https://www.theverge.com',
        rss: 'https://www.theverge.com/rss/index.xml'
    },
    {
        name: 'Wired',
        url: 'https://www.wired.com',
        rss: 'https://www.wired.com/feed/rss'
    },

    // Business News
    {
        name: 'Financial Times',
        url: 'https://www.ft.com',
        rss: 'https://www.ft.com/world?format=rss'
    },
    {
        name: 'Bloomberg',
        url: 'https://www.bloomberg.com',
        rss: 'https://www.bloomberg.com/feeds/bbiz/sitemap_index.xml'
    },
    {
        name: 'Forbes',
        url: 'https://www.forbes.com',
        rss: 'https://www.forbes.com/real-time/feed2/'
    },

    // UAE News Sources
    {
        name: 'Khaleej Times',
        url: 'https://www.khaleejtimes.com',
        rss: 'https://www.khaleejtimes.com/rss'
    },
    {
        name: 'Gulf News',
        url: 'https://gulfnews.com',
        rss: 'https://gulfnews.com/rss'
    },
    {
        name: 'The National UAE',
        url: 'https://www.thenationalnews.com',
        rss: 'https://www.thenationalnews.com/rss'
    },
    {
        name: 'Emirates 24/7',
        url: 'https://www.emirates247.com',
        rss: 'https://www.emirates247.com/rss'
    },
    {
        name: 'Dubai Eye',
        url: 'https://www.dubaieye1038.com',
        rss: 'https://www.dubaieye1038.com/feed/'
    },

    // Indian News Sources
    {
        name: 'Times of India',
        url: 'https://timesofindia.indiatimes.com',
        rss: 'https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms'
    },
    {
        name: 'NDTV',
        url: 'https://www.ndtv.com',
        rss: 'https://feeds.feedburner.com/ndtvnews-top-stories'
    },
    {
        name: 'Hindustan Times',
        url: 'https://www.hindustantimes.com',
        rss: 'https://www.hindustantimes.com/rss/top-news'
    },
    {
        name: 'The Hindu',
        url: 'https://www.thehindu.com',
        rss: 'https://www.thehindu.com/rss/top-news/'
    },
    {
        name: 'Indian Express',
        url: 'https://indianexpress.com',
        rss: 'https://indianexpress.com/feed/'
    },
    {
        name: 'Economic Times',
        url: 'https://economictimes.indiatimes.com',
        rss: 'https://economictimes.indiatimes.com/rssfeedsdefault.cms'
    },
    {
        name: 'Mint',
        url: 'https://www.livemint.com',
        rss: 'https://www.livemint.com/rss'
    },
    {
        name: 'Business Standard',
        url: 'https://www.business-standard.com',
        rss: 'https://www.business-standard.com/rss/latest.rss'
    },
    {
        name: 'News18',
        url: 'https://www.news18.com',
        rss: 'https://www.news18.com/rss/latest.xml'
    },
    {
        name: 'India Today',
        url: 'https://www.indiatoday.in',
        rss: 'https://www.indiatoday.in/rss/home'
    },

    // Regional Indian News (Multiple Languages)
    {
        name: 'Dainik Bhaskar',
        url: 'https://www.bhaskar.com',
        rss: 'https://www.bhaskar.com/rss-feed/521/'
    },
    {
        name: 'Malayala Manorama',
        url: 'https://www.manoramaonline.com',
        rss: 'https://www.manoramaonline.com/news.rss'
    },
    {
        name: 'Mathrubhumi',
        url: 'https://www.mathrubhumi.com',
        rss: 'https://www.mathrubhumi.com/rss'
    },
    {
        name: 'Lokmat',
        url: 'https://www.lokmat.com',
        rss: 'https://www.lokmat.com/rss/'
    },

    // UAE Business News
    {
        name: 'Arabian Business',
        url: 'https://www.arabianbusiness.com',
        rss: 'https://www.arabianbusiness.com/rss'
    },
    {
        name: 'Zawya UAE',
        url: 'https://www.zawya.com/uae',
        rss: 'https://www.zawya.com/uae/en/rss'
    },
    {
        name: 'UAE News 4U',
        url: 'https://uaenews4u.com',
        rss: 'https://uaenews4u.com/feed/'
    }
];

// Browser-like headers to avoid blocking
const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
};

// Helper function to extract image URL from various formats
function extractImageUrl(item) {
    if (item.media && item.media.$ && item.media.$.url) {
        return item.media.$.url;
    }
    if (item.thumbnail && item.thumbnail.$.url) {
        return item.thumbnail.$.url;
    }
    if (item.enclosure && item.enclosure.url) {
        return item.enclosure.url;
    }
    if (item['media:content'] && item['media:content'].$.url) {
        return item['media:content'].$.url;
    }
    return null;
}

// Helper function to extract all images from HTML content
async function extractImagesFromContent(url) {
    try {
        const response = await axios.get(url, { headers, timeout: 5000 });
        const $ = cheerio.load(response.data);
        const images = [];

        // Look for article images
        $('article img, .article-content img, .story-content img, .main-content img').each((i, element) => {
            const src = $(element).attr('src') || $(element).attr('data-src');
            const alt = $(element).attr('alt');
            if (src && !src.includes('icon') && !src.includes('logo')) {
                images.push({
                    url: src.startsWith('http') ? src : `https:${src}`,
                    alt: alt || 'Article image'
                });
            }
        });

        // Look for Open Graph images
        const ogImage = $('meta[property="og:image"]').attr('content');
        if (ogImage) {
            images.push({
                url: ogImage.startsWith('http') ? ogImage : `https:${ogImage}`,
                alt: 'Featured image'
            });
        }

        return images;
    } catch (error) {
        console.error(`Error extracting images from ${url}:`, error.message);
        return [];
    }
}

async function fetchNewsFromRSS(source) {
    try {
        const feed = await parser.parseURL(source.rss);
        const articles = await Promise.all(feed.items.map(async item => {
            let images = [];
            
            // Try to get image from RSS first
            const rssImage = extractImageUrl(item);
            if (rssImage) {
                images.push({
                    url: rssImage,
                    alt: 'RSS image'
                });
            }

            // Try to get additional images from the article
            if (item.link) {
                const contentImages = await extractImagesFromContent(item.link);
                images = [...images, ...contentImages];
            }

            return {
                id: Math.random().toString(36).substr(2, 9),
                title: item.title,
                description: item.contentSnippet || item.description || 'Click to read more...',
                url: item.link,
                source: source.name,
                publishedAt: item.pubDate || new Date().toISOString(),
                images: images.filter(img => img.url), // Filter out any invalid images
                category: item.categories?.[0] || 'General',
                author: item.creator || item.author || 'Unknown'
            };
        }));

        return articles;
    } catch (error) {
        console.error(`Error fetching RSS from ${source.name}:`, error.message);
        return [];
    }
}

async function scrapeWebsite(source) {
    try {
        const response = await axios.get(source.url, { headers, timeout: 10000 });
        const $ = cheerio.load(response.data);
        const articles = [];

        // Enhanced article scraping with images
        $('article, .article, .story, .news-item, .post, .item, .entry').each(async (i, element) => {
            const title = $(element).find('h1, h2, h3, .title, .headline').first().text().trim();
            let url = $(element).find('a').first().attr('href');
            const description = $(element).find('p, .description, .summary, .excerpt').first().text().trim();
            const category = $(element).find('.category, .tag, .section').first().text().trim() || 'General';
            const author = $(element).find('.author, .byline').first().text().trim() || 'Unknown';

            if (title && url) {
                // Ensure URL is absolute
                if (!url.startsWith('http')) {
                    url = new URL(url, source.url).href;
                }

                // Collect all images from the article
                const images = [];
                $(element).find('img').each((i, img) => {
                    const src = $(img).attr('src') || $(img).attr('data-src');
                    const alt = $(img).attr('alt');
                    if (src && !src.includes('icon') && !src.includes('logo')) {
                        images.push({
                            url: src.startsWith('http') ? src : `https:${src}`,
                            alt: alt || 'Article image'
                        });
                    }
                });

                articles.push({
                    id: Math.random().toString(36).substr(2, 9),
                    title,
                    description: description || 'Click to read more...',
                    url,
                    source: source.name,
                    publishedAt: new Date().toISOString(),
                    images: images.filter(img => img.url),
                    category,
                    author
                });
            }
        });

        return articles;
    } catch (error) {
        console.error(`Error scraping ${source.name}:`, error.message);
        return [];
    }
}

app.get('/trending', async (req, res) => {
    try {
        console.log('Starting news collection...');
        let allArticles = [];

        // Fetch news from all sources in parallel
        const promises = newsSources.map(async (source) => {
            try {
                const [rssArticles, scrapedArticles] = await Promise.all([
                    fetchNewsFromRSS(source),
                    scrapeWebsite(source)
                ]);
                return [...rssArticles, ...scrapedArticles];
            } catch (error) {
                console.error(`Error fetching from ${source.name}:`, error.message);
                return [];
            }
        });

        const results = await Promise.all(promises);
        allArticles = results.flat();

        // Sort by date only, keep all articles
        const sortedArticles = allArticles.sort((a, b) => 
            new Date(b.publishedAt) - new Date(a.publishedAt)
        );

        console.log(`Successfully collected ${sortedArticles.length} articles`);
        res.json(sortedArticles);

    } catch (error) {
        console.error('Error in /trending:', error);
        res.status(500).json({ 
            error: 'Failed to fetch news',
            message: error.message 
        });
    }
});

// Search endpoint with expanded functionality
app.get('/search', async (req, res) => {
    try {
        const { q, source, category } = req.query;
        if (!q && !source && !category) {
            return res.status(400).json({ error: 'Search parameters required' });
        }

        const allArticles = await Promise.all(
            newsSources.map(source => scrapeWebsite(source))
        );

        let searchResults = allArticles.flat();

        // Apply filters if provided
        if (q) {
            searchResults = searchResults.filter(article => 
                article.title.toLowerCase().includes(q.toLowerCase()) ||
                article.description.toLowerCase().includes(q.toLowerCase())
            );
        }

        if (source) {
            searchResults = searchResults.filter(article => 
                article.source.toLowerCase().includes(source.toLowerCase())
            );
        }

        if (category) {
            searchResults = searchResults.filter(article => 
                article.category.toLowerCase().includes(category.toLowerCase())
            );
        }

        // Sort by date
        searchResults.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

        res.json(searchResults);

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

// URL checking endpoint with better error handling
app.post('/check-url', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                error: 'URL is required',
                message: 'Please provide a valid URL'
            });
        }

        const response = await axios({
            method: 'get',
            url: url,
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const html = response.data;
        const $ = cheerio.load(html);

        // Remove ads and unnecessary content
        $('script, style, iframe, .ad, .advertisement, .social-share, .related-posts, #sidebar, .sidebar, .comments, .footer, nav, header').remove();
        
        // Try to find the main article content using common selectors
        const articleSelectors = [
            'article',
            '[role="article"]',
            '.article-content',
            '.post-content',
            '.entry-content',
            '.story-content',
            '.article-body',
            'main p',
            '.main-content'
        ];

        let content = '';
        let mainContentFound = false;

        // Try each selector until we find content
        for (const selector of articleSelectors) {
            const articleContent = $(selector).text().trim();
            if (articleContent.length > 200) { // Minimum content length threshold
                content = articleContent;
                mainContentFound = true;
                break;
            }
        }

        // Fallback to paragraphs if no main content found
        if (!mainContentFound) {
            content = $('p').map((_, el) => $(el).text().trim())
                .get()
                .filter(text => text.length > 50) // Filter out short paragraphs
                .join(' ');
        }

        // Clean the content
        content = content
            .replace(/\s+/g, ' ')
            .replace(/\[.*?\]/g, '') // Remove square brackets content
            .replace(/advertisement/gi, '') // Remove advertisement text
            .trim();

        // Calculate credibility score
        const credibilityScore = calculateArticleCredibility($, url, content);

        // Generate credibility insights
        const credibilityInsights = generateCredibilityInsights($, url, content, credibilityScore);

        const response_data = {
            url,
            contentPreview: content.slice(0, 2000),
            content: content.slice(0, 5000),
            credibilityScore: credibilityScore.total,
            credibilityBreakdown: credibilityScore.breakdown,
            insights: credibilityInsights,
            analysisDate: new Date().toISOString()
        };

        res.json(response_data);

    } catch (error) {
        console.error('Error analyzing URL:', error);
        res.status(500).json({
            error: 'Analysis failed',
            message: 'Failed to analyze the URL. Please try again.',
            details: error.message
        });
    }
});

function calculateArticleCredibility($, url, content) {
    let score = {
        total: 0,
        breakdown: {}
    };

    // Source credibility (0-25 points)
    score.breakdown.source = 0;
    if (url.includes('https')) score.breakdown.source += 5;
    if (url.match(/\.(gov|edu)$/)) score.breakdown.source += 20;
    else if (url.match(/\.(org|com)$/)) score.breakdown.source += 10;
    
    // Content quality (0-25 points)
    score.breakdown.content = 0;
    if (content.length > 1500) score.breakdown.content += 10;
    if (content.match(/\d{4}/)) score.breakdown.content += 5; // Contains years
    if (content.match(/[A-Z][a-z]+ [A-Z][a-z]+/)) score.breakdown.content += 5; // Contains proper names
    if (content.match(/\d+%/)) score.breakdown.content += 5; // Contains percentages

    // Citations and sources (0-25 points)
    score.breakdown.citations = 0;
    const citationPhrases = [
        'according to',
        'cited by',
        'reported by',
        'study shows',
        'research indicates',
        'experts say',
        'sources confirm'
    ];
    citationPhrases.forEach(phrase => {
        if (content.toLowerCase().includes(phrase)) {
            score.breakdown.citations += 5;
        }
    });
    score.breakdown.citations = Math.min(25, score.breakdown.citations);

    // Factual indicators (0-25 points)
    score.breakdown.factual = 0;
    const factualIndicators = [
        'data shows',
        'statistics indicate',
        'survey results',
        'evidence suggests',
        'analysis reveals'
    ];
    factualIndicators.forEach(indicator => {
        if (content.toLowerCase().includes(indicator)) {
            score.breakdown.factual += 5;
        }
    });
    score.breakdown.factual = Math.min(25, score.breakdown.factual);

    // Calculate total score
    score.total = Math.min(100, Object.values(score.breakdown).reduce((a, b) => a + b, 0));

    return score;
}

function generateCredibilityInsights($, url, content, score) {
    const insights = [];

    // Source insights
    if (score.breakdown.source > 15) {
        insights.push('High credibility source domain');
    } else if (score.breakdown.source > 5) {
        insights.push('Moderate credibility source domain');
    }

    // Content insights
    if (score.breakdown.content > 15) {
        insights.push('Article contains detailed information with dates and statistics');
    }

    // Citation insights
    if (score.breakdown.citations > 15) {
        insights.push('Multiple credible sources cited');
    } else if (score.breakdown.citations > 5) {
        insights.push('Some sources referenced');
    }

    // Factual content insights
    if (score.breakdown.factual > 15) {
        insights.push('Strong factual evidence and data presented');
    } else if (score.breakdown.factual > 5) {
        insights.push('Contains some factual indicators');
    }

    // Overall assessment
    if (score.total >= 80) {
        insights.push('High credibility article with strong sourcing and evidence');
    } else if (score.total >= 60) {
        insights.push('Moderately credible article with some supporting evidence');
    } else {
        insights.push('Limited credibility indicators found - verify with additional sources');
    }

    return insights;
}

// Helper function to analyze credibility
async function analyzeCredibility({ title, content, url, keywords }) {
    try {
        let score = 70; // Base score

        // URL analysis
        const domain = new URL(url).hostname;
        const reputableDomains = [
            'reuters.com', 'apnews.com', 'bbc.com', 'theguardian.com',
            'nytimes.com', 'wsj.com', 'bloomberg.com', 'aljazeera.com'
        ];
        
        if (reputableDomains.some(d => domain.includes(d))) {
            score += 15;
        }

        // Content analysis
        if (content) {
            const contentLength = content.length;
            if (contentLength > 2000) score += 5;
            if (contentLength > 4000) score += 5;
            if (contentLength < 500) score -= 10;
            if (contentLength < 200) score -= 10;
        }

        // Title analysis
        if (title) {
            const clickbaitPhrases = [
                'you won\'t believe', 'shocking', 'mind-blowing', 
                'amazing', 'incredible', 'unbelievable', '...', '!!'
            ];
            const hasClickbait = clickbaitPhrases.some(phrase => 
                title.toLowerCase().includes(phrase)
            );
            if (hasClickbait) score -= 15;
        }

        // Keywords analysis
        if (keywords && keywords.length >= 5) {
            score += 5;
        }

        // Normalize score
        return Math.max(0, Math.min(100, Math.round(score)));
    } catch (error) {
        console.error('Error in credibility analysis:', error);
        return 50; // Default score on error
    }
}

// Helper function to search for related articles
async function searchNewsAPIs(keyword) {
    try {
        const articles = [];
        const searchPromises = newsSources.slice(0, 5).map(async source => {
            try {
                const response = await axios.get(source.url, { 
                    headers,
                    timeout: 5000
                });
                const $ = cheerio.load(response.data);
                
                $('article, .article').each((i, element) => {
                    const articleText = $(element).text();
                    if (articleText.toLowerCase().includes(keyword.toLowerCase())) {
                        articles.push({
                            title: $(element).find('h1, h2, h3, .title').first().text().trim(),
                            url: $(element).find('a').first().attr('href'),
                            source: source.name,
                            date: new Date().toISOString()
                        });
                    }
                });
            } catch (error) {
                console.error(`Error searching ${source.name}:`, error.message);
            }
        });

        await Promise.all(searchPromises);
        return articles.filter(article => article.title && article.url);
    } catch (error) {
        console.error('Error in searchNewsAPIs:', error);
        return [];
    }
}

// Add this function at the top level
function getQuestionType(question) {
    const q = question.toLowerCase();
    if (q.startsWith('what')) return 'what';
    if (q.startsWith('who')) return 'who';
    if (q.startsWith('when')) return 'when';
    if (q.startsWith('where')) return 'where';
    if (q.startsWith('why')) return 'why';
    if (q.startsWith('how')) return 'how';
    return 'general';
}

app.post('/ask-article', async (req, res) => {
    try {
        const { question, articleContent } = req.body;
        
        if (!question || !articleContent) {
            return res.status(400).json({
                error: 'Missing data',
                message: 'Please provide both question and article content'
            });
        }

        // Clean and prepare the content
        const cleanContent = articleContent
            .replace(/\s+/g, ' ')
            .trim();

        // Split content into sentences
        const sentences = cleanContent
            .split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 20);

        // Prepare question keywords
        const questionWords = question.toLowerCase()
            .split(/\W+/)
            .filter(word => 
                word.length > 2 && 
                !['what', 'who', 'when', 'where', 'why', 'how', 'is', 'are', 'was', 'were', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of'].includes(word)
            );

        // Find relevant sentences
        const relevantSentences = sentences.filter(sentence => {
            const sentenceWords = sentence.toLowerCase().split(/\W+/);
            return questionWords.some(word => sentenceWords.includes(word));
        });

        // Get surrounding context for each relevant sentence
        const contextSentences = new Set();
        relevantSentences.forEach(sentence => {
            const index = sentences.indexOf(sentence);
            if (index > 0) contextSentences.add(sentences[index - 1]);
            contextSentences.add(sentence);
            if (index < sentences.length - 1) contextSentences.add(sentences[index + 1]);
        });

        // Construct the answer
        let answer = '';
        if (relevantSentences.length > 0) {
            // Determine question type
            const questionType = question.toLowerCase().split(' ')[0];
            
            switch(questionType) {
                case 'what':
                    answer = `Based on the article, ${relevantSentences[0]}`;
                    if (relevantSentences.length > 1) {
                        answer += ` Furthermore, ${relevantSentences[1]}`;
                    }
                    break;
                    
                case 'who':
                    const namePattern = /[A-Z][a-z]+ [A-Z][a-z]+/;
                    const nameMatch = relevantSentences.find(s => namePattern.test(s));
                    answer = nameMatch ? 
                        `The article mentions that ${nameMatch}` : 
                        `According to the article, ${relevantSentences[0]}`;
                    break;
                    
                case 'when':
                    const timePattern = /\b\d{4}\b|\b(January|February|March|April|May|June|July|August|September|October|November|December)\b|\b\d{1,2}(st|nd|rd|th)\b/;
                    const timeMatch = relevantSentences.find(s => timePattern.test(s));
                    answer = timeMatch ? 
                        `The article indicates that ${timeMatch}` : 
                        `According to the article, ${relevantSentences[0]}`;
                    break;
                    
                case 'where':
                    const locationPattern = /\b[A-Z][a-z]+(,\s*[A-Z][a-z]+)*\b/;
                    const locationMatch = relevantSentences.find(s => locationPattern.test(s));
                    answer = locationMatch ? 
                        `The location mentioned in the article is: ${locationMatch}` : 
                        `According to the article, ${relevantSentences[0]}`;
                    break;
                    
                case 'why':
                    const causalPatterns = ['because', 'due to', 'as a result', 'therefore', 'since'];
                    const causalMatch = relevantSentences.find(s => 
                        causalPatterns.some(pattern => s.toLowerCase().includes(pattern))
                    );
                    answer = causalMatch ? 
                        `The article explains that ${causalMatch}` : 
                        `Based on the article, ${relevantSentences.join(' ')}`;
                    break;
                    
                case 'how':
                    answer = `The article describes that ${relevantSentences.join(' ')}`;
                    break;
                    
                default:
                    answer = `According to the article: ${relevantSentences.join(' ')}`;
            }
        } else {
            answer = "I couldn't find a specific answer to this question in the article. Try rephrasing your question or check if the article contains this information.";
        }

        // Calculate confidence score
        const confidence = Math.min(100, Math.round(
            (relevantSentences.length * 20) + 
            (questionWords.length * 10) + 
            (contextSentences.size * 5)
        ));

        res.json({
            question,
            answer,
            confidence,
            relevantExcerpts: Array.from(contextSentences).slice(0, 3),
            keywordsFound: questionWords,
            analysisDate: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error processing question:', error);
        res.status(500).json({
            error: 'Failed to process question',
            message: error.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Available endpoints:');
    console.log(`http://192.168.0.170:${PORT}/check-url (POST)`);
    console.log(`http://192.168.0.170:${PORT}/test (GET)`);
});

// Keep the server alive
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
});

// Export app for testing
module.exports = app;