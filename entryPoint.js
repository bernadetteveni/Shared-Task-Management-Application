import dotenv from 'dotenv'
dotenv.config()
console.log(process.env.SECRET);

import express from "express";
import { urlencoded } from 'body-parser';
import ejs from "ejs";
import session from 'express-session'
import passport from 'passport'
import passportLocalMongoose from 'passport-local-mongoose'

const app = express();
const port = 3000;
app.listen(port, ()=>{
    console.log("Server is running on port" + port)
})

app.use(urlencoded({extended:true}));
app.use(express.static("public", {index: false}))

// set up session
app.use(session({
    secret: process.env.SECRET, // stores our secret in our .env file
    resave: false,              // other config settings explained in the docs
    saveUninitialized: false
}));

// set up passport
app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs');

//set up mongoose
import mongoose from 'mongoose';

await mongoose.connect("mongodb://localhost/taskDB",
    {useNewUrlParser: true,
    useUnifiedTopology: true});

const userSchema = new mongoose.Schema ({
    username: String,
    email: String,
    password: String
})

userSchema.plugin(passportLocalMongoose)

const User = new mongoose.model("User", userSchema);

// more passport-local-mongoose config
// create a strategy for storing users with Passport
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const taskSchema = new mongoose.Schema ({
    id: Number,
    name: String,
    owner: userSchema,
    creator: userSchema,
    done: Boolean,
    cleared: Boolean
})

const Task = mongoose.model("Task", taskSchema);


app.get("/",function(req,res){
    res.render("login");
});


app.post('/register', function(req, res) {
    User.register({username: req.body.username, email: req.body.email}, req.body.password, function(err, user){
        if(!err){
            passport.authenticate("local",{ successRedirect: 'todo' })(req, res, function(){
                req.flash("success","You created a new User Account ");
                res.redirect("/todo")
            });
         }
         else{
            console.log(err);
            req.flash("error", err.message);
            res.redirect("/")
         }
    });
});

app.post("/signin", function(req, res) {
    console.log("A user is logging in", req.body.username)
    // create a user
    const user = new User ({
        username: req.body.username,
        password: req.body.password
     });
     // try to log them in
    req.login (user, function(err) {
        if (err) {
            // failure
            console.log(err);
            res.redirect("/")
        } else {
            // success
            // authenticate using passport-local
            passport.authenticate("local")(req, res, function(){
                res.redirect("/todo"); 
            });
        }
    });
});

app.get("/todo", (req, res)=>{
    console.log("A user is accessing todo")
    if (req.isAuthenticated()) {
        console.log(req.user.username)
        var username = req.user.username;
        Task.find({}, function(err, results) {
            if (err) {
                console.log(err);
            } else {
                var listOfTasks = results
                var largestTaskId = 10
                res.render("todo", {
                    title: "To Do",
                    username: username,
                    largestTaskId: largestTaskId,
                    listOfTasks: listOfTasks
                });
            }
        });
    } else {
        res.redirect("/");
    }
    
});

app.get("/logout", function(req, res){
    console.log("A user logged out")
    req.logout();
    res.redirect("/");
});

app.post("/addtask", async(req, res)=>{
    var user
    await User.find({username: req.body.usernameId}, (err, results)=>{
        if(err){
            console.log(err)
        }
        else{
            user = results[0]
        }
    })

    console.log(req.body.usernameId);
   
    var taskName = req.body.taskInput;
    const task = new Task({
        "name": taskName,
        "owner": null, 
        "creator": user, 
        "done": false,
        "cleared": false
    })

    await task.save()
    
    res.redirect("/todo");

});

app.post("/claim", async(req, res)=>{
    console.log("called claim", req.body)
    var user
    await User.find({username: req.body.usernameId}, (err, results)=>{
        if(err){
            console.log(err)
        }
        else{
            user = results[0]
        }
    })
    console.log("username", req.body.usernameId);
    console.log("req.body.id", req.body.id);
    await Task.updateOne( {"_id": mongoose.Types.ObjectId(req.body.id)}, {$set: {owner: user}}, function(err){
        if (err) {
            console.log(err);
        }
        else{
            res.redirect("/todo");
        }
    })
});

app.post("/unfinish", async(req, res)=>{
    console.log("called unfinished", req.body)
    await Task.updateOne( {"_id": mongoose.Types.ObjectId(req.body.id)}, {$set: {done: false}}, function(err){
        if (err) {
            console.log(err);
        }
        else{
            res.redirect("/todo");
        }
    })
});

app.post("/abandonorcomplete", async(req, res)=>{
    console.log("called abandonorcomplete", req.body)
    if(req.body.abandon != null){
        //abandon
        await Task.updateOne( {"_id": mongoose.Types.ObjectId(req.body.id)}, {$set: {"owner": null}}, function(err){
            if (err) {
                console.log(err);
            }
            else{
                res.redirect("/todo");
            }
        })
    }
    else{
        console.log("checkbox on")
        //complete
        await Task.updateOne( {"_id": mongoose.Types.ObjectId(req.body.id)}, {$set: {"done": true}}, function(err){
            if (err) {
                console.log(err);
            }
            else{
                res.redirect("/todo");
            }
        })
    }
});

app.post("/purge", async(req, res)=>{
    console.log("called purged", req.body)
    await Task.updateMany( {"owner.username": req.body.usernameId, "done": true}, {$set: {"cleared": true}}, function(err){
        if (err) {
            console.log(err);
        }
        else{
            res.redirect("/todo");
        }
    })
});