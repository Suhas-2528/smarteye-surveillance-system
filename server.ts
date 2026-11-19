import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import cors from "cors";
import multer from "multer";
import { fileURLToPath } from "url";
import { initDB, getPool } from "./src/server/db";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure Multer for image file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    const uniqueName = `alert-${Date.now()}-${cleanName}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB max upload size
});

// Fallback in-memory stores for standalone mode
const fallbackAlerts: any[] = [];
const fallbackSavedPictures: any[] = [];
const fallbackPictures: any[] = [
  { id: 1, loc: 'Room 101', dept: 'Computer Science', type: 'Classroom', time: '10:42 AM', imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80' },
  { id: 2, loc: 'Room 5', dept: 'Main Block', type: 'Assessment Center', time: '10:15 AM', imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80' },
  { id: 3, loc: 'Room 202', dept: 'Mechanical Eng.', type: 'Classroom', time: '09:30 AM', imageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80' },
  { id: 4, loc: 'Room 12', dept: 'Exam Center', type: 'Assessment Center', time: '09:05 AM', imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80' },
  { id: 5, loc: 'Room 103', dept: 'Computer Science', type: 'Classroom', time: '08:50 AM', imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80' },
  { id: 6, loc: 'Room 1', dept: 'Main Block', type: 'Assessment Center', time: '08:15 AM', imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80' },
];

const fallbackUsers: any[] = [
  { id: 1, google_uid: 'uid-1', name: 'Dr. Robert Vance', email: 'vance@university.edu', role: 'Faculty', last_login: new Date().toISOString(), status: 'Active' },
  { id: 2, google_uid: 'uid-2', name: 'Prof. Sarah Jenkins', email: 's.jenkins@university.edu', role: 'Faculty', last_login: new Date(Date.now() - 3600000).toISOString(), status: 'Active' },
  { id: 3, google_uid: 'uid-3', name: 'Dr. Michael Chen', email: 'm.chen@university.edu', role: 'Faculty', last_login: new Date(Date.now() - 7200000).toISOString(), status: 'Active' },
  { id: 4, google_uid: 'uid-4', name: 'Root System Admin', email: 'admin@smarteye.local', role: 'Admin', last_login: new Date().toISOString(), status: 'Active' }
];

const fallbackLogs: any[] = [
  { id: 1, email: 'admin@smarteye.local', action: 'Admin Portal Login', ip_address: '127.0.0.1', user_agent: 'Chrome/Windows 11', login_time: new Date().toISOString(), status: 'Success' },
  { id: 2, email: 'vance@university.edu', action: 'Faculty Feed Access', ip_address: '192.168.1.104', user_agent: 'Chrome/Edge', login_time: new Date(Date.now() - 900000).toISOString(), status: 'Success' },
  { id: 3, email: 's.jenkins@university.edu', action: 'Snapshot Downloaded', ip_address: '192.168.1.112', user_agent: 'Safari/macOS', login_time: new Date(Date.now() - 1800000).toISOString(), status: 'Success' },
  { id: 4, email: 'unknown_probe@network.scan', action: 'Unauthorized API Attempt', ip_address: '45.134.22.9', user_agent: 'Python-Requests/2.28', login_time: new Date(Date.now() - 3600000).toISOString(), status: 'Warning' }
];

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  await initDB();

  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Serve static uploads with permissive cross-origin headers for Android WebViews
  app.use("/uploads", (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.header("Access-Control-Allow-Headers", "*");
    res.header("Cross-Origin-Resource-Policy", "cross-origin");
    res.header("Cross-Origin-Embedder-Policy", "unsafe-none");
    next();
  }, express.static(uploadsDir));

  // Direct APK download route for mobile devices on LAN
  app.get("/SmartEye-debug.apk", (_req, res) => {
    const apkPath = path.join(__dirname, "SmartEye-debug.apk");
    if (fs.existsSync(apkPath)) {
      res.download(apkPath, "SmartEye-debug.apk");
    } else {
      res.status(404).send("APK not found");
    }
  });

  // Google OAuth URL endpoint
  app.get("/api/auth/google/url", (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      return res.status(400).json({ 
        error: "Google Client ID not configured. Please add GOOGLE_CLIENT_ID to your environment variables." 
      });
    }

    const role = req.query.role || 'Patient';
    const redirectUri = `${process.env.APP_URL}/auth/google/callback`;
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
      state: JSON.stringify({ role }),
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    res.json({ url: authUrl });
  });

  // Google OAuth Callback
  app.get("/auth/google/callback", async (req, res) => {
    const { code, state } = req.query;
    
    if (!code) {
      return res.status(400).send("No code provided");
    }

    try {
      // In a real app, you'd exchange the code for tokens here
      // const tokenResponse = await fetch('https://oauth2.googleapis.com/token', { ... });
      
      const stateData = JSON.parse(state as string);
      const role = stateData.role;

      // Send success message to parent window and close popup
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_SUCCESS',
                  role: '${role}'
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.status(500).send("Authentication failed");
    }
  });

  // User Sync API
  app.post("/api/users/sync", async (req, res) => {
    try {
      const { uid, name, email, photoUrl, role } = req.body;
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Client Application';

      const pool = getPool();
      if (!pool) {
        const existingIdx = fallbackUsers.findIndex(u => (email && u.email?.toLowerCase() === email.toLowerCase()) || (uid && u.google_uid === uid));
        if (existingIdx >= 0) {
          fallbackUsers[existingIdx] = {
            ...fallbackUsers[existingIdx],
            name: name || fallbackUsers[existingIdx].name,
            last_login: new Date().toISOString(),
            status: 'Active'
          };
        } else {
          fallbackUsers.unshift({
            id: Date.now(),
            google_uid: uid || `user-${Date.now()}`,
            name: name || (email ? email.split('@')[0] : 'Faculty Member'),
            email: email,
            photo_url: photoUrl || null,
            role: role || 'Faculty',
            last_login: new Date().toISOString(),
            status: 'Active'
          });
        }

        fallbackLogs.unshift({
          id: Date.now(),
          email: email || 'faculty@smarteye.local',
          action: 'Faculty Account Sync / Activity',
          ip_address: String(ip),
          user_agent: String(userAgent),
          login_time: new Date().toISOString(),
          status: 'Success'
        });

        return res.status(200).json({ success: true, message: "User synced (standalone mode)" });
      }
      
      // Upsert user based on google_uid
      const query = `
        INSERT INTO users (google_uid, name, email, photo_url, role)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          name = VALUES(name), 
          email = VALUES(email), 
          photo_url = VALUES(photo_url), 
          last_login = CURRENT_TIMESTAMP
      `;
      
      await pool.query(query, [uid, name, email, photoUrl, role]);

      // Record login log
      const logQuery = `
        INSERT INTO login_logs (uid, email, ip_address, user_agent)
        VALUES (?, ?, ?, ?)
      `;
      await pool.query(logQuery, [uid, email, ip, userAgent]);

      res.status(200).json({ success: true, message: "User synced successfully" });
    } catch (error) {
      console.error("User sync error:", error);
      res.status(500).json({ error: "Failed to sync user" });
    }
  });

  // Dedicated Register API for Faculty Users
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { name, email, password, role } = req.body;
      if (!email || !name) {
        return res.status(400).json({ error: "Name and email are required" });
      }
      const uid = `faculty-${Date.now()}`;
      const userRole = role || 'Faculty';
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Client Application';

      const pool = getPool();
      if (!pool) {
        const existingIdx = fallbackUsers.findIndex(u => u.email?.toLowerCase() === email.toLowerCase());
        let finalUser;
        if (existingIdx >= 0) {
          fallbackUsers[existingIdx].name = name;
          fallbackUsers[existingIdx].last_login = new Date().toISOString();
          finalUser = fallbackUsers[existingIdx];
        } else {
          finalUser = {
            id: Date.now(),
            google_uid: uid,
            name,
            email,
            role: userRole,
            last_login: new Date().toISOString(),
            status: 'Active'
          };
          fallbackUsers.unshift(finalUser);
        }

        fallbackLogs.unshift({
          id: Date.now(),
          email,
          action: 'Faculty Account Registered',
          ip_address: String(ip),
          user_agent: String(userAgent),
          login_time: new Date().toISOString(),
          status: 'Success'
        });

        return res.status(201).json({ success: true, user: finalUser });
      }

      await pool.query(
        'INSERT INTO users (google_uid, name, email, role) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), last_login = CURRENT_TIMESTAMP',
        [uid, name, email, userRole]
      );

      const logQuery = 'INSERT INTO login_logs (uid, email, ip_address, user_agent) VALUES (?, ?, ?, ?)';
      await pool.query(logQuery, [uid, email, ip, userAgent]);

      res.status(201).json({ success: true, user: { uid, name, email, role: userRole } });
    } catch (err) {
      console.error("Auth register error:", err);
      res.status(500).json({ error: "Registration failed on server" });
    }
  });

  // DB Healthcheck Status API
  app.get("/api/db-status", async (req, res) => {
    const pool = getPool();
    if (pool) {
      try {
        await pool.query('SELECT 1');
        return res.json({
          connected: true,
          database: process.env.DB_NAME || 'smarteye',
          host: process.env.DB_HOST || 'localhost',
          mode: 'MySQL Production Database'
        });
      } catch (err) {
        return res.json({
          connected: false,
          mode: 'Standalone Fallback Mode',
          error: (err as Error).message
        });
      }
    }
    res.json({
      connected: false,
      mode: 'Standalone Fallback Mode',
      message: 'Running with responsive in-memory persistence engine'
    });
  });

  // Alerts API (Python YOLO Surveillance Integration)
  app.post("/api/alerts", upload.single("image"), async (req, res) => {
    try {
      const { detection, room, timestamp, confidence } = req.body;
      
      // Determine Image URL
      let imageUrl = "";
      if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
      } else if (req.body.image && typeof req.body.image === 'string' && req.body.image.startsWith('data:image')) {
        const base64Data = req.body.image.replace(/^data:image\/\w+;base64,/, "");
        const fileName = `alert-${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
        const filePath = path.join(uploadsDir, fileName);
        fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
        imageUrl = `/uploads/${fileName}`;
      } else if (req.body.imageUrl || req.body.image_url) {
        imageUrl = req.body.imageUrl || req.body.image_url;
      } else {
        imageUrl = 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80';
      }

      const alertRoom = room || "Room 101";
      const alertDetection = detection || "Activity Detected";
      const alertConfidence = confidence !== undefined ? String(confidence) : "0.95";
      const alertTimestamp = timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const pool = getPool();
      let savedAlertId: number | string = Date.now();
      let savedPictureId: number | string = Date.now();

      if (pool) {
        try {
          const [alertResult]: any = await pool.query(
            "INSERT INTO alerts (room, detection, confidence, timestamp, image_url) VALUES (?, ?, ?, ?, ?)",
            [alertRoom, alertDetection, alertConfidence, alertTimestamp, imageUrl]
          );
          savedAlertId = alertResult.insertId;
        } catch (err) {
          console.warn("Could not insert into alerts table:", err);
        }

        try {
          const [picResult]: any = await pool.query(
            "INSERT INTO pictures (loc, dept, type, time, image_url) VALUES (?, ?, ?, ?, ?)",
            [alertRoom, "YOLO AI Detection", alertDetection, alertTimestamp, imageUrl]
          );
          savedPictureId = picResult.insertId;
        } catch (err) {
          console.warn("Could not insert into pictures table:", err);
        }
      } else {
        const alertObj = {
          id: savedAlertId,
          room: alertRoom,
          detection: alertDetection,
          confidence: alertConfidence,
          timestamp: alertTimestamp,
          imageUrl,
          image_url: imageUrl,
          created_at: new Date().toISOString()
        };
        fallbackAlerts.unshift(alertObj);

        const pictureObj = {
          id: savedPictureId,
          loc: alertRoom,
          dept: "YOLO AI Detection",
          type: alertDetection,
          time: alertTimestamp,
          imageUrl,
          image_url: imageUrl,
          detection: alertDetection,
          confidence: alertConfidence
        };
        fallbackPictures.unshift(pictureObj);
      }

      const savedAlert = {
        id: savedAlertId,
        room: alertRoom,
        detection: alertDetection,
        confidence: alertConfidence,
        timestamp: alertTimestamp,
        imageUrl,
        image_url: imageUrl
      };

      console.log(`[SURVEILLANCE ALERT] Received alert from ${alertRoom}: ${alertDetection} (conf: ${alertConfidence})`);
      return res.status(201).json({
        success: true,
        message: "Alert archived and added to Captured Images successfully",
        alert: savedAlert
      });
    } catch (error) {
      console.error("Error processing /api/alerts:", error);
      return res.status(500).json({ error: "Failed to process alert", details: (error as Error).message });
    }
  });

  app.get("/api/alerts", async (req, res) => {
    try {
      const pool = getPool();
      if (!pool) {
        return res.json(fallbackAlerts);
      }
      const [rows] = await pool.query("SELECT * FROM alerts ORDER BY id DESC");
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  // Helper to safely delete an uploaded file from disk
  const deleteUploadedFile = (imageUrl?: string) => {
    if (!imageUrl) return;
    try {
      if (imageUrl.startsWith("/uploads/")) {
        const fileName = imageUrl.replace("/uploads/", "");
        const filePath = path.join(uploadsDir, fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`[DELETE] Deleted physical file from disk: ${filePath}`);
        }
      }
    } catch (err) {
      console.warn("Could not delete image file from disk:", err);
    }
  };

  // Pictures API
  app.get("/api/pictures", async (req, res) => {
    try {
      const pool = getPool();
      if (!pool) {
        return res.json(fallbackPictures);
      }
      const [rows] = await pool.query('SELECT * FROM pictures ORDER BY id DESC');
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch pictures" });
    }
  });

  // Delete Picture API (Admin Only)
  app.delete("/api/pictures/:id", async (req, res) => {
    try {
      const pictureId = req.params.id;
      const pool = getPool();
      let targetImageUrl: string | undefined;

      if (pool) {
        // 1. Fetch picture to identify image_url
        const [rows]: any = await pool.query("SELECT * FROM pictures WHERE id = ?", [pictureId]);
        if (rows && rows.length > 0) {
          targetImageUrl = rows[0].image_url;
        }

        // 2. Delete from pictures table
        await pool.query("DELETE FROM pictures WHERE id = ?", [pictureId]);

        // 3. Delete linked alert record if present
        if (targetImageUrl) {
          await pool.query("DELETE FROM alerts WHERE image_url = ?", [targetImageUrl]);
        }
      } else {
        const index = fallbackPictures.findIndex((p: any) => String(p.id) === String(pictureId));
        if (index !== -1) {
          targetImageUrl = fallbackPictures[index].imageUrl || fallbackPictures[index].image_url;
          fallbackPictures.splice(index, 1);
        }

        if (targetImageUrl) {
          const alertIdx = fallbackAlerts.findIndex((a: any) => a.imageUrl === targetImageUrl || a.image_url === targetImageUrl);
          if (alertIdx !== -1) {
            fallbackAlerts.splice(alertIdx, 1);
          }
        }
      }

      // 4. Delete uploaded image file from uploads folder
      if (targetImageUrl) {
        deleteUploadedFile(targetImageUrl);
      }

      console.log(`[ADMIN DELETE] Picture ID #${pictureId} deleted successfully`);
      return res.json({
        success: true,
        message: "Captured image and linked alert deleted permanently",
        id: pictureId
      });
    } catch (error) {
      console.error("Error deleting picture:", error);
      return res.status(500).json({ error: "Failed to delete captured picture", details: (error as Error).message });
    }
  });

  // Saved Pictures API (Mobile & Faculty Saved Images)
  app.get("/api/saved-pictures", async (req, res) => {
    try {
      const pool = getPool();
      if (!pool) {
        return res.json(fallbackSavedPictures);
      }
      const [rows] = await pool.query('SELECT * FROM saved_pictures ORDER BY id DESC');
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch saved pictures" });
    }
  });

  app.post("/api/saved-pictures", async (req, res) => {
    try {
      const { pictureId, loc, dept, type, time, imageUrl } = req.body;
      const finalImageUrl = imageUrl || req.body.image_url;
      const targetTime = time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const pool = getPool();
      if (!pool) {
        const fallbackItem = { 
          id: Date.now(), 
          picture_id: pictureId ? String(pictureId) : String(Date.now()), 
          loc: loc || 'Room 101', 
          dept: dept || 'Surveillance', 
          type: type || 'Saved Record', 
          time: targetTime, 
          imageUrl: finalImageUrl, 
          image_url: finalImageUrl,
          created_at: new Date().toISOString()
        };
        fallbackSavedPictures.unshift(fallbackItem);
        return res.status(201).json(fallbackItem);
      }

      const [result]: any = await pool.query(
        'INSERT INTO saved_pictures (picture_id, loc, dept, type, time, image_url) VALUES (?, ?, ?, ?, ?, ?)',
        [pictureId ? String(pictureId) : null, loc, dept, type, targetTime, finalImageUrl]
      );
      
      res.status(201).json({ 
        id: result.insertId, 
        picture_id: pictureId, 
        loc, 
        dept, 
        type, 
        time: targetTime, 
        imageUrl: finalImageUrl,
        image_url: finalImageUrl 
      });
    } catch (error) {
      console.error("Failed to save picture:", error);
      res.status(500).json({ error: "Failed to save picture", details: (error as Error).message });
    }
  });

  app.delete("/api/saved-pictures/:id", async (req, res) => {
    try {
      const savedId = req.params.id;
      const pool = getPool();

      if (pool) {
        await pool.query("DELETE FROM saved_pictures WHERE id = ?", [savedId]);
      } else {
        const index = fallbackSavedPictures.findIndex((p: any) => String(p.id) === String(savedId));
        if (index !== -1) {
          fallbackSavedPictures.splice(index, 1);
        }
      }

      return res.json({ success: true, message: "Saved picture removed", id: savedId });
    } catch (error) {
      console.error("Failed to delete saved picture:", error);
      res.status(500).json({ error: "Failed to delete saved picture" });
    }
  });

  // Delete Alert API (Admin Only)
  app.delete("/api/alerts/:id", async (req, res) => {
    try {
      const alertId = req.params.id;
      const pool = getPool();
      let targetImageUrl: string | undefined;

      if (pool) {
        const [rows]: any = await pool.query("SELECT * FROM alerts WHERE id = ?", [alertId]);
        if (rows && rows.length > 0) {
          targetImageUrl = rows[0].image_url;
        }

        await pool.query("DELETE FROM alerts WHERE id = ?", [alertId]);

        if (targetImageUrl) {
          await pool.query("DELETE FROM pictures WHERE image_url = ?", [targetImageUrl]);
        }
      } else {
        const index = fallbackAlerts.findIndex((a: any) => String(a.id) === String(alertId));
        if (index !== -1) {
          targetImageUrl = fallbackAlerts[index].imageUrl || fallbackAlerts[index].image_url;
          fallbackAlerts.splice(index, 1);
        }

        if (targetImageUrl) {
          const picIdx = fallbackPictures.findIndex((p: any) => p.imageUrl === targetImageUrl || p.image_url === targetImageUrl);
          if (picIdx !== -1) {
            fallbackPictures.splice(picIdx, 1);
          }
        }
      }

      if (targetImageUrl) {
        deleteUploadedFile(targetImageUrl);
      }

      console.log(`[ADMIN DELETE] Alert ID #${alertId} deleted successfully`);
      return res.json({
        success: true,
        message: "Alert and linked captured image deleted permanently",
        id: alertId
      });
    } catch (error) {
      console.error("Error deleting alert:", error);
      return res.status(500).json({ error: "Failed to delete alert", details: (error as Error).message });
    }
  });

  // Admin Users API
  app.get("/api/admin/users", async (req, res) => {
    try {
      const pool = getPool();
      if (!pool) {
        return res.json(fallbackUsers);
      }
      const [rows] = await pool.query('SELECT id, google_uid, name, email, photo_url, role, last_login FROM users ORDER BY id DESC');
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Admin Audit & Login Logs API
  app.get("/api/admin/logs", async (req, res) => {
    try {
      const pool = getPool();
      if (!pool) {
        return res.json(fallbackLogs);
      }
      const [rows] = await pool.query('SELECT * FROM login_logs ORDER BY id DESC LIMIT 50');
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  });

  // Incidents In-Memory / Database Store
  const incidentsList = [
    { id: 'INC-104', title: 'Unauthorized movement in Lab 202', location: 'Mechanical Eng. Room 202', reportedBy: 'Prof. Sarah Jenkins', severity: 'Critical', description: 'Motion detector tripped after scheduled lab hours at 20:45.', timestamp: '10 mins ago', status: 'Pending' },
    { id: 'INC-103', title: 'Camera Node Cam-04 Low Frame Rate', location: 'Assessment Room 5', reportedBy: 'System Auto-Monitor', severity: 'Medium', description: 'Stream dropped below 15 FPS during exam hours.', timestamp: '45 mins ago', status: 'Investigating' },
    { id: 'INC-102', title: 'Door access reader offline', location: 'CS Dept Room 101', reportedBy: 'Dr. Vance', severity: 'Low', description: 'Keycard reader not syncing RFID pulses.', timestamp: '2 hours ago', status: 'Resolved' }
  ];

  app.get("/api/incidents", (req, res) => {
    res.json(incidentsList);
  });

  app.post("/api/incidents", (req, res) => {
    const { title, location, reportedBy, severity, description } = req.body;
    const newIncident = {
      id: `INC-${Math.floor(100 + Math.random() * 900)}`,
      title: title || 'Reported Incident',
      location: location || 'Campus Area',
      reportedBy: reportedBy || 'Faculty Member',
      severity: severity || 'Medium',
      description: description || '',
      timestamp: 'Just now',
      status: 'Pending'
    };
    incidentsList.unshift(newIncident);
    res.status(201).json(newIncident);
  });

  app.post("/api/pictures", async (req, res) => {
    try {
      const { loc, dept, type, time, imageUrl } = req.body;
      const sampleImages = [
        'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'
      ];
      const finalImageUrl = imageUrl || sampleImages[Math.floor(Math.random() * sampleImages.length)];
      
      const pool = getPool();
      if (!pool) {
        const fallbackItem = { id: Date.now(), loc, dept, type, time, imageUrl: finalImageUrl, image_url: finalImageUrl };
        fallbackPictures.unshift(fallbackItem);
        return res.status(201).json(fallbackItem);
      }
      const [result]: any = await pool.query(
        'INSERT INTO pictures (loc, dept, type, time, image_url) VALUES (?, ?, ?, ?, ?)',
        [loc, dept, type, time, finalImageUrl]
      );
      res.status(201).json({ id: result.insertId, loc, dept, type, time, imageUrl: finalImageUrl });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to insert picture" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PRIMARY_PORT = PORT;
  const SECONDARY_PORT = 3001;

  app.listen(PRIMARY_PORT, "0.0.0.0", () => {
    console.log(`🚀 SmartEye Server running on http://localhost:${PRIMARY_PORT} (Mobile & Web)`);
  }).on('error', (err: any) => {
    console.warn(`Primary port ${PRIMARY_PORT} issue: ${err.message}`);
  });

  if (PRIMARY_PORT !== SECONDARY_PORT) {
    app.listen(SECONDARY_PORT, "0.0.0.0", () => {
      console.log(`🔄 SmartEye Mirror running on http://localhost:${SECONDARY_PORT}`);
    }).on('error', () => {
      // Secondary port already in use or optional
    });
  }
}

startServer();
