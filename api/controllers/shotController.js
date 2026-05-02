const jwt = require('jsonwebtoken');
const Shot = require('../models/Shot');
const User = require('../models/User');
const { connectToDatabase } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

module.exports.getAllShots = async (req, res) => {
  try {
    await connectToDatabase();
    
    const shots = await Shot.find().sort({ createdAt: -1 });
    res.json(shots);
  } catch (error) {
    console.error('获取作品列表失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports.getShot = async (req, res) => {
  try {
    await connectToDatabase();
    
    const { id } = req.params;
    const shot = await Shot.findById(id);
    
    if (!shot) {
      return res.status(404).json({ message: '作品不存在' });
    }
    
    shot.views += 1;
    await shot.save();
    
    res.json(shot);
  } catch (error) {
    console.error('获取作品失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports.createShot = async (req, res) => {
  try {
    await connectToDatabase();
    
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: '未授权' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: '用户不存在' });
    }
    
    const { title, description, image, category, tags } = req.body;
    
    const shot = new Shot({
      title,
      description,
      image,
      category: category || 'web',
      tags: tags || [],
      author: user.username,
      authorId: user._id
    });
    
    await shot.save();
    
    res.status(201).json({
      message: '作品创建成功',
      shot
    });
  } catch (error) {
    console.error('创建作品失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports.updateShot = async (req, res) => {
  try {
    await connectToDatabase();
    
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: '未授权' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const { id } = req.params;
    
    const shot = await Shot.findById(id);
    
    if (!shot) {
      return res.status(404).json({ message: '作品不存在' });
    }
    
    if (shot.authorId.toString() !== decoded.id) {
      return res.status(403).json({ message: '无权修改此作品' });
    }
    
    const { title, description, category, tags } = req.body;
    
    shot.title = title || shot.title;
    shot.description = description || shot.description;
    shot.category = category || shot.category;
    shot.tags = tags || shot.tags;
    
    await shot.save();
    
    res.json({ message: '更新成功', shot });
  } catch (error) {
    console.error('更新作品失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports.deleteShot = async (req, res) => {
  try {
    await connectToDatabase();
    
    const { id } = req.params;
    await Shot.findByIdAndDelete(id);
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除作品失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports.likeShot = async (req, res) => {
  try {
    await connectToDatabase();
    
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: '未授权' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const { id } = req.params;
    
    const shot = await Shot.findById(id);
    
    if (!shot) {
      return res.status(404).json({ message: '作品不存在' });
    }
    
    const userId = decoded.id;
    
    if (shot.likedBy.includes(userId)) {
      shot.likedBy = shot.likedBy.filter(id => id.toString() !== userId);
      shot.likes -= 1;
    } else {
      shot.likedBy.push(userId);
      shot.likes += 1;
    }
    
    await shot.save();
    
    res.json({ message: '操作成功', shot });
  } catch (error) {
    console.error('点赞失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports.addComment = async (req, res) => {
  try {
    await connectToDatabase();
    
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: '未授权' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: '用户不存在' });
    }
    
    const { id } = req.params;
    const { content, rating } = req.body;
    
    const shot = await Shot.findById(id);
    
    if (!shot) {
      return res.status(404).json({ message: '作品不存在' });
    }
    
    shot.comments.push({
      userId: user._id,
      userName: user.username,
      content,
      rating: rating || 4
    });
    
    await shot.save();
    
    res.json({ message: '评论成功', shot });
  } catch (error) {
    console.error('添加评论失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

module.exports.getUserShots = async (req, res) => {
  try {
    await connectToDatabase();
    
    const { userId } = req.params;
    const shots = await Shot.find({ authorId: userId }).sort({ createdAt: -1 });
    res.json(shots);
  } catch (error) {
    console.error('获取用户作品失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};