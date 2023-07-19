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
  username: String,
  description: String,
  duration: Number,
  date: Date,
  userId:String
},{versionKey:false});

const userSchema = new mongoose.Schema({
  username: String,
},{versionKey:false});

const exerciseModel = mongoose.model('Exercise', exerciseSchema);
const userModel = mongoose.model('Create', userSchema);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json())

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
   
    console.error("Error creating a new user:", err);
    res.status(500).json({ error: "Failed to create a new user" });
  }
});
//get all users
app.get("/api/users",async(req,res)=>{
  try {
    const allusers = await userModel.find()
    res.json(allusers);
  } catch (err) {
    console.error("Error creating a new user:", err);
    res.status(500).json({ error: "Cannot ge users" });
  }
  
})
//get a user log of exercises by id
// app.get("/api/users/:_id/logs", async (req, res) => {
//   try {
//     const userId = req.params._id;
//     const user = await userModel.findById(userId);
//     // const { from, to, limit } = req.query;

//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     // let filter = { userId };
//     // let dateFilter = {};

//     // if (from) {
//     //   dateFilter["gte"] = new Date(from);
//     // }
//     // if (to) {
//     //   dateFilter["lte"] = new Date(to);
//     // }
//     // if (from || to) {
//     //   filter.date = dateFilter;
//     // }
//     let log = await exerciseModel.find();
//     console.log(log)
//     if(!log){
//       return res.status(404).json({ error: "log not found" }); 
//     }
//     // if (limit) {
//     //   log = log.limit(parseInt(limit));
//     // }
  
   
//     // exerciseModel

//     log = log.map((exercise) => {
//       return{
//         description: exercise.description,
//         duration: exercise.duration,
//         date: exercise.date.toDateString(),
//       }
//     });

//     res.json({
//       username: user.username,
//       count: log.length,
//       _id: userId,
//       log: log,
//     });
//   } catch (err) {
//     console.error("Error retrieving exercise log:", err);
//     res.status(500).json({ error: "Failed to retrieve exercise log" });
//   }
// });
app.get("/api/users/:_id/logs", async (req, res) => {
  try {
    const userId = req.params._id;
    const user = await userModel.findById(userId);
    let { from, to, limit } = req.query;

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let filter = { userId };
    let dateFilter = {};
    if (from) {
      dateFilter.$gte = new Date(from);
    }
    if (to) {
      dateFilter.$lte = new Date(to);
    }
    if (from || to) {
      filter.date = dateFilter;
    }
    if (!limit) {
      limit = 20;
    }

    const log = await exerciseModel.find(filter).limit(parseInt(limit));

    if (!log || log.length === 0) {
      return res.status(404).json({ error: "Exercise log not found" });
    }

    const logs = log.map((exercise) => {
      const currentDate = exercise.date && exercise.date.currentDate
        ? exercise.date.currentDate.toDateString()
        : new Date().toDateString();

      return {
        description: exercise.description,
        duration: exercise.duration,
        date: currentDate,
      };
    });

    res.json({
      username: user.username,
      count: logs.length,
      _id: userId,
      log: logs,
    });
  } catch (err) {
    console.error("Error retrieving exercise log:", err);
    res.status(500).json({ error: "Failed to retrieve exercise log" });
  }
});

//get user exercise by id
app.post("/api/users/:_id/exercises", async (req, res) => {
  try {
    let { description, duration, date} = req.body;
    const userId =  req.body[":_id"];
    console.log(userId)

    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const exercise = new exerciseModel({
      username:user.username,
      description,
      duration,
      date,
      userId
    });
    if (!date) {
      const currentDate = new Date();
      date = currentDate.toDateString();
    }
    

    await exercise.save();
    await user.save();

    res.json({
      username: user.username,
      description,
      duration,
      date,
      _id: userId,
    });
  } catch (err) {
    console.error("Error creating a new user:", err);
    res.status(500).json({ error: "Failed to add exercise" });
  }
});
app.get("/api/users/:_id/exercise",async(req,res)=>{
  const exer = await exerciseModel.find();
  res.json(exer)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
