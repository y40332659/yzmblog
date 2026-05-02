const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { connectToDatabase } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = '7d';

module.exports.register = async (req, res) => {
  try {
    await connectToDatabase();
    
    const { username, email, password } = req.body;
    
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      return res.status(400).json({ message: '用户已存在' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const user = new User({
      username,
      email,
      password: hashedPassword
    });
    
    await user.save();
    
    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    res.status(201).json({
      message: '注册成功',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports.login = async (req, res) => {
  try {
    await connectToDatabase();
    
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }
    
    const token = jwt.sign(
      { id: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    res.json({
      message: '登录成功',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports.getUser = async (req, res) => {
  try {
    await connectToDatabase();
    
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: '未授权' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(401).json({ message: 'token 无效' });
  }
};

module.exports.getAllUsers = async (req, res) => {
  try {
    await connectToDatabase();
    
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports.deleteUser = async (req, res) => {
  try {
    await connectToDatabase();
    
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};