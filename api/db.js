// 数据库连接配置
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

let cachedDb = null;
let useInMemory = false;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  if (!MONGODB_URI) {
    console.log('⚠️  MONGODB_URI 未设置，使用内存存储');
    useInMemory = true;
    return { useInMemory: true };
  }

  try {
    const client = await mongoose.connect(MONGODB_URI);
    cachedDb = client.connection;
    useInMemory = false;
    console.log('✅ 数据库连接成功');
    return cachedDb;
  } catch (error) {
    console.error('❌ 数据库连接失败，使用内存存储:', error);
    useInMemory = true;
    return { useInMemory: true };
  }
}

module.exports = { connectToDatabase, mongoose, useInMemory };