const User = require('../models/user');
const Post = require('../models/post');
const Media = require('../models/media');
const { body, validationResult } = require('express-validator');
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

