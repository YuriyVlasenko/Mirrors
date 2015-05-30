/**
 * Created by Serg on 25.05.2015.
 */
var userModel = require('../models/User').dbModel;
var LocalStrategy   = require('passport-local').Strategy;

module.exports.init = function(app, passport){
    passport.serializeUser(function(user, done) {
        console.log('serializeUser');
        done(null, user.userId);
    });

    passport.deserializeUser(function(id, done) {
        console.log('deserializeUser');
        userModel.findOne({userId: id}, function(err,user){
            err ? done(err) : done(null,user);
        });
    });

    passport.use('local-signup', new LocalStrategy({
            usernameField: 'username',
            passwordField: 'password'
        },
        function(username, password, done) {
            //console.log('username'+username);
            userModel.findOne({ login: username }, function(err, user) {
                if (err) { return done(err); }
                if (!user) {
                    return done(null, false, { message: 'Incorrect username.' });
                }
                if (user.password !== password) {
                    return done(null, false, { message: 'Incorrect password.' });
                }
                if (!user.isActive){
                    return done(null, false, { message: 'User is inactive.' });
                }
                return done(null, user);
            });
        }
    ));

    app.post('/signIn', function(req, res, next) {
        console.log('sign in');
        passport.authenticate('local-signup', function(err, user, info) {
            if (err) { return next(err) }
            if (!user) {
                req.session.messages =  [info.message];
                return res.redirect('/signIn')
            }
            req.logIn(user, function(err) {
                if (err) { return next(err); }
                req.session.user = {
                    id: user.userId,
                    login: user.login,
                    fio: user.fio,
                    roleId: user.roleId,
                    comment: user.comment
                };
                return res.redirect('/');
            });
        })(req, res, next);
    });
    app.get('/signOut', function(req, res){
        req.logout();
        res.redirect('/');
    });
};