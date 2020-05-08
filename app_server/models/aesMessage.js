const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const MessagesSchema = new Schema({
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
    created_at : { 
        type: Date, 
        default: Date.now 
    }
});

const AESMessage = mongoose.model('AESMessage',MessagesSchema);

module.exports = AESMessage;