require('dotenv').config();

var express = require('express');
var passport = require('passport');
//var Strategy = require('passport-facebook').Strategy;
var Strategy = require('passport-github').Strategy;
var axios     = require('axios');

// load up the user model
var User            = require('./app/models/user');



//API
const PostAPI = 'https://api.github.com/users/' + 'rbalukja15' + '/repos';

//Config db
var mongoose  = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://test:test123456@ds119795.mlab.com:19795/todo');

var nameSchema = new mongoose.Schema({
  firstName: String,
  lastNameName: String
});

var myUser = mongoose.model("myUser", nameSchema);



// Configure the Facebook strategy for use by Passport.
//
// OAuth 2.0-based strategies require a `verify` function which receives the
// credential (`accessToken`) for accessing the Facebook API on the user's
// behalf, along with the user's profile.  The function must invoke `cb`
// with a user object, which will be set at `req.user` in route handlers after
// authentication.
passport.use(new Strategy({
    clientID: '9b0f639324816cd4431d',
    clientSecret: '574a7ba1ba29d6aa74948308c71080936dd3092c',
    callbackURL: 'http://localhost:8080/login/github/callback',
    userAgent: 'https://api.github.com/user'
  },
  function(accessToken, refreshToken, profile, cb) {
    
    
      return cb(null, profile);
    
  }));


// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  In a
// production-quality application, this would typically be as simple as
// supplying the user ID when serializing, and querying the user record by ID
// from the database when deserializing.  However, due to the fact that this
// example does not have a database, the complete Facebook profile is serialized
// and deserialized.
passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});


// Create a new Express application.
var app = express();

// Configure view engine to render EJS templates.
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('cookie-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next){
  res.locals.user = req.user || null
  next();
})


// Define routes.
app.get('/',
  function(req, res) {
    res.render('home', { user: req.user });
  });

app.get('/login',
  function(req, res){
    res.render('login');
  });

app.get('/login/github',
  passport.authenticate('github'));

app.get('/login/github/callback', 
  passport.authenticate('github', { failureRedirect: '/login'}),
  function(req, res) {
    res.redirect('/');
  });

app.post('/login/github/callback', passport.authenticate('github', {
  successRedirect: '/profile',
  failureRedirect: '/login',
  failureFlash: true
}));

app.get('/profile',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, res){
    res.render('profile', { user: req.user });
  });

app.get('/repos', (req, res) => {
  axios.get(`${PostAPI}`).then(posts => {
    res.status(200).json(
      posts.data
    );
  }).catch(error => {
    console.log(error.response);
  });
});


app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.listen(process.env['PORT'] || 8080);
