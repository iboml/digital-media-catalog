// Persistence Layer - MongoDB Database Operations
const { MongoClient, ObjectId } = require('mongodb');

// MongoDB connection string 
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/';
const DATABASE_NAME = 'infs3201_fall2025';

let db = null;

/**
 * Connects to MongoDB and initializes the database connection
 * @returns {Promise<void>}
 */
async function connectDB() {
    if (db) {
        return; // Already connected
    }
    
    try {
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db(DATABASE_NAME);
        console.log('Connected to MongoDB successfully');
    } catch (error) {
        throw new Error('Error connecting to MongoDB: ' + error.message);
    }
}

/**
 * Gets all albums from the database
 * @returns {Promise<Array>} Array of album objects
 */
async function loadAlbums() {
    await connectDB();
    try {
        const albums = await db.collection('albums').find({}).toArray();
        return albums;
    } catch (error) {
        throw new Error('Error loading albums: ' + error.message);
    }
}

/**
 * Finds an album by its ID
 * @param {number} albumId - ID of the album to find
 * @returns {Promise<Object|null>} Album object or null if not found
 */
async function findAlbumById(albumId) {
    await connectDB();
    try {
        const album = await db.collection('albums').findOne({ id: albumId });
        return album;
    } catch (error) {
        throw new Error('Error finding album: ' + error.message);
    }
}

/**
 * Gets all photos that belong to a specific album
 * @param {number} albumId - ID of the album
 * @returns {Promise<Array>} Array of photos in the album
 */
async function getPhotosByAlbum(albumId) {
    await connectDB();
    try {
        const photos = await db.collection('photos').find({ albums: albumId }).toArray();
        return photos;
    } catch (error) {
        throw new Error('Error loading photos: ' + error.message);
    }
}

/**
 * Finds a photo by its ID
 * @param {number} photoId - ID of the photo to find
 * @returns {Promise<Object|null>} Photo object or null if not found
 */
async function findPhotoById(photoId) {
    await connectDB();
    try {
        const photo = await db.collection('photos').findOne({ id: photoId });
        return photo;
    } catch (error) {
        throw new Error('Error finding photo: ' + error.message);
    }
}

/**
 * Updates a photo in the database
 * @param {number} photoId - ID of the photo to update
 * @param {Object} updates - Object containing fields to update
 * @returns {Promise<boolean>} True if update was successful, false otherwise
 */
async function updatePhoto(photoId, updates) {
    await connectDB();
    try {
        const updateFields = {};
        
        if (updates.title !== undefined) {
            updateFields.title = updates.title;
        }
        if (updates.description !== undefined) {
            updateFields.description = updates.description;
        }
        if (updates.visibility !== undefined) {
            updateFields.visibility = updates.visibility;
        }
        
        // If no fields to update, consider it successful
        if (Object.keys(updateFields).length === 0) {
            return true;
        }
        
        const result = await db.collection('photos').updateOne(
            { id: photoId },
            { $set: updateFields }
        );
        
        // Success if the photo was found (even if values didn't change)
        return result.matchedCount > 0;
    } catch (error) {
        throw new Error('Error updating photo: ' + error.message);
    }
}

// ==================== USER OPERATIONS ====================

/**
 * Creates a new user in the database
 * @param {Object} userData - User data {name, email, password}
 * @returns {Promise<Object>} Created user object with id
 */
async function createUser(userData) {
    await connectDB();
    try {
        // Get the next user ID
        const lastUser = await db.collection('users').find({}).sort({ id: -1 }).limit(1).toArray();
        const nextId = lastUser.length > 0 ? lastUser[0].id + 1 : 1;
        
        const user = {
            id: nextId,
            name: userData.name,
            email: userData.email,
            password: userData.password,
            createdAt: new Date()
        };
        
        await db.collection('users').insertOne(user);
        return user;
    } catch (error) {
        throw new Error('Error creating user: ' + error.message);
    }
}

/**
 * Finds a user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User object or null if not found
 */
async function findUserByEmail(email) {
    await connectDB();
    try {
        const user = await db.collection('users').findOne({ email: email });
        return user;
    } catch (error) {
        throw new Error('Error finding user: ' + error.message);
    }
}

/**
 * Finds a user by ID
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} User object or null if not found
 */
async function findUserById(userId) {
    await connectDB();
    try {
        const user = await db.collection('users').findOne({ id: userId });
        return user;
    } catch (error) {
        throw new Error('Error finding user: ' + error.message);
    }
}

// ==================== COMMENT OPERATIONS ====================

/**
 * Creates a new comment on a photo
 * @param {Object} commentData - Comment data {photoId, userId, username, text}
 * @returns {Promise<Object>} Created comment object with id
 */
async function createComment(commentData) {
    await connectDB();
    try {
        // Get the next comment ID
        const lastComment = await db.collection('comments').find({}).sort({ id: -1 }).limit(1).toArray();
        const nextId = lastComment.length > 0 ? lastComment[0].id + 1 : 1;
        
        const comment = {
            id: nextId,
            photoId: commentData.photoId,
            userId: commentData.userId,
            username: commentData.username,
            text: commentData.text,
            createdAt: new Date()
        };
        
        await db.collection('comments').insertOne(comment);
        return comment;
    } catch (error) {
        throw new Error('Error creating comment: ' + error.message);
    }
}

/**
 * Gets all comments for a specific photo
 * @param {number} photoId - ID of the photo
 * @returns {Promise<Array>} Array of comments
 */
async function getCommentsByPhotoId(photoId) {
    await connectDB();
    try {
        const comments = await db.collection('comments').find({ photoId: photoId }).sort({ createdAt: 1 }).toArray();
        return comments;
    } catch (error) {
        throw new Error('Error loading comments: ' + error.message);
    }
}

// ==================== PHOTO OPERATIONS ====================

/**
 * Creates a new photo in the database
 * @param {Object} photoData - Photo data {filename, title, description, tags, albums, visibility, owner, date}
 * @returns {Promise<Object>} Created photo object with id
 */
async function createPhoto(photoData) {
    await connectDB();
    try {
        // Get the next photo ID
        const lastPhoto = await db.collection('photos').find({}).sort({ id: -1 }).limit(1).toArray();
        const nextId = lastPhoto.length > 0 ? lastPhoto[0].id + 1 : 1;
        
        const photo = {
            id: nextId,
            filename: photoData.filename,
            title: photoData.title || '',
            description: photoData.description || '',
            tags: photoData.tags || [],
            albums: photoData.albums || [],
            visibility: photoData.visibility || 'private',
            owner: photoData.owner,
            date: photoData.date || new Date().toISOString()
        };
        
        await db.collection('photos').insertOne(photo);
        return photo;
    } catch (error) {
        throw new Error('Error creating photo: ' + error.message);
    }
}

/**
 * Searches photos by title, description, and tags
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of matching photos
 */
async function searchPhotos(query) {
    await connectDB();
    try {
        // Convert query to lowercase for case-insensitive search
        const searchTerm = query.toLowerCase();
        
        // Get all photos and filter manually (avoiding .filter() method)
        const allPhotos = await db.collection('photos').find({}).toArray();
        const results = [];
        
        for (let i = 0; i < allPhotos.length; i++) {
            const photo = allPhotos[i];
            let matches = false;
            
            // Check title
            if (photo.title && photo.title.toLowerCase().indexOf(searchTerm) !== -1) {
                matches = true;
            }
            
            // Check description
            if (photo.description && photo.description.toLowerCase().indexOf(searchTerm) !== -1) {
                matches = true;
            }
            
            // Check tags
            if (photo.tags && photo.tags.length > 0) {
                for (let j = 0; j < photo.tags.length; j++) {
                    if (photo.tags[j].toLowerCase().indexOf(searchTerm) !== -1) {
                        matches = true;
                        break;
                    }
                }
            }
            
            if (matches) {
                results.push(photo);
            }
        }
        
        return results;
    } catch (error) {
        throw new Error('Error searching photos: ' + error.message);
    }
}

module.exports = {
    connectDB,
    loadAlbums,
    findAlbumById,
    getPhotosByAlbum,
    findPhotoById,
    updatePhoto,
    createUser,
    findUserByEmail,
    findUserById,
    createComment,
    getCommentsByPhotoId,
    createPhoto,
    searchPhotos
};
