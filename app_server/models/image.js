const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const imageSchema = new Schema({
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
    imageUrlFront : {
        type: String,
        require: true
    },
    imageUrlBack : {
        type: String,
        require: true
    }
});

const Image = mongoose.model('Image',imageSchema);

module.exports = Image;