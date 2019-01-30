const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true })

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  }
});
var User = mongoose.model('User',userSchema);

const exerciseSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: Date
});
var Exercise = mongoose.model('Exercise', exerciseSchema);

app.post("/api/exercise/new-user",function(req,res){
  let username = req.body.username;
  User.findOne({username: username}, function(err, user) {
    if (err) {
      res.json(err);
    } else {
      if (user != null) {
        res.json({error: "username already taken"});
      } else {
        let newuser = new User({username});
        newuser.save((err,result)=> {
          if (err) {
            res.json(err);
          } else {
            res.json(result);
          }
        });
      }
    }
  });  
});

app.post('/api/exercise/add', function(req, res){
  let {userId ,description, duration, date} = req.body;
  User.findById(userId, function(err, user) {
    if (err) {
      res.json(err);
    } else {
      if (user != null) {
        let newex = new Exercise({
          userId,
          description,
          duration,
          date
        });
        newex.save((err,result)=> {
          if (err) {
            res.json(err);
          } else {
            res.json(result);
          }
        });
      } else {
        res.json({error: "unknown userId"});
      }
    }
  });  
});

app.get('/api/exercise/log', function(req, res) {
  if (req.query.userId) {
    User.findById(req.query.userId, function(err, user) {     
      if (err) {
        res.json(err);
      } else {    
        let result = {
          _id: user._id,
          username: user.username
        };        
        let query = Exercise.find();
        query.select("description duration date");
        query.select("-_id");
        if (req.query.from) {    
          console.log(new Date(req.query.from));
          query.find({date: {$gte: new Date(req.query.from)}});
          // query.where('date').gte(new Date(req.query.from));
        }
        if (req.query.to) {
          // query.where('date').lte(new Date(req.query.to));
          query.find({date: {$lte: new Date(req.query.to)}});
        }
        if (req.query.limit) {
          query.limit(parseInt(req.query.limit));
        }        
        query.exec((err,logs)=> {          
          if (err) {
            res.json(err);
          } else {
            result.count = logs.length;
            result.log=logs;
            res.json(result);
          }
        });
      }      
    })
  } else {
    res.json({error: 'Undefined userId'});
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
