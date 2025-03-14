const express = require('express');
const router = express.Router();
const pool = require('../dbConfig');
const bcrypt = require('bcrypt');

// Register endpoint
router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ message: 'Please fill in all fields' });
        }

        const emailCheck = await pool.query('SELECT * FROM users_t WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) {
            return res.status(409).json({ message: 'Email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const query = 'INSERT INTO users_t (first_name, last_name, email, password) VALUES ($1, $2, $3, $4) RETURNING id';
        const values = [firstName, lastName, email, hashedPassword];
        const result = await pool.query(query, values);

        res.status(201).json({ message: 'Registration successful', userId: result.rows[0].id });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Registration failed', error: error.message });
    }
});

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        const query = 'SELECT id, first_name, last_name, email, password FROM users_t WHERE email = $1';
        const result = await pool.query(query, [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (passwordMatch) {
            delete user.password;
            res.status(200).json({ message: 'Login successful', user });
        } else {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
});

module.exports = router; 