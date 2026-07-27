import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import db from './config/database.js';
import { getMessaging } from './config/firebase.js';

import http from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const INSTANCE_ID = Math.random().toString(36).substring(7);
console.log(`--- BACKEND INSTANCE STARTING (ID: ${INSTANCE_ID}) ---`);

app.use((req, res, next) => {
  console.log(`[${INSTANCE_ID}] ${req.method} ${req.url}`);
  next();
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for now
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"]
  }
});

// Store io instance to be used in routes/controllers
app.set('io', io);

const PORT = process.env.PORT || 5005;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Log requests to index.js for inspection
import fs from 'fs';
app.use((req, res, next) => {
  if (req.method === 'POST') {
    const logEntry = `[${new Date().toISOString()}] ${req.url} BODY: ${JSON.stringify(req.body)}\n`;
    fs.appendFileSync('requests.log', logEntry);
  }
  next();
});

// Catch JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    const logEntry = `[${new Date().toISOString()}] --- BAD JSON RECEIVED --- ${err.message}\n`;
    fs.appendFileSync('requests.log', logEntry);
    console.error(`[${INSTANCE_ID}] --- BAD JSON RECEIVED ---`);
    console.error(err.message);
    return res.status(400).json({ message: "Invalid JSON format in request body." });
  }
  next();
});

// Routes
app.use('/api', routes);

app.get('/', (req, res) => {
  res.send('GoWash Backend is running');
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Background Job: Notify online drivers about pending jobs every 30 seconds
setInterval(async () => {
  try {
    const jobsRes = await db.query(`
      SELECT o.*, u.name as customer_name, s.name as service_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN services s ON o.service_id = s.id
      WHERE o.status IN ('Pending', 'Ready')
      AND o.id NOT IN (SELECT order_id FROM ride_assignments WHERE status NOT IN ('delivered', 'cancelled'))
      ORDER BY o.created_at DESC
    `);
    
    if (jobsRes.rows.length > 0) {
      const driversRes = await db.query("SELECT id, push_token FROM drivers WHERE status = 'online'");
      const onlineDrivers = driversRes.rows;
      
      jobsRes.rows.forEach(job => {
        // Emit Socket Event
        io.emit('new_driver_job', job);
        
        // Send Push Notifications
        onlineDrivers.forEach(driver => {
          if (driver.push_token) {
            const message = {
              token: driver.push_token,
              data: {
                type: 'new_job',
                orderId: job.id.toString(),
                pickup_address: job.address || '',
                price: (job.delivery_fee || 350).toString()
              },
              notification: {
                title: 'New Delivery Request',
                body: `New request at ${job.address || 'location'} for LKR ${job.delivery_fee || 350}`,
              },
              android: {
                priority: 'high',
                notification: {
                  sound: 'default'
                }
              }
            };
            const messaging = getMessaging();
            if (messaging) {
              messaging.send(message).catch(err => console.error(`FCM error for driver ${driver.id}:`, err));
            }
          }
        });
      });
    }
  } catch (error) {
    console.error('Error in background job loop:', error);
  }
}, 30000); // 30 seconds

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
