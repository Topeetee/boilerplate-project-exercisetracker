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
},{versionKey:false});

const userSchema = new mongoose.Schema({
  username: String,
});

const exerciseModel = mongoose.model('Exercise', exerciseSchema);
const userModel = mongoose.model('User', userSchema);

app.use(bodyParser.urlencoded({ extended: true }));

//create users
app.post("/api/users", async (req, res) => {
  try {
    const { username } = req.body;
    const user = new userModel({ username });
    //save user
    await user.save();
    res.json({
      username: user.username,
      _id: user._id
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create a new user" });
  }
});
//get all users
app.get("/api/users",async(req,res)=>{
  try {
    const allusers = await userModel.find()
    res.json.send(allusers);
  } catch (err) {
    res.status(500).json({ error: "Cannot ge users" });
  }
})
//get a user log of exercises by id
app.get("/api/users/:_id/logs", async (req, res) => {
  try {
    const userId = req.params._id;
    const user = await userModel.findById(_id);
    const {from, to, limit} = req.query
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    let filter = {userId}
    let dateFilter = {}

    if(from){
      dateFilter["gte"] = new Date(from)
    }
    if(to){
      dateFilter["lte"] = new Date(to)
    }
    if(from || to){
      filter.date = dateFilter;
    }
    if(limit){
      dateFilter = dateFilter.slice(0, limit);
    }
   
    const log = await exerciseModel.find(filter).limit();

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
//get user exercise by id
app.post("/api/users/:_id/exercises", async (req, res) => {
  try {
    const { description, duration, date } = req.body;
    const { userId} = req.body[":_id"];

    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const exercise = new exerciseModel({
      description,
      duration,
      date,
      user: user.userId,
    });
    if (!date) {
      const currentDate = new Date();
      date = currentDate.toDateString();
    }
    

    await exercise.save();
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
