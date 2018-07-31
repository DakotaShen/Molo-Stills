var mongoose = require("mongoose");
 
var commentSchema = new mongoose.Schema({
    text: String,
    authorName: String,
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users"
    }
});
 
module.exports = mongoose.model("Comments", commentSchema);

