const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { DateTime } = require('luxon');

const PostSchema = new Schema({
    date: {type: Date, required: true},
    title: {type: String, required: true},
    message: {type: String, required: true},
    media: {type: Schema.Types.ObjectId, ref:'Media'},
    user: {type: Schema.Types.ObjectId, ref: 'User', required: true}
});

PostSchema.virtual('url').get(function() {
    return `/user/${this.user}/${this.id}`;
});

PostSchema.virtual('pretty_date').get(function() {
    return DateTime.fromJSDate(this.date).toLocaleString(DateTime.DATETIME_FULL);
})

module.exports = mongoose.model('Post', PostSchema);