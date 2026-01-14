const router = require('express').Router();
const verify = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// GET User's Documents
router.get('/', verify, (req, res) => {
    const userDocs = global.documents.filter(doc => doc.owner === req.user._id);
    res.json(userDocs);
});

// CREATE Document
router.post('/', verify, (req, res) => {
    const document = {
        _id: uuidv4(),
        title: req.body.title || 'Untitled Document',
        owner: req.user._id,
        content: '',
        lastModified: new Date()
    };

    global.documents.push(document);
    res.json(document);
});

// GET Document by ID
router.get('/:id', verify, (req, res) => {
    const document = global.documents.find(doc => doc._id === req.params.id);
    if (!document) return res.status(404).send('Document not found');
    res.json(document);
});

// UPDATE Document
router.put('/:id', verify, (req, res) => {
    const docIndex = global.documents.findIndex(doc => doc._id === req.params.id);
    if (docIndex === -1) return res.status(404).send('Document not found');

    const updatedDoc = {
        ...global.documents[docIndex],
        content: req.body.content !== undefined ? req.body.content : global.documents[docIndex].content,
        title: req.body.title !== undefined ? req.body.title : global.documents[docIndex].title,
        lastModified: new Date()
    };

    global.documents[docIndex] = updatedDoc;
    res.json(updatedDoc);
});

module.exports = router;
