const mongoose = require('mongoose');
const User = mongoose.model('User');
const jwt = require('jwt-then');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');
const sha512 = require('crypto-js/sha512');

const fromUint8ArraytoHexadecimalString = uint8Array =>
  uint8Array.reduce((string, byte) => string + byte.toString(16).padStart(2, '0'), '');

// πρόκειται για μεθόδους που επιστρέφουν promises, οπότε θα γίνουν με την μορφή async/await συναρτήσεων
exports.login = async (req, res) => {

    const {name, password} = req.body;

    // βρίσκω τον χρηστη στη βάση με το name του
    const userExists = await User.findOne({name: name});

    // αν δε βρεθεί ο χρηστης τότε θα βγαίνει error και ενημερώνεται ο χρήστης
    if(!userExists) {
        throw 'User does not exist or the username is not correct.'
    }

    // πρέπει να ελέγχω αν ο χρήστης έχει βάλει το σωστό password, δηλαδή το ίδιο με αυτό που υπάρχει στη βάση και το οποίο έβαλε όταν έκανε το sign up
    if(sha512(JSON.stringify(password)).toString() !== userExists.password){
        throw 'The password is not correct.'
    }

    const token = await jwt.sign({id: userExists.id}, process.env.SECRET);

    res.json({
        message: 'User "' + name + '" has logged in.',
        token: token,
        userId: userExists._id
    })
}

exports.signup = async (req, res) => {
    const {name, password} = req.body;

    const userExists = await User.findOne({name: name});

    if(name === ''){
        throw 'Name is required';
    }

    // αν ο χρήστης υπάρχει ήδη με αυτό το όνομα θα βγαίνει error και ενημερώνεται ο χρήστης
    if(userExists) {
        throw 'This user already exists. Please try a different name.';
    }

    // αν το password δεν είναι τουλάχιστον 8 χαρακτήρες θα βγαίνει error και ενημερώνεται ο χρήστης
    if(password.length < 8){
        throw 'Password must contain at least 8 characters.';
    }

    const keyPair = nacl.box.keyPair();
    const publicKey = keyPair.publicKey;

    const hexPublicKey = fromUint8ArraytoHexadecimalString(publicKey);

    const user = new User({
        name, 
        password: sha512(JSON.stringify(password)).toString(),
        address_publicKey: hexPublicKey
    });

    await user.save();

    // Τώρα αφού έγινε η αποθήκευση του χρήστη με τα παρπάνω 3 στοιχεία στη βάση, πρέπει να επιστρέφω ένα promise με τη μορφή μηνύματος json προκειμένου να ενημερώνεται ο χρήστης ότι η εγγραφή του ήταν επιτυχημένη. αν δεν είναι πετυχημένη βγαίνει κάποιο μήνυμα από τα παραπάνω 2 if blocks
    res.json({
        message: 'User "' + name + '" has signed-up.'
    });
}

//βρίσκει όλους τους χρήστες από τη βάση και τους επιστρέφει με json
exports.getAllUsers = async (req,res) => {
    const users = await User.find();
    res.json(users);
}