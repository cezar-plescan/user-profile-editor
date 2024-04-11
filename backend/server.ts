import express from 'express';
import fs from 'fs';
import cors from 'cors';

interface DbSchema {
  users: User[]
}

export interface User {
  id: number;
  name: string;
  email: string;
  address: string;
  avatar?: string;
}

const app = express();
const port = 3000;
const dataFilePath = 'backend/db.json'; // File to store user data

// configure CORS
const corsOptions: cors.CorsOptions = {
  origin: '*'
}
app.use(cors(corsOptions));

// Express JSON middleware
app.use(express.json())


// Helper function to load users from file
function loadDb(): DbSchema {
  return JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
}

// Get Users
app.get('/users', (req, res) => {
  const users = loadDb();

  res.json({
    status: 'ok',
    data: users
  });
});

// Get a specific User
app.get('/users/:id', (req, res) => {
  const users = loadDb().users;
  const userId = String(req.params['id']);

  const user = users.find(user => String(user.id) == userId);

  if (!user) {
    res.status(404)
      .send({
      message: 'User ID not found',
    });
  }
  else {
    res.json({
      status: 'ok',
      data: user
    });
  }
});

// Server Startup
app.listen(port);
console.log(`Server started at port ${port}...`);
