const googleStrategy = require('passport-google-oauth2').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const passport = require('passport');
passport.use(new googleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/api/auth/google/callback",
    passReqToCallback: true,
},
    function(request, accessToken, refreshToken, profile, done){
        done(null, profile);
    }    
));
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/api/auth/facebook/callback",
    passReqToCallback: true,
    profileFields: ["id", "emails", "name", "displayName", "picture.type(large)"]
},
    function(request, accessToken, refreshToken, profile, done){
        done(null, profile);
    }
));