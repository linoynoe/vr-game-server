require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// התחברות ל-MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("❌ MongoDB connection error:", err));

// סכמת נתוני המשחק
const gameSchema = new mongoose.Schema({
    playerName: String,
    score: Number,
    time: String,
    itemsCollected: [String],
});

const Game = mongoose.model("Game", gameSchema);

// API לשמירת נתוני משחק
app.post("/save-game", async (req, res) => {
    try {
        const { playerName, score, time, itemsCollected } = req.body;
        const newGame = new Game({ playerName, score, time, itemsCollected });
        await newGame.save();
        res.status(201).json({ message: "Game saved successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API להצגת הנתונים
app.get("/games", async (req, res) => {
    try {
        const games = await Game.find();
        res.json(games);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// הפעלת השרת
const PORT = process.env.PORT || 5000;
const path = require("path");
app.use(express.static(path.join(__dirname, "public")));
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
