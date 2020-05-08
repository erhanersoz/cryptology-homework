const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const rsaKeySchema = new Schema({
    userId: {
        type: String,
        require: true
    },
    privateKey:{
        type: String,
        require: true
    },
    publicKey:{
        type: String,
        require: true
    }
});

const RSAKey = mongoose.model('RSAKey',rsaKeySchema);

module.exports = RSAKey;
