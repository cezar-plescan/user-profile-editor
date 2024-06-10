import express from 'express';
import fs from 'fs';
import cors from 'cors';
import multer from 'multer';

// Interface for the database schema
interface DbSchema {
  users: User[]
}

// Interface for a user object
interface User {
  id: number;
  name: string;
  email: string;
  address: string;
  avatar?: string;
}

const app = express();
const port = 3000;
const dataFilePath = 'backend/db.json'; // File to store user data

// Multer configuration for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Store uploaded images in the 'backend/images' directory
    cb(null, 'backend/images/');
  },
  filename: function (req, file, cb) {
    // Rename uploaded files to include a timestamp to avoid name collisions
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Serve static files from the 'backend/images' directory
app.use('/images', express.static('backend/images'))

// Configure CORS to allow requests from any origin
const corsOptions: cors.CorsOptions = {
  origin: '*'
}
app.use(cors(corsOptions));

// Parse JSON request bodies
app.use(express.json())

// Helper function to load user data from the db.json file
function loadDb(): DbSchema {
  return JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
}

// Helper function to save user data to the db.json file
function saveUsers(db: DbSchema) {
  fs.writeFileSync(dataFilePath, JSON.stringify(db, null, 2));
}

/**
 * Helper function to generate the full URL for an avatar image.
 * @param req The Express request object.
 * @param avatarFilename The filename of the avatar image.
 * @returns The full URL for the avatar image, or an empty string if no filename is provided.
 */
function getAvatarUrl(req: express.Request, avatarFilename: string | undefined): string {
  return avatarFilename
    // Construct the full URL using the request protocol, host, and image path
    ? `${req.protocol}://${req.get('host')}/images/${avatarFilename}`
    : '';
}

/**
 * Helper function to build a user data object with the full avatar URL.
 * @param req The Express request object.
 * @param user The user object to build the response data for.
 * @returns A new user object with the `avatarUrl` property added.
 */
function buildUserDataResponse(req: express.Request, user: User): User {
  const avatar = getAvatarUrl(req, user.avatar);

  // Create a new object with the avatar URL included
  return { ...user, avatar };
}

// API endpoint to get all users
app.get('/users', (req, res) => {
  const users = loadDb();

  res.json({
    status: 'ok',
    data: users
  });
});

// API endpoint to get a specific user by ID
app.get('/users/:id', (req, res) => {
  const users = loadDb().users;
  const userId = String(req.params['id']);

  const user = users.find(user => String(user.id) == userId);

  if (!user) {
    // User not found
    res.status(404)
      .send({
      message: 'User ID not found',
    });
  }
  else {
    // Build the response data with the full avatar URL
    res.json({
      status: 'ok',
      data: buildUserDataResponse(req, user)
    });
  }
});

// API endpoint to update a user by ID
app.put('/users/:id', upload.single('avatar'), (req, res) => {
  const userId = String(req.params['id']);
  const db = loadDb();
  let users = db.users;

  const updatedUserData = {...req.body} as User;
  const existingUser = users.find(user => String(user.id) == userId);

  // simulate a 500 error (for testing purposes)
  if (updatedUserData.name === 'error') {
    res.status(500).send();

    return;
  }

  // Check for valid user ID and existing user
  if (!userId || !existingUser) {
    res.status(404).send({
      message: 'User ID is missing or invalid',
    });

    return;
  }

  // Check for duplicate usernames
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

  // If a new avatar file was uploaded, update the avatar filename
  if (req.file?.filename) {
    updatedUserData.avatar = req.file.filename;
  }
  else {
    // Otherwise, retain the existing avatar filename
    updatedUserData.avatar = existingUser.avatar;
  }

  let updatedUser: User = {} as User;

  // Update the user in the users array
  users = users.map(user => {
    if (String(user.id) == userId) {
      updatedUser = {...user, ...updatedUserData}
      return updatedUser;
    }
    else {
      return user;
    }
  });

  // Save the updated user data to the file
  saveUsers({...db, users});

  // Send the response with the updated user data and avatar URL
  res.send({
    status: 'ok',
    data: buildUserDataResponse(req, updatedUserData)
  });
});

// Start the server
app.listen(port);
console.log(`Server started at port ${port}...`);
