const User = require('../models/user');
const Post = require('../models/post');
const Media = require('../models/media');
const { body, validationResult, check } = require('express-validator');
const async = require('async');
const fs = require('fs');
const path = require('path');

exports.index = (req, res, next) => {
    Post.find({}).sort({date: -1}).populate('media').populate('user')
    .exec((err, thePost) => {
        if (err)
            return next(err);
        res.render('index', {
            title: 'Home',
            page: './home',
            content: {
                title: 'Welcome',
                post_list: thePost,
            },
        });
    });
}

exports.post_detail = (req, res, next) => {
    Post.findById(req.params.id).populate('media').populate('user')
    .exec((err, thePost) => {
        if (err)
            return next(err);
        res.render('index', {title: thePost.title, page: './post',
                            content: {
                                title: thePost.title,
                                post: thePost,
                            }});
    });
}

exports.post_create_get = (req, res, next) => {
    res.render('index', {title: 'Create Post', page: './post_form', 
                        content: {title: 'Create Post'}});
}

exports.post_create_post = [
    body('post_title', 'Title must not be empty.').trim().isLength({min: 1}).escape(),
    body('message').trim().escape(),
    check('media', 'Please upload an image file').custom((value, {req}) => {
        return req.file.mimetype.substring(0, req.file.mimetype.indexOf('/')) === 'image';
    }),
    (req, res, next) => {
        const errors = validationResult(req);
        async.parallel({
            post: (callback) => {
                callback(null, new Post({
                    date: new Date,
                    title: req.body.post_title,
                    message: req.body.message,
                    user: res.locals.currentUser.id,
                }));
            },
            media: (callback) => {
                const media = new Media({
                    data: fs.readFileSync(path.join(__dirname, '../uploads/', req.file.filename)),
                    content_type: 'image/jpg',
                });
                media.save(err => {
                    if (err)
                        return next(err);
                    callback(null, media);
                });
            },
        }, (err, results) => {
            if (err)
                return next(err);
            const post = results.post; 
            post.media = results.media;
            if (!errors.isEmpty()) {
                res.render('index', {title: 'Create Post', page: './post_form', 
                                    content: {
                                        title: 'Create Post',
                                        post: post,
                                        errors: errors.array()
                                    }});
                return;
            } else {
                post.save(err => {
                    if (err)
                        return next(err);
                    res.redirect(post.url);
                });
            }
        });
    }
]

exports.post_delete_get = (req, res, next) => {
    Post.findById(req.params.id).populate('user').populate('media').exec((err, thePost) => {
        if (err)
            return next(err);
        if (thePost === null) {
            const err = new Error('No such post');
            err.status = 404;
            return next(err);
        }
        res.render('index', {title: 'Delete post', page: './post_delete', 
                            content: {post: thePost}});
    });
}

exports.post_delete_post = (req, res, next) => {
    Post.findById(req.params.id).exec((err, thePost) => {
        if (err)
            return next(err);
        Post.findByIdAndRemove(req.body.postid, (err) => {
            if (err)
                return next(err);
            res.redirect('/');
        });
    });
}

exports.post_update_get = (req, res, next) => {
    Post.findById(req.params.id).exec((err, thePost) => {
        if (err)
            return next(err);
        if(thePost === null) {
            const err = new Error('No such post');
            err.status = 404;
            return next(err);
        }
        res.render('index', {title: 'Update Post', page: './post_form', 
                            content: {
                                title: 'Update Post',
                                post: thePost,
                            }});
    });
}

exports.post_update_post = [
    body('post_title', 'Title must not be empty.').trim().isLength({min: 1}).escape(),
    body('message').trim().escape(),
    (req, res, next) => {
        const errors = validationResult(req);
        const post = new Post({
            date: req.body.date,
            title: req.body.post_titel,
            message: req.body.message,
            media: req.body.media,
            user: res.locals.currentUser.id,
            _id: req.params.id
        });
        if (!errors.isEmpty()) {
            res.render('index', {title: 'Update Post', page: './psot_form',
                                content: {
                                    title: 'Update Post',
                                    post: post
                                }});
            return;
        } else {
            Post.findByIdAndUpdate(req.params.id, post, {}, (err, thePost) => {
                if(err)
                    return next(err);
                res.redirect(thePost.url);
            });
        }
    }
]