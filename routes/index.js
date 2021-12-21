const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const userController = require('../controllers/userController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' ,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.substring(0, file.mimetype.indexOf('/')) === 'image') {
            cb(null, true);
        } else {
            cb(null, false);
            return cb(new Error('Please only upload images file, Click back'));
        }
}});

/* GET home page. */
router.get('/', postController.index);

/* GET and POST for Posts */
// router.get('/post/create', upload.single('media'), postController.post_create_get);
// router.post('/post/create', postController.post_create_post);
router.get('/post/:id', postController.post_detail);
// router.get('post/:id/delete', postController.post_delete_get);
// router.post('post/:id/delete', postController.post_delete_post);
// router.get('/post/:id/update', upload.single('media'), postController.post_update_get);
// router.post('/post/:id/update', postController.post_update_post);

// /* GET and POST for Users */
router.get('/user/account', userController.user_account_get);
router.get('/user/create', userController.user_create_get);
router.post('/user/create', userController.user_create_post);
router.get('/user/log_in', userController.user_login_get);
router.post('/user/log_in', userController.user_login_post);
router.get('/user/log_out', userController.user_log_out);
router.get('/user/:id', userController.user_detail);
router.get('/user/:id/delete', userController.user_delete_get);
router.post('/user/:id/delete', userController.user_delete_post);
// router.get('/user/:id/update', userController.user_update_get);
// router.postget('/user/:id/update', userController.user_update_post);

module.exports = router;
