import React from 'react'
import axios from 'axios' // αυτο γίνεται για να μπορώ να στείλω requests από το frontend που είμαι τώρα προς το backend και εκεί γίνεται η διαχείριση ανάλογα με το userRouting, που ορίσαμε και τις αντίστοιχες μεθόδους (εδώ πχ είναι η μέθοδος getAllUsers του userController)
import {Link} from 'react-router-dom';
import showMessage from '../pop_up_Toasts';

export default function Lobby(socket) {
    const [users, setUsers] = React.useState([]);
    const reg = /\d+/g;

    // αυτή η μέθοδος είναι μέσα στο useEffect που έχει σαν παράμετρο το []. αυτό σημαίνει πως ότι βρίσκεται μέσα στο useEffect θα κληθεί μόνο την πρώτη φορά που γίνεται render to component Lobby. Επομένως, όταν ο χρήστης κάνει πετυχημένο login και πάει σε αυτό το view, τότε καλείται αυτή η μέθοδος για να φέρει όλους τους χρήστες από την βάση και να τους εμφανίσει. Γίνεται ένα get request μέσω του axios.get προς τον σέρβερ μας. Σε αυτό το request θέτουμε κάποιους headers και υπάρχει η ιδιότητα του Authentication. Αυτό γίνεται, επειδή χρησιμοποιούμε τα jwt - JSON Web Tokens για να πιστοποιήσουμε τον χρήστη όταν κάνει το login μέσω ενός token που υπογράφεται και ελέγχεται, σύμφωνα με το μοναδικό Id του κάθε χρήστη. Ο τρόπος λοιπόν που στέλνουμε το get request εδώ, είναι μέσω πιστοποίησης του χρήστη. δηλαδή το bearer authentication ή αλλιώς token authentication σημαίνει "δώσε πρόσβαση για request από τον client προς τον server, μόνο σε αυτόν που φέρει το token (bearer of token)". Έπειτα, το token αυτό ελέγχεται στο backend/server side και αν είναι όντως έγκυρο, τότε γίνεται το request.
    const getAllUsers = () => {
        axios.get('http://localhost:8000/user/users', {
            headers: {
                Authorization: 'Bearer ' + localStorage.getItem('userToken'),
            },
        })
        .then( (response) => {
            setUsers(response.data);  // λοιπόν εδώ με την get παίρνω όλα τους χρήστες που αντιστοιχούν ο καθένας σε μία συνομιλία για τον χρηστη με αυτό το συγκεκριμένο token, άρα το response.data θα μου επιστρέφει έναν πινακα με όλους τους χρήστες (που αργότερα μεταφράζονται σε συνομιλίες/conversations. Αν επιλέξω να κάνω enter σε έναν χρήστη από την λίστα, τότε μπαίνω στο conversation με αυτό τον χρήστη). Έτσι, έχοντας μπεί στο then υπάρχει το αποτέλεσμα της επιτυχημένης get και επομένως θέτω το state μου users στο αποτέλεσμα αυτό.
        })
        .catch( (error) => {
            setTimeout(getAllUsers, 2000); // αν υπάρχει error δεν εμφανίζουμε κάποιο μήνυμα αλλά προσπαθούμε να ξαναφέρουμε όλους τους χρήστες μετά από 2 δευτερόλεπτα (πχ ίσως υπήρχε κάποια αδυναμία σύνδεσης με το backend)
        });
    };

    React.useEffect(() => {
        getAllUsers();

        // αυτό είναι για την περίπτωση που γίνεται refresh στο conversation page. επειδή, η σύνδεση socket είναι session και χάνεται όταν γίνεται ανανέωση σελίδας. η συνομιλία λειτουργεί με τα συγκεκριμένα socket που έχει πάρει ο κάθε χρήστης (από τους 2 που συνομιλούν), δηλαδή αν ανανεώσω την σελίδα conversations δεν ισχύει πλέον το socket που είχα πριν και μου επέτρεπε να μιλήσω με τον άλλο χρήστη. για αυτό ανακατευθύνεται ο χρήστης εδώ όταν κάνει ένα τέτοιο refresh ώστε να ξαναπατήσει το enter. O σκοπός αυτού του μηνύματος είναι να ενημερωθεί ο χρήστης αν καταλάθος πατήσει το refresh/reload, ότι δεν υπάρχει λόγος να το ξανακάνει διότι η εφαρμογή λειτουργεί μια χαρά και realtime όπως και να χει. Επίσης, ο δεύτερος έλεγχος για το token γίνεται ώστε να μην βγαίνει αυτό το μήνυμα αν έχει αποσυνδεθεί ο χρήστης και πάει στο conversation και κάνει refresh.
        if(localStorage.getItem('reloaded') === 'true' && localStorage.getItem('userToken') !== 'null'){
            showMessage('info','You were redirected here to instantiate the socket connection again. There is no need to refresh the page.');
            localStorage.setItem('reloaded', false);
        }

        //μήνυμα ενημέρωσης του χρήστη για την περίπτωση που το τοπικό blockchain μας δεν είναι έγκυρο όταν ο χρήστης κάνει enter στη συζήτηση. αυτό εδώ είναι το τελευταίο βήμα. ξεκινάμε από το backend, πάμε στο frontend στο αρχείο conversation.js και από εκεί καταλήγουμε εδώ.
        if(localStorage.getItem('reconstructedWhenEntering') === 'true'){
            showMessage('info','The blockchain is not valid and has to be reconstructed. Please wait for this message to disappear and enter again...');
            localStorage.setItem('reconstructedWhenEntering', false);
        }
    }, []);

    return (
        <div>
            {/* εδώ υπάρχει ο έλεγχος για το userToken, αν είναι null. δηλαδή πρέπει να έχει γίνει πετυχημένη είσοδος του χρήστη για να μπορέσει να δεί την σελίδα αυτή. αν πχ κάποιος πατήσει τη σελίδα χωρίς να έχει μπεί στην εφαρμογή ή έχει κάνει logout, τότε θα εμφανίζεται μήνυμα ότι δεν έχεις την εξουσιοδότηση για να δεις την σελίδα αυτή. αν υπάρχει το token, τότε εμφανίζεται κανονικά. */}
            {localStorage.getItem('userToken') !== 'null' && localStorage.getItem('userToken') !== null ? 
              <div>
                    <br />
                    <div className="form-group">
                        <h4 className='text'><i>Click <b><u>Enter</u></b> to start a conversation</i></h4>
                        <hr />
                    </div>
                    <div className='conversations'> 
                        <div className='text'>List of Registered Users<br /><br />
                            {users.filter(u => u.name !== localStorage.getItem('userName')).map(user => (
                                <div key={user._id} className="conversation">
                                    <div>{user.name}</div>
                                    {/* περνάμε σαν παράμετρο στο url της κάθε συνομιλίας, α) το άθροισμα των αριθμών που υπάρχουν στα ids των 2 χρηστών που συνομιλούν ( το οποίο θα είναι πάντα σταθερό), β) το id αυτού που θα λαμβάνει τα μηνύματα και γ) το όνομα του. αυτά είναι αναγνωριστικά που βοηθάνε στην ανταλλαγή των μηνυμάτων με σωστό τρόπο μετά στο conversation page */ }
                                    <Link to={'/conversation/' + (parseInt(user._id.match(reg).join('')) + parseInt(localStorage.getItem('currentUserId').match(reg).join(''))) + '_' + user._id + '_' + user.name}>
                                        <button className="btn btn-primary btn-block">Enter</button>
                                    </Link>
                                </div>
                            ))}
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
    )
}