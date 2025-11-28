import { useState, useEffect } from "react"
import { Send, Trash2, Edit, Plus, X, Loader, Bell, Users, Calendar } from "lucide-react"
import { db } from "../firebaseConfig"
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy } from "firebase/firestore"

// --- Reusable UI Components ---

const Button = ({ children, variant = "default", size = "default", onClick, disabled = false, className = "", ...props }) => {
  let baseClasses = "flex items-center gap-2 p-3 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap"
  let variantClasses = ""

  switch (variant) {
    case "destructive":
      variantClasses = "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
      break
    case "outline":
      variantClasses = "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
      break
    case "success":
      variantClasses = "bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
      break
    default:
      variantClasses = "bg-[#13274f] text-white hover:bg-[#0f1f41] disabled:opacity-50"
  }

  if (size === "sm") {
    baseClasses = baseClasses.replace("p-3", "p-2").replace("text-sm", "text-xs")
  }

  return (
    <button className={`${baseClasses} ${variantClasses} ${className}`} onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  )
}

const Input = ({ value, onChange, placeholder, type = "text", className = "", ...props }) => {
  const inputClasses = "w-full p-2.5 border border-gray-300 rounded-md text-sm outline-none transition duration-200 focus:border-[#13274f] box-border"
  return <input type={type} value={value} onChange={onChange} placeholder={placeholder} className={`${inputClasses} ${className}`} {...props} />
}

const TextArea = ({ value, onChange, placeholder, className = "", rows = 4, ...props }) => {
  const textareaClasses = "w-full p-2.5 border border-gray-300 rounded-md text-sm outline-none transition duration-200 focus:border-[#13274f] box-border resize-vertical"
  return <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} className={`${textareaClasses} ${className}`} {...props} />
}

const Label = ({ children, htmlFor, className = "" }) => (
  <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 mb-1.5 ${className}`}>
    {children}
  </label>
)

const Select = ({ value, onChange, options, className = "" }) => {
  return (
    <select value={value} onChange={onChange} className={`w-full p-2.5 border border-gray-300 rounded-md text-sm outline-none transition duration-200 focus:border-[#13274f] box-border ${className}`}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

const Dialog = ({ open, children, onClose }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

const DialogHeader = ({ children, onClose }) => (
  <div className="flex justify-between items-center px-6 pt-6 border-b border-gray-200">
    <h3 className="text-xl font-semibold text-[#13274f] m-0 pb-3">{children}</h3>
    <X className="w-6 h-6 text-gray-400 cursor-pointer hover:text-gray-600" onClick={onClose} />
  </div>
)

const DialogFooter = ({ children }) => <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6 px-6 pb-6">{children}</div>

// Notification types with icons
const NOTIFICATION_TYPES = [
  { value: "news_added", label: "📰 News Added", color: "#4CAF50" },
  { value: "news_updated", label: "📝 News Updated", color: "#2196F3" },
  { value: "event_added", label: "📅 Event Added", color: "#9C27B0" },
  { value: "event_updated", label: "📝 Event Updated", color: "#2196F3" },
  { value: "announcement_added", label: "📢 Announcement", color: "#FF9800" },
  { value: "gallery_added", label: "🖼️ Gallery Added", color: "#00BCD4" },
  { value: "custom", label: "🔔 Custom", color: "#13274f" },
]

const NOTIFICATION_CATEGORIES = [
  { value: "general", label: "General" },
  { value: "news", label: "News" },
  { value: "events", label: "Events" },
  { value: "announcements", label: "Announcements" },
  { value: "gallery", label: "Gallery" },
  { value: "important_dates", label: "Important Dates" },
  { value: "convocation", label: "Convocation" },
  { value: "attire", label: "Attire Collection" },
]

// --- Main Component ---
const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingNotification, setEditingNotification] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    type: "custom",
    category: "general",
    targetFaculty: "all", // ✅ NEW: Faculty filter
  })

  // ✅ NEW: Faculty list state
  const [faculties, setFaculties] = useState([])
  const [loadingFaculties, setLoadingFaculties] = useState(true)
  const [studentCounts, setStudentCounts] = useState({})

  const NOTIFICATIONS_COLLECTION = collection(db, "notifications")
  const STUDENTS_COLLECTION = collection(db, "students")

  // ✅ NEW: Fetch faculties and student counts
  const fetchFacultiesAndCounts = async () => {
    setLoadingFaculties(true)
    try {
      const studentsSnapshot = await getDocs(STUDENTS_COLLECTION)
      const facultyMap = {}
      
      studentsSnapshot.forEach((doc) => {
        const data = doc.data()
        const faculty = data.faculty || "Unknown Faculty"
        
        if (facultyMap[faculty]) {
          facultyMap[faculty]++
        } else {
          facultyMap[faculty] = 1
        }
      })

      // Create faculties list sorted alphabetically
      const facultiesList = Object.keys(facultyMap).sort()
      setFaculties(facultiesList)
      setStudentCounts(facultyMap)
    } catch (error) {
      console.error("Error fetching faculties:", error)
    } finally {
      setLoadingFaculties(false)
    }
  }

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const q = query(NOTIFICATIONS_COLLECTION, orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)
      const notificationsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setNotifications(notificationsList)
    } catch (error) {
      console.error("Error fetching notifications:", error)
      alert("Failed to fetch notifications")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    fetchFacultiesAndCounts() // ✅ Fetch faculties on mount
  }, [])

  // Handle form changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      body: "",
      type: "custom",
      category: "general",
      targetFaculty: "all", // ✅ Reset faculty filter
    })
    setEditingNotification(null)
  }

  // Open modal for new notification
  const handleNewNotification = () => {
    resetForm()
    setShowModal(true)
  }

  // Open modal for editing
  const handleEditNotification = (notification) => {
    setEditingNotification(notification)
    setFormData({
      title: notification.title,
      body: notification.body,
      type: notification.type || "custom",
      category: notification.metadata?.category || "general",
      targetFaculty: notification.targetFaculty || "all", // ✅ Load faculty filter
    })
    setShowModal(true)
  }

  // Save notification (create or update)
  const handleSaveNotification = async () => {
    if (!formData.title.trim() || !formData.body.trim()) {
      alert("Please fill in all required fields")
      return
    }

    setIsSaving(true)
    try {
      const notificationData = {
        title: formData.title.trim(),
        body: formData.body.trim(),
        type: formData.type,
        metadata: {
          category: formData.category,
        },
        targetFaculty: formData.targetFaculty, // ✅ Save target faculty
        createdAt: Date.now(),
      }

      if (editingNotification) {
        // Update existing notification
        const notifRef = doc(db, "notifications", editingNotification.id)
        await updateDoc(notifRef, notificationData)
        alert("Notification updated successfully!")
      } else {
        // Create new notification
        await addDoc(NOTIFICATIONS_COLLECTION, notificationData)
        
        // Display success message with target info
        const targetInfo = formData.targetFaculty === "all" 
          ? "all students" 
          : `students from ${formData.targetFaculty} (${studentCounts[formData.targetFaculty] || 0} students)`
        alert(`Notification sent successfully to ${targetInfo}!`)
      }

      setShowModal(false)
      resetForm()
      fetchNotifications()
    } catch (error) {
      console.error("Error saving notification:", error)
      alert("Failed to save notification")
    } finally {
      setIsSaving(false)
    }
  }

  // Delete notification
  const handleDeleteNotification = async (notificationId) => {
    if (!window.confirm("Are you sure you want to delete this notification?")) return

    try {
      await deleteDoc(doc(db, "notifications", notificationId))
      alert("Notification deleted successfully!")
      fetchNotifications()
    } catch (error) {
      console.error("Error deleting notification:", error)
      alert("Failed to delete notification")
    }
  }

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return ""
    const date = new Date(parseInt(timestamp))
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Get type color
  const getTypeColor = (type) => {
    const typeObj = NOTIFICATION_TYPES.find((t) => t.value === type)
    return typeObj?.color || "#13274f"
  }

  // ✅ Get target recipients count
  const getTargetRecipientsCount = () => {
    if (formData.targetFaculty === "all") {
      return Object.values(studentCounts).reduce((sum, count) => sum + count, 0)
    }
    return studentCounts[formData.targetFaculty] || 0
  }

  return (
    <div className="min-h-screen bg-gray-50 p-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#13274f]">Notification Management</h1>
        </div>
        <Button onClick={handleNewNotification}>
          <Plus className="w-5 h-5" />
          New Notification
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Sent</p>
              <p className="text-2xl font-bold text-gray-800">{notifications.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Active Users</p>
              <p className="text-2xl font-bold text-gray-800">All</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">This Month</p>
              <p className="text-2xl font-bold text-gray-800">
                {notifications.filter((n) => {
                  const date = new Date(parseInt(n.createdAt))
                  const now = new Date()
                  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Sent Notifications</h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader className="w-8 h-8 text-gray-500 animate-spin mb-3" />
            <p className="text-gray-500">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No notifications sent yet</p>
            <p className="text-gray-400 text-sm mt-2">Click "New Notification" to send your first notification</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div key={notification.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: getTypeColor(notification.type) + "20" }}>
                        <Bell className="w-5 h-5" style={{ color: getTypeColor(notification.type) }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 text-lg">{notification.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {NOTIFICATION_TYPES.find((t) => t.value === notification.type)?.label || "Custom"}
                          </span>
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                            {NOTIFICATION_CATEGORIES.find((c) => c.value === notification.metadata?.category)?.label || "General"}
                          </span>
                          {/* ✅ Show target faculty badge */}
                          <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">
                            {notification.targetFaculty === "all" ? "📢 All Students" : `🎓 ${notification.targetFaculty}`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-2 ml-13">{notification.body}</p>
                    <p className="text-xs text-gray-400 ml-13">{formatDate(notification.createdAt)}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditNotification(notification)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteNotification(notification.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onClose={() => setShowModal(false)}>
        <DialogHeader onClose={() => setShowModal(false)}>
          {editingNotification ? "Edit Notification" : "Send New Notification"}
        </DialogHeader>

        <div className="p-6 space-y-5">
          <div>
            <Label htmlFor="title">Notification Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Enter notification title"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">{formData.title.length}/100 characters</p>
          </div>

          <div>
            <Label htmlFor="body">Notification Message *</Label>
            <TextArea
              id="body"
              value={formData.body}
              onChange={(e) => handleInputChange("body", e.target.value)}
              placeholder="Enter notification message"
              rows={5}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{formData.body.length}/500 characters</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Notification Type</Label>
              <Select
                id="type"
                value={formData.type}
                onChange={(e) => handleInputChange("type", e.target.value)}
                options={NOTIFICATION_TYPES.map((t) => ({ value: t.value, label: t.label }))}
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                options={NOTIFICATION_CATEGORIES}
              />
            </div>
          </div>

          {/* ✅ NEW: Target Faculty Selection */}
          <div>
            <Label htmlFor="targetFaculty">Send To</Label>
            {loadingFaculties ? (
              <div className="flex items-center gap-2 p-2.5 border border-gray-300 rounded-md text-sm">
                <Loader className="w-4 h-4 animate-spin" />
                <span className="text-gray-500">Loading faculties...</span>
              </div>
            ) : (
              <>
                <Select
                  id="targetFaculty"
                  value={formData.targetFaculty}
                  onChange={(e) => handleInputChange("targetFaculty", e.target.value)}
                  options={[
                    { value: "all", label: `📢 All Students (${Object.values(studentCounts).reduce((sum, count) => sum + count, 0)} students)` },
                    ...faculties.map((faculty) => ({
                      value: faculty,
                      label: `🎓 ${faculty} (${studentCounts[faculty]} students)`,
                    })),
                  ]}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This notification will be sent to {getTargetRecipientsCount()} student{getTargetRecipientsCount() !== 1 ? "s" : ""}
                </p>
              </>
            )}
          </div>

          {/* Preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-500 mb-3">PREVIEW</p>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: getTypeColor(formData.type) + "20" }}>
                  <Bell className="w-5 h-5" style={{ color: getTypeColor(formData.type) }} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{formData.title || "Notification Title"}</h4>
                  <p className="text-sm text-gray-600 mt-1">{formData.body || "Notification message will appear here..."}</p>
                  <p className="text-xs text-gray-400 mt-2">Just now</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveNotification} disabled={isSaving} variant="success">
            {isSaving ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {editingNotification ? "Update" : "Send"} Notification
              </>
            )}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}

export default AdminNotifications