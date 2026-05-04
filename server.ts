import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";
import { initializeApp, cert, getApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

import fs from 'fs';
const firebaseConfig = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'firebase-applet-config.json'), 'utf-8'));

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const dbAdmin = getFirestore(firebaseConfig.firestoreDatabaseId);
const authAdmin = getAuth();

/**
 * Middleware to verify Firebase Auth Token and check permissions
 */
const requirePermission = (permission?: string) => {
  return async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await authAdmin.verifyIdToken(token);
      const uid = decodedToken.uid;
      const email = decodedToken.email;
      
      let userDoc = await dbAdmin.collection('users').doc(uid).get();
      
      // Auto-bootstrap master admin if missing
      if (!userDoc.exists && email === 'surajkumarrai721@gmail.com') {
        console.log('Bootstrapping master admin profile for:', email);
        const masterProfile = {
          uid,
          email,
          displayName: 'System Admin',
          role: 'Admin',
          permissions: [
            'view_dashboard', 'manage_leads', 'view_all_leads', 
            'manage_clients', 'add_client', 'edit_client', 'delete_client',
            'manage_team', 'view_finance', 'manage_finance', 'assign_tasks'
          ],
          createdAt: new Date().toISOString()
        };
        await dbAdmin.collection('users').doc(uid).set(masterProfile);
        userDoc = await dbAdmin.collection('users').doc(uid).get();
      }

      if (!userDoc.exists) {
        return res.status(403).json({ error: 'Forbidden: User profile not found' });
      }

      const profile = userDoc.data();
      req.user = { uid, ...profile };

      // Admin bypass
      if (['Admin', 'Co-founder', 'CEO', 'CTO'].includes(profile?.role || '')) {
        return next();
      }

      if (permission && !(profile?.permissions || []).includes(permission)) {
        return res.status(403).json({ error: `Forbidden: Missing permission ${permission}` });
      }

      next();
    } catch (error) {
      console.error('Auth Middleware Error:', error);
      res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
  };
};

const app = express();

async function startServer() {
  const PORT = 3000;

  app.use(express.json());
  app.use(cors());
  app.use(cookieParser());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Example API route for stats
  app.get("/api/stats", requirePermission('view_dashboard'), (req, res) => {
    res.json({
      leadsCount: 150,
      activeClients: 42,
      revenue: 125000,
      conversion: 15.5
    });
  });

  // --- TASK MANAGEMENT ---
  app.get("/api/tasks", requirePermission('view_dashboard'), async (req: any, res) => {
    try {
      const { relatedId, assignedTo } = req.query;
      let query: any = dbAdmin.collection('tasks');

      if (relatedId) query = query.where('relatedId', '==', relatedId);
      if (assignedTo) query = query.where('assignedTo', '==', assignedTo);

      const snapshot = await query.orderBy('createdAt', 'desc').get();
      const tasks = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tasks", requirePermission('view_dashboard'), async (req: any, res) => {
    try {
      const taskData = req.body;
      // Strict role check for assignment
      if (taskData.assignedTo !== req.user.uid && req.user.role === 'Intern') {
        return res.status(403).json({ error: 'Interns cannot assign tasks to others' });
      }

      const docRef = await dbAdmin.collection('tasks').add({
        ...taskData,
        createdBy: req.user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Log activity
      await dbAdmin.collection('activityLogs').add({
        userId: req.user.uid,
        userName: req.user.displayName,
        action: 'CREATED_TASK',
        entity: 'TASK',
        entityId: docRef.id,
        timestamp: new Date().toISOString(),
        details: { title: taskData.title }
      });

      res.status(201).json({ id: docRef.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/tasks/:id", requirePermission('view_dashboard'), async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const taskDoc = await dbAdmin.collection('tasks').doc(id).get();

      if (!taskDoc.exists) return res.status(404).json({ error: 'Task not found' });
      const task = taskDoc.data();

      // Authorization: Check if user can edit
      const isAdmin = ['Admin', 'Co-founder', 'CEO', 'CTO', 'Manager'].includes(req.user.role);
      const isAssigned = task?.assignedTo === req.user.uid;

      if (!isAdmin && !isAssigned) {
        return res.status(403).json({ error: 'You are not authorized to edit this task' });
      }

      await dbAdmin.collection('tasks').doc(id).update({
        ...updates,
        updatedAt: new Date().toISOString()
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/tasks/:id", requirePermission('view_dashboard'), async (req: any, res) => {
    try {
      const { id } = req.params;
      const taskDoc = await dbAdmin.collection('tasks').doc(id).get();

      if (!taskDoc.exists) return res.status(404).json({ error: 'Task not found' });
      const task = taskDoc.data();

      // Authorization: Admin or Creator or Assignee (if they want to clear their own)
      const isAdmin = ['Admin', 'Co-founder', 'CEO', 'CTO', 'Manager'].includes(req.user.role);
      const isCreator = task?.createdBy === req.user.uid;

      if (!isAdmin && !isCreator) {
        return res.status(403).json({ error: 'Only admins or the creator can delete tasks' });
      }

      await dbAdmin.collection('tasks').doc(id).delete();

      // Log activity
      await dbAdmin.collection('activityLogs').add({
        userId: req.user.uid,
        userName: req.user.displayName,
        action: 'DELETED_TASK',
        entity: 'TASK',
        entityId: id,
        timestamp: new Date().toISOString(),
        details: { title: task?.title }
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- AUDIT RETRIEVAL ---
  app.get("/api/audit", requirePermission('manage_team'), async (req: any, res) => {
    try {
      const { entityId, limit = 50 } = req.query;
      let query: any = dbAdmin.collection('activityLogs').orderBy('timestamp', 'desc').limit(Number(limit));

      if (entityId) query = query.where('entityId', '==', entityId);

      const snapshot = await query.get();
      const logs = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create User endpoint for Admins
  app.post("/api/admin/create-user", requirePermission('manage_team'), async (req, res) => {
    const { email, password, displayName, role, permissions } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
      // 1. Create the Auth User
      const userRecord = await authAdmin.createUser({
        email,
        password,
        displayName,
      });

      // 2. Create the Firestore User Profile
      await dbAdmin.collection('users').doc(userRecord.uid).set({
        uid: userRecord.uid,
        email,
        displayName,
        role: role || 'Intern',
        permissions: permissions || [],
        createdAt: new Date().toISOString(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userRecord.uid}`
      });

      res.status(201).json({ 
        message: 'User created successfully', 
        uid: userRecord.uid 
      });
    } catch (error: any) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: error.message || 'Failed to create user' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    // Fallback for SPA routing in dev mode
    app.get("*", async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) {
        return next();
      }
      try {
        const fs = await import('fs');
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Serve index.html for any non-API route in production
    app.get("*", (req, res) => {
      if (req.originalUrl.startsWith('/api')) return res.status(404).json({ error: 'Not Found' });
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Only listen if not running on Vercel (which uses the exported app)
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Nexorith Studio server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
