const express = require('express');

//η εφαρμογή μας θα είναι express εφαρμογή, δηλαδή χρησιμοποιούμε το express σαν την βάση πάνω στην οποία χτίζεται η εφαρμογή μας και μπορούμε να χρησιμοποιήσουμε όλες τις συναρτήσεις του για να κάνουμε την ενδιάμεση σύνδεση μεταξύ front και back end. Πρακτικά και με απλά λόγια, ορίζουμε πως θα διαχειρίζονται τα requests από το front στο back. Είναι μία απλή και χρήσιμη τεχνική καθώς χρησιμοποιώντας τις μεθόδους του express έχουμε ανά πάσα στιγμή πρόσβαση σε όλα τα requests μέσω των αντικειμένων αιτήματος (req), απόκρισης (res) και στην επόμενη συνάρτηση next που διαχειρίζεται αυτόματα το τι θα γίνει (αν πχ δεν κάνουμε κάτι εμείς πιο πριν ή δεν καλύπτονται οι συνθήκες)
const app = express();

//γενικά με το app.use ενσωματώνω στην εφαρμογή μου διάφορα χαρακτηριστικά και επιλογές που μου δίνονται από το express, όπως βλέπουμε παρακάτω

//ενσωματωμένη λειτουργία ενδιάμεσου λογισμικού στο Express. Αναλύει τα εισερχόμενα requests ως JSON και η όλη διαχείριση γίνεται πάνω σε αυτό το πρότυπο 
app.use(express.json());
// με απλά λόγια αυτό χρησιμοποιείται για να μπορούμε να περνάμε περιεχόμενο στα αιτήματα εμφωλευμένα/nested αντικείμενα μέσα σε άλλα αντικέιμενα κοκ, αλλιώς δεν γίνεται κάτι τέτοιο αν δεν το είχαμε ορίσει.
app.use(express.urlencoded({extended: true}));
//Το "CORS" σημαίνει Cross-Origin Resource Sharing. επιτρέπει να γίνονται requests από την εφαρμογή μας σε έναν άλλο ιστότοπο πχ σε κάποια APIs που χρησιμοποιούμε. Ουσιαστικά παρακάμπτει τις ρυθμίσεις που έχουν κάποιοι browsers και οι οποίες το απαγορεύουν σύμφωνα με την πολιτική Same origin Policy (SOP). Και για να μην υπάρχουν θέματα σε διαφορετικούς browsers κλπ το ενεργοποιούμε global στην εφαρμογή μας, αφού πρώτα εγκαταστήσαμε το package cors με το npm install --save cors
app.use(require('cors')());

// πρέπει να ενημερώσω την εφαρμογή μου πως θα χρησιμοποιηθεί για τις λειτουργίες του χρήστη το αρχείο userRouting, στο οποίο ορίζεται τι γίνεται οταν ο χρήστης κανει requests στον σερβερ. Δηλαδή πχ όταν ο χρήστης πατάει το κουμπί login τότε γίνεται από το frontend μέσω του axios post request sto http://localhost:8000/user/login και σε αυτή την περίπτωση πρέπει σύμφωνα με το αρχείο userRouting να κληθεί η μέθοδος login από τον userController. Ομοίως με το sign up κουμπί και με την εμφάνιση όλων των χρηστών (από getAllUsers) όταν μπαίνει ο χρήστης στο lobby.

app.use('/user', require('./userRouting')); 

// εδώ αρχικά κάνω την σύνδεση με το αρχείο handlingErrors, στο οποίο υπάρχουν έλεγχοι για διάφορα σφάλματα και το τί γίνεται για να διαχειριστούν. Ενημερώνω την εφαρμογή μου ότι για τέτοια σφάλματα θα αναλαμβάνει το αρχείο αυτό και τα χειρίζεται.

const errors = require('./handlingErrors');
app.use(errors.mongodbErrors);

module.exports = app;