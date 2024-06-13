const express = require('express');
const router = express.Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Course } = require('../models/course');
const authMiddleware = require('../middleware/authentication'); // Import authMiddleware if needed

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// User login endpoint
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

        res.status(200).json({ token });
    } catch (error) {
        console.error("Error logging in user:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// User registration endpoint
router.post('/', async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'Invalid input' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = new User({ name, email, password: hashedPassword, role });
        const savedUser = await newUser.save();

        res.status(201).json({ id: savedUser._id });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(400).json({ message: error.message });
    }
});

// Fetch user data endpoint
router.get('/:id', authMiddleware, async (req, res) => {
    const userId = req.params.id;

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    try {
        const user = await User.findById(userId).select('-password -createdAt -updatedAt -__v');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (req.user._id.toString() !== userId) {
            return res.status(403).json({ message: 'Unauthorized access' });
        }

        let additionalData = {};
        if (user.role === 'instructor') {
            additionalData.coursesTeaching = await Course.find({ instructorID: userId }, '_id');
        } else if (user.role === 'student') {
            additionalData.enrolledCourses = await Course.find({ students: userId }, '_id');
        }

        const responseData = { ...user.toObject(), ...additionalData };

        res.status(200).json(responseData);
    } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = { router };
