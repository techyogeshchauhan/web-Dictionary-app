const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const path = require('path');


const app = express();
const PORT = process.env.PORT || 3001;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Database connection
const db = mysql.createConnection({ 
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'dic'
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the MySQL database.');
});

// Serve the registration page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'register_Admin.html'));
});

// Handle form submission for registration
app.post('/register_admin', (req, res) => {
    const { first_name, last_name, username, password, email } = req.body;
    if (!first_name || !last_name || !username || !password || !email) {
        return res.status(400).send({ message: 'All fields are required' });
    }

    const checkQuery = 'SELECT * FROM admin_register WHERE email = ?';
    db.query(checkQuery, [email], (err, results) => {
        if (err) {
            console.error('Error checking user:', err);
            return res.status(500).send({ message: 'Database error' });
        }

        if (results.length > 0) {
            return res.status(409).send({ message: 'Email already exists' });
        } else {
            const query = 'INSERT INTO admin_register (first_name, last_name, username, password, email) VALUES (?, ?, ?, ?, ?)';
            db.query(query, [first_name, last_name, username, password, email], (err, results) => {
                if (err) {
                    console.error('Error adding user:', err);
                    return res.status(500).send({ message: 'Database error' });
                }
                res.json({ message: "User registered successfully" });
            });
        }
    });
});

// Serve the login page
app.get('/Admin_login', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin_login.html'));
});

// Handle form submission for login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).send({ message: 'Username and password are required' });
    }

    const query = 'SELECT * FROM admin_register WHERE username = ? AND password = ?';
    db.query(query, [username, password], (err, results) => {
        if (err) {
            console.error('Error fetching user:', err);
            return res.status(500).send({ message: 'Database error' });
        }

        if (results.length > 0) {
            res.redirect('/dictonnary1.html'); // Assuming you have an Admin dashboard page
        } else {
            res.status(401).send({ message: 'Invalid username or password' });
        }
    });
});

// Serve the dictionary page
app.get('/dictonnary1', (req, res) => {
    res.sendFile(path.join(__dirname, 'dictonnary1.html')); // Ensure this file exists in your directory
});

// Handle adding a word
app.post('/api/add-word', (req, res) => {
    const { word, definition } = req.body;
    if (!word || !definition) {
        return res.status(400).send({ message: 'Word and definition are required' });
    }

    const query = 'INSERT INTO words (word, definition) VALUES (?, ?)';
    db.query(query, [word, definition], (err, results) => {
        if (err) {
            console.error('Error adding word:', err);
            return res.status(500).send({ message: 'Database error' });
        }
        res.send({ message: 'Word added successfully' });
    });
});


// Handle searching for a word
app.get('/api/definition', (req, res) => {
    const word = req.query.word;

    if (!word) {
        return res.status(400).json({ message: 'Word is required' });
    }

    const exactMatchQuery = 'SELECT definition FROM words WHERE LOWER(word) = LOWER(?)';
    const similarMatchQuery = 'SELECT word FROM words WHERE LOWER(word) LIKE ? LIMIT 5';

    db.query(exactMatchQuery, [word], (err, exactResults) => {
        if (err) {
            console.error('Error fetching definition:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        if (exactResults.length > 0) {
            res.json({ word: word, definition: exactResults[0].definition });
        } else {
            // If no exact match, search for similar words
            db.query(similarMatchQuery, [`%${word.toLowerCase()}%`], (err, similarResults) => {
                if (err) {
                    console.error('Error fetching similar words:', err);
                    return res.status(500).json({ message: 'Database error' });
                }

                if (similarResults.length > 0) {
                    const suggestions = similarResults.map(row => row.word);
                    res.status(404).json({
                        message: 'No exact match found for the given word',
                        suggestions: suggestions
                    });
                } else {
                    res.status(404).json({ message: 'No matches found' });
                }
            });
        }
    });
});



// Ensure only one app.listen call
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
