//jshint esversion:6
//...................Encryrption level2.....................
require('dotenv').config();
const express = require ('express');
const app = express();
const bodyParser= require('body-parser');
const mongoose  = require('mongoose');
//const encrypt = require('mongoose-encryption');
//.....................hashing method level 3......................................
//const md5 = require('md5');
//........................hashing method with salt rounds level4...................
// const bcrypt = require('bcrypt');
// const saltRounds = 10;
//.......................Cookies&Session level5............................
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
//.......................Google strategy auth level 6...............................
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');
// .apps.googleusercontent.com


app.use(express.static('public'));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
    //secret:"Passport secret key",
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:false,
    //cookie:{secure:true}

}))

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true , useUnifiedTopology: true });
mongoose.set("useCreateIndex",true);

const userSchema = new mongoose.Schema({
    name:String,
    password:String,
    googleId:String,
    facebookId:String,
    secret:String
})

userSchema.plugin(passportLocalMongoose);
//userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});
userSchema.plugin(findOrCreate);

const User = mongoose.model('user',userSchema);

passport.use(User.createStrategy());
 
//.............This work for only mongoose internal DB ...............
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
//....................This work for all..............................
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  //...............Google Verification Strategy......................
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRETS,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"

  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

//.......................Facebook Verifiaction Strategy......................

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, fbprofile, cb) {
    User.findOrCreate({ facebookId: fbprofile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
  );

  app.get('/auth/google/secrets', 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });


app.get("/" , (req,res)=>{
    res.render("home");
})
app.get("/login",(req,res)=>{
    res.render("login");
})
app.get("/register",(req,res)=>{
    res.render("register");
})
app.get("/secrets",(req,res)=>{
    // if(req.isAuthenticated()){
    //     res.render("secrets");    
    // }else{
    //     res.redirect("login");
    // }
    User.find({"secret":{$ne:null}},(err,foundusers)=>{
        if(err){
            
        }else{
            if(foundusers){
                res.render("secrets",{userWithSecrets:foundusers});
            }
        }
    });
    
});
app.post("/register",(req,res)=>{
    // let userName = req.body.username;
    // let password = req.body.password;
    // bcrypt.hash(password, saltRounds, function(err, hash) {
    //     // Store hash in your password DB.
    //     if(!err){
    //     const newUser = new User({
    //         name : userName,
    //         password:hash
    //     })
    
    //     newUser.save((err)=>{
    //         if(err){
    //             console.log(err);
    //         }else{
    //             res.render('secrets')
    //         }
    //     })
    // }else{
    //     console.log(err);
    // }
    // });
    User.register({username:req.body.username},req.body.password, (err,user)=>{
        if(err){
            console.log(err);
            res.redirect("register");
        }else{
            passport.authenticate("local")(req,res,()=>{
                res.redirect("/secrets");
            })
        }
    })
    
    
});

app.post('/login',(req,res)=>{
    // let username = req.body.username;
    // let password = req.body.password;
    

    // User.findOne({name:username},(err,foundUser)=>{
    //     if(!err){
    //         if(foundUser){
    //             bcrypt.compare(password, foundUser.password, function(err, result) {
    //                 // result == true
    //                 if(!err){
    //                     if(result == true){
    //                         res.render("secrets");
    //                     }
    //                 }else{
    //                     console.log(err);
    //                 }
                    
    //             });

                
    //         }else{
    //         console.log("User is  not available");
    //     }
    //     }
    //     else{
    //         console.log("err");

    //     }
    // }
    // )

    const user = new User({
        username:req.body.username,
        password:req.body.password
    })
    req.login(user,(err)=>{
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req,res,()=>{
                res.redirect("/secrets");
            })
        }
    });
});

app.get("/submit",(req,res)=>{
    if(req.isAuthenticated()){
        res.render("submit");    
    }else{
        res.redirect("login");
    }
})
app.post("/submit",(req,res)=>{
    const submittedSceret = req.body.secret;
    User.findById(req.user.id,(err,founduser)=>{
        if(err){
            console.log(err);
        }else{
            if(founduser){
                founduser.secret = submittedSceret;
                founduser.save(()=>{
                    res.redirect("/secrets");
                })
            }
        }
    })
})

app.get("/logout",(req,res)=>{
    req.logout();
    res.redirect("/");
})
PORT = process.env.PORT || 3000;
 app.listen(PORT,()=>{
  console.log(`Server is running on ${PORT}`);
 });