const persistence = require('./persistence')

/**
 * Authenticates a user with username and password
 * @param {string} username - The username to authenticate
 * @param {string} password - The password to verify
 * @returns {Promise<Object|null>} User object if authenticated, null otherwise
 */
async function authenticateUser(username, password) {
    const user = await persistence.findUserByUsername(username)
    
    if (user && user.password === password) {
        return user
    }
    
    return null
}

/**
 * Checks if a user owns a specific photo
 * @param {number} userId - ID of the user
 * @param {number} photoId - ID of the photo
 * @returns {Promise<boolean>} True if user owns the photo, false otherwise
 */
async function userOwnsPhoto(userId, photoId) {
    const photo = await persistence.findPhotoById(photoId)
    
    if (!photo) {
        return false
    }
    
    return photo.owner === userId
}

/**
 * Gets photo details with album names instead of IDs
 * @param {number} photoId - ID of the photo
 * @param {number} userId - ID of the requesting user
 * @returns {Promise<Object|null>} Photo object with album names or null if not found/no access
 */
async function getPhotoDetails(photoId, userId) {
    const photo = await persistence.findPhotoById(photoId)
    
    if (!photo) {
        return null
    }
    
    if (photo.owner !== userId) {
        return { error: 'access_denied' }
    }
    
    const albumNames = []
    for (let i = 0; i < photo.albums.length; i++) {
        const album = await persistence.findAlbumById(photo.albums[i])
        if (album) {
            albumNames.push(album.name)
        }
    }
    
    return {
        id: photo.id,
        filename: photo.filename,
        title: photo.title,
        date: photo.date,
        description: photo.description,
        albums: albumNames,
        tags: photo.tags
    }
}

/**
 * Updates photo details (title and description)
 * @param {number} photoId - ID of the photo to update
 * @param {number} userId - ID of the user making the update
 * @param {string} title - New title (or empty string to keep existing)
 * @param {string} description - New description (or empty string to keep existing)
 * @returns {Promise<Object>} Result object with success status and message
 */
async function updatePhotoDetails(photoId, userId, title, description) {
    const photo = await persistence.findPhotoById(photoId)
    
    if (!photo) {
        return { success: false, message: 'Photo not found.' }
    }
    
    if (photo.owner !== userId) {
        return { success: false, message: 'Access denied. You do not own this photo.' }
    }
    
    const updates = {}
    if (title !== '') {
        updates.title = title
    }
    if (description !== '') {
        updates.description = description
    }
    
    await persistence.updatePhoto(photoId, updates)
    
    return { success: true, message: 'Photo updated' }
}

/**
 * Gets photos in an album formatted for CSV output
 * @param {string} albumName - Name of the album
 * @param {number} userId - ID of the requesting user
 * @returns {Promise<Array|null>} Array of photo objects for CSV display or null if album not found
 */
async function getAlbumPhotoList(albumName, userId) {
    const album = await persistence.findAlbumByName(albumName)
    
    if (!album) {
        return null
    }
    
    const photos = await persistence.getPhotosByAlbum(album.id)
    
    const userPhotos = []
    for (let i = 0; i < photos.length; i++) {
        if (photos[i].owner === userId) {
            userPhotos.push({
                filename: photos[i].filename,
                resolution: photos[i].resolution,
                tags: photos[i].tags
            })
        }
    }
    
    return userPhotos
}

/**
 * Adds a tag to a photo
 * @param {number} photoId - ID of the photo
 * @param {number} userId - ID of the user adding the tag
 * @param {string} tag - Tag to add
 * @returns {Promise<Object>} Result object with success status and message
 */
async function addTagToPhoto(photoId, userId, tag) {
    const photo = await persistence.findPhotoById(photoId)
    
    if (!photo) {
        return { success: false, message: 'Photo not found.' }
    }
    
    if (photo.owner !== userId) {
        return { success: false, message: 'Access denied. You do not own this photo.' }
    }
    
    for (let i = 0; i < photo.tags.length; i++) {
        if (photo.tags[i] === tag) {
            return { success: false, message: 'Photo already has this tag.' }
        }
    }
    
    const newTags = photo.tags.slice()
    newTags.push(tag)
    
    await persistence.updatePhoto(photoId, { tags: newTags })
    
    return { success: true, message: 'Updated!' }
}

/**
 * Formats a date to a readable date string
 * @param {string|number} dateInput - ISO date string or Unix timestamp
 * @returns {string} Formatted date string
 */
function formatDate(dateInput) {
    const date = new Date(dateInput)
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]
    return months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear()
}

module.exports = {
    authenticateUser,
    userOwnsPhoto,
    getPhotoDetails,
    updatePhotoDetails,
    getAlbumPhotoList,
    addTagToPhoto,
    formatDate
}