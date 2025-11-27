// notificationService.js
import { collection, addDoc } from "firebase/firestore"
import { db } from "../firebaseConfig"

/**
 * Centralized Notification Service
 * Use this to create notifications from any admin component
 */

// Notification types for better organization
export const NOTIFICATION_TYPES = {
  NEWS_ADDED: "news_added",
  NEWS_UPDATED: "news_updated",
  NEWS_DELETED: "news_deleted",
  EVENT_ADDED: "event_added",
  EVENT_UPDATED: "event_updated",
  EVENT_DELETED: "event_deleted",
  ANNOUNCEMENT_ADDED: "announcement_added",
  ANNOUNCEMENT_UPDATED: "announcement_updated",
  ANNOUNCEMENT_DELETED: "announcement_deleted",
  GALLERY_ADDED: "gallery_added",
  GALLERY_UPDATED: "gallery_updated",
  GALLERY_DELETED: "gallery_deleted",
  // Add more types as needed for different pages
}

// Icons for different notification types (for mobile app display)
export const NOTIFICATION_ICONS = {
  news_added: "newspaper",
  news_updated: "create",
  news_deleted: "trash",
  event_added: "calendar",
  event_updated: "create",
  event_deleted: "trash",
  announcement_added: "megaphone",
  announcement_updated: "create",
  announcement_deleted: "trash",
  gallery_added: "images",
  gallery_updated: "create",
  gallery_deleted: "trash",
}

/**
 * Create a notification in Firestore
 * @param {string} type - Type of notification (use NOTIFICATION_TYPES)
 * @param {string} title - Notification title
 * @param {string} body - Notification body/description
 * @param {object} metadata - Additional data (optional)
 * @returns {Promise<void>}
 */
export const createNotification = async (type, title, body, metadata = {}) => {
  try {
    await addDoc(collection(db, "notifications"), {
      type: type,
      title: title,
      body: body,
      metadata: metadata,
      createdAt: Date.now(),
      read: false,
    })
    console.log(`✅ Notification created: ${type}`)
  } catch (error) {
    console.error("❌ Error creating notification:", error)
    throw error
  }
}

// NEWS NOTIFICATIONS
export const notifyNewsAdded = async (newsTitle) => {
  await createNotification(
    NOTIFICATION_TYPES.NEWS_ADDED,
    "New News Added",
    `${newsTitle}`,
    { category: "news" }
  )
}

export const notifyNewsUpdated = async (newsTitle) => {
  await createNotification(
    NOTIFICATION_TYPES.NEWS_UPDATED,
    "News Updated",
    `"${newsTitle}" has been updated`,
    { category: "news" }
  )
}

export const notifyNewsDeleted = async () => {
  await createNotification(
    NOTIFICATION_TYPES.NEWS_DELETED,
    "News Removed",
    "A news item has been removed",
    { category: "news" }
  )
}

// IMPORTANT DATES NOTIFICATIONS
export const notifyImportantDateAdded = async (title, date) => {
  await createNotification(
    NOTIFICATION_TYPES.EVENT_ADDED,
    "New Important Date Added",
    `${title} - ${new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
    { category: "important_dates" }
  )
}

export const notifyImportantDateUpdated = async (title) => {
  await createNotification(
    NOTIFICATION_TYPES.EVENT_UPDATED,
    "Important Date Updated",
    `"${title}" has been updated`,
    { category: "important_dates" }
  )
}

export const notifyImportantDateDeleted = async () => {
  await createNotification(
    NOTIFICATION_TYPES.EVENT_DELETED,
    "Important Date Removed",
    "An important date has been removed",
    { category: "important_dates" }
  )
}

// CONVOCATION SCHEDULE NOTIFICATIONS
export const notifyConvocationScheduleAdded = async (faculty, date, timeSlot) => {
  await createNotification(
    NOTIFICATION_TYPES.EVENT_ADDED,
    "Convocation Ceremony Scheduled",
    `${faculty} - ${new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${timeSlot}`,
    { category: "convocation" }
  )
}

export const notifyConvocationScheduleUpdated = async (faculty) => {
  await createNotification(
    NOTIFICATION_TYPES.EVENT_UPDATED,
    "Convocation Schedule Updated",
    `${faculty} ceremony schedule has been updated`,
    { category: "convocation" }
  )
}

export const notifyConvocationScheduleDeleted = async () => {
  await createNotification(
    NOTIFICATION_TYPES.EVENT_DELETED,
    "Convocation Schedule Removed",
    "A convocation ceremony schedule has been removed",
    { category: "convocation" }
  )
}

// ATTIRE COLLECTION SCHEDULE NOTIFICATIONS
export const notifyAttireScheduleAdded = async (faculty, date, timeSlot) => {
  await createNotification(
    NOTIFICATION_TYPES.EVENT_ADDED,
    "Attire Collection Scheduled",
    `${faculty} - ${new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${timeSlot}`,
    { category: "attire" }
  )
}

export const notifyAttireScheduleUpdated = async (faculty) => {
  await createNotification(
    NOTIFICATION_TYPES.EVENT_UPDATED,
    "Attire Collection Updated",
    `${faculty} collection schedule has been updated`,
    { category: "attire" }
  )
}

export const notifyAttireScheduleDeleted = async () => {
  await createNotification(
    NOTIFICATION_TYPES.EVENT_DELETED,
    "Attire Collection Removed",
    "An attire collection schedule has been removed",
    { category: "attire" }
  )
}