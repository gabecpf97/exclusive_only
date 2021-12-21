const Post = require('../models/post');
const User = require('../models/user');
const { body, check, validationResult } = require('express-validator');
const async = require('async');
const bcrypt = require('bcrypt');
const passport = require('passport');

exports.user_detail = (req, res, next) => {
    async.parallel({
        posts: (callback) => {
            Post.find({user: req.params.id}).populate('media').populate('user')
            .exec(callback);
        },
        user: (callback) => {
            User.findById(req.params.id).exec(callback);
        }
    }, (err, results) => {
        if(err)
            return next(err);
        if(results.user === null) {
            const err = new Error('No such user');
            err.status = 404;
            return next(err);
        }
        res.render('index', {title: `${results.user.username}`, page: './user', 
                            content: {
                                user: results.user,
                                post_list: results.posts
                            }});
    });
}

exports.user_create_get = (req, res, next) => {
    res.render('index', {title: 'Sign Up', page: './sign_up_form', 
                        content: {}});
}

exports.user_create_post = [
    body('username', 'Name must be longer than 4 letter.').trim().isLength({min: 4}).escape(),
    body('first_name', "First name must not be empty").trim().isLength({min: 1}).escape(),
    body('last_name', "Last name must not be empty").trim().isLength({min: 1}).escape(),
    body('password', 'Password must be longer than 6 letter').trim().isLength({min: 6}).escape(),
    check('username').custom( async (value) => {
        return new Promise((resolve, reject) => {
            User.find({username: value}).exec((err, theUser) => {
                if (theUser.length > 0)
                    reject(new Error('Username already existed'));
                resolve(true);
            });
        });
    }),
    (req, res, next) => {
        const errors = validationResult(req);
        const user = new User({ 
            username: req.body.username,
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            status: 'online',
        });
        if (!errors.isEmpty()) {
            res.render('index', {title: 'Sign Up', page: './sign_up_form',
                                content: {
                                    user: user,
                                    errors: errors.array()
                                }});
            return;
        } else {
            bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
                if(err)
                    return next(err);
                user.password = hashedPassword;
                user.save(err => {
                    if (err)
                        return next(err);
                    res.redirect(`${user.url}`);
                });
            });
        }
    }
]

exports.user_login_get = (req, res, next) => {
    res.render('index', {title: 'Log in', page: './log_in', content: {}});
};

exports.user_login_post = passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/user/log_in',
});