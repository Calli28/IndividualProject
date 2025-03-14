const axios = require('axios');
const cheerio = require('cheerio');

class NewsScraper {
    constructor() {
        this.articles = [];
        this.newspapers = [
            {
                name: 'bbc',
                address: 'https://www.bbc.com/news',
                base: 'https://www.bbc.com',
                articleSelector: '.gs-c-promo-heading',
                titleSelector: '.gs-c-promo-heading__title',
                imageSelector: 'img',
                descriptionSelector: '.gs-c-promo-summary'
            },
            {
                name: 'reuters',
                address: 'https://www.reuters.com',
                base: 'https://www.reuters.com',
                articleSelector: '.media-story-card',
                titleSelector: '.media-story-card__heading__eqhp9',
                imageSelector: 'img',
                descriptionSelector: '.media-story-card__description__3xbK_'
            }
        ];
    }

    async scrapeNews() {
        try {
            const promises = this.newspapers.map(async newspaper => {
                const response = await axios.get(newspaper.address);
                const html = response.data;
                const $ = cheerio.load(html);

                $(newspaper.articleSelector).each((i, element) => {
                    const title = $(element).find(newspaper.titleSelector).text().trim();
                    const url = $(element).attr('href');
                    const image = $(element).find(newspaper.imageSelector).attr('src');
                    const description = $(element).find(newspaper.descriptionSelector).text().trim();

                    if (title && url) {
                        this.articles.push({
                            id: Math.random().toString(36).substr(2, 9),
                            title,
                            url: url.includes('http') ? url : `${newspaper.base}${url}`,
                            image,
                            description,
                            source: newspaper.name,
                            timestamp: new Date()
                        });
                    }
                });
            });

            await Promise.all(promises);
            return this.articles;
        } catch (error) {
            console.error('Scraping error:', error);
            throw error;
        }
    }

    searchNews(query) {
        return this.articles.filter(article => 
            article.title.toLowerCase().includes(query.toLowerCase()) ||
            article.description.toLowerCase().includes(query.toLowerCase())
        );
    }

    getTrendingNews() {
        return this.articles
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 10);
    }
}

module.exports = new NewsScraper(); 