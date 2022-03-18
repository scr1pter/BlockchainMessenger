const jwt = require('jwt-then');

module.exports = async (req, res, next) => {
    try{
        // αν δεν υπάρχει το token που δίνεται στον χρήστη όταν κάνει πετυχημένο login, τότε πρέπει να βγαίνει error
        if(!req.headers.authorization){
            throw 'You are not authorized / User token is missing'
        }

        //παίρνω το token του χρήστη που έχει κάνει login από το request και συγκεκριμένα από τους headers και το κάνω split στο space, δηλαδή θα πάρω έναν πίνακα που θα έχει ['something', '985fhashvc772fa75742jdvn', ...]. άρα, για αυτό παίρνω το δεύτερο στοιχείο
        const token = req.headers.authorization.split(' ')[1];

        //τώρα πρέπει να κάνω verify το token και να περιμένω να γίνει το verify για να συνεχίσω πιο κάτω. Όταν στο login κάνω sign για το token στον userController, χρησιμοποιώ το id του user (αυτό δηλαδή που δίνει αυτόματα το mongodb σε κάθε εγγραφη). αν το token που πήρα από τους headers δεν κάνει επιτυχώς το verify τότε θα βγεί error και πάμε παρακάτω στο catch. αλλιώς αν πάνε όλα καλά και μου επιστρέψει το json web token τότε συνεχίζω
        const payload = await jwt.verify(token, process.env.SECRET);

        req.payload = payload;// άρα, εδώ θέτω το payload του request ως αυτό που πήρα σαν απάντηση από το verification του token παραπάνω.

        next();
    }
    //401 status για not authorized, δηλαδή ότι δεν είναι έγκυρο το token με το οποίο έγινε το request για login ή για να φέρουμε όλους τους χρήστες μέσω της getAllUsers()
    catch(error) {
        res.status(401).json({
            message: 'Not Authorized'
        })
    }
}