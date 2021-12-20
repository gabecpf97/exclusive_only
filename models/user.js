const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {type: String, required: true},
    password: {type: String, required: true},
    first_name: {type: String, required: true},
    last_name: {type: String, required: true},
    status: {type: String, required: true},
});

UserSchema.virtual('url').get(function() {
    return `/user/${this.id}`;
});

UserSchema.virtual('full_name').get(function() {
    return `${this.first_name} ${this.last_name}`;
});

module.exports = mongoose.model('User', UserSchema);