const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        default: 'Untitled Document'
    },
    content: {
        type: Object, // Using Object to support Quill Delta or simple string later if needed. For now assume string or delta.
        default: ''
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    lastModified: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Document', DocumentSchema);
