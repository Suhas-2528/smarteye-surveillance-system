import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'venu@123',
  database: process.env.DB_NAME || 'smarteye'
};

let pool: mysql.Pool;

export async function initDB() {
  try {
    // First, connect without database to create it if it doesn't exist
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
    await connection.end();

    // Now create the pool connected to the database
    pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Explicitly switch database context to smarteye
    await pool.query(`USE \`${dbConfig.database}\`;`);
    console.log('Connected to MySQL database:', dbConfig.database);

    // Initialize the specific tables we need
    const createPicturesTable = `
      CREATE TABLE IF NOT EXISTS pictures (
        id INT AUTO_INCREMENT PRIMARY KEY,
        loc VARCHAR(255) NOT NULL,
        dept VARCHAR(255) NOT NULL,
        type VARCHAR(255) NOT NULL,
        time VARCHAR(50) NOT NULL,
        image_url TEXT
      );
    `;
    await pool.query(createPicturesTable);

    try {
      await pool.query('ALTER TABLE pictures ADD COLUMN image_url TEXT;');
    } catch (e) {
      // Column image_url already exists
    }

    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        google_uid VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        email VARCHAR(255),
        photo_url VARCHAR(255),
        role VARCHAR(50) DEFAULT 'Faculty',
        last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `;
    await pool.query(createUsersTable);

    const createLoginLogsTable = `
      CREATE TABLE IF NOT EXISTS login_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uid VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(45),
        user_agent TEXT
      );
    `;
    await pool.query(createLoginLogsTable);

    const createAlertsTable = `
      CREATE TABLE IF NOT EXISTS alerts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room VARCHAR(255) NOT NULL,
        detection VARCHAR(255) NOT NULL,
        confidence VARCHAR(50) NOT NULL,
        timestamp VARCHAR(100) NOT NULL,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(createAlertsTable);

    const alertColumns = [
      { name: 'room', def: 'VARCHAR(255) DEFAULT "Room 101"' },
      { name: 'detection', def: 'VARCHAR(255) DEFAULT "Activity Detected"' },
      { name: 'confidence', def: 'VARCHAR(50) DEFAULT "0.95"' },
      { name: 'timestamp', def: 'VARCHAR(100) DEFAULT "12:00 PM"' },
      { name: 'image_url', def: 'TEXT' },
      { name: 'created_at', def: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' },
    ];
    for (const col of alertColumns) {
      try {
        await pool.query(`ALTER TABLE alerts ADD COLUMN \`${col.name}\` ${col.def};`);
      } catch (e) {
        // Column already exists
      }
    }

    const createSavedPicturesTable = `
      CREATE TABLE IF NOT EXISTS saved_pictures (
        id INT AUTO_INCREMENT PRIMARY KEY,
        picture_id VARCHAR(100),
        loc VARCHAR(255) NOT NULL,
        dept VARCHAR(255) NOT NULL,
        type VARCHAR(255) NOT NULL,
        time VARCHAR(50) NOT NULL,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(createSavedPicturesTable);

    // Optionally seed the table if empty
    const [rows]: any = await pool.query('SELECT COUNT(*) as count FROM pictures');
    if (rows[0].count === 0) {
      console.log('Seeding pictures table...');
      const seedPictures = [
        { loc: 'Room 101', dept: 'Computer Science', type: 'Classroom', time: '10:42 AM', imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80' },
        { loc: 'Room 5', dept: 'Main Block', type: 'Assessment Center', time: '10:15 AM', imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80' },
        { loc: 'Room 202', dept: 'Mechanical Eng.', type: 'Classroom', time: '09:30 AM', imageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80' },
        { loc: 'Room 12', dept: 'Exam Center', type: 'Assessment Center', time: '09:05 AM', imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80' },
        { loc: 'Room 103', dept: 'Computer Science', type: 'Classroom', time: '08:50 AM', imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80' },
        { loc: 'Room 1', dept: 'Main Block', type: 'Assessment Center', time: '08:15 AM', imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80' },
      ];
      
      for (const pic of seedPictures) {
        await pool.query('INSERT INTO pictures (loc, dept, type, time, image_url) VALUES (?, ?, ?, ?, ?)', [pic.loc, pic.dept, pic.type, pic.time, pic.imageUrl]);
      }
    }

    return pool;
  } catch (error) {
    console.warn('⚠️  Could not connect to MySQL database. Server will start in standalone/fallback mode.');
    return null;
  }
}

export function getPool(): mysql.Pool | null {
  return pool || null;
}
