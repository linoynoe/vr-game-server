const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // משרת את תיקיית ה-public

// חיבור ל-MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("❌ Could not connect to MongoDB:", err));

// מודל למסד הנתונים
const GameSchema = new mongoose.Schema({
    playerName: String,
    score: Number,
    time: String,
    itemsCollected: [String]
});
const Game = mongoose.model("Game", GameSchema);

// קבלת כל המשחקים (API JSON)
app.get("/api/games", async (req, res) => {
    try {
        const games = await Game.find();
        res.json(games);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// שמירת נתוני משחק
app.post("/save-game", async (req, res) => {
    try {
        const newGame = new Game(req.body);
        await newGame.save();
        res.status(201).json({ message: "Game data saved successfully!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// הצגת עמוד HTML במקום JSON
app.get("/games", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// הפעלת השרת
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
