const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const mongoose = require("mongoose");

app.use(cors());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
  } catch (err) {
    throw err;
  }
};

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error: '));
db.once('open', function () {
  console.log('Connected successfully');
});
connect();

const exerciseSchema = new mongoose.Schema({
  description: String,
  duration: Number,
  date: Date,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

const userSchema = new mongoose.Schema({
  username: String,
});

const exerciseModel = mongoose.model('Exercise', exerciseSchema);
const userModel = mongoose.model('User', userSchema);

app.use(bodyParser.urlencoded({ extended: true }));

app.post("/api/users", async (req, res) => {
  try {
    const { username } = req.body;
    const user = new userModel({ username });
    await user.save();
    res.json({
      username: user.username,
      _id: user._id
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create a new user" });
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  try {
    const { _id } = req.params;
    const user = await userModel.findById(_id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const log = await exerciseModel.find({ user: user._id });

    res.json({
      username: user.username,
      count: log.length,
      _id: user._id,
      log: log.map((exercise) => ({
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString(),
      }))
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve exercise log" });
  }
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  try {
    const { description, duration, date } = req.body;
    const { _id } = req.params;

    const user = await userModel.findById(_id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const exercise = new exerciseModel({
      description,
      duration,
      date,
      user: user._id,
    });

    await exercise.save();

    user.log.push(exercise._id);
    await user.save();

    res.json({
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
      _id: exercise._id,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to add exercise" });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
