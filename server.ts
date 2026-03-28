import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { initDb } from './src/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-for-development';

async function startServer() {
  const app = express();
  const PORT = 3000;
  const db = await initDb();

  app.use(express.json());

  // Middleware to verify JWT
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // Auth API
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const finalEmail = email === 'admin' ? 'admin@system.local' : email;
    
    const user = await db.get('SELECT * FROM users WHERE email = ?', [finalEmail]);
    if (!user) return res.status(400).json({ message: '用户不存在' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: '密码错误' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    const { password: _, ...userProfile } = user;
    res.json({ token, profile: userProfile });
  });

  app.post('/api/auth/register', async (req, res) => {
    const { email, password, name } = req.body;
    const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) return res.status(400).json({ message: '邮箱已被占用' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = Math.random().toString(36).substring(2, 15);
    const newUser = {
      id,
      email,
      password: hashedPassword,
      name,
      role: 'quoter',
      status: 'active',
      createdAt: new Date().toISOString()
    };

    await db.run(
      'INSERT INTO users (id, email, password, name, role, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [newUser.id, newUser.email, newUser.password, newUser.name, newUser.role, newUser.status, newUser.createdAt]
    );

    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '24h' });
    const { password: _, ...userProfile } = newUser;
    res.json({ token, profile: userProfile });
  });

  app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ message: '用户不存在' });
    const { password: _, ...userProfile } = user;
    res.json(userProfile);
  });

  // Categories API
  app.get('/api/categories', authenticateToken, async (req, res) => {
    const categories = await db.all('SELECT * FROM categories ORDER BY "order" ASC');
    res.json(categories);
  });

  app.post('/api/categories', authenticateToken, async (req, res) => {
    const { name, parentId, status, order } = req.body;
    const id = Math.random().toString(36).substring(2, 15);
    await db.run('INSERT INTO categories (id, name, parentId, status, "order", createdAt) VALUES (?, ?, ?, ?, ?, ?)', [id, name, parentId, status, order, new Date().toISOString()]);
    res.json({ id, name, parentId, status, order });
  });

  app.put('/api/categories/:id', authenticateToken, async (req, res) => {
    const { name, parentId, status, order } = req.body;
    await db.run('UPDATE categories SET name = ?, parentId = ?, status = ?, "order" = ? WHERE id = ?', [name, parentId, status, order, req.params.id]);
    res.json({ id: req.params.id, name, parentId, status, order });
  });

  app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
    await db.run('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.sendStatus(204);
  });

  // Products API
  app.get('/api/products', authenticateToken, async (req, res) => {
    const products = await db.all('SELECT * FROM products ORDER BY createdAt DESC');
    res.json(products);
  });

  app.post('/api/products', authenticateToken, async (req, res) => {
    const { categoryId, name, description, unit, costPrice, retailPrice, imageUrl, status } = req.body;
    const id = Math.random().toString(36).substring(2, 15);
    await db.run(
      'INSERT INTO products (id, categoryId, name, description, unit, costPrice, retailPrice, imageUrl, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, categoryId, name, description, unit, costPrice, retailPrice, imageUrl, status, new Date().toISOString()]
    );
    res.json({ id, ...req.body });
  });

  app.put('/api/products/:id', authenticateToken, async (req, res) => {
    const { categoryId, name, description, unit, costPrice, retailPrice, imageUrl, status } = req.body;
    await db.run(
      'UPDATE products SET categoryId = ?, name = ?, description = ?, unit = ?, costPrice = ?, retailPrice = ?, imageUrl = ?, status = ? WHERE id = ?',
      [categoryId, name, description, unit, costPrice, retailPrice, imageUrl, status, req.params.id]
    );
    res.json({ id: req.params.id, ...req.body });
  });

  app.delete('/api/products/:id', authenticateToken, async (req, res) => {
    await db.run('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.sendStatus(204);
  });

  // Quotations API
  app.get('/api/quotations', authenticateToken, async (req, res) => {
    const quotations = await db.all('SELECT * FROM quotations ORDER BY createdAt DESC');
    res.json(quotations.map(q => ({ ...q, items: JSON.parse(q.items) })));
  });

  app.post('/api/quotations', authenticateToken, async (req, res) => {
    const { clientName, contactPerson, phone, date, headCount, items, totalRetail, totalDiscounted, perPerson, status } = req.body;
    const id = Math.random().toString(36).substring(2, 15);
    await db.run(
      'INSERT INTO quotations (id, clientName, contactPerson, phone, date, headCount, items, totalRetail, totalDiscounted, perPerson, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, clientName, contactPerson, phone, date, headCount, JSON.stringify(items), totalRetail, totalDiscounted, perPerson, status, new Date().toISOString()]
    );
    res.json({ id, ...req.body });
  });

  app.put('/api/quotations/:id', authenticateToken, async (req, res) => {
    const { clientName, contactPerson, phone, date, headCount, items, totalRetail, totalDiscounted, perPerson, status } = req.body;
    await db.run(
      'UPDATE quotations SET clientName = ?, contactPerson = ?, phone = ?, date = ?, headCount = ?, items = ?, totalRetail = ?, totalDiscounted = ?, perPerson = ?, status = ? WHERE id = ?',
      [clientName, contactPerson, phone, date, headCount, JSON.stringify(items), totalRetail, totalDiscounted, perPerson, status, req.params.id]
    );
    res.json({ id: req.params.id, ...req.body });
  });

  app.delete('/api/quotations/:id', authenticateToken, async (req, res) => {
    await db.run('DELETE FROM quotations WHERE id = ?', [req.params.id]);
    res.sendStatus(204);
  });

  // Contracts API
  app.get('/api/contracts', authenticateToken, async (req, res) => {
    const contracts = await db.all('SELECT * FROM contracts ORDER BY createdAt DESC');
    res.json(contracts);
  });

  app.post('/api/contracts', authenticateToken, async (req, res) => {
    const { quotationId, contractNumber, clientName, amount, status, content } = req.body;
    const id = Math.random().toString(36).substring(2, 15);
    await db.run(
      'INSERT INTO contracts (id, quotationId, contractNumber, clientName, amount, status, content, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, quotationId, contractNumber, clientName, amount, status, content, new Date().toISOString()]
    );
    res.json({ id, ...req.body });
  });

  app.put('/api/contracts/:id', authenticateToken, async (req, res) => {
    const { quotationId, contractNumber, clientName, amount, status, content } = req.body;
    await db.run(
      'UPDATE contracts SET quotationId = ?, contractNumber = ?, clientName = ?, amount = ?, status = ?, content = ? WHERE id = ?',
      [quotationId, contractNumber, clientName, amount, status, content, req.params.id]
    );
    res.json({ id: req.params.id, ...req.body });
  });

  app.delete('/api/contracts/:id', authenticateToken, async (req, res) => {
    await db.run('DELETE FROM contracts WHERE id = ?', [req.params.id]);
    res.sendStatus(204);
  });

  // Contract Templates API
  app.get('/api/contract_templates', authenticateToken, async (req, res) => {
    const templates = await db.all('SELECT * FROM contract_templates ORDER BY createdAt DESC');
    res.json(templates);
  });

  app.post('/api/contract_templates', authenticateToken, async (req, res) => {
    const { name, content } = req.body;
    const id = Math.random().toString(36).substring(2, 15);
    await db.run(
      'INSERT INTO contract_templates (id, name, content, createdAt) VALUES (?, ?, ?, ?)',
      [id, name, content, new Date().toISOString()]
    );
    res.json({ id, name, content });
  });

  app.put('/api/contract_templates/:id', authenticateToken, async (req, res) => {
    const { name, content } = req.body;
    await db.run(
      'UPDATE contract_templates SET name = ?, content = ? WHERE id = ?',
      [name, content, req.params.id]
    );
    res.json({ id: req.params.id, name, content });
  });

  app.delete('/api/contract_templates/:id', authenticateToken, async (req, res) => {
    await db.run('DELETE FROM contract_templates WHERE id = ?', [req.params.id]);
    res.sendStatus(204);
  });

  // Customers API
  app.get('/api/customers', authenticateToken, async (req, res) => {
    const customers = await db.all('SELECT * FROM customers ORDER BY createdAt DESC');
    res.json(customers);
  });

  app.post('/api/customers', authenticateToken, async (req, res) => {
    const { name, company, phone, email, address, status } = req.body;
    const id = Math.random().toString(36).substring(2, 15);
    await db.run(
      'INSERT INTO customers (id, name, company, phone, email, address, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, company, phone, email, address, status, new Date().toISOString()]
    );
    res.json({ id, ...req.body });
  });

  app.put('/api/customers/:id', authenticateToken, async (req, res) => {
    const { name, company, phone, email, address, status } = req.body;
    await db.run(
      'UPDATE customers SET name = ?, company = ?, phone = ?, email = ?, address = ?, status = ? WHERE id = ?',
      [name, company, phone, email, address, status, req.params.id]
    );
    res.json({ id: req.params.id, ...req.body });
  });

  app.delete('/api/customers/:id', authenticateToken, async (req, res) => {
    await db.run('DELETE FROM customers WHERE id = ?', [req.params.id]);
    res.sendStatus(204);
  });

  // Users Management API (for super_admin)
  app.get('/api/users', authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'super_admin') return res.sendStatus(403);
    const users = await db.all('SELECT id, email, name, role, status, createdAt FROM users ORDER BY createdAt DESC');
    res.json(users);
  });

  app.post('/api/users', authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'super_admin') return res.sendStatus(403);
    const { email, name, password, role, status } = req.body;
    const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) return res.status(400).json({ error: '邮箱已被占用' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = Math.random().toString(36).substring(2, 15);
    await db.run(
      'INSERT INTO users (id, email, password, name, role, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, email, hashedPassword, name, role, status, new Date().toISOString()]
    );
    res.json({ id, email, name, role, status });
  });

  app.put('/api/users/:id', authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'super_admin') return res.sendStatus(403);
    const { name, role, status } = req.body;
    await db.run('UPDATE users SET name = ?, role = ?, status = ? WHERE id = ?', [name, role, status, req.params.id]);
    res.json({ id: req.params.id, name, role, status });
  });

  app.delete('/api/users/:id', authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'super_admin') return res.sendStatus(403);
    await db.run('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.sendStatus(204);
  });

  // Settings API
  app.get('/api/settings', authenticateToken, async (req, res) => {
    const settings = await db.get('SELECT * FROM settings WHERE id = ?', ['config']);
    res.json(settings);
  });

  app.post('/api/settings', authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'super_admin' && req.user.role !== 'admin') return res.sendStatus(403);
    const { companyName, logo, contactInfo } = req.body;
    await db.run(
      'UPDATE settings SET companyName = ?, logo = ?, contactInfo = ? WHERE id = ?',
      [companyName, logo, contactInfo, 'config']
    );
    res.json({ companyName, logo, contactInfo });
  });

  // API routes can go here if needed for server-side exports
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
