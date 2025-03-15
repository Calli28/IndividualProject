require('dotenv').config();
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
const similarity = require('string-similarity');
const CredibilityService = require('./services/CredibilityService');

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

// Configure axios with better defaults
const axiosInstance = axios.create({
    timeout: 10000, // 10 second timeout
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0'
    },
    validateStatus: function (status) {
        return status >= 200 && status < 500; // Accept all responses except 500+ errors
    }
});

// Add these headers to mimic a real browser
const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'max-age=0'
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
        const response = await axiosInstance.get(url);
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
        const response = await axiosInstance.get(source.url);
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

// Helper function to validate URLs
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Helper function to clean HTML content
function cleanHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

// Function to fetch and parse article content
async function fetchArticleContent(url) {
    try {
        console.log('Fetching article from:', url);
        const response = await axios.get(url, {
            headers: BROWSER_HEADERS,
            timeout: 10000
        });

        const html = response.data;
        const source = new URL(url).hostname;

        // Extract title (try different patterns)
        let title = '';
        const titlePatterns = [
            /<h1[^>]*>([^<]+)<\/h1>/i,
            /<title[^>]*>([^<]+)<\/title>/i,
            /<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i
        ];

        for (const pattern of titlePatterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
                title = cleanHtml(match[1]);
                break;
            }
        }

        // Extract content (try different patterns)
        let content = '';
        const contentPatterns = [
            /<article[^>]*>(.*?)<\/article>/is,
            /<div[^>]*class="[^"]*article[^"]*"[^>]*>(.*?)<\/div>/is,
            /<div[^>]*class="[^"]*content[^"]*"[^>]*>(.*?)<\/div>/is
        ];

        for (const pattern of contentPatterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
                content = cleanHtml(match[1]);
                if (content.length > 100) break;
            }
        }

        return {
            title: title || 'Untitled Article',
            content: content || 'No content available',
            source,
            url
        };
    } catch (error) {
        console.error('Error fetching article:', error.message);
        throw new Error('Failed to fetch article content');
    }
}

// Main route handler
app.post('/check-url', async (req, res) => {
    try {
        const { url } = req.body;
        console.log('Checking URL:', url);

        if (!url || !isValidUrl(url)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid URL' 
            });
        }

        // Step 1: Fetch article
        const article = await fetchArticleContent(url);
        console.log('Successfully fetched article:', article.title);

        // Step 2: Calculate credibility
        const credibilityScore = await CredibilityService.calculateCredibilityScore(article);
        const credibilityLabel = CredibilityService.getCredibilityLabel(credibilityScore);
        const analysisDetails = CredibilityService.getAnalysisDetails(article);

        // Add CORS headers to allow frontend access
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

        // Step 3: Send response with all necessary data
        res.json({
            success: true,
            data: {
                title: article.title,
                source: article.source,
                url: article.url,
                content: article.content,
                credibilityScore: credibilityScore,
                credibilityLabel: credibilityLabel,
                analysisDetails: analysisDetails,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error analyzing article:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to analyze article'
        });
    }
});

// Add CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
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