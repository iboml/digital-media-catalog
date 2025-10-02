const fs = require('fs/promises')

/**
 * Loads photos data from the JSON file
 * @returns {Promise<Array>} Array of photo objects
 */
async function loadPhotos() {
    try {
        const data = await fs.readFile('photos.json', 'utf8')
        return JSON.parse(data)
    } catch (error) {
        throw new Error('Error loading photos: ' + error.message)
    }
}

/**
 * Loads albums data from the JSON file
 * @returns {Promise<Array>} Array of album objects
 */
async function loadAlbums() {
    try {
        const data = await fs.readFile('albums.json', 'utf8')
        return JSON.parse(data)
    } catch (error) {
        throw new Error('Error loading albums: ' + error.message)
    }
}

/**
 * Loads users data from the JSON file
 * @returns {Promise<Array>} Array of user objects
 */
async function loadUsers() {
    try {
        const data = await fs.readFile('users.json', 'utf8')
        return JSON.parse(data)
    } catch (error) {
        throw new Error('Error loading users: ' + error.message)
    }
}

/**
 * Saves photos data to the JSON file
 * @param {Array} photos - Array of photo objects to save
 * @returns {Promise<void>}
 */
async function savePhotos(photos) {
    try {
        await fs.writeFile('photos.json', JSON.stringify(photos, null, 2))
    } catch (error) {
        throw new Error('Error saving photos: ' + error.message)
    }
}

/**
 * Finds a photo by its ID
 * @param {number} photoId - ID of the photo to find
 * @returns {Promise<Object|null>} Photo object or null if not found
 */
async function findPhotoById(photoId) {
    const photos = await loadPhotos()
    for (let i = 0; i < photos.length; i++) {
        if (photos[i].id === photoId) {
            return photos[i]
        }
    }
    return null
}

/**
 * Finds an album by its ID
 * @param {number} albumId - ID of the album to find
 * @returns {Promise<Object|null>} Album object or null if not found
 */
async function findAlbumById(albumId) {
    const albums = await loadAlbums()
    for (let i = 0; i < albums.length; i++) {
        if (albums[i].id === albumId) {
            return albums[i]
        }
    }
    return null
}

/**
 * Finds an album by name (case insensitive)
 * @param {string} albumName - Name of the album to find
 * @returns {Promise<Object|null>} Album object or null if not found
 */
async function findAlbumByName(albumName) {
    const albums = await loadAlbums()
    const lowerCaseName = albumName.toLowerCase()
    for (let i = 0; i < albums.length; i++) {
        if (albums[i].name.toLowerCase() === lowerCaseName) {
            return albums[i]
        }
    }
    return null
}

/**
 * Finds a user by username
 * @param {string} username - Username to search for
 * @returns {Promise<Object|null>} User object or null if not found
 */
async function findUserByUsername(username) {
    const users = await loadUsers()
    for (let i = 0; i < users.length; i++) {
        if (users[i].username === username) {
            return users[i]
        }
    }
    return null
}

/**
 * Gets all photos that belong to a specific album
 * @param {number} albumId - ID of the album
 * @returns {Promise<Array>} Array of photos in the album
 */
async function getPhotosByAlbum(albumId) {
    const photos = await loadPhotos()
    const albumPhotos = []
    for (let i = 0; i < photos.length; i++) {
        for (let j = 0; j < photos[i].albums.length; j++) {
            if (photos[i].albums[j] === albumId) {
                albumPhotos.push(photos[i])
                break
            }
        }
    }
    return albumPhotos
}

/**
 * Updates a photo in the database
 * @param {number} photoId - ID of the photo to update
 * @param {Object} updates - Object containing fields to update
 * @returns {Promise<boolean>} True if update was successful, false otherwise
 */
async function updatePhoto(photoId, updates) {
    const photos = await loadPhotos()
    let found = false
    
    for (let i = 0; i < photos.length; i++) {
        if (photos[i].id === photoId) {
            if (updates.title !== undefined) {
                photos[i].title = updates.title
            }
            if (updates.description !== undefined) {
                photos[i].description = updates.description
            }
            if (updates.tags !== undefined) {
                photos[i].tags = updates.tags
            }
            found = true
            break
        }
    }
    
    if (found) {
        await savePhotos(photos)
    }
    
    return found
}

module.exports = {
    loadPhotos,
    loadAlbums,
    loadUsers,
    savePhotos,
    findPhotoById,
    findAlbumById,
    findAlbumByName,
    findUserByUsername,
    getPhotosByAlbum,
    updatePhoto
}