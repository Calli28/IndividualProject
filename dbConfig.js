const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    password: 'C@llistaden2812',
    host: 'localhost',
    port: 5432,
    database: 'postgres'
});

// Test the pool connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Database connected successfully');
    }
});

module.exports = pool; 