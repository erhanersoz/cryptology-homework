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
    }
});

const RSAChat = mongoose.model('RSAChat',chatSchema);

module.exports = RSAChat;

