require('dotenv').config() // φορτώνω μέσω του dotenv πακέτου το αρχείο env, ώστε να συμπεριληφθούν οι σταθερές που έχω ορίσει στο αρχείο μου ώς μεταβλητές της τρέχουσας διεργασίας και να έχω πρόσβαση σε αυτές από το process.env. Πχ χρησιμοποιώ την σταθερά process.env.DATABASE που έχω ορίσει μέσα στο αρχείο env για να κάνω τη σύνδεση με το mongoose.

//SET UP THE DATABASE
const mongoose = require('mongoose');

const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');
const sha512 = require('crypto-js/sha512');

// έτσι γίνονται οι συναλλαγές στο blockchain bigchaindb και με το searchAssets τις παίρνω πίσω. άρα, κάθε φορα που στέλνω ένα μήνυμα θα το κάνω με κρυπτογράφηση το message. κάθε φορα στο getAllMessages τα φέρνω από το bigchain ψαχnοντας τα blocks που έχουν σαν αποστολέα η/και παραλήπτη τους 2 χρηστες που αλληλεπιδρούν στο κάθε conversation. 

const driver = require('bigchaindb-driver');
const API_PATH = 'http://localhost:9984/api/v1/'; // έχοντας τρέξει το docker container gia to bigchaindb έχουν ρυθμιστεί τα πάντα στο σύστημα μου, ώστε να δημιουργώ ένα node του bigchaindb network μέσω του τοπικού μου δικτύου και οι συναλλαγές μου να επικυρώνονται μέσω 2-3 validator nodes που είναι πάλι στο local δίκτυο μου. Επομένως, αφ'ενός προσφέρουμε στο συνολικό bigchain blockchain επιπλέον κόμβους κάνοντας το πιο ισχυρό και  αφ'ετέρου έχουμε έναν τρόπο να είμαστε πιο ασφαλείς, αφού όλα τα transactions μας εκτελούνται και επικυρώνονται μέσω του localhost μας (χρησιμοποιώντας το consensus της Tendermint, του οποίου ο αλγόριθμος έχει ενσωματωθεί όταν τρέξαμε το container bigchaindb) πριν πάνε στα blocks κατανεμημένου δικτύου της bigchaindb.
const conn = new driver.Connection(API_PATH);
//const conn = new driver.Connection('https://test.ipdb.io/api/v1/'); // αυτό είναι το testnet της bigchaindb και κάθε μέρα κάνει reset τα transactions για λόγους GDPR. Χρησιμοποιήθηκε μόνο στην αρχή για να δω αν και πως δουλεύει όλο αυτό
conn.searchAssets('BlockchainMessenger_v1').then(response => {
    console.log(response);
})

//συνδέομαι στην τοπική βάση mongodb μέσω της σταθεράς από το αρχείο env , δηλαδή κάνω την σύνδεση για το περιβάλλον mongodb://localhost/MERNBlockchainMessenger
mongoose.connect(process.env.DATABASE , {
    useUnifiedTopology: true,
    useNewUrlParser: true
});

//ενημερώνει όταν βρεθεί error στη σύνδεση με την τοπική βάση μας και έτσι ξέρουμε ποιό είναι αυτό το error.
mongoose.connection.on('error', (error) => {
    console.log("There is an error with the mongoose connection: " + error.message);
});

// ενημερώνει την πρώτη φορά μόνο, με το που γίνει πετυχημένη σύνδεση στην τοπική βάση μας.
mongoose.connection.once('open', () => {
    console.log('Mongo database is connected')
})

//μετά την επιτυχημένη σύνδεση στη βάση πρέπει να γίνει η διασύνδεση με τα μοντέλα που έχω στον κώδικα μου. τα models πρακτικά είναι ο κάθε πινακας που θα υπάρχει στη βάση. 2 models, άρα 2 πίνακες στην τοπική βάσης μας
require('./Models/User');
require('./Models/Blockchain');

const app = require('./app');

const Server = app.listen(8000, () => {
    console.log('Server is listening on port 8000');
});

//δημιουργώ το middleware μέσω του socket για τον server μου. κάνει την σύνδεση με τον σέρβερ μας, δηλαδή το πως θα γίνεται η επικοινωνία του backend με το frontend
const SocketIO = require("socket.io")(Server, {
    allowEIO3: true,
    cors: {
      origin: true,
      methods: ['GET', 'POST'],
      credentials: true
    }
});

const jwt = require('jwt-then');

const User = mongoose.model('User');
const Blockchain = mongoose.model('Blockchain');

// ΜΕΘΟΔΟΙ/ΣΥΝΑΡΤΗΣΕΙΣ BLOCKCHAIN ΚΑΙ ΣΥΝΔΕΣΙΜΟΤΗΤΑ*************************************************

//Γενικά για τις παρακάτω 2 μεθόδους πρέπει να ξέρουμε πως ο πίνακας Uint8Array είναι ένας πίνακας με στοιχεία ακεραίους 8 bit, που πρακτικά θα είναι αριθμοί bytes από 0 ως 255 και είναι η μορφή που πρέπει να δέχονται οι μέθοδοι που κάνουν generate τα κλειδιά για την κρυπτογράφηση/απόκρυπτογράφηση των μηνυμάτων. Οπότε θα δούμε παρακάτω διάφορες μετατροπές από δεκαεξαδικά strings σε Uint8Array και αντίστροφα.

const fromHexadecimalStringtoUint8Array = hexadecimalString =>
// αρχικά με το regex βρίσκει όλους τους χαρακτήρες (η τελεία '.' σημαίνει όλοι οι χαρακτήρες εκτός τις αλλαγές γραμμής \n κλπ) που έχουν 1 ή 2 μήκος, διότι ξέρουμε πως οι δεκαεξαδικοί έχουν μήκος 1 ή 2 (χωρίς τα 0x στην αρχή κλπ). άρα βρίσκει όλους τους δεκαεξαδικούς σε έναν πίνακα και μετά για όλο τον πίνακα βρίσκει για κάθε στοιχείο το αντίστοιχο σε byte από 0 ως 255 και το καταχωρεί σαν στοιχείο του Uint8Array.
  new Uint8Array(hexadecimalString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

const fromUint8ArraytoHexadecimalString = uint8Array =>
// αντίστοιχα εδώ παίρνει τα στοιχεία του Uint8Array που είναι αριθμοί από το 0 ως το 255 δηλαδή bytes και σχηματίζει σε κάθε επανάληψη το δεκαεξαδικό string. αυτό γίνεται με το reduce που λειτουργεί προσθετικά. δηλαδή το str είναι αυτό που θα πάρουμε τελικά σαν αποτέλεσμα και σε κάθε επανάληψη περιέχει το άθροισμα όλων των προηγούμενων στοιχείων του πίνακα αφού πρώτα μετατράπηκαν σε δεκαεξαδικά, το byte είναι το εκάστοτε στοιχείο του πίνακα Uint8Array που προστίθεται στο προηγούμενο άθροισμα και το '' είναι η αρχική τιμή για το str. Δηλαδή ξεκινάμε από το str = '' ένα κενό string, έπειτα στην 1η επανάληψη προσθέτουμε στο str το δεκαεξαδικό αντίστοιχο του 1ου byte στοιχείου του πίνακα Uint8Array, στην 2η επανάληψη προσθέτουμε στο str το δεκαεξαδικό αντίστοιχο του 2ου byte στοιχείου κοκ μέχρι να τελειώσει το loop. Τελικά, θα έχουμε το δεκαεξαδικό string που αντιστοιχεί στον πίνακα Uint8Array που περάσαμε σαν παράμετρο με το bytes. το padStart γίνεται για να προκύπτει κάθε φορά δεκαεξαδικός με μήκος 2 (αν έχει μήκος 1, τότε προσθέτει το 0 στην αρχή), καθώς στην γλώσσα προγραμματισμού javascript πρέπει κάθε byte όταν μετατρέπεται σε δεκαεξαδικό να αντιπροσωπεύεται με 2 ψηφία, ανεξάρτητα αν κανονικά στο 16αδικό μπορεί να έχει ένα ψηφίο (πχ το 0 θα πρέπει να είναι εδώ 00), προκειμένου να δουλέψει αυτή η μετατροπή.
  uint8Array.reduce((string, byte) => string + byte.toString(16).padStart(2, '0'), '');

const GetDateTimeNow = () => {
    var DateTime = new Date();
    var date = DateTime.getFullYear()+ '/' + (DateTime.getMonth() + 1) + '/' + DateTime.getDate();
    var time = DateTime.getHours() + ":" + DateTime.getMinutes() + ":" + DateTime.getSeconds();
    return date + ' ' + time;
}

const ComputeTheHashOfThisBlock = (MessageTransactions, PreviousBlockHash, Timestamp, SenderId, RecipientId, Index) => {
    return sha512(JSON.stringify(MessageTransactions) + PreviousBlockHash + Timestamp + SenderId + RecipientId + Index).toString();
}

const VerifyTheBlockchain = async(blockchain) => {
    var validity = true;

    // περιμένω να πάρω την απάντηση από το promise searchAssets για το αντικείμενο που περιέχει το blockchain στο BigchainDB
    const res = await conn.searchAssets('BlockchainMessenger_v1');

    // πρέπει να ελέγχω και αν έχει διαγραφει το genesis block, διότι και τότε πάλι δεν είναι έγκυρο το blockchain μας. Αν δεν υπάρχει το genesis block τότε πρέπει να γίνει fetch από το blockchain του bigchaindb. Ουσιαστικά, γίνετα fetch όλο το blockchain μας
    // αν εχουν διαγραφει τα παντα και δεν υπάρχει τίποτα
    if(blockchain.length === 0) {
        validity = false;
    }
    //η αν έχει διαγραφεί το genesis block
    else if(blockchain.length > 0){
        if(blockchain[0].index !== 0){
            validity = false;
        } 
    }

    // από το i=1, γιατί εδώ δεν μας ενδιαφέρει το genesis block (το ελέγξαμε παραπάνω). Έτσι, ελέγχω μονο αν η αλυσίδα έχει πάνω από 2 στοιχεια δηλαδή το length είναι >= 2. Αν έχει μονο το genesis δεν χρειάζεται να ελέγχουμε ξανά
    if(blockchain.length>=2){
        for(var i=1; i<blockchain.length; i++){

            var ThisBlock = blockchain[i];
            var PreviousBlock = blockchain[i-1];

            // εδώ γίνεται ο έλεγχος αν είναι έγκυρο το blockchain, με την διασταύρωση των hashes
            if( ThisBlock.previousBlockHash !== PreviousBlock.currentBlockHash || 
            ThisBlock.currentBlockHash !== ComputeTheHashOfThisBlock(ThisBlock.message, ThisBlock.previousBlockHash, ThisBlock.timestamp, ThisBlock.senderId, ThisBlock.recipientId, ThisBlock.index) ){
                validity = false;
                break;
            }
        }
    }

    // αυτό λοιπόν πρόκειται για ένα αντικείμενο promise, αν όλα πήγαν καλά και περιέχει δεδομένα (δηλαδή το blockchain μου) και μέχρι στιγμής το blockchain είναι έγκυρο, τότε πρέπει να ελέγχω αν το μήκος από το response (τον πίνακα blockchain, που είναι όμως στο bigchaindb και είναι αξιόπιστο) είναι ίσο με το μήκος του blockchain μας στην τοπική βάση. Αν δεν είναι ίδιο, σημαίνει ότι έχει διαγραφεί κάποιο block από την τοπική βάση και πρέπει να γίνει ανακατασκευή, άρα η εγκυρότητα να πάει στο false
    if(res && validity){
        if(res.length !== blockchain.length){
            validity = false;
        }
    }   

    console.log(validity);
    return validity;
}

const ReconstructTheBlockchain = async() => {

    //πρέπει να ξαναφέρω από το bigchaindb όλες τις συναλλαγές που συγκεντρωτικά δημιουργούν το τοπικό μου blockchain. Πρακτικά, κάθε συναλλαγή στο bigchaindb είναι και ένα block στο τοπικό blockchain μου. oπότε διαγράφω τα πάντα που εχουν απομείνει και θα το φέρω ξανά με την σωστή του μορφή
    const removed = await Blockchain.deleteMany({});

    // η τρέχουσα μέθοδος καλείται μόνο όταν έχει αποτύχει ο έλεγχος εγκυρότητας. Δηλαδή είτε δεν υπάρχει τίποτα στην τοπική βάση μας στον πίνακα blockchain (διαγράφηκαν όλα τα blocks και το removed.deletedCount πρακτικά είναι 0) είτε διαγράφηκαν όλα τα εναπομείναντα blocks
    if(removed.deletedCount>=0){
        conn.searchAssets('BlockchainMessenger_v1').then( response => {
            for(let i=0; i<response.length;i++){
                let blockdata = response[i].data;

                const block = new Blockchain({
                    message: blockdata.message,
                    senderId: blockdata.senderId,
                    recipientId: blockdata.recipientId,
                    timestamp: blockdata.timestamp,
                    previousBlockHash: blockdata.previousBlockHash,
                    currentBlockHash: blockdata.currentBlockHash,
                    index: blockdata.index,
                    name: blockdata.name
                })
                block.save();
            }
        })
    }
}

// αυτή θα καλείται μια φορά όταν πχ δημιουργώ πρώτη φορα το blockchain μου με το συγκεκριμένο όνομα (που σημαίνει ότι στη βάση δεν υπάρχει τίποτα στον πινακα blockchain), μετά θα υπάρχει μόνιμα όλο το blockchain μας στη bigchaindb και όποτε εντοπίζεται άκυρο blockchain τότε θα το φέρνω από εκεί και θα γίνεται reconstruct με την παραπάνω μέθοδο
const CreateGenesisBlock = async(idS) => {
    const userS = await User.findOne({_id: idS}); //βρίσκω τον χρήστη που ενεργεί ως αποστολέας
	
    //δημιουργώ με βάση το δημόσιο κλειδί που έχει στην τοπική βάση, ένα ζευγάρι κλειδιά Ed25519 (ο αλγόριθμος αυτός χρησιμοποιείται από το BigchainDB)
    const sender = new driver.Ed25519Keypair(fromHexadecimalStringtoUint8Array(userS.address_publicKey));

    //δημιουργώ το genesis block στην τοπική μου βάση που αντιστοιχεί σε έγγραφο της συλλογής Blockchain
    const genesis = new Blockchain({
        message: 'This is the genesis block',
        senderId: '',
        recipientId: '',
        timestamp: GetDateTimeNow(),
        previousBlockHash: '',
        currentBlockHash: 'd41cbddc5fe1aeb84e967773845f21a63be45bb5a4e758e57bb453cd4b4768a811cdaaf801ecc5cfb0d826bc20bf14f47d064156c2ce632dc8044ca64bbf4aba',
        index: 0,
        name: 'BlockchainMessenger_v1'
    })

    //δημιουργώ την συναλλαγή για το BigchainDB σύμφωνα με τις προκαθορισμένες εντολές
    const transaction = driver.Transaction.makeCreateTransaction(
        genesis,
        null,
        [ driver.Transaction.makeOutput(
            driver.Transaction.makeEd25519Condition(sender.publicKey))],
        sender.publicKey
    );
    
    //υπογράφεται η συναλλαγή με το ιδιωτικό κλειδί του αποστολέα
    const transactionSigned = driver.Transaction.signTransaction(transaction, sender.privateKey);
    
    //στέλνεται η συναλλαγή στο blockchain του BigchainDB και αποθηκεύεται
    conn.postTransactionCommit(transactionSigned);

    //τελικά αν όλα πάνε καλά με το BigchainDB, αποθηκεύεται η συναλλαγή σαν κουτί στην τοπική μας βάση
    await genesis.save();
}
//ΤΕΛΟΣ ΣΥΝΑΡΤΗΣΕΩΝ BLOCKCHAIN*************************************************

SocketIO.use(async (socket, next) => {

    try{
        const userToken = socket.handshake.query.token; // αφού το έχουμε περάσει έτσι στο conversation.js

        // οπότε τώρα πρέπει να κάνω verify το token και να περιμένω να γίνει για να συνεχίσω παρακάτω για αυτό είναι σε try/catch και με async/await. Όταν το κάνω sign στο userController χρησιμοποιώ το id του user (αυτό δηλαδή που δίνει αυτόματα το mongodb σε κάθε εγγραφη). Άρα, από το payload.id έχω το id του χρήστη που έχει εισέλθει αυτή τη στιγμή την εφαρμογή
        const payload = await jwt.verify(userToken, process.env.SECRET);

        socket.userId = payload.id;

        next();
    } catch(error) {}
});

SocketIO.on('connect', async (socket) => {
    console.log('connected');
    // το socket.userId είναι αυτός που μπαίνει στο conversation room και είναι ο αποστολέας, ενώ userId είναι αυτός που θα παραλαβει το μήνυμα
    socket.on('disconnect', () => {
        console.log('disconnected');
    });

    socket.on('enterConversation', async ({conversationId, userId}) => {
        socket.join(conversationId);
        console.log('entered the conversation ' + conversationId)

        const blockchain = await Blockchain.find(); // επιστρέφει όλο το blockchain

        const res = await conn.searchAssets('BlockchainMessenger_v1');
        
        // αν δεν υπάρχει το blockchain και επίσης δεν υπάρχει και στα αρχεία του bigchaindb, τότε σημαίνει πως είναι η πρώτη φορά που γίνεται εισαγωγή στον πίνακα αυτόν στην βάση, άρα πρέπει να δημιουργήσω το genesis block. Αυτό θα γίνει μόνο αν ισχύουν τα παραπάνω και επίσης το μήκος του πίνακα από το bigchaindb είναι 0, δηλαδή δεν υπάρχει τέτοιο blockchain με αυτό το όνομα
        if(blockchain.length === 0 && res.length === 0) {
            await CreateGenesisBlock(socket.userId);
        }
        else{
            const valid = await VerifyTheBlockchain(blockchain);
            if(!valid){
                await ReconstructTheBlockchain();
                SocketIO.to(conversationId).emit('informTheUserWhenEntering', {});
            }
        }

        const userS = await User.findOne({_id: socket.userId}); // αποστολέας
        const userR = await User.findOne({_id: userId}); // παραλήπτης

        const senderKeyPair = nacl.box.keyPair.fromSecretKey(fromHexadecimalStringtoUint8Array(userS.address_publicKey));
        const recipientKeyPair = nacl.box.keyPair.fromSecretKey(fromHexadecimalStringtoUint8Array(userR.address_publicKey));

        const oneTimeCode1 = recipientKeyPair.publicKey.slice(8);
        const oneTimeCode2 = senderKeyPair.publicKey.slice(8);


        // βρίσκω τα blocks που περιέχουν τα μηνύματα μεταξύ των 2 χρηστών είτε αυτά που χει στείλει ο ένας και τα παρέλαβε ο άλλος είτε το αντίστροφο
        const blocks = await Blockchain.find({$or:[ {senderId: socket.userId, recipientId: userId}, {senderId: userId, recipientId: socket.userId} ] }) 
        const userMessages = [];
        if(blocks.length>=1){
            for(var block of blocks){
                let decodedMessage = block.senderId === socket.userId? nacl.box.open(fromHexadecimalStringtoUint8Array(block.message), oneTimeCode1, senderKeyPair.publicKey, recipientKeyPair.secretKey) : nacl.box.open(fromHexadecimalStringtoUint8Array(block.message), oneTimeCode2, recipientKeyPair.publicKey, senderKeyPair.secretKey);
                let readableMessage = nacl.util.encodeUTF8(decodedMessage);

                const message = {
                    message: readableMessage,
                    username: block.senderId === socket.userId ? userS.name : userR.name,
                    userSender: block.senderId
                }
                userMessages.push(message);
            }

            if(userMessages && userS && userR){
                SocketIO.to(conversationId).emit('getAllMessages', {
                    allMessages: userMessages
                });
            }
        }
    });

    socket.on('leaveConversation', (conversationId) => {
        socket.leave(conversationId); 
        console.log('left the conversation ' + conversationId.conversationId) // όταν γίνεται emit το leaveConversation στο frontend επιστρέφει conversationId σαν αντικείμενο με ιδιότητα το conversationId και όχι απλά σαν string
    })


    socket.on('conversationMessage', async ({conversationId, message, userId}) => {
        // μονο αν το μήνυμα δεν είναι κενό τότε κάνω emit μια νέα μέθοδο newMessage


        const userS = await User.findOne({_id: socket.userId}); // αποστολέας

        const userR = await User.findOne({_id: userId}); // παραλήπτης

        var blockchain = await Blockchain.find(); // επιστρέφει όλο blockchain


        //εδώ θα ελέγχω αν είναι έγκυρο το blockchain
        if(message){
            var valid = await VerifyTheBlockchain(blockchain);
            var validAfterRecons;

            console.log('is chain valid?' + valid);
            if(!valid){
                const reconstructed = await ReconstructTheBlockchain();
                if(reconstructed){
                    validAfterRecons = VerifyTheBlockchain(blockchain);
                }
                SocketIO.to(conversationId).emit('informTheUserWhenSending', {});
                blockchain = await Blockchain.find();
            }
            
            if(valid || validAfterRecons){
                console.log('chain is valid');
                // keypair αποστολέα για την συναλλαγή/transaction στο bigchaindb
                const sender = new driver.Ed25519Keypair(fromHexadecimalStringtoUint8Array(userS.address_publicKey));

                // τα keypairs που θα χρησιμοποιηθούν για την κρυπτογράφηση σύμφωνα με το δημόσιο κλειδί που έχει δοθεί στον κάθε χρηστη. αυτά δεν αποθηκεύονται για λόγους ασφαλείας, αλλα κάθε φορα γίνονται generate με βάση το δημόσιο κλειδί που υπάρχει στη βάση
                const senderKeyPair = nacl.box.keyPair.fromSecretKey(fromHexadecimalStringtoUint8Array(userS.address_publicKey));
                const recipientKeyPair = nacl.box.keyPair.fromSecretKey(fromHexadecimalStringtoUint8Array(userR.address_publicKey));

                const oneTimeCode = recipientKeyPair.publicKey.slice(8);

                //ποιο είναι το μήνυμα που γράφει ο χρήστης
                const unencryptedMessage = message;

                //κρυπτογράφησε το
                const encryptedMessage = nacl.box(
                    nacl.util.decodeUTF8(unencryptedMessage),
                    oneTimeCode,
                    recipientKeyPair.publicKey,
                    senderKeyPair.secretKey 
                );

                const hexEncryptedMessage = fromUint8ArraytoHexadecimalString(encryptedMessage);

                const Timestamp = GetDateTimeNow();
                const PreviousBlockHash = blockchain[blockchain.length -1].currentBlockHash;
                const BlockIndex = blockchain[blockchain.length -1].index + 1;
                const CurrentBlockHash = ComputeTheHashOfThisBlock(hexEncryptedMessage, PreviousBlockHash, Timestamp, userS._id, userR._id, BlockIndex);
                

                const assetData_BlockData = {
                    message: hexEncryptedMessage,
                    senderId: userS._id ,
                    recipientId: userR._id,
                    timestamp: Timestamp,
                    previousBlockHash: PreviousBlockHash,
                    currentBlockHash: CurrentBlockHash,
                    index: BlockIndex,
                    name: 'BlockchainMessenger_v1'
                }

                const transaction = driver.Transaction.makeCreateTransaction(
                    assetData_BlockData,
                    null,
                    [ driver.Transaction.makeOutput(
                        driver.Transaction.makeEd25519Condition(sender.publicKey))],
                    sender.publicKey
                );

                const transactionSigned = driver.Transaction.signTransaction(transaction, sender.privateKey);

                conn.postTransactionCommit(transactionSigned);

                const newBlock = new Blockchain(assetData_BlockData);

                let decodedMessage = nacl.box.open(fromHexadecimalStringtoUint8Array(hexEncryptedMessage), oneTimeCode, senderKeyPair.publicKey, recipientKeyPair.secretKey);
                let readableMessage = nacl.util.encodeUTF8(decodedMessage);

                // είναι από τη μεριά αυτού που στέλνει, άρα userId και name αυτού που το στέλνει
                SocketIO.to(conversationId).emit('newConvMessage', {
                    userId: userS._id,
                    name: userS.name,
                    message: readableMessage
                });

                await newBlock.save();
            }
        }
    })
});