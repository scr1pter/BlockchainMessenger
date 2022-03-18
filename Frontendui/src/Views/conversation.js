import React from 'react';
import { withRouter } from 'react-router-dom';
import showMessage from '../pop_up_Toasts';

const Conversation = ({socket, match}) => {

    // επειδή το socket.io δημιουργεί σύνδεση με τον server με τη μορφή session (δηλαδή γίνεται η σύνδεση και ισχύει όσο αυτό το socket instance είναι ενεργό) σημαίνει πως αν κάνω refresh μέσα από το conversation view γίνεται επανεκκίνηση και υπάρχει άλλο socket instance πλέον, το οποίο όμως πρέπει να πάρει τα σωστά στοιχεια για να μπορέσεις να συνομιλήσεις με τον χρήστη εκ νέου. Έτσι, αυτό θα γίνεται όταν μπαίνω από το lobby και για αυτό αν τυχόν γίνει refresh τότε κάνουμε redirect στο lobby για να εισέλθει εκ νέου ο χρηστης στη συζήτηση. Δεν είναι ανάγκη να γίνεται refresh, η συνομιλία είναι realtime και γίνεται update όπως πρέπει. Οι session συνδέσεις είναι ασφαλότερες, καθώς κάθε φορα υπάρχει διαφορετική σύνδεση με αλλα στοιχεια, για αυτό επιλέξαμε το socket. Όμως δεν θέλουμε να κάνει re render αυτή η σελίδα, όταν πχ κάνω refresh το lobby page και πατάω το enter δε θέλω να μπαίνει σε αυτό το if block και να με ξαναγυρνάει στο lobby. Θέλω μόνο όταν πατάω refresh sto conversation page (στο τρέχον component δηλαδή) και μηδενίζεται/γίνεται null το socket να κάνει το redirect, εξού και ο έλεγχος για το !socket. Διότι, όταν πατάω enter μπαίνει στην σελίδα και επειδή κάνει render το react το λαμβάνει σαν refresh/reload και αν δεν υπήρχε ο έλεγχος έμπαινε εδώ.
    if (window.performance && !socket) {
        if (window.performance.navigation.type === 1) {
          localStorage.setItem('reloaded', true);
          window.location.href = 'http://localhost:3000/lobby';
        }
      }
      
    //με βάση το conversationParameters, που όρισα στο App και με τις παραμέτρους που βάζω στο Link, όταν πατάει κάποιος το enter κουμπί στο lobby για να μπεί σε μία συζήτηση μπορώ και παίρνω τις τιμές που στέλνω

    const conversationID = match.params.conversationParameters.split('_')[0]; // αυτό είναι το άθροισμα των αριθμών που υπάρχουν στο id του κάθε εκ των 2 χρηστών. θα είναι πάντα ίδιο είτε μπει ο ένας ως αποστολέας είτε ο άλλος. άρα, σύμφωνα με αυτό θα στέλνονται τα μηνύματα και είναι το μοναδικό αναγνωριστικό της κάθε συνομιλίας
    const userID = match.params.conversationParameters.split('_')[1]; // id του χρήστη που λαμβάνει τα μηνύματα
    var receiverName = match.params.conversationParameters.split('_')[2]; // όνομα του χρήστη που λαμβάνει τα μηνύματα και μπαίνει ως τίτλος στη συνομιλία πάνω δεξιά. δηλαδή όταν μπαίνω στην συνομιλία ξέρω ότι αυτός που συνομιλώ είναι με το πάνω δεξιά όνομα

    const [messages, setMessages] = React.useState([]); // το state των μηνυμάτων που υπάρχουν στην συνομιλία

    const msgReference = React.useRef(); // δημιουργώ το reference, ώστε να υπάρχει δυναμική αναφορά σε σχέση με το πεδίο του μηνύματος που γράφει ο χρήστης και έτσι έχω άμεση πρόσβαση με το current.value

    // στέλνει το μήνυμα και όταν πατάω το enter 
    const handleEnter = e => {
        if (e.charCode === 13) {
            sendMessage();
          }
    }

    //η μέθοδος που καλείται όταν πατάμε send ή enter για να στείλουμε το μήνυμα μας. ελέγχουμε αν υπάρχει το socket αρχικά (για να γίνει η σύνδεση με το backend) και κάνω emit (καλώ) την μέθοδο conversationMessage που έχει οριστεί στο backend/ αρχείο server.js. Περνάω σαν παραμέτρους το id της συνομιλίας, το μήνυμα kai to id του χρήστη που λαμβάνει το μήνυμα. Εκεί είναι που εν τέλει αν όλα πάνε καλά καλείται η μέθοδος newConvMessage
    const sendMessage = () => {
        if(socket){
            socket.emit('conversationMessage', {
                conversationId: conversationID,
                message: msgReference.current.value,
                userId: userID
            });

            //μετά την αποστολή του μηνύματος αρχικοποιώ την αναφορά μου για το τι γράφει ο χρήστης, ώστε να είναι έτοιμο για την επόμενη αποστολή
            msgReference.current.value = "";
        }
    }

    //μόνο την πρώτη φορά που φορτώνει η σελίδα (όταν μπαίνει ο χρήστης πρώτη φορά μετά το πάτημα κουμπιού enter)
    React.useEffect(() => {
        // αν υπάρχει η σύνδεση socket συνδέεται ο χρήστης στην συζήτηση, καλώντας την μέθοδο enterConversation
        console.log(socket);
        if(socket){
            socket.emit('enterConversation', {
                conversationId: conversationID,
                userId: userID
            });

            //αν όταν κάνουμε enter σε μία συζήτηση, εξακριβωθεί από τους ελέγχους στο backend ότι το blockchain στην βάση μας δεν είναι έγκυρο, τότε γίνεται ανακατεύθυνση στο lobby όπου εμφανίζεται μήνυμα ότι ανακατασκευάζεται το blockchain και πρέπει να γίνει enter ξανά.
            socket.on('informTheUserWhenEntering', () => {
                window.location.href = 'http://localhost:3000/lobby';
                localStorage.setItem('reconstructedWhenEntering', true);
            })

            //φέρνει το ιστορικό όλων των μηνυμάτων από το blockchain της βάσης
            socket.on('getAllMessages', ({allMessages}) => {
                var newMessages = [];
                if(allMessages){
                    for (const msg of allMessages) {
                        const message = {
                            name: msg.username,
                            userId: msg.userSender,
                            message: msg.message
                        }
                        newMessages.push(message);
                    }
                    setMessages(newMessages);
                }
            });
        }

        // όταν φεύγει ο χρήστης από την συνομιλία (κλείνει browser, πάει πίσω, κάνει refresh), τότε καλούμε την μέθοδο leaveConversation
        return () => {
            if(socket){
                socket.emit('leaveConversation', {
                    conversationId: conversationID,
                })
            }   
        }
    },[]);

    //κάθε φορά που αλλάζει το state των μηνυμάτων μπαίνει στην useEffect. ΟΜΩΣ, προσοχή. εδώ δεν καλείται η μέθοδος, αλλά αρχικοποιείται/δηλώνεται η newConvMessage. Πρακτικά, αυτή θα καλείται όταν γίνεται το emit/η κλήση από το backend, μετά την κλήση της παραπάνω μεθόδου conversationMessage. Αυτό γίνεται, διότι πριν σταλεί κάποιο μήνυμα υπάρχει διαδικασία στο αρχείο server.js (ελέγχεται το blockchain μας, κρυπτογραφείται το μήνυμα, γίνεται η συναλλαγή bigchaindb και αποθηκεύεται στο blockchain του bigchaindb επιτυχώς και αν όλα αυτά πάνε καλά, τότε ετοιμάζεται η εγγραφή/αποθήκευση του μηνύματος/block στην τοπική μας βάση στον πίνακα blockchain, αποκρυπτογραφείται το μήνυμα και γίνεται η κλήση της μεθόδου newConvMessage (και ερχόμαστε εδώ κάτω) με την παράλληλη ασύγχρονη αποθήκευση του block στη βάση)
    React.useEffect(() => {

        if(socket){
            socket.on('newConvMessage', (message) => {
                const newMessages = [...messages, message];
                setMessages(newMessages);
            });

            // αν κατά την διάρκεια της συνομιλίας και συγκεκριμένα όταν πατήσω την αποστολή, εξακριβωθεί από τους ελέγχους στο backend ότι το blockchain στην βάση μας δεν είναι έγκυρο, τότε βγαίνει μήνυμα ενημέρωσης του χρήστη 'να περιμένει όσο το μήνυμα αυτό διαρκεί για να γίνει ανακατασκευή του blockchain' περίπου 5 δευτερόλεπτα.
            socket.on('informTheUserWhenSending', () => {
                showMessage('info','The blockchain is not valid and has to be reconstructed. Please wait for this message to disappear and try again...');
            })
        }
    },[messages])

    return (
        <div>
            {/* εδώ υπάρχει ο έλεγχος για το userToken, αν είναι null. δηλαδή πρέπει να έχει γίνει πετυχημένη είσοδος του χρήστη για να μπορέσει να δεί την σελίδα αυτή. αν πχ κάποιος πατήσει τη σελίδα χωρίς να έχει μπεί στην εφαρμογή ή έχει κάνει logout, τότε θα εμφανίζεται μήνυμα ότι δεν έχεις την εξουσιοδότηση για να δεις την σελίδα αυτή. αν υπάρχει το token, τότε εμφανίζεται κανονικά. */}
            {localStorage.getItem('userToken') !== 'null' && localStorage.getItem('userToken') !== null ? 
                <div>
                    <div className="conversationBox">
                        <div className="receiver">
                            <span>{receiverName}</span>
                        </div>
                        <br />
                        <div className="conversationInterior">
                            {messages.map((msg, index) => (
                                <div key={index} className="message">
                                    <span className={receiverName !== msg.name ? "me" : "others"}>{receiverName !== msg.name ? 'Me' : msg.name}: </span> {msg.message}
                                </div>
                            ))}
                        </div>
                        <div className="conversationHandlers">
                            <div>
                                <input type="text" name='message' placeholder='Type here...' ref={msgReference} onKeyPress={handleEnter} />
                            </div>
                            <div>
                                <button className="btn btn-primary btn-block" onClick={sendMessage}>Send</button>
                            </div>
                        </div>
                    </div>
                </div>
                :
                <div>
                    <br />
                    <h3 style={{textAlign: 'center'}}>You are not authorized to view this page.<br /><br />Please login or sign-up.</h3>
                </div>
            }
        </div>
    );
};

export default withRouter(Conversation); // βάζω το withRouter για να μπορώ να έχω πρόσβαση στις παραμέτρους που πέρασα πριν (στο App render όρισα ένα Route για το Conversation component, αρχικά με την ενσωμάτωση του conversationParameters και πέρασα ως παράμετρους το socket kai to match). Έτσι, τώρα μπορώ και χρησιμοποιώ και το socket και το match.params για να πάρω τα αναγνωριστικά της συνομιλίας.
