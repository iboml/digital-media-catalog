// Persistence Layer - MongoDB Database Operations
const { MongoClient, ObjectId } = require('mongodb');

// MongoDB connection string - REPLACE with your actual connection string
const MONGODB_URI = 'mongodb+srv://webstudent:UDSTstudent@cluster0.yrtvuxn.mongodb.net/';
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

module.exports = {
    connectDB,
    loadAlbums,
    findAlbumById,
    getPhotosByAlbum,
    findPhotoById,
    updatePhoto
};

