import React from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import {Link} from 'react-router-dom';
import Login from './Views/login';
import SignUp from './Views/signup';
import Lobby from './Views/lobby';
import Index from './Views/index';
import Conversation from './Views/conversation';
import IO from 'socket.io-client';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import showMessage from './pop_up_Toasts';

function App() {
  const [socketIO, setSocketIO] = React.useState(null);

  const SocketIO_Setup = () => {

    const userToken = localStorage.getItem('userToken');

    //αν υπάρχει το token χρήστη και δεν έχει πάρει ακόμα κανονική τιμή το SocketIO (είναι null δηλαδή και είτε δεν έχει γίνει ακόμα η σύνδεση είτε έγινε αποσύνδεση), τότε πρέπει να δημιουργήσω την σύνδεση με το socket ώστε να επικοινωνούμε με το backend
    if(userToken && !socketIO) {
      const socket = IO("http://localhost:8000", {
        query: {
            token: localStorage.getItem('userToken'),
        },
      });
      // όταν αποσυνδέεται η σύνδεση socket (πχ για λόγους αποσύνδεσης από το internet και όχι χειροκίνητα, δηλαδή με logout) πρέπει να θέσω το state του socket, το socketIO σε null
      socket.on('disconnect', () => {
        setSocketIO(null);
      });

      //όταν συνδέεται η σύνδεση socket πρέπει να θέσω το state του socket, το socketIO στην τιμή που πήρε από την επιτυχημένη σύνδεση που έγινε παραπάνω
      socket.on('connect', () => {
        setSocketIO(socket);
      });
    }
  }

  // την 1η φορά που γίνεται render / εμφανίζεται το τρέχον component App (δηλαδή σε όλες τις φάσεις της εφαρμογής), πρέπει να γίνεται η επανεκκίνηση του socket για να υπάρχει η απαραίτητη διασύνδεση με το backend
  React.useEffect( () => {
    SocketIO_Setup();
  }, []);

  // εδώ γίνεται η χειροκίνητη αποσύνδεση του χρήστη από την εφαρμογή, ήτοι το logout. Αν λοιπόν ο χρήστης πατήσει το κουμπί logout παίρνω τα στοιχεία της σύνδεσης socket από το backend, σύμφωνα με το αναγνωριστικό token του χρήστη και αν έχει τιμή το state του socketIO (δηλαδή δεν είναι null), τότε κάνω την αποσύνδεση με το αντίστοιχο μήνυμα
  const disconnect = () => {
    const socket = IO("http://localhost:8000", {
        query: {
            token: localStorage.getItem('userToken'),
        },
      });
      if(socketIO){
        socket.disconnect();
        localStorage.setItem('userToken', null);
        setSocketIO(null);
        showMessage('success', 'You have logged out.');
      }
  }

  return (
    <BrowserRouter>
      <div className="App">
      <div className="container-fluid">
        <nav className="navbar navbar-expand-sm navbar-light fixed-top">
            <div className="navbar-brand">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Blockchain Messenger <i style={{fontSize: '12px'}}>by Gerasimos Varnis</i></div>
              {localStorage.getItem('userToken') === 'null' || localStorage.getItem('userToken') === null ? 
              <ul className="navbar-nav">
                <li className="nav-item">
                  <Link className="nav-link" to={"/login"}>Login</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to={"/sign-up"}>Sign-Up</Link>
                </li>
              </ul> : 
              <ul className="navbar-nav">
                <li className="nav-item">
                  <Link className="nav-link" to={"/lobby"}>Lobby</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to={"/login"} onClick={disconnect}>Logout</Link>
                </li>
            </ul>}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        </nav>
      </div>
        <div className="customBox">
          <div className='custombox'>
            <Switch>
              <Route exact path="/login" render={() => <Login SocketIO_Setup={SocketIO_Setup}/>}/>
              <Route exact path='/sign-up' component={SignUp}/>
              <Route exact path='/lobby' render={() => <Lobby socket={socketIO}/>}/>
              <Route exact path='/' component={Index}/>
              {/* με την : μετά url περνάω ότι είναι μετά την : σαν params από αυτό το page στο conversation και έτσι όπως θα δούμε σε εκείνο το view μπορώ να πάρω την τιμή των παραμέτρων αυτών μέσω του match.params. πρακτικά αυτά εδώ θα είναι αυτά που περνάνε από το lobby, όταν πατάω το κουμπί enter σε κάποια συνομιλία */}
              <Route exact path='/conversation/:conversationParameters' render={(props) => <Conversation socket={socketIO} match={props.match}/>}/>
              {/* εδώ γίνεται ο έλεγχος για το αν το url που εισάγει ο χρήστης δεν είναι κάποιο από τα προηγούμενα αποδεκτά urls, τα οποία αντιστοιχούν και περιγράφουν την λειτουργία της εφαρμογής μας. Αν εισάγει κάτι διαφορετικό από αυτό που υπάρχει μέσα στην πρώτη παρένθεση του regex, τότε θα γίνεται render ενός μόνο div με μήνυμα λάθους, πως η σελίδα δεν βρέθηκε  */}
              <Route exact path={/^\/(?:login|sign-up|lobby|conversation\/:conversationParameters|)\s*.*[A-Za-z0-9]+$/} render={() =>
                <div>
                  <br />
                  <h3 style={{textAlign: 'center'}}>Page Not Found!</h3>
                </div>
              }/>
            </Switch>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
