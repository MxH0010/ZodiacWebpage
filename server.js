const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const cors = require('cors'); // <-- FIX 1: Import CORS

const app = express();
const PORT = 3000;

// Middleware
app.use(cors()); // <-- FIX 1: Use CORS middleware for cross-origin requests
app.use(bodyParser.json());
// FIX 3: Combine body-parser (deprecated) usage with Express
// app.use(express.json()); 
app.use(express.static('public')); 

// MongoDB Connection
const MONGODB_URI = 'mongodb+srv://madalynhedges_db_user:cZYrLOBe8ZXhuZdW@cluster0.ugbpan1.mongodb.net/?appName=Cluster0';

mongoose.connect(MONGODB_URI) // <-- FIX 2: Removed deprecated options
    .then(() => console.log('MongoDB successfully connected.'))
    .catch(err => console.error('MongoDB connection error:', err));

// MongoDB User Schema and Model
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true }
});

const User = mongoose.model('User', UserSchema);

// API Endpoint for Registration
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = new User({
            username: username,
            passwordHash: passwordHash,
        });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Username already exists.' });
        }
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// API Endpoint for Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }

        // Returns simple success status, client only stores the username
        res.status(200).json({ message: 'Login successful!' }); 
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// Serve the index.html file - NOTE: If your HTML is loaded as index.html, this is fine.
// But your front-end calls require the full path, which this route doesn't use.
// We will focus on the main API calls.
app.get('/', (req, res) => {
    // This assumes index.html is in the same directory as server.js
    res.sendFile(__dirname + '/index.html'); 
});

// Start the Server
app.listen(PORT, () => {
    console.log(`Server running and listening on http://localhost:${PORT}`);
});