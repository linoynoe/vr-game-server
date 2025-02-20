require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs"); // להצפנת סיסמאות
const jwt = require("jsonwebtoken"); // לניהול אימות משתמשים
const cookieParser = require("cookie-parser"); // ניהול קבצי Cookie

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "secretkey"; // מפתח להצפנת טוקנים

// Middleware
app.use(cors({
    origin: "https://vr-game-server.onrender.com", // להחליף בכתובת האתר שלך
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static("Public")); // משרת את תיקיית ה-Public

// 🔗 חיבור ל-MongoDB
console.log("🔍 MONGO_URI:", process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("❌ Could not connect to MongoDB:", err));

// 📌 **מודלים למסד הנתונים**
const UserSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String
});
const User = mongoose.model("User", UserSchema);

const GameSchema = new mongoose.Schema({
    playerName: String,
    score: Number,
    time: String,
    itemsCollected: [String],
    userId: mongoose.Schema.Types.ObjectId // קשר למשתמש המחובר
});
const Game = mongoose.model("Game", GameSchema);

// 📌 **הרשמה**
app.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) return res.status(400).json({ error: "All fields are required" });

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 📌 **התחברות**
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: "All fields are required" });

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: "1h" });
        res.cookie("token", token, { httpOnly: true }).json({ message: "Logged in successfully!", username: user.username });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 📌 **בדיקת התחברות**
app.get("/auth", (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ loggedIn: false });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ loggedIn: true, userId: decoded.userId, username: decoded.username });
    } catch (err) {
        res.status(401).json({ loggedIn: false });
    }
});

// 📌 **התנתקות**
app.post("/logout", (req, res) => {
    res.clearCookie("token").json({ message: "Logged out successfully!" });
});

// 📌 **API למשחקים**
app.get("/api/games", async (req, res) => {
    try {
        const games = await Game.find().populate("userId", "username"); // מציג את שם המשתמש ששיחק
        res.json(games);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 📌 **שמירת תוצאות משחק – רק למשתמש מחובר**
app.post("/save-game", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1]; // חילוץ הטוקן מהכותרת
        if (!token) return res.status(401).json({ error: "Unauthorized" });

        const decoded = jwt.verify(token, JWT_SECRET); // אימות הטוקן
        const newGame = new Game({
            ...req.body,
            playerName: decoded.username, // השם של המשתמש מתוך הטוקן
            userId: decoded.userId
        });

        await newGame.save();
        res.status(201).json({ message: "Game data saved successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 📌 **טעינת עמודי HTML**
app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "Public", "register.html"));
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "Public", "login.html"));
});

app.get("/games", (req, res) => {
    res.sendFile(path.join(__dirname, "Public", "index.html"));
});

// 📌 **הפעלת השרת**
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
