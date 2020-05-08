const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const chatSchema = new Schema({
    idString:{
        type: String,
        require: true
    },
    user1: {
        type: String,
        require: true
    },
    user2: {
        type: String,
        require: true
    },
    key:{
        type: String,
        require: true
    }
});

const AESChat = mongoose.model('AESChat',chatSchema);

module.exports = AESChat;

