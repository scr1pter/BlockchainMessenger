const mongoose = require('mongoose');

//εδώ έχουμε τον πίνακα blockchain, όπου κάθε εγγραφή θα είναι και 1 block. Επομένως, οι στήλες αυτού του πίνακα πρέπει να έχουν τις ιδιότητες, το τι θα περιέχει το κάθε block, δηλαδή το message, το timestamp (για το πότε δημιουργήθηκε το block ή αντίστοιχα για το πότε ενσωματώθηκε επιτυχώς η συναλλαγή στο blockchain του bigchaindb), το previous block hash και το current block hash, το index για να ξέρουμε με ποιά σειρά μπήκαν τα blocks (και να τα φέρνουμε με τον ίδιο τρόπο όταν γίνετα η ανακατασκευή), το name, που είναι κοινό για όλα τα blocks (περιγράφει το όνομα του blockchain μας και μέσω αυτού γίνεται το fetch από το bigchaindb) και τα ids του αποστολέα και του παραλήπτη.  Γίνεται η παραδοχή ότι κάθε block θα είναι μόνο ένα μήνυμα, ένα message transaction και όχι παραπάνω.
const blockchainSchema = new mongoose.Schema({
    message: {
        type: String
    },

    senderId: {
        type: String,
        ref: 'User'
    },

    recipientId: {
        type: String,
        ref: 'User'
    },
            
    timestamp: {
        type: String,
        required: ' is required',
    },

    previousBlockHash: {
        type: String,
    },

    currentBlockHash: {
        type: String,
    },

    index: {
        type: Number
    },

    name: {
        type:String
    }
});

//  εδώ κάνω export το model της βάσης Blockchain, ώστε να μπορώ να έχω πρόσβαση μετά και να κάνω διάφορες ενέργειες όπως πχ find, delete κλπ
module.exports = mongoose.model('Blockchain', blockchainSchema);
