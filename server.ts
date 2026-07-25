/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
const JWT_SECRET = 'chordpro-studio-admin-secret-key-2026';
const REFRESH_SECRET = 'chordpro-studio-refresh-secret-2026';

app.use(express.json());

// Memory Data Store
let songs = [
  {
    id: 'song-1',
    title: 'Amazing Grace',
    artist: 'John Newton',
    folderId: 'folder-hymns',
    path: 'Hymns/Amazing Grace.pro',
    tags: ['Hymn', 'Classic', 'Grace'],
    content: `{title: Amazing Grace}\n{artist: John Newton}\n{key: G}\n{tempo: 72}\n\n{c: Verse 1}\n[G]Amazing [C]grace, how [G]sweet the sound\nThat [G]saved a [D]wretch like [D7]me\nI [G]once was [C]lost, but [G]now am found\nWas [G]blind but [D]now I [G]see\n\n{c: Chorus}\n[G]My chains are [C]gone, I've been set [G]free\nMy [G]Savior [C]God has ransomed [D]me\nAnd [G]like a [C]flood His mercy [G]reigns\nUn[G]ending [D]love, amazing [G]grace`,
    createdAt: new Date('2026-07-01').toISOString(),
    updatedAt: new Date('2026-07-19').toISOString()
  },
  {
    id: 'song-2',
    title: 'How Great Is Our God',
    artist: 'Chris Tomlin',
    folderId: 'folder-contemporary',
    path: 'Contemporary/How Great Is Our God.pro',
    tags: ['Contemporary', 'Worship', 'Praise'],
    content: `{title: How Great Is Our God}\n{artist: Chris Tomlin}\n{key: G}\n{tempo: 78}\n\n{c: Verse 1}\nThe [G]splendor of the [Em]King, clothed in majesty\nLet all the earth re[C]joice, all the earth rejoice\nHe [G]wraps Himself in [Em]light, and darkness tries to hide\nAnd trembles at His [C]voice, trembles at His voice\n\n{c: Chorus}\nHow [G]great is our God, sing with me\nHow [Em]great is our God, and all will see\nHow [C]great, how [D]great is our [G]God`,
    createdAt: new Date('2026-07-05').toISOString(),
    updatedAt: new Date('2026-07-20').toISOString()
  },
  {
    id: 'song-3',
    title: '10,000 Reasons (Bless The Lord)',
    artist: 'Matt Redman',
    folderId: 'folder-contemporary',
    path: 'Contemporary/10,000 Reasons.pro',
    tags: ['Contemporary', 'Blessing'],
    content: `{title: 10,000 Reasons (Bless The Lord)}\n{artist: Matt Redman}\n{key: G}\n{tempo: 73}\n\n{c: Chorus}\nBless the [C]Lord, O my [G]soul, [D]O my [Em]soul\n[C]Worship His [G]holy [D]name [Dsus4] [D]\nSing like [C]never be[Em]fore, [C]O my [D]soul [Em]\nI'll [C]worship Your [D]holy [G]name`,
    createdAt: new Date('2026-07-10').toISOString(),
    updatedAt: new Date('2026-07-21').toISOString()
  },
  {
    id: 'song-4',
    title: 'In Christ Alone',
    artist: 'Keith Getty & Stuart Townend',
    folderId: 'folder-hymns',
    path: 'Hymns/In Christ Alone.pro',
    tags: ['Hymn', 'Theological', 'Hope'],
    content: `{title: In Christ Alone}\n{artist: Keith Getty & Stuart Townend}\n{key: G}\n{tempo: 68}\n\n{c: Verse 1}\nIn [G]Christ a[D]lone my [G]hope is [A]found\n[D]He is my [G]light, my [A]strength, my [D]song\nThis [G]Corner[D]stone, this [G]solid [A]Ground\n[D]Firm through the [G]fiercest [A]drought and [D]storm`,
    createdAt: new Date('2026-07-12').toISOString(),
    updatedAt: new Date('2026-07-22').toISOString()
  },
  {
    id: 'song-5',
    title: 'Way Maker',
    artist: 'Sinach',
    folderId: 'folder-worship',
    path: 'Worship/Way Maker.pro',
    tags: ['Worship', 'Global'],
    content: `{title: Way Maker}\n{artist: Sinach}\n{key: G}\n{tempo: 68}\n\n{c: Chorus}\n[C]Way maker, [G]miracle worker\n[D]Promise keeper, [Em]light in the darkness\nMy God, that is who You [C]are`,
    createdAt: new Date('2026-07-15').toISOString(),
    updatedAt: new Date('2026-07-23').toISOString()
  }
];

let folders = [
  { id: 'folder-hymns', name: 'Hymns', parentId: null, createdAt: new Date('2026-07-01').toISOString() },
  { id: 'folder-contemporary', name: 'Contemporary', parentId: null, createdAt: new Date('2026-07-02').toISOString() },
  { id: 'folder-worship', name: 'Worship', parentId: null, createdAt: new Date('2026-07-03').toISOString() }
];

let services = [
  {
    id: 'service-1',
    name: 'Sunday Morning Service',
    date: '2026-07-26',
    notes: 'Focus on God\'s faithfulness. Acoustic guitar intro for song 1.',
    songs: [
      { songId: 'song-1', notes: 'Soft acoustic intro' },
      { songId: 'song-3', notes: 'Seamless transition in G' },
      { songId: 'song-2', notes: 'Full band entrance' }
    ],
    songNotes: {
      'song-1': 'Soft acoustic intro',
      'song-3': 'Seamless transition in G',
      'song-2': 'Full band entrance'
    },
    updatedAt: new Date('2026-07-20').toISOString()
  },
  {
    id: 'service-2',
    name: 'Midweek Worship Night',
    date: '2026-07-29',
    notes: 'Extended prayer and acoustic worship session.',
    songs: [
      { songId: 'song-5', notes: 'Repeat Chorus 3x' },
      { songId: 'song-4', notes: 'A cappella verse 4' }
    ],
    songNotes: {
      'song-5': 'Repeat Chorus 3x',
      'song-4': 'A cappella verse 4'
    },
    updatedAt: new Date('2026-07-22').toISOString()
  }
];

let musicianTokens = [
  {
    id: 'token-1',
    name: 'Sunday Band Access',
    token: 'musician-sub-key-8912',
    expiresAt: new Date('2026-08-30').toISOString(),
    createdAt: new Date('2026-07-01').toISOString(),
    status: 'active',
    allowedServices: ['service-1']
  },
  {
    id: 'token-2',
    name: 'Youth Vocalists Token',
    token: 'musician-sub-key-4421',
    expiresAt: new Date('2026-08-15').toISOString(),
    createdAt: new Date('2026-07-05').toISOString(),
    status: 'active',
    allowedServices: []
  }
];

let serverSettings = {
  serverName: 'ChordPro Primary Production Server',
  port: 3000,
  defaultKey: 'G',
  syncIntervalSeconds: 30,
  allowPublicRead: false,
  autoBackupEnabled: true,
  maxUploadMB: 10
};

// Middleware: Authenticate Admin JWT
function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Missing token' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
      return;
    }
    (req as any).user = user;
    next();
  });
}

// --- AUTH ROUTES ---
app.post('/api/auth/login', (req, res) => {
  const { email, password, bearerToken } = req.body;

  // Support both standard credentials or direct Bearer Token entry
  if (bearerToken || (email && password)) {
    const user = { id: 'admin-1', email: email || 'leader@church.org', name: 'Worship Director', role: 'admin' };
    const accessToken = jwt.sign(user, JWT_SECRET, { expiresIn: '8h' });
    const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: '7d' });

    res.json({
      user,
      token: accessToken,
      accessToken,
      refreshToken
    });
  } else {
    res.status(400).json({ error: 'Please provide email and password or token' });
  }
});

app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token required' });
    return;
  }

  jwt.verify(refreshToken, REFRESH_SECRET, (err: any, decoded: any) => {
    if (err) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }
    const user = { id: 'admin-1', email: 'leader@church.org', name: 'Worship Director', role: 'admin' };
    const newAccessToken = jwt.sign(user, JWT_SECRET, { expiresIn: '8h' });
    res.json({ accessToken: newAccessToken });
  });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({
    user: (req as any).user
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// --- SONG ROUTES ---
app.get('/api/songs', authenticateToken, (req, res) => {
  const { search, folder, sortBy = 'title', sortOrder = 'asc', page = '1', limit = '50', key, tag, searchFields } = req.query;

  let result = [...songs];

  if (folder) {
    if (folder === 'root') {
      result = result.filter(s => !s.folderId);
    } else {
      result = result.filter(s => s.folderId === folder);
    }
  }

  if (tag) {
    const t = String(tag).toLowerCase();
    result = result.filter(s => s.tags.some(st => st.toLowerCase() === t));
  }

  if (key) {
    const k = String(key).toLowerCase();
    result = result.filter(s => {
      const keyMatch = s.content.match(/\{key:\s*([^}]+)\}/i);
      return keyMatch && keyMatch[1].trim().toLowerCase() === k;
    });
  }

  if (search) {
    const q = String(search).toLowerCase();
    let fields = { title: true, artist: true, content: true, tags: true };
    if (searchFields) {
      try {
        fields = JSON.parse(String(searchFields));
      } catch (e) {
        // use defaults
      }
    }

    result = result.filter(s => {
      const titleMatch = fields.title && s.title.toLowerCase().includes(q);
      const artistMatch = fields.artist && s.artist.toLowerCase().includes(q);
      const contentMatch = fields.content && s.content.toLowerCase().includes(q);
      const tagsMatch = fields.tags && s.tags.some(t => t.toLowerCase().includes(q));
      return titleMatch || artistMatch || contentMatch || tagsMatch;
    });
  }

  // Sorting
  result.sort((a: any, b: any) => {
    let valA = a[sortBy as string] || '';
    let valB = b[sortBy as string] || '';
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const pageNum = parseInt(String(page), 10) || 1;
  const limitNum = parseInt(String(limit), 10) || 50;
  const total = result.length;
  const startIndex = (pageNum - 1) * limitNum;
  const paginatedSongs = result.slice(startIndex, startIndex + limitNum);

  res.json({
    songs: paginatedSongs,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1
  });
});

app.get('/api/songs/:id', authenticateToken, (req, res) => {
  const song = songs.find(s => s.id === req.params.id);
  if (!song) {
    res.status(404).json({ error: 'Song not found' });
    return;
  }
  res.json(song);
});

app.post('/api/songs', authenticateToken, (req, res) => {
  const { title, artist, content, folderId, path: songPath, tags } = req.body;
  if (!title) {
    res.status(400).json({ error: 'Song title is required' });
    return;
  }

  const folderObj = folders.find(f => f.id === folderId);
  const folderName = folderObj ? folderObj.name : '';
  const computedPath = songPath || (folderName ? `${folderName}/${title}.pro` : `${title}.pro`);

  const newSong = {
    id: `song-${Date.now()}`,
    title,
    artist: artist || 'Unknown Artist',
    content: content || `{title: ${title}}\n{artist: ${artist || 'Unknown'}}\n{key: G}\n\n[G]Add chords and lyrics here...`,
    folderId: folderId || null,
    path: computedPath,
    tags: tags || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  songs.push(newSong);
  res.status(201).json(newSong);
});

app.post('/api/songs/batch', authenticateToken, (req, res) => {
  const { songs: batch } = req.body;
  if (!Array.isArray(batch)) {
    res.status(400).json({ error: 'Array de cânticos inválido' });
    return;
  }

  const createdSongs: any[] = [];
  for (const item of batch) {
    const { title, artist, content, folderId, path: songPath, tags } = item;
    if (!title) continue;

    const folderObj = folders.find(f => f.id === folderId);
    const folderName = folderObj ? folderObj.name : '';
    const computedPath = songPath || (folderName ? `${folderName}/${title}.pro` : `${title}.pro`);

    const newSong = {
      id: `song-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      artist: artist || 'Vários',
      content: content || `{title: ${title}}\n{artist: ${artist || 'Vários'}}\n\n`,
      folderId: folderId || null,
      path: computedPath,
      tags: tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    songs.push(newSong);
    createdSongs.push(newSong);
  }

  res.status(201).json({ created: createdSongs, count: createdSongs.length });
});

app.put('/api/songs/batch-tags', authenticateToken, (req, res) => {
  const { songIds, tags, mode = 'append' } = req.body;
  if (!Array.isArray(songIds) || !Array.isArray(tags)) {
    res.status(400).json({ error: 'Parâmetros songIds e tags são obrigatórios e devem ser arrays' });
    return;
  }

  let updatedCount = 0;
  songs = songs.map(song => {
    if (songIds.includes(song.id)) {
      updatedCount++;
      let newTags = [...(song.tags || [])];

      if (mode === 'replace') {
        newTags = [...new Set(tags)];
      } else if (mode === 'remove') {
        newTags = newTags.filter(t => !tags.includes(t));
      } else {
        // append default
        tags.forEach(t => {
          if (!newTags.includes(t)) {
            newTags.push(t);
          }
        });
      }

      return {
        ...song,
        tags: newTags,
        updatedAt: new Date().toISOString()
      };
    }
    return song;
  });

  res.json({ success: true, count: updatedCount });
});

app.put('/api/songs/:id', authenticateToken, (req, res) => {
  const index = songs.findIndex(s => s.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Song not found' });
    return;
  }

  const updatedSong = {
    ...songs[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  songs[index] = updatedSong;
  res.json(updatedSong);
});

app.delete('/api/songs/:id', authenticateToken, (req, res) => {
  const id = req.params.id;
  songs = songs.filter(s => s.id !== id);
  // Also remove from services
  services.forEach(srv => {
    srv.songs = srv.songs.filter(s => s.songId !== id);
    if (srv.songNotes && srv.songNotes[id]) {
      delete srv.songNotes[id];
    }
  });
  res.status(204).send();
});

app.put('/api/songs/:id/rename', authenticateToken, (req, res) => {
  const { newTitle, newPath } = req.body;
  const song = songs.find(s => s.id === req.params.id);
  if (!song) {
    res.status(404).json({ error: 'Song not found' });
    return;
  }

  song.title = newTitle || song.title;
  if (newPath) song.path = newPath;
  song.updatedAt = new Date().toISOString();
  res.json(song);
});

app.put('/api/songs/:id/move', authenticateToken, (req, res) => {
  const { folderId, newPath } = req.body;
  const song = songs.find(s => s.id === req.params.id);
  if (!song) {
    res.status(404).json({ error: 'Song not found' });
    return;
  }

  song.folderId = folderId || null;
  if (newPath) song.path = newPath;
  song.updatedAt = new Date().toISOString();
  res.json(song);
});

// --- FOLDER ROUTES ---
app.get('/api/folders', authenticateToken, (req, res) => {
  const foldersWithCounts = folders.map(f => {
    const count = songs.filter(s => s.folderId === f.id).length;
    return { ...f, songCount: count };
  });

  const rootSongsCount = songs.filter(s => !s.folderId).length;

  res.json({
    folders: foldersWithCounts,
    rootSongsCount
  });
});

app.post('/api/folders', authenticateToken, (req, res) => {
  const { name, parentId } = req.body;
  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Folder name is required' });
    return;
  }

  const newFolder = {
    id: `folder-${Date.now()}`,
    name: name.trim(),
    parentId: parentId || null,
    createdAt: new Date().toISOString()
  };

  folders.push(newFolder);
  res.status(201).json({ ...newFolder, songCount: 0 });
});

app.put('/api/folders/:id', authenticateToken, (req, res) => {
  const { name, parentId } = req.body;
  const folder = folders.find(f => f.id === req.params.id);
  if (!folder) {
    res.status(404).json({ error: 'Folder not found' });
    return;
  }

  if (name !== undefined) folder.name = name;
  if (parentId !== undefined) folder.parentId = parentId === 'root' || parentId === null ? null : parentId;

  // Update paths of contained songs
  songs.forEach(s => {
    if (s.folderId === folder.id) {
      s.path = `${folder.name}/${s.title}.pro`;
    }
  });

  res.json(folder);
});

app.delete('/api/folders/:id', authenticateToken, (req, res) => {
  const folderId = req.params.id;
  const action = req.query.action || req.body.action || 'move_to_root'; // 'delete_songs' or 'move_to_root'

  const folderIndex = folders.findIndex(f => f.id === folderId);
  if (folderIndex === -1) {
    res.status(404).json({ error: 'Folder not found' });
    return;
  }

  if (action === 'delete_songs') {
    const songIdsToDelete = songs.filter(s => s.folderId === folderId).map(s => s.id);
    songs = songs.filter(s => s.folderId !== folderId);
    // Remove deleted songs from services
    services.forEach(srv => {
      srv.songs = srv.songs.filter(s => !songIdsToDelete.includes(s.songId));
      songIdsToDelete.forEach(id => delete srv.songNotes[id]);
    });
  } else {
    // Move to root
    songs.forEach(s => {
      if (s.folderId === folderId) {
        s.folderId = null;
        s.path = `${s.title}.pro`;
      }
    });
  }

  folders.splice(folderIndex, 1);
  res.status(200).json({ message: 'Folder deleted', actionUsed: action });
});

// --- SERVICE ROUTES ---
app.get('/api/services', authenticateToken, (req, res) => {
  res.json(services);
});

app.get('/api/services/:id', authenticateToken, (req, res) => {
  const service = services.find(s => s.id === req.params.id);
  if (!service) {
    res.status(404).json({ error: 'Service not found' });
    return;
  }
  res.json(service);
});

app.post('/api/services', authenticateToken, (req, res) => {
  const { name, date, notes, songs: serviceSongs, songNotes } = req.body;
  if (!name || !date) {
    res.status(400).json({ error: 'Service name and date are required' });
    return;
  }

  const newService = {
    id: `service-${Date.now()}`,
    name,
    date,
    notes: notes || '',
    songs: serviceSongs || [],
    songNotes: songNotes || {},
    updatedAt: new Date().toISOString()
  };

  services.push(newService);
  res.status(201).json(newService);
});

app.put('/api/services/:id', authenticateToken, (req, res) => {
  const index = services.findIndex(s => s.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Service not found' });
    return;
  }

  const updatedService = {
    ...services[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  services[index] = updatedService;
  res.json(updatedService);
});

app.delete('/api/services/:id', authenticateToken, (req, res) => {
  const id = req.params.id;
  services = services.filter(s => s.id !== id);
  res.status(204).send();
});

// --- MUSICIAN ACCESS TOKEN ROUTES ---
app.get('/api/musicians/tokens', authenticateToken, (req, res) => {
  res.json(musicianTokens);
});

app.post('/api/musicians/tokens', authenticateToken, (req, res) => {
  const { name, expiresAt, allowedServices } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Token name/label is required' });
    return;
  }

  const newToken = {
    id: `token-${Date.now()}`,
    name,
    token: `musician-key-${Math.random().toString(36).substring(2, 10)}`,
    expiresAt: expiresAt || new Date(Date.now() + 30 * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    status: 'active',
    allowedServices: allowedServices || []
  };

  musicianTokens.push(newToken);
  res.status(201).json(newToken);
});

app.delete('/api/musicians/tokens/:id', authenticateToken, (req, res) => {
  const id = req.params.id;
  musicianTokens = musicianTokens.filter(t => t.id !== id);
  res.status(204).send();
});

// --- SETTINGS ROUTES ---
app.get('/api/settings', authenticateToken, (req, res) => {
  res.json(serverSettings);
});

app.put('/api/settings', authenticateToken, (req, res) => {
  serverSettings = {
    ...serverSettings,
    ...req.body
  };
  res.json(serverSettings);
});

// --- BACKUP & RESTORE ROUTES ---
app.get('/api/backup', authenticateToken, (req, res) => {
  res.json({
    version: '1.0',
    exportedAt: new Date().toISOString(),
    songs,
    folders,
    services,
    musicianTokens,
    settings: serverSettings
  });
});

app.post('/api/backup/restore', authenticateToken, (req, res) => {
  const backupData = req.body;
  if (!backupData || (typeof backupData !== 'object')) {
    res.status(400).json({ error: 'Ficheiro de cópia de segurança inválido ou corrompido' });
    return;
  }

  if (Array.isArray(backupData.songs)) {
    songs = backupData.songs;
  }
  if (Array.isArray(backupData.folders)) {
    folders = backupData.folders;
  }
  if (Array.isArray(backupData.services)) {
    services = backupData.services;
  }
  if (Array.isArray(backupData.musicianTokens)) {
    musicianTokens = backupData.musicianTokens;
  }
  if (backupData.settings && typeof backupData.settings === 'object') {
    serverSettings = {
      ...serverSettings,
      ...backupData.settings
    };
  }

  res.json({
    message: 'Cópia de segurança restaurada com sucesso',
    counts: {
      songs: songs.length,
      folders: folders.length,
      services: services.length,
      musicianTokens: musicianTokens.length
    }
  });
});

// Vite Middleware for Dev Mode & Static Files for Production Mode
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ChordPro Studio Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
