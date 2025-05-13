const express = require('express');
const authenticationControler = express.authenticationControler();
const { getLoginStatus } = require("../repositories/authenticationRepository");

authenticationControler.post("/register", async (req, res) => {
    try {
        const { username, password, role } = req.body;
        
        // Validate input
        if (!username || !password || !role) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long' });
        }

        // Check if user already exists
        //const checkUserQuery = "SELECT * FROM users WHERE username = ?";
        //const [existingUsers] = await db.promise().query(checkUserQuery, [username]);
        const existingUsers = await getLoginStatus(username);
        
        if (existingUsers.length > 0) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        // Hash password and create user
        //const hash = await bcrypt.hash(password, 10);
        //const createUserQuery = "INSERT INTO users (username, password, role) VALUES (?, ?, ?)";
        //const [result] = await db.promise().query(createUserQuery, [username, hash, role]);
        const result = await createUser(username, password, role);

        res.status(201).json({ 
            message: "User registered successfully",
            userId: result.insertId 
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ 
            error: 'Registration failed',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});




authenticationControler.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Validate input
        if (!username || !password) {
            return res.status(400).json({ error: 'Missing username or password' });
        }

        const results = await getLoginStatus(username);
        
        if (results.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        
        // Create a session
        req.session.user = { 
            id: user.id, 
            username: user.username, 
            role: user.role 
        };

        console.log(req.session.user);
        
        res.json({ 
            message: "Login successful", 
            user: req.session.user 
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ 
            error: 'Login failed',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

authenticationControler.post("/logout", (req, res) => {
    try {
        req.session.destroy(err => {
            if (err) {
                console.error('Session destruction error:', err);
                return res.status(500).json({ error: 'Logout failed' });
            }
            
            res.clearCookie('connect.sid'); // Clear the session cookie
            res.json({ message: "Logged out successfully" });
        });
    } catch (err) {
        console.error('Logout error:', err);
        res.status(500).json({ 
            error: 'Logout failed',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});



authenticationControler.get("/auth", (req, res) => {
    try {
        if (req.session && req.session.user) {
            res.json({ 
                authenticated: true, 
                user: req.session.user 
            });
        } else {
            res.json({ authenticated: false });
        }
    } catch (err) {
        console.error('Auth check error:', err);
        res.status(500).json({ 
            error: 'Authentication check failed',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

module.exports = authenticationControler;