import express from 'express';
import fs from 'fs';
import cors from 'cors';
import multer from 'multer';

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

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'backend/images/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Store with a timestamp
  }
});

const upload = multer({ storage: storage });

// Static file serving
app.use('/images', express.static('backend/images'))

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

// Helper function to save users to file
function saveUsers(db: DbSchema) {
  fs.writeFileSync(dataFilePath, JSON.stringify(db, null, 2));
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

// Update User
app.put('/users/:id', upload.single('avatar'), (req, res) => {
  const userId = String(req.params['id']);
  const db = loadDb();
  let users = db.users;

  const updatedUserData = {...req.body} as User;
  const existingUser = users.find(user => String(user.id) == userId);

  // simulate a 500 error
  if (updatedUserData.name === 'error') {
    res.status(500).send();

    return;
  }

  // there should be a valid userId
  if (!userId || !existingUser) {
    res.status(404).send({
      message: 'User ID is missing or invalid',
    });

    return;
  }

  // the names should be unique
  if (users.some(user => String(user.id) != userId && user.name === updatedUserData.name)) {
    res.status(400).send({
      message: 'Validation errors',
      errors: [
        {
          field: 'name',
          message: 'There is already a user with this name.',
          code: 'duplicate_name'
        }
      ]
    });

    return;
  }

  if (req.file?.filename) {
    updatedUserData.avatar = req.file.filename
  }

  let updatedUser: User = {} as User;

  users = users.map(user => {
    if (String(user.id) == userId) {
      updatedUser = {...user, ...updatedUserData}
      return updatedUser;
    }
    else {
      return user;
    }
  });

  saveUsers({...db, users});

  res.send({status: 'ok', data: updatedUser});
});


// Server Startup
app.listen(port);
console.log(`Server started at port ${port}...`);
