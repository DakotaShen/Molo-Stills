var express = require("express"),
    app = express(),
    bodyParser = require("body-parser"),
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    session = require("express-session"),
    Users = require("./module/Users"),
    passportLocalMongoose = require("passport-local-mongoose"),
    methodOverride = require("method-override");
    
    
var mongoose = require("mongoose");
// CONNECT MONGODB
// mongoose.connect("mongodb://localhost:27017/molo_camp");
mongoose.connect("mongodb://DakotaShen:SMS950520@ds259351.mlab.com:59351/molo-camp");

// CONNECT TO CSSS 
app.use(express.static(__dirname + "/public"));
// console.log(__dirname + "/public");

var seedDB = require("./module/seeds"),
    Movies = require("./module/Movies"),
    Comments = require("./module/Comments");
    


// seedDB();
app.use(methodOverride("_method"));

// PASSWORD CONFIGURATION
app.use(session({
    secret: "Yes, this is a secret",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(Users.authenticate()));
passport.serializeUser(Users.serializeUser());
passport.deserializeUser(Users.deserializeUser());

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

// USER LOGGIN DISPLAY, ADDING MIDDLEWARE
// Make req.user availabe in all routes
app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    next();
});

// ROUTE


app.get("/", function(req, res){
    res.render("landing");
});

// INDEX
app.get("/movies", function(req,res){
    // var currentUser = req.user;
    // RETRIEVE ALL MOVIES FROM DATABASE
    Movies.find({}, function(err, movies){
        if(err){
            console.log("WRONG! CAN'T GET MOVIES FROM DB!");
        }else{
            res.render("movies", {movies: movies});
        }
    });
    // res.send("this is movie");
});

// CREATE
app.post("/movies", isSignedIn, function(req,res){
    var name = req.body.name;
    var image = req.body.image;
    var descrip = req.body.descrip;
    Movies.create({
        name: name,
        image: image,
        descrip:descrip,
        username: req.user.username,
        userId: req.user._id
    }, function(err, movie){
        if(err){
            console.log("ERROR! CAN'T CREAT NEW MOVIE IN NEW WEBPAGE!");
        }else{
            console.log("CREAT NEW CAMPGOUNRD TO WEBPAGE AND DB:)")
            // post route must redirect to get, so it could be shown
            res.redirect("/movies"); // redirect here is to html, not to directory file...
        }
    });
});

// NEW
app.get("/movies/new", isSignedIn, function(req, res){
    res.render("new");
});

// SHOW
app.get("/movies/:id", function(req, res){
    // RESPOND DESCRIPTIONS FOR THIS MOVIE
    Movies.findById(req.params.id).populate("comments").exec(function(err, movie){
        if(err){
            console.log(err);
        }else{
           // console.log(req.params.id);
           // console.log(movie);
            res.render("show", {movie: movie});
        }
    });
});

// EDIT MOVIE
app.get("/movies/:id/edit", function(req, res) {
    if(req.isAuthenticated()){
        Movies.findById(req.params.id, function(err, movie) {
        if(err){
            console.log(err);
        }else{
            console.log(movie.userId);
            console.log(req.user._id);
            if(movie.userId.equals(req.user._id)){
                res.render("edit", {movie: movie});
            }else{
                res.send("Sorry, only movie owner could edit this movie");
            }
        }
    });
    }else{
        res.send("You need to log in first :)");
    }
});

app.put("/movies/:id", function(req, res){
    Movies.findByIdAndUpdate(req.params.id,{
        image: req.body.image, 
        descrip: req.body.descrip,
        name: req.body.name
    }, function(err, movie){
        if(err){
            console.log(err);
        }else{
            res.redirect("/movies/" + movie._id);
        }
    });
})

// DELETE MOVIE
app.delete("/movies/:id", function(req,res){
    if(req.isAuthenticated()){
        Movies.findById(req.params.id, function(err, movie){
        if(err){
            console.log(err);
        }else{
            if(movie.userId.equals(req.user._id)){
                Movies.findByIdAndRemove(req.params.id, function(err, movie){
                    if(err){
                        console.log(err);
                    }else{
                        res.redirect("/movies");
                    }
                })
            }else{
                res.redirect("back");
            }
        }
       });
    }else{
        res.redirect("/signin");
    }
});

// =========COMMENT ROUTER==========
// NEW COMMENT
app.get("/movies/:id/comments/new", isSignedIn, function(req, res) {
    Movies.findById(req.params.id).populate("comments").exec(function(err, movie){
        if(err){
            console.log(err);
        }else{
           // console.log(req.params.id);
           // console.log(movie);
            res.render("comments/new", {movie: movie});
        }
    });
});

// CREATE COMMENT
app.post("/movies/:id", isSignedIn, function(req, res){
    Movies.findById(req.params.id, function(err, movie){
        if(err){
            console.log(err);
        }else{
            // var name = req.body.name;
            var commentText = req.body.text;
            Comments.create({
                text: commentText,
                authorId: req.user._id,
                authorName: req.user.username
            }, function(err, comment){
                if(err){
                    console.log(err);
                }else{
                    // console.log(req.user);
                    // console.log(req.user.username);
                    movie.comments.push(comment);
                    movie.save();
                    // console.log(movie.comment.author.authorName);
                    res.redirect("/movies/" + movie._id);
                }
            }); 
        }
    });
});

// delete comment(comment owner)
app.get("/movies/:id/delComment", function(req, res){
    Movies.findById(req.params.id).populate("comments").exec(function(err, movie){
        if(err){
            console.log(err);
        }else{
          // console.log(req.params.id);
          // console.log(movie);
            res.render("show", {movie: movie});
        }
    });
});

app.delete("/movies/:id/delComment", function(req,res){
    // res.send("ca");
    console.log("getincommentdelete")
    if(req.isAuthenticated()){
        Movies.findById(req.params.id).populate("comments").exec(function(err, movie){
            if(err){
                console.log(err);
            }else{
               var comments = movie.comments;
               for(var i = 0; i < comments.length; i++){
                   if(comments[i].authorId.equals(req.user._id)){
                       Comments.findByIdAndRemove(comments[i].authorId, function(err, removedComment){
                           if(err){
                               console.log(err);
                           }else{
                               console.log(comments[i].authorId);
                               res.redirect("back");
                           }
                       });
                       break;
                   }
               }
            }
        });
    }
});
    //     });            
    //     Movies.findById(req.params.id, function(err, movie){
    //         if(err){
    //             console.log(err);
    //         }else{
    //             var commentsId = movie.comments;
    //             commentsId.forEach(function(commentId){
    //                 Comments.findById(commentId, function(err, comment){
    //                     if(err){
    //                         console.log(err);
    //                     }else{
    //                         console.log(comment)
    //                         if(comment.authorId.equals(req.user._id)){
    //                             Comments.findByIdAndRemove(commentId, function(err, removedMovie){
    //                                 if(err){
    //                                     console.log(err);
    //                                 }else{
    //                                     res.redirect("/movies");
    //                                 }
    //                             })
    //                         }else{
    //                             res.redirect("/movies/signin");
    //                         }
    //                     }
    //                 })
    //             });
    //         }
    //   });
    // }
// });

// ==============
// User Router
// ==============

// show sign up page
app.get("/register", function(req, res) {
    res.render("register/register");
});

// post register form
app.post("/register", function(req, res) {
    var username = new Users({username: req.body.username});
    Users.register(username, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.render("register/register");
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/movies");
            });
        }
    });
});

// show sign in page
app.get("/signin", function(req, res){
    res.render("signin/signin");
});

// post sign in
app.post("/signin",passport.authenticate("local", {
    successRedirect: "/movies",
    failureRedirect: "/register"
    }),function(req,res){});

// sign out(sign out doesn't need a single show page, so when GET request sign out, directly redirect to homepage)
app.get("/signout", function(req, res) {
    req.logout();
    res.redirect("/");
})

// middleware
function isSignedIn(req, res, next){
    if(req.isAuthenticated()){
        next();
    }else{
        res.redirect("/signin");
    }
}

app.listen(process.env.PORT, process.env.IP, function(){
    console.log("MoloCamp has started!!!");
});