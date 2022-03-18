import React from 'react'
import axios from 'axios' // αυτο γίνεται για να μπορώ να στείλω requests από το frontend που είμαι τώρα προς το backend και εκεί γίνεται η διαχείριση ανάλογα με το userRouting, που ορίσαμε και τις αντίστοιχες μεθόδους (εδώ πχ είναι η μέθοδος login του userController)
import showMessage from '../pop_up_Toasts';
import { withRouter } from 'react-router-dom';

const Login = (props) => {
    // δημιουργώ τα references, ώστε να υπάρχει δυναμική αναφορά σε σχέση με τα πεδία name και password που εισάγει ο χρήστης και έτσι μετά από την τιμή/value των inputs αυτών έχω άμεση πρόσβαση με το current.value
    const nameReference = React.createRef();
    const passwordReference = React.createRef();

    const loginUser = () => {
        const name = nameReference.current.value;
        const password = passwordReference.current.value;

        // οποτε τώρα αφού έχω τις τιμές από αυτά που έχει εισάγει ο χρηστης στα πεδία input name, password πρέπει να κάνω την σύνδεση με την βάση και να ψάξω τον χρηστη στη mongoDB μέσω του axios.post, που κάνει ένα post request με την μορφή promise και καλεί τον userController, συγκεκριμένα πάει στην μέθοδο login. τελικά θα επιστρέψει αποτέλεσμα resolved η rejected. όταν επιστραφεί κάτι τότε αυτό θα περιέχεται στην παράμετρο response μέσα στο then. αν το axios.post ήταν πετυχημένο δηλαδή έγινε το login, τότε δημιουργούμε ένα μηνυματάκι με το makeToast τύπου success και εμφανίζουμε από τα δεδομένα του αποτελέσματος το message. Αυτό που περιέχεται μέσα στο response είναι αυτό που επιστρέφουμε σαν res json από τον userController. 
        axios.post('http://localhost:8000/user/login', {
            name,
            password
        }).then(response => {
            showMessage('success', response.data.message);
            // αποθηκεύω προσωρινά το token, το name και το Id του εκάστοτε χρηστη που κάνει login στο localStorage (token και Id υπάρχουν στο response.data), ώστε μετά να τα χρησιμοποιήσω σε άλλα views με το getItem
            localStorage.setItem('userToken', response.data.token);
            localStorage.setItem('userName', name);
            localStorage.setItem('currentUserId', response.data.userId);

            props.history.push('/lobby'); // αφού γίνει το πετυχημένο login κατευθύνω τον χρηστη στο lobby (όπου βλέπει όλους τους χρήστες της εφαρμογής και επιλέγει κάποιον για να συνομιλήσει). δηλαδή το push πρακτικά μετακινεί τον χρήστη από αυτό το view στο lobby
            props.SocketIO_Setup(); // αφού έγινε η πετυχημένη είσοδος στην εφαρμογή πρέπει να δώσουμε τιμή στο socket
        }).catch(error => { //αν όμως υπήρξε error κατά το login, μέσω του catch(error) παίρνουμε αυτό το σφάλμα και το εμφανίζουμε πάλι ανάλογα με το throw που έγινε μέσα στον userController.
            if(error.response){
                showMessage('error', error.response.data.message)
            }
        })
    }

    const handleEnter = e => {
        if (e.charCode === 13) {
            loginUser();
          }
    }


    return (
        <div className="login">
            <br />
            <div className="form-group">
                <label htmlFor="name">Name</label>
                <input className="form-control" type="text" name="name" id="name" placeholder='Enter your name' ref={nameReference} onKeyPress={handleEnter}/>
            </div>
            <br />
            <div className="form-group">
                <label htmlFor="password">Password</label>
                <input className="form-control" type="password" name="password" id="password" placeholder='Enter your password' ref={passwordReference} onKeyPress={handleEnter}/>
            </div>
            <br />
            <div className="button">
                <button className="btn btn-primary btn-block" onClick={loginUser}>Login</button>
            </div>
        </div>
    );
};

export default withRouter(Login); // βάζω το withRouter για να μπορώ να έχω πρόσβαση στην παράμετρο που πέρασα πριν (στο App render όρισα ένα Route για το Login component και πέρασα ως παράμετρο την μέθοδο SocketIO_Setup που υπάρχει εκεί στο App). Έτσι, τώρα μπορώ και χρησιμοποιώ το props.SocketIO_Setup() στο line 27

