const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// REGISTER
router.post('/register', async (req, res) => {
    // Check if user exists
    const emailExist = global.users.find(u => u.email === req.body.email);
    if (emailExist) return res.status(400).send('Email already exists');

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Create user
    const user = {
        _id: uuidv4(),
        username: req.body.username,
        email: req.body.email,
        password: hashedPassword
    };

    global.users.push(user);
    res.send({ user: user._id });
});

// LOGIN
router.post('/login', async (req, res) => {
    // Check if user exists
    const user = global.users.find(u => u.email === req.body.email);
    if (!user) return res.status(400).send('Email is not found');

    // Check password
    const validPass = await bcrypt.compare(req.body.password, user.password);
    if (!validPass) return res.status(400).send('Invalid password');

    // Create and assign token
    const token = jwt.sign({ _id: user._id, username: user.username }, process.env.JWT_SECRET);
    res.header('auth-token', token).send({ token, username: user.username, userId: user._id });
});

module.exports = router;
