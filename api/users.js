const express = require('express');
const router = express.Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
  
    try {
      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
  
      // Compare passwords
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
  
      // Create and sign JWT token
      const token = jwt.sign({ userId: user._id }, JWT_SECRET , { expiresIn: '1h' });
  
      res.status(200).json({ token });
    } catch (error) {
      console.error("Error logging in user:", error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });




router.post('/', async (req, res) => {
    const { username, email, password, role } = req.body;
  
    if (!username || !email || !password || !role) {
      return res.status(400).json({ message: 'Invalid input' });
    }
  
    try {
      const newUser = new User({ username, email, password, role });
      const savedUser = await newUser.save();
      res.status(201).json({ id: savedUser._id });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(400).json({ message: error.message });
    }
  });





  router.get('/:id', async (req, res) => {
    const userId = req.params.id;
  
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    try {
      const user = await User.findById(userId);
      console.log(user)
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      if (req.user.userId !== userId) {
        return res.status(403).json({ message: 'Unauthorized access' });
      }
  
      let additionalData = {};
      if (user.role === 'instructor') {
        additionalData.coursesTeaching = await Course.find({ instructorId: userId }, '_id');
      } else if (user.role === 'student') {
        additionalData.enrolledCourses = await Course.find({ enrolledStudents: userId }, '_id');
      }
  
      const responseData = { ...user.toObject(), ...additionalData };
  
      res.status(200).json(responseData);
    } catch (error) {
      console.error("Error fetching user data:", error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });


module.exports = { router };
