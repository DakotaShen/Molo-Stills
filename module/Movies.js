var mongoose = require("mongoose");
var Comments = require("./Comments");
var Users = require("./Users");
    
// SET UP MONGOOSE SCHEME AND MODEL FOR CAMP
var schMovies = new mongoose.Schema({
    name:String,
    image:String,
    descrip:String,
    username: String,
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users"
    },
    comments:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comments"  // ref里字符串的值，要和所建的model的名字一摸一样，包括大小写。。
    }]
});
var Movies = mongoose.model("Movies", schMovies); // "Movies" is an instance of schMovies

module.exports = Movies;
