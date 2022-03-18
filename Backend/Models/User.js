const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: 'Name is required'
    },

    password: {
        type: String,
        required: 'Password is required'
    },

    address_publicKey: {
        type: String,
        required: 'address_publicKey is required'
    }
}, 
  {timestamps: true}
);

// εδώ κάνω export το model της βάσης User, ώστε να μπορώ να έχω πρόσβαση μετά και να κάνω διάφορες ενέργειες όπως πχ να βρώ χρήστη μέ την find 
module.exports = mongoose.model('User', userSchema);