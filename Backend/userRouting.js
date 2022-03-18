const router = require('express').Router();// που θα κατευθύνονται τα requests ανάλογα με το url που περιέχουν. πχ βλέπουμε παρακάτω πως όταν γίνεται request στο http://localhost:3000/login στο frontend αυτό αντιστοιχεί στο http://localhost:8000/user/login στο backend και τότε καλείται η μέθοδος login από τον userController.

const {appErrors} = require('./handlingErrors')

const userController = require('./Controllers/userController');

const authentication = require('./authentication');

// αυτό που θέλουμε εδώ είναι όταν γίνονται τα requests για login, sign-up και getAllUsers να ελέγχουμε και να δεσμεύουμε τα errors που προκύπτουν από την μεθόδους αυτές του userController. Επίσης, για την μέθοδο getAllUsers συμπεριλαμβάνω και το authentication στο ενδιάμεσο, δηλαδή θα πρέπει να ελέγχεται πως το token από τους headers του request είναι έγκυρο και κατ'επέκταση ο χρήστης είναι έγκυρος, είναι αυτός που όντως έκανε το request, άρα έχει το δικαίωμα να δεί όλους τους χρήστες, να δει το αποτέλεσμα που θα επιστρέψει η μέθοδος αυτή.
router.post('/login', appErrors(userController.login));
router.post('/sign-up', appErrors(userController.signup));
router.get('/users', authentication, appErrors(userController.getAllUsers));


module.exports = router;