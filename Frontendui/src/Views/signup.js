import React from 'react'
import axios from 'axios' // αυτο γίνεται για να μπορώ να στείλω requests από το frontend που είμαι τώρα προς το backend και εκεί γίνεται η διαχείριση ανάλογα με το userRouting, που ορίσαμε και τις αντίστοιχες μεθόδους (εδώ πχ είναι η μέθοδος sign-up του userController)
import showMessage from '../pop_up_Toasts';

export default function SignUp(props) {
    // δημιουργώ τα references, ώστε να υπάρχει δυναμική αναφορά σε σχέση με τα πεδία name και password που εισάγει ο χρήστης και έτσι μετά από την τιμή/value των inputs αυτών έχω άμεση πρόσβαση με το current.value
    const nameReference = React.createRef();
    const passwordReference = React.createRef();

    const signupUser = () => {
        const name = nameReference.current.value;
        const password = passwordReference.current.value;

        // αφού έχω τις τιμές από αυτά που έχει εισάγει ο χρηστης στα πεδία input name, password πρέπει να κάνω την σύνδεση με την βάση και να γίνει η εγγραφή του χρήστη στη mongoDB μέσω του axios.post. το axios.post κάνει ένα post request με την μορφή promise και καλεί τον userController και συγκεκριμένα την μέθοδο sign-up. τελικά θα επιστρέψει αποτέλεσμα resolved η rejected. όταν επιστραφεί κάτι τότε αυτό θα περιέχεται στην παράμετρο response μέσα στο then. αν το axios.post ήταν πετυχημένο δηλαδή έγινε η εγγραφή του χρήστη στην βάση, τότε δημιουργούμε ένα μηνυματάκι με το makeToast τύπου success και εμφανίζουμε από τα δεδομένα του αποτελέσματος το message. Αυτό που περιέχεται μέσα στο response είναι αυτό που επιστρέφουμε σαν res json από τον userController. 
        axios.post('http://localhost:8000/user/sign-up', {
            name,
            password
        }).then(response => {
            showMessage('success', response.data.message);
            props.history.push('./login'); // αφού γίνει το πετυχημένο sign-up κατευθύνω τον χρηστη στο login για να εισάγει τα στοιχεία του και να κάνει είσοδο στην εφαρμογή. δηλαδή το push πρακτικά μετακινεί τον χρήστη από αυτό το view στο login
        }).catch(error => { // αν όμως υπήρξε error κατά το sign-up του χρήστη, μέσω του catch(error) παίρνουμε αυτό το σφάλμα και το εμφανίζουμε πάλι ανάλογα με το throw που έγινε μέσα στον userController.
            if(error.response){
                showMessage('error', error.response.data.message)
            }
        })
    }

    const handleEnter = e => {
        if (e.charCode === 13) {
            signupUser();
          }
    }

    return (
        <div className="signup">
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
                <button className="btn btn-primary btn-block" onClick={signupUser}>Sign-Up</button>
            </div>
        </div>
    )
}
