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
    check('confirmPassword', "Please enter the same password").exists()
    .custom((value, { req }) => value === req.body.password),
    (req, res, next) => {
        const errors = validationResult(req);
        const user = new User({ 
            username: req.body.username,
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            status: 'normal',
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

exports.user_log_out = (req, res) => {
    req.logOut();
    res.redirect('/');
};

exports.user_account_get = (req, res, next) => {
    if (res.locals.currentUser !== undefined) {
        Post.find({user: res.locals.currentUser.id}).populate('media')
        .populate('user').exec((err, thePosts) => {
            if(err)
            return next(err);
            res.render('index', {title: 'Account', page: './account', 
            content: {
                posts: thePosts
            }});
        });
    }
};

exports.user_delete_get = (req, res, next) => {
    res.render('index', {title: 'Delete User', page: './user_delete', content: {}});
}

exports.user_delete_post = (req, res, next) => {
    User.findById(res.locals.currentUser.id).exec((err, theUser) => {
        if (err)
            return next(err);
        req.logOut();
        User.findByIdAndRemove(res.locals.currentUser.id, (err) => {
            if (err)
                return next(err);
            res.redirect('/');
        });
    });
}

exports.user_update_get = (req, res, next) => {
    res.render('index', {title: 'Edit profile', page: './account_update', content: {}});
}

exports.user_update_post = [
    body('username', 'Name must be longer than 4 letter.').trim().isLength({min: 4}).escape(),
    body('first_name', "First name must not be empty").trim().isLength({min: 1}).escape(),
    body('last_name', "Last name must not be empty").trim().isLength({min: 1}).escape(),
    (req, res, next) => {
        const user = new User({
            username: req.body.username,
            password: res.locals.currentUser.id,
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            status: res.locals.currentUser.status,
            _id: res.locals.currentUser.id
        });
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.render('index', {title: 'Edit profile', page: './account_update', 
                                content: { 
                                    user: user,
                                    errors: errors.array(),
                                }});
            return;
        } else {
            User.findByIdAndUpdate(res.locals.currentUser.id, user, {}, (err, theUser) => {
                if (err)
                    return next(err);
                res.redirect('/user/account');
            });
        }
    }
]

exports.user_change_password_get = (req, res, next) => {
    res.render('index', {title: 'Change password', page: './update_password',
                        content: {}});
}

exports.user_change_password_post = [
    check('password').custom(async (value, { req }) => {
        return new Promise((resolve, reject) => {
            User.findById(req.params.id).exec((err, theUser) => {
                if (err)
                return next(err);
                if (theUser === null) {
                    const err = new Error('No such user');
                    err.status = 404;
                    return next(err);
                }
                bcrypt.compare(value, theUser.password, (err, res) => {
                    if (res)
                        resolve(true);
                    else
                        reject(new Error('Please enter correct password'));
                });               
            });
        });
    }),
    body('newPassword', 'Password must be longer than 6 letter').trim().isLength({min: 6}).escape(),
    (req, res, next) => {
        const user = new User({
            username: res.locals.currentUser.username,
            first_name: res.locals.currentUser.first_name,
            last_name: res.locals.currentUser.last_name,
            status: res.locals.currentUser.status,
            _id: res.locals.currentUser.id
        })
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.render('index', {title: 'Change password', page: './update_password',
            content: {errors: errors.array()}});
            return;
        } else {
            bcrypt.hash(req.body.newPassword, 10, (err, hashedPassword) => {
                if (err)
                    return next(err);
                user.password = hashedPassword;
                User.findByIdAndUpdate(res.locals.currentUser.id, user, {}, (err, theUser) => {
                    if (err)
                        return next(err);
                    res.redirect('/user/account');
                });
            });
        }
    }
]