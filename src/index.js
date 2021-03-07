const express = require('express');
const app = express();

/** Middleware **/

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const keys = require('./private/keys');
const session = require('express-session');
app.use(
  session({
    secret: keys.sessionSecret,
    saveUninitialized: false,
    resave: false,
    rolling: true,
  })
);

/** Authentication **/

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
passport.use(
  new GoogleStrategy(
    {
      clientID: keys.googleID,
      clientSecret: keys.googleSecret,
      callbackURL: '/login/redirect',
    },
    (accessToken, refreshToken, profile, callback) => callback(null, profile)
  )
);
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, callback) => callback(null, user));
passport.deserializeUser((user, callback) => callback(null, user || false));

/** Layout Engine **/

app.use(require('express-ejs-layouts'));
app.set('view engine', 'ejs');

const path = require('path');
app.set('layout', path.join(__dirname, './app/layouts/main'));

/** Routers **/

const routes = {};
routes.app = require('./app/routes');
routes.api = require('./api/routes');
app.use('/app/', express.static(path.join(__dirname, 'public')));
app.use('/app/', routes.app);
app.use('/api/', routes.api);
app.get('/login', passport.authenticate('google', { scope: ['profile'] }));
app.get('/login/redirect', passport.authenticate('google', { successRedirect: '/', failureRedirect: '/' }));
app.get('/logout', (request, response) => {
  request.logout();
  response.redirect('/');
});
app.use('/', (_, response) => response.redirect('/app/'));

/** Server **/

const port = process.env.PORT || '3000';
app.listen(port, () => {
  console.log(`\nThe server is now listening at http://localhost:${port}/app/`);
});

module.exports = app;
