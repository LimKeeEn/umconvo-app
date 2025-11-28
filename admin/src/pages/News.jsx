import { useState, useEffect } from "react"
import { storage, db } from "../firebaseConfig"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { collection, addDoc, onSnapshot, updateDoc, doc, deleteDoc } from "firebase/firestore"
import { FaPlus, FaTrash, FaEdit, FaTimes } from "react-icons/fa"
import { notifyNewsAdded, notifyNewsUpdated, notifyNewsDeleted } from "../services/notificationService"
import { Mail, Settings} from "lucide-react"

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
  const [editInfo, setEditInfo] = useState("")
  const [editFile, setEditFile] = useState(null)
  const [addTitle, setAddTitle] = useState("")
  const [addInfo, setAddInfo] = useState("")

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
    setAddInfo("")
    setSelectedFile(null)
  }

  const handleUpload = async () => {
    if (!selectedFile || !addTitle.trim()) {
      alert("Please select a file and enter a title")
      return
    }

    setUploading(true)
    try {
      const storageRef = ref(storage, `news/${Date.now()}_${selectedFile.name}`)
      await uploadBytes(storageRef, selectedFile)
      const url = await getDownloadURL(storageRef)

      await addDoc(collection(db, "news"), {
        title: addTitle.trim(),
        info: addInfo.trim(),
        url,
        createdAt: Date.now(),
      })

      // ✅ Use centralized notification service
      await notifyNewsAdded(addTitle.trim())

      setUploading(false)
      setSelectedFile(null)
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

  const handleDelete = async (id, imageUrl) => {
    if (window.confirm("Are you sure you want to delete this news item?")) {
      try {
        const storageRef = ref(storage, imageUrl)
        await deleteObject(storageRef)
        await deleteDoc(doc(db, "news", id))
        
        // ✅ Use centralized notification service
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
        info: editInfo.trim(),
        url: newUrl,
        updatedAt: Date.now(),
      })

      // ✅ Use centralized notification service
      await notifyNewsUpdated(editTitle.trim())

      setShowEditModal(false)
      setEditingNews(null)
      setEditTitle("")
      setEditInfo("")
      setEditFile(null)
      
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
    setEditFile(null)
  }

  const handleAddCancel = () => {
    setShowAddModal(false)
    setAddTitle("")
    setAddInfo("")
    setSelectedFile(null)
  }

  return (
    <div className="p-10 bg-[#f8f9fc] min-h-[95vh]">
      <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#13274f]">News</h1>
          <div className="flex items-center gap-4">
            <Mail className="w-6 h-6 text-gray-500 cursor-pointer hover:text-gray-700" />
            <Settings className="w-6 h-6 text-gray-500 cursor-pointer hover:text-gray-700" />
          </div>
        </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
        {newsItems.map((news) => (
          <div
            key={news.id}
            className="relative bg-white rounded-xl shadow-md overflow-hidden cursor-pointer h-[19rem] flex flex-col justify-between"
            onMouseEnter={() => setHovered(news.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="relative h-[80rem] overflow-hidden">
              <img 
                src={news.url || "/placeholder.svg"} 
                alt={news.title} 
                className="w-full h-full object-cover"
              />
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
                  onClick={() => handleDelete(news.id, news.url)}
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
        ))}

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
                <label className="block mb-2 font-semibold text-gray-700">Image:</label>
                <input 
                  type="file" 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="w-full p-2 border border-gray-300 rounded-lg text-base box-border"
                />
              </div>
              {selectedFile && (
                <div className="p-3 bg-gray-100 rounded-lg text-sm text-gray-600">
                  <p>Selected: {selectedFile.name}</p>
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
                disabled={uploading || !selectedFile || !addTitle.trim()}
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
                <label className="block mb-2 font-semibold text-gray-700">Current Image:</label>
                <img
                  src={editingNews?.url || "/placeholder.svg"}
                  alt={editingNews?.title}
                  className="w-full max-h-[200px] object-cover rounded-lg border border-gray-300"
                />
              </div>
              <div className="mb-5">
                <label className="block mb-2 font-semibold text-gray-700">Replace Image (optional):</label>
                <input
                  type="file"
                  onChange={(e) => setEditFile(e.target.files[0])}
                  accept="image/*"
                  className="w-full p-2 border border-gray-300 rounded-lg text-base box-border"
                />
              </div>
              {editFile && (
                <div className="p-3 bg-gray-100 rounded-lg text-sm text-gray-600">
                  <p>New image selected: {editFile.name}</p>
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