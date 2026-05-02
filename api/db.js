// 数据库连接配置
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI 环境变量未设置');
  }

  try {
    const client = await mongoose.connect(MONGODB_URI);
    cachedDb = client.connection;
    console.log('✅ 数据库连接成功');
    return cachedDb;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    throw error;
  }
}

module.exports = { connectToDatabase, mongoose };