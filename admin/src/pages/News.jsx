import { useState, useEffect } from "react"
import { storage, db } from "../firebaseConfig"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { collection, addDoc, onSnapshot, updateDoc, doc, deleteDoc } from "firebase/firestore"
import { FaPlus, FaTrash, FaEdit, FaTimes } from "react-icons/fa"
import styles from '../StyleSheetWeb/news.styles.js';

const AdminNews = () => {
  const [newsItems, setNewsItems] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [hovered, setHovered] = useState(null)

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingNews, setEditingNews] = useState(null)
  const [editTitle, setEditTitle] = useState("")
  const [editFile, setEditFile] = useState(null)
  const [addTitle, setAddTitle] = useState("")

  // Fetch news items from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "news"), (snapshot) => {
      setNewsItems(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    })
    return unsub
  }, [])

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0])
  }

  const handleAddClick = () => {
    setShowAddModal(true)
    setAddTitle("")
    setSelectedFile(null)
  }

  const handleUpload = async () => {
    if (!selectedFile || !addTitle.trim()) {
      alert("Please select a file and enter a title")
      return
    }

    setUploading(true)
    const storageRef = ref(storage, `news/${Date.now()}_${selectedFile.name}`)
    await uploadBytes(storageRef, selectedFile)
    const url = await getDownloadURL(storageRef)

    await addDoc(collection(db, "news"), {
      title: addTitle.trim(),
      url,
      createdAt: new Date(),
    })

    setUploading(false)
    setSelectedFile(null)
    setAddTitle("")
    setShowAddModal(false)
  }

  const handleDelete = async (id, imageUrl) => {
    if (window.confirm("Are you sure you want to delete this news item?")) {
      const storageRef = ref(storage, imageUrl)
      await deleteObject(storageRef)
      await deleteDoc(doc(db, "news", id))
    }
  }

  const handleEditClick = (news) => {
    setEditingNews(news)
    setEditTitle(news.title)
    setEditFile(null)
    setShowEditModal(true)
  }

  const handleEditSave = async () => {
    if (!editTitle.trim()) {
      alert("Please enter a title")
      return
    }

    setUploading(true)

    try {
      let newUrl = editingNews.url

      // If a new file is selected, upload it and delete the old one
      if (editFile) {
        // Delete old image
        await deleteObject(ref(storage, editingNews.url))

        // Upload new image
        const storageRef = ref(storage, `news/${Date.now()}_${editFile.name}`)
        await uploadBytes(storageRef, editFile)
        newUrl = await getDownloadURL(storageRef)
      }

      // Update document
      await updateDoc(doc(db, "news", editingNews.id), {
        title: editTitle.trim(),
        url: newUrl,
        updatedAt: new Date(),
      })

      setShowEditModal(false)
      setEditingNews(null)
      setEditTitle("")
      setEditFile(null)
    } catch (error) {
      console.error("Error updating news:", error)
      alert("Error updating news item")
    }

    setUploading(false)
  }

  const handleEditCancel = () => {
    setShowEditModal(false)
    setEditingNews(null)
    setEditTitle("")
    setEditFile(null)
  }

  const handleAddCancel = () => {
    setShowAddModal(false)
    setAddTitle("")
    setSelectedFile(null)
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.heading}>News</h1>
      </div>

      <div style={styles.contentGrid}>
        {newsItems.map((news) => (
          <div
            key={news.id}
            style={styles.card}
            onMouseEnter={() => setHovered(news.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <div style={styles.imageWrapper}>
              <img src={news.url || "/placeholder.svg"} alt={news.title} style={styles.image} />
              <div
                style={{
                  ...styles.overlay,
                  ...(hovered === news.id ? styles.overlayVisible : {}),
                }}
              >
                <button onClick={() => handleEditClick(news)} style={{ ...styles.overlayButton, ...styles.editButton }}>
                  <FaEdit /> Edit
                </button>
                <button
                  onClick={() => handleDelete(news.id, news.url)}
                  style={{ ...styles.overlayButton, ...styles.deleteButton }}
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
            <p style={styles.newsTitle}>{news.title}</p>
          </div>
        ))}

        <div
          style={{
            ...styles.addCard,
            ...(hovered === "add" ? styles.addCardHover : {}),
          }}
          onMouseEnter={() => setHovered("add")}
          onMouseLeave={() => setHovered(null)}
          onClick={handleAddClick}
        >
          <div style={styles.addIconWrapper}>
            <FaPlus size={24} />
          </div>
          <div>Add New News</div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Add New News</h2>
              <button onClick={handleAddCancel} style={styles.closeButton}>
                <FaTimes />
              </button>
            </div>
            <div style={styles.modalContent}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Title:</label>
                <input
                  type="text"
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  placeholder="Enter news title"
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Image:</label>
                <input type="file" onChange={handleFileChange} accept="image/*" style={styles.fileInput} />
              </div>
              {selectedFile && (
                <div style={styles.preview}>
                  <p>Selected: {selectedFile.name}</p>
                </div>
              )}
            </div>
            <div style={styles.modalFooter}>
              <button onClick={handleAddCancel} style={styles.cancelButton}>
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !selectedFile || !addTitle.trim()}
                style={styles.saveButton}
              >
                {uploading ? "Uploading..." : "Add News"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Edit News</h2>
              <button onClick={handleEditCancel} style={styles.closeButton}>
                <FaTimes />
              </button>
            </div>
            <div style={styles.modalContent}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Title:</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Enter news title"
                  style={styles.input}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Current Image:</label>
                <img
                  src={editingNews?.url || "/placeholder.svg"}
                  alt={editingNews?.title}
                  style={styles.currentImage}
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Replace Image (optional):</label>
                <input
                  type="file"
                  onChange={(e) => setEditFile(e.target.files[0])}
                  accept="image/*"
                  style={styles.fileInput}
                />
              </div>
              {editFile && (
                <div style={styles.preview}>
                  <p>New image selected: {editFile.name}</p>
                </div>
              )}
            </div>
            <div style={styles.modalFooter}>
              <button onClick={handleEditCancel} style={styles.cancelButton}>
                Cancel
              </button>
              <button onClick={handleEditSave} disabled={uploading || !editTitle.trim()} style={styles.saveButton}>
                {uploading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminNews;