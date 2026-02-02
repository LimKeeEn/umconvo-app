import { useState, useEffect } from "react"
import { storage, db } from "../firebaseConfig"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { collection, addDoc, onSnapshot, updateDoc, doc, deleteDoc } from "firebase/firestore"
import { FaPlus, FaTrash, FaEdit, FaTimes } from "react-icons/fa"
import { notifyNewsAdded, notifyNewsUpdated, notifyNewsDeleted } from "../services/notificationService"
import { Mail, Settings, X, ChevronLeft, ChevronRight } from "lucide-react"

const AdminNews = () => {
  const [newsItems, setNewsItems] = useState([])
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [hovered, setHovered] = useState(null)

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingNews, setEditingNews] = useState(null)
  const [editTitle, setEditTitle] = useState("")
  const [editInfo, setEditInfo] = useState("")
  const [editFiles, setEditFiles] = useState([])
  const [addTitle, setAddTitle] = useState("")
  const [addInfo, setAddInfo] = useState("")

  // Image carousel state
  const [currentImageIndex, setCurrentImageIndex] = useState({})

  // Fetch news items from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "news"), (snapshot) => {
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      setNewsItems(items)
      
      // Initialize carousel indices
      const indices = {}
      items.forEach(item => {
        indices[item.id] = 0
      })
      setCurrentImageIndex(indices)
    })
    return unsub
  }, [])

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    setSelectedFiles(files)
  }

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleAddClick = () => {
    setShowAddModal(true)
    setAddTitle("")
    setAddInfo("")
    setSelectedFiles([])
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !addTitle.trim()) {
      alert("Please select at least one image and enter a title")
      return
    }

    setUploading(true)
    try {
      const imageUrls = []
      
      // Upload all selected images
      for (const file of selectedFiles) {
        const storageRef = ref(storage, `news/${Date.now()}_${file.name}`)
        await uploadBytes(storageRef, file)
        const url = await getDownloadURL(storageRef)
        imageUrls.push(url)
      }

      await addDoc(collection(db, "news"), {
        title: addTitle.trim(),
        info: addInfo.trim(),
        images: imageUrls, // Store array of image URLs
        createdAt: Date.now(),
      })

      await notifyNewsAdded(addTitle.trim())

      setUploading(false)
      setSelectedFiles([])
      setAddTitle("")
      setAddInfo("")
      setShowAddModal(false)
      
      alert("News added successfully!")
    } catch (error) {
      console.error("Error uploading news:", error)
      alert("Error uploading news")
      setUploading(false)
    }
  }

  const handleDelete = async (id, images) => {
    if (window.confirm("Are you sure you want to delete this news item?")) {
      try {
        // Delete all images from storage
        const imageUrls = Array.isArray(images) ? images : [images]
        for (const imageUrl of imageUrls) {
          if (imageUrl) {
            const storageRef = ref(storage, imageUrl)
            await deleteObject(storageRef)
          }
        }
        
        await deleteDoc(doc(db, "news", id))
        await notifyNewsDeleted()
      } catch (error) {
        console.error("Error deleting news:", error)
        alert("Error deleting news")
      }
    }
  }

  const handleEditClick = (news) => {
    setEditingNews(news)
    setEditTitle(news.title)
    setEditInfo(news.info || "")
    setEditFiles([])
    setShowEditModal(true)
  }

  const handleEditSave = async () => {
    if (!editTitle.trim()) {
      alert("Please enter a title")
      return
    }

    setUploading(true)

    try {
      let imageUrls = editingNews.images || [editingNews.url] // Support old single image format

      // If new files are selected, upload them
      if (editFiles.length > 0) {
        // Delete old images
        for (const url of imageUrls) {
          if (url) {
            await deleteObject(ref(storage, url))
          }
        }

        // Upload new images
        imageUrls = []
        for (const file of editFiles) {
          const storageRef = ref(storage, `news/${Date.now()}_${file.name}`)
          await uploadBytes(storageRef, file)
          const url = await getDownloadURL(storageRef)
          imageUrls.push(url)
        }
      }

      // Update document
      await updateDoc(doc(db, "news", editingNews.id), {
        title: editTitle.trim(),
        info: editInfo.trim(),
        images: imageUrls,
        updatedAt: Date.now(),
      })

      await notifyNewsUpdated(editTitle.trim())

      setShowEditModal(false)
      setEditingNews(null)
      setEditTitle("")
      setEditInfo("")
      setEditFiles([])
      
      alert("News updated successfully!")
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
    setEditInfo("")
    setEditFiles([])
  }

  const handleAddCancel = () => {
    setShowAddModal(false)
    setAddTitle("")
    setAddInfo("")
    setSelectedFiles([])
  }

  const removeEditFile = (index) => {
    setEditFiles(prev => prev.filter((_, i) => i !== index))
  }

  const nextImage = (newsId, totalImages) => {
    setCurrentImageIndex(prev => ({
      ...prev,
      [newsId]: (prev[newsId] + 1) % totalImages
    }))
  }

  const prevImage = (newsId, totalImages) => {
    setCurrentImageIndex(prev => ({
      ...prev,
      [newsId]: prev[newsId] === 0 ? totalImages - 1 : prev[newsId] - 1
    }))
  }

  const getNewsImages = (news) => {
    // Support both old format (url) and new format (images array)
    if (news.images && Array.isArray(news.images)) {
      return news.images
    }
    return news.url ? [news.url] : []
  }

  return (
    <div className="p-10 bg-[#f8f9fc] min-h-[95vh]">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#13274f]">News</h1>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
        {newsItems.map((news) => {
          const images = getNewsImages(news)
          const currentIndex = currentImageIndex[news.id] || 0
          
          return (
            <div
              key={news.id}
              className="relative bg-white rounded-xl shadow-md overflow-hidden cursor-pointer h-[19rem] flex flex-col justify-between"
              onMouseEnter={() => setHovered(news.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="relative h-[80rem] overflow-hidden">
                <img 
                  src={images[currentIndex] || "/placeholder.svg"} 
                  alt={news.title} 
                  className="w-full h-full object-cover"
                />
                
                {/* Image counter badge */}
                {images.length > 1 && (
                  <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-semibold">
                    {currentIndex + 1}/{images.length}
                  </div>
                )}

                {/* Navigation arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        prevImage(news.id, images.length)
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        nextImage(news.id, images.length)
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                <div
                  className={`absolute inset-0 bg-black/60 flex justify-center items-center gap-3 transition-opacity duration-300 ${
                    hovered === news.id ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <button 
                    onClick={() => handleEditClick(news)} 
                    className="px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer border-none bg-white text-gray-800"
                  >
                    <FaEdit /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(news.id, images)}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 cursor-pointer border-none bg-red-600 text-white"
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
              <p className="flex items-center justify-center font-semibold text-base text-gray-800 text-center p-2 overflow-hidden text-ellipsis line-clamp-2 leading-[1.2] m-auto w-full h-[80%]">
                {news.title}
              </p>
            </div>
          )
        })}

        <div
          className={`bg-white rounded-xl shadow-md border-2 border-dashed cursor-pointer flex flex-col items-center justify-center h-[19rem] transition-colors duration-300 ${
            hovered === "add" ? 'border-gray-700 text-gray-800' : 'border-gray-400'
          }`}
          onMouseEnter={() => setHovered("add")}
          onMouseLeave={() => setHovered(null)}
          onClick={handleAddClick}
        >
          <div className="flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full mb-4">
            <FaPlus size={24} />
          </div>
          <div>Add New News</div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000]">
          <div className="bg-white rounded-xl w-[90%] max-w-[500px] max-h-[90vh] overflow-auto shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-gray-300">
              <h2 className="text-2xl font-bold text-[#13274f] m-0">Add New News</h2>
              <button onClick={handleAddCancel} className="bg-transparent border-none text-xl cursor-pointer text-gray-500 p-1">
                <FaTimes />
              </button>
            </div>
            <div className="p-5">
              <div className="mb-5">
                <label className="block mb-2 font-semibold text-gray-700">Title:</label>
                <input
                  type="text"
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  placeholder="Enter news title"
                  className="w-full p-3 border border-gray-300 rounded-lg text-base box-border"
                />
              </div>
              <div className="mb-5">
                <label className="block mb-2 font-semibold text-gray-700">Description (optional):</label>
                <textarea
                  value={addInfo}
                  onChange={(e) => setAddInfo(e.target.value)}
                  placeholder="Enter news description"
                  rows="4"
                  className="w-full p-3 border border-gray-300 rounded-lg text-base box-border resize-vertical"
                />
              </div>
              <div className="mb-5">
                <label className="block mb-2 font-semibold text-gray-700">Images:</label>
                <input 
                  type="file" 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  multiple
                  className="w-full p-2 border border-gray-300 rounded-lg text-base box-border"
                />
                <p className="text-xs text-gray-500 mt-1">You can select multiple images</p>
              </div>
              {selectedFiles.length > 0 && (
                <div className="mb-5">
                  <label className="block mb-2 font-semibold text-gray-700">Selected Images ({selectedFiles.length}):</label>
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-100 rounded-lg">
                        <div className="flex items-center gap-2">
                          <img 
                            src={URL.createObjectURL(file)} 
                            alt={file.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <span className="text-sm text-gray-600 truncate max-w-[200px]">{file.name}</span>
                        </div>
                        <button
                          onClick={() => removeSelectedFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-300">
              <button 
                onClick={handleAddCancel} 
                className="px-5 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 cursor-pointer text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || selectedFiles.length === 0 || !addTitle.trim()}
                className="px-5 py-2.5 border-none rounded-lg bg-[#fbbf24] text-black cursor-pointer text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? "Uploading..." : "Add News"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[1000]">
          <div className="bg-white rounded-xl w-[90%] max-w-[500px] max-h-[90vh] overflow-auto shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-gray-300">
              <h2 className="text-2xl font-bold text-[#13274f] m-0">Edit News</h2>
              <button onClick={handleEditCancel} className="bg-transparent border-none text-xl cursor-pointer text-gray-500 p-1">
                <FaTimes />
              </button>
            </div>
            <div className="p-5">
              <div className="mb-5">
                <label className="block mb-2 font-semibold text-gray-700">Title:</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Enter news title"
                  className="w-full p-3 border border-gray-300 rounded-lg text-base box-border"
                />
              </div>
              <div className="mb-5">
                <label className="block mb-2 font-semibold text-gray-700">Description (optional):</label>
                <textarea
                  value={editInfo}
                  onChange={(e) => setEditInfo(e.target.value)}
                  placeholder="Enter news description"
                  rows="4"
                  className="w-full p-3 border border-gray-300 rounded-lg text-base box-border resize-vertical"
                />
              </div>
              <div className="mb-5">
                <label className="block mb-2 font-semibold text-gray-700">Current Images:</label>
                <div className="grid grid-cols-2 gap-2">
                  {getNewsImages(editingNews).map((url, index) => (
                    <img
                      key={index}
                      src={url || "/placeholder.svg"}
                      alt={`Current ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-300"
                    />
                  ))}
                </div>
              </div>
              <div className="mb-5">
                <label className="block mb-2 font-semibold text-gray-700">Replace Images (optional):</label>
                <input
                  type="file"
                  onChange={(e) => setEditFiles(Array.from(e.target.files))}
                  accept="image/*"
                  multiple
                  className="w-full p-2 border border-gray-300 rounded-lg text-base box-border"
                />
                <p className="text-xs text-gray-500 mt-1">Select new images to replace all existing ones</p>
              </div>
              {editFiles.length > 0 && (
                <div className="mb-5">
                  <label className="block mb-2 font-semibold text-gray-700">New Images ({editFiles.length}):</label>
                  <div className="space-y-2">
                    {editFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-100 rounded-lg">
                        <div className="flex items-center gap-2">
                          <img 
                            src={URL.createObjectURL(file)} 
                            alt={file.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <span className="text-sm text-gray-600 truncate max-w-[200px]">{file.name}</span>
                        </div>
                        <button
                          onClick={() => removeEditFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-gray-300">
              <button 
                onClick={handleEditCancel} 
                className="px-5 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 cursor-pointer text-sm font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleEditSave} 
                disabled={uploading || !editTitle.trim()} 
                className="px-5 py-2.5 border-none rounded-lg bg-[#fbbf24] text-black cursor-pointer text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminNews