const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const SpamsSchema = new Schema({
    chatId : {
        type : String,
        require: true
    },
    fromUser : {
        type: String, 
        require: true
    },
    toUser : {
        type: String,
        require: true
    },
    content : {
        type: String,
        require: true
    },
    contentHash : {
        type: String,
        require: true
    },
    created_at : { 
        type: Date, 
        default: Date.now 
    }
});

const Spam = mongoose.model('Spam',SpamsSchema);

module.exports = Spam;