"use client"

import styles from '../StyleSheetWeb/importantdates.styles.js';
import { useState, useRef, useEffect } from "react"
import {
  Search,
  Mail,
  Settings,
  Calendar,
  MapPin,
  Edit,
  Trash2,
  Plus,
  Filter,
  GripVertical,
  FileText,
  Upload,
  X,
  Download,
  Loader,
} from "lucide-react"

// Firebase imports
import { db, storage } from "../firebaseConfig"
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"

const ImportantDates = () => {
  const [dates, setDates] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [editingDate, setEditingDate] = useState(null)
  const [viewingDate, setViewingDate] = useState(null)
  const [draggedItem, setDraggedItem] = useState(null)
  const [dragOverItem, setDragOverItem] = useState(null)
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    location: "",
  })
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    pdfFile: null,
    pdfUrl: "",
    pdfName: "",
  })

  const dragCounter = useRef(0)
  const fileInputRef = useRef(null)
  const editFileInputRef = useRef(null)

  // Fetch dates from Firebase on component mount
  useEffect(() => {
    fetchDates()
  }, [])

  // Fetch dates from Firestore
  const fetchDates = async () => {
    try {
      setLoading(true)
      const datesQuery = query(collection(db, "importantDates"), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(datesQuery)

      const datesData = []
      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data()

        // Create date object with Firestore data
        const dateItem = {
          id: docSnapshot.id,
          title: data.title,
          date: data.date,
          time: data.time || "",
          location: data.location,
          status: data.status || "active",
          pdfUrl: data.pdfUrl || "",
          pdfName: data.pdfName || "",
          pdfFile: null, // Will be populated when needed
          order: data.order || 0,
        }

        datesData.push(dateItem)
      }

      // Sort by order field
      datesData.sort((a, b) => a.order - b.order)
      setDates(datesData)
    } catch (error) {
      console.error("Error fetching dates:", error)
      alert("Failed to load important dates. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Update order in Firestore after drag and drop
  const updateOrderInFirestore = async (newDates) => {
    try {
      // Update each document with its new order
      const updatePromises = newDates.map((date, index) => {
        const dateRef = doc(db, "importantDates", date.id)
        return updateDoc(dateRef, { order: index })
      })

      await Promise.all(updatePromises)
    } catch (error) {
      console.error("Error updating order:", error)
      alert("Failed to update order. Please try again.")
    }
  }

  // Helper functions defined first
  const formatDateDisplay = (date, time) => {
    if (!date) return ""
    const dateObj = new Date(date)
    const options = { day: "numeric", month: "short", year: "numeric" }
    let formatted = dateObj.toLocaleDateString("en-US", options)

    if (time) {
      const timeObj = new Date(time)
      const timeFormatted = timeObj.toLocaleDateString("en-US", options)
      formatted = `${formatted} - ${timeFormatted}`
    }

    return formatted
  }

  // Get color based on date
  const getDateColor = (dateString) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const itemDate = new Date(dateString)
    itemDate.setHours(0, 0, 0, 0)

    const diffTime = itemDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return "#10b981" // Green for past dates
    } else if (diffDays <= 7) {
      return "#ef4444" // Red for upcoming dates (within 7 days)
    } else {
      return "#f59e0b" // Yellow for later upcoming dates
    }
  }

  // Enhanced filtering function
  const getFilteredDates = () => {
    return dates.filter((date) => {
      // Text search
      const matchesSearch =
        date.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        date.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        date.date.includes(searchTerm) ||
        formatDateDisplay(date.date, date.time).toLowerCase().includes(searchTerm.toLowerCase())

      // Date range filter
      const matchesDateRange =
        (!filters.dateFrom || new Date(date.date) >= new Date(filters.dateFrom)) &&
        (!filters.dateTo || new Date(date.date) <= new Date(filters.dateTo))

      // Location filter
      const matchesLocation = !filters.location || date.location.toLowerCase().includes(filters.location.toLowerCase())

      return matchesSearch && matchesDateRange && matchesLocation
    })
  }

  const filteredDates = getFilteredDates()

  // File handling functions
  const handleFileUpload = (e, isEdit = false) => {
    const file = e.target.files[0]
    if (file && file.type === "application/pdf") {
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("File size exceeds 10MB limit. Please choose a smaller file.")
        e.target.value = ""
        return
      }

      setFormData({
        ...formData,
        pdfFile: file,
        pdfName: file.name,
      })
    } else if (file) {
      alert("Please select a PDF file only.")
      e.target.value = ""
    }
  }

  const removeFile = (isEdit = false) => {
    setFormData({
      ...formData,
      pdfFile: null,
      pdfUrl: isEdit ? formData.pdfUrl : "", // Keep the URL if editing
      pdfName: isEdit ? formData.pdfName : "",
    })

    if (isEdit && editFileInputRef.current) {
      editFileInputRef.current.value = ""
    } else if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Firebase file upload with enhanced error handling
  const uploadPdfToFirebase = async (file, dateId) => {
    if (!file) return { url: "", name: "" }

    try {
      console.log("Starting PDF upload to Firebase Storage...")
      console.log("File details:", { 
        name: file.name, 
        size: file.size, 
        type: file.type,
        isValidPDF: file.type === "application/pdf",
        isWithinSizeLimit: file.size <= 10 * 1024 * 1024
      });
      console.log("Storage bucket:", storage.app.options.storageBucket)

      // Validate file
      if (file.type !== "application/pdf") {
        throw new Error("File must be a PDF")
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File size must be less than 10MB")
      }

      // Create a reference to Firebase Storage
       const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const storageRef = ref(storage, `importantDates/${dateId}/${fileName}`);

      console.log("Storage reference created:", storageRef.fullPath)

      // Upload the file to Firebase Storage
      console.log("Uploading file to Firebase Storage...")
      const uploadTask = uploadBytes(storageRef, file, {
        contentType: "application/pdf",
        customMetadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      })

      // Add a timeout to prevent hanging forever
      const uploadPromise = Promise.race([
        uploadTask,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Upload timed out after 60 seconds")), 60000)),
      ])

      const uploadResult = await uploadPromise
      console.log("File uploaded successfully:", uploadResult)

      // Get the download URL from Firebase Storage
      console.log("Getting download URL...")
      const downloadUrl = await getDownloadURL(storageRef)
      console.log("Download URL obtained:", downloadUrl)

      return {
        url: downloadUrl,
        name: fileName,
        originalName: file.name,
      }
    } catch (error) {
      console.error("Detailed upload error:", error)

      // Provide specific error messages
      if (error.code === "storage/unauthorized") {
        throw new Error("Upload failed: Permission denied. Please check Firebase Storage rules.")
      } else if (error.code === "storage/canceled") {
        throw new Error("Upload was canceled.")
      } else if (error.code === "storage/unknown") {
        throw new Error("Upload failed: Unknown error occurred.")
      } else if (error.code === "storage/invalid-format") {
        throw new Error("Upload failed: Invalid file format.")
      } else if (error.code === "storage/invalid-argument") {
        throw new Error("Upload failed: Invalid argument provided.")
      } else {
        throw new Error(`Upload failed: ${error.message || "Unknown error"}`)
      }
    }
  }

  // Enhanced delete function for Firebase Storage
  const deletePdfFromFirebase = async (dateId, fileName) => {
    if (!fileName) return

    try {
      console.log("Deleting PDF from Firebase Storage:", fileName)
      const fileRef = ref(storage, `pdfs/${dateId}/${fileName}`)
      await deleteObject(fileRef)
      console.log("PDF deleted successfully from Firebase Storage")
    } catch (error) {
      console.error("Error deleting file from Firebase Storage:", error)

      if (error.code === "storage/object-not-found") {
        console.log("File not found in storage, may have been already deleted")
      } else {
        console.error("Failed to delete file:", error.message)
      }
      // Don't throw error as the file might not exist
    }
  }

  // View modal handler
  const handleViewDate = async (date) => {
    // If the date has a PDF URL but no file loaded yet
    if (date.pdfUrl && !date.pdfFile) {
      try {
        // Create a temporary loading state
        setViewingDate({ ...date, loadingPdf: true })
        setIsViewModalOpen(true)

        // Fetch the PDF file
        const response = await fetch(date.pdfUrl)
        const blob = await response.blob()
        const file = new File([blob], date.pdfName || "document.pdf", { type: "application/pdf" })

        // Update the date with the file
        const updatedDate = { ...date, pdfFile: file, loadingPdf: false }
        setViewingDate(updatedDate)

        // Also update in the dates array
        setDates(dates.map((d) => (d.id === date.id ? { ...d, pdfFile: file } : d)))
      } catch (error) {
        console.error("Error loading PDF:", error)
        setViewingDate({ ...date, loadingPdf: false, pdfError: true })
      }
    } else {
      // If no PDF or already loaded
      setViewingDate(date)
      setIsViewModalOpen(true)
    }
  }

  // Drag and drop handlers - only for drag handle
  const handleDragStart = (e, item) => {
    setDraggedItem(item)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/html", e.target.parentNode.parentNode)
    e.dataTransfer.setDragImage(e.target.parentNode.parentNode, 20, 20)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDragEnter = (e, item) => {
    e.preventDefault()
    setDragOverItem(item)
    dragCounter.current++
  }

  const handleDragLeave = (e) => {
    dragCounter.current--
    if (dragCounter.current === 0) {
      setDragOverItem(null)
    }
  }

  const handleDrop = async (e, dropItem) => {
    e.preventDefault()
    dragCounter.current = 0
    setDragOverItem(null)

    if (draggedItem && draggedItem.id !== dropItem.id) {
      const draggedIndex = dates.findIndex((item) => item.id === draggedItem.id)
      const dropIndex = dates.findIndex((item) => item.id === dropItem.id)

      const newDates = [...dates]
      const draggedItemData = newDates.splice(draggedIndex, 1)[0]
      newDates.splice(dropIndex, 0, draggedItemData)

      setDates(newDates)

      // Update order in Firebase
      await updateOrderInFirestore(newDates)
    }
    setDraggedItem(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDragOverItem(null)
    dragCounter.current = 0
  }

  const handleAddNew = () => {
    setFormData({
      title: "",
      date: "",
      time: "",
      location: "",
      pdfFile: null,
      pdfUrl: "",
      pdfName: "",
    })
    setIsAddModalOpen(true)
  }

  const handleEdit = (e, date) => {
    e.stopPropagation() // Prevent triggering the view modal
    setEditingDate(date)

    setFormData({
      title: date.title,
      date: date.date,
      time: date.time,
      location: date.location,
      pdfFile: date.pdfFile, // Include the file if it's already loaded
      pdfUrl: date.pdfUrl || "",
      pdfName: date.pdfName || "",
    })

    setIsEditModalOpen(true)

    // Preload the PDF if needed
    if (date.pdfUrl && !date.pdfFile) {
      preloadPdfForEdit(date)
    }
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation() // Prevent triggering the view modal
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        // Find the date to get PDF info
        const dateToDelete = dates.find((date) => date.id === id)

        // Delete from Firestore
        await deleteDoc(doc(db, "importantDates", id))

        // Delete PDF if exists
        if (dateToDelete.pdfName) {
          await deletePdfFromFirebase(id, dateToDelete.pdfName)
        }

        // Update local state
        setDates(dates.filter((date) => date.id !== id))
      } catch (error) {
        console.error("Error deleting date:", error)
        alert("Failed to delete. Please try again.")
      }
    }
  }

  const handleSubmitAdd = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)

      // Create new document in Firestore first
      const docRef = await addDoc(collection(db, "importantDates"), {
        title: formData.title,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        status: "active",
        pdfUrl: "",
        pdfName: "",
        pdfOriginalName: "",
        createdAt: serverTimestamp(),
        order: dates.length,
      })

      console.log("Document created in Firestore:", docRef.id)

      // Prepare the new date object for local state
      const newDate = {
        id: docRef.id,
        title: formData.title,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        status: "active",
        pdfUrl: "",
        pdfName: "",
        pdfOriginalName: "",
        pdfFile: null,
        order: dates.length,
      }

      // Upload PDF if provided
      if (formData.pdfFile) {
        try {
          console.log("Starting PDF upload for document:", docRef.id)
          const pdfData = await uploadPdfToFirebase(formData.pdfFile, docRef.id)

          // Update the document with PDF info in Firestore
          await updateDoc(docRef, {
            pdfUrl: pdfData.url,
            pdfName: pdfData.name,
            pdfOriginalName: pdfData.originalName || formData.pdfFile.name,
          })

          console.log("PDF metadata saved to Firestore")

          // Update the newDate object with PDF info
          newDate.pdfUrl = pdfData.url
          newDate.pdfName = pdfData.name
          newDate.pdfOriginalName = pdfData.originalName || formData.pdfFile.name
          newDate.pdfFile = formData.pdfFile

          console.log("PDF upload completed successfully")
        } catch (pdfError) {
          console.error("PDF upload failed:", pdfError)
          alert(
            `PDF upload failed: ${pdfError.message}. The date was created but without the PDF. You can edit it later to add the PDF.`,
          )
        }
      }

      // Add to local state
      setDates([...dates, newDate])
      setIsAddModalOpen(false)
      setFormData({
        title: "",
        date: "",
        time: "",
        location: "",
        pdfFile: null,
        pdfUrl: "",
        pdfName: "",
      })

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      console.log("Date added successfully")
    } catch (error) {
      console.error("Error adding date:", error)
      alert(`Failed to add new date: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!editingDate) return;

    try {
      setLoading(true);
      const dateRef = doc(db, "importantDates", editingDate.id);

      // Prepare update data
      const updateData = {
        title: formData.title,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        updatedAt: serverTimestamp(),
      };

      // Handle PDF changes
      if (formData.pdfFile) {
        try {
          console.log("Attempting PDF upload for edit...");
          const pdfData = await uploadPdfToFirebase(formData.pdfFile, editingDate.id);
          
          // Add PDF info to update data
          updateData.pdfUrl = pdfData.url;
          updateData.pdfName = pdfData.name;
          updateData.pdfOriginalName = pdfData.originalName;
          
          // If there was a previous PDF, delete it
          if (editingDate.pdfName && editingDate.pdfName !== pdfData.name) {
            console.log("Deleting previous PDF:", editingDate.pdfName);
            await deletePdfFromFirebase(editingDate.id, editingDate.pdfName);
          }
        } catch (pdfError) {
          console.error("PDF upload failed during edit:", pdfError);
          // Show error but continue with the update
          alert(`Warning: ${pdfError.message}. The date was updated but without PDF changes.`);
        }
      } else if (formData.pdfUrl === "" && editingDate.pdfName) {
        // User removed the PDF
        try {
          console.log("Removing PDF attachment...");
          await deletePdfFromFirebase(editingDate.id, editingDate.pdfName);
          updateData.pdfUrl = "";
          updateData.pdfName = "";
          updateData.pdfOriginalName = "";
        } catch (deleteError) {
          console.error("Failed to delete PDF:", deleteError);
          // Continue with the update anyway
        }
      }

      // Update in Firestore
      console.log("Updating Firestore document with:", updateData);
      await updateDoc(dateRef, updateData);

      // Update local state
      setDates(dates.map((date) => 
        date.id === editingDate.id ? { 
          ...date, 
          ...updateData,
          pdfFile: formData.pdfFile || date.pdfFile,
        } : date
      ));

      setIsEditModalOpen(false);
      setEditingDate(null);
      setFormData({
        title: "",
        date: "",
        time: "",
        location: "",
        pdfFile: null,
        pdfUrl: "",
        pdfName: "",
      });

      if (editFileInputRef.current) {
        editFileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error updating date:", error);
      alert(`Failed to update: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  const closeModal = () => {
    setIsAddModalOpen(false)
    setIsEditModalOpen(false)
    setIsFilterModalOpen(false)
    setIsViewModalOpen(false)
    setEditingDate(null)
    setViewingDate(null)
    setFormData({
      title: "",
      date: "",
      time: "",
      location: "",
      pdfFile: null,
      pdfUrl: "",
      pdfName: "",
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    if (editFileInputRef.current) {
      editFileInputRef.current.value = ""
    }
  }

  const clearFilters = () => {
    setFilters({ dateFrom: "", dateTo: "", location: "" })
  }

  const hasActiveFilters = filters.dateFrom || filters.dateTo || filters.location

  // Download PDF function
  const handleDownloadPdf = (e, pdfUrl, fileName) => {
    e.stopPropagation()

    // Create an anchor element and set properties
    const link = document.createElement("a")
    link.href = pdfUrl
    link.download = fileName || "document.pdf"

    // Append to the document, click it, and remove it
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Event handlers for styling
  const handleSearchInputFocus = (e) => {
    e.target.style.borderColor = "#13274f"
    e.target.style.boxShadow = "0 0 0 3px rgba(19, 39, 79, 0.1)"
  }

  const handleSearchInputBlur = (e) => {
    e.target.style.borderColor = "#d1d5db"
    e.target.style.boxShadow = "none"
  }

  const handleFormInputFocus = (e) => {
    e.target.style.borderColor = "#13274f"
    e.target.style.boxShadow = "0 0 0 3px rgba(19, 39, 79, 0.1)"
  }

  const handleFormInputBlur = (e) => {
    e.target.style.borderColor = "#d1d5db"
    e.target.style.boxShadow = "none"
  }

  const handleButtonHover = (e, hoverStyle) => {
    Object.assign(e.target.style, hoverStyle)
  }

  const handleButtonLeave = (e, originalStyle) => {
    Object.assign(e.target.style, originalStyle)
  }

  const handleDateItemHover = (e) => {
    if (!draggedItem) {
      e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)"
    }
  }

  const handleDateItemLeave = (e) => {
    if (!draggedItem) {
      e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1)"
    }
  }

  const handleActionBtnHover = (e, isEdit = false) => {
    e.target.style.backgroundColor = isEdit ? "#f3f4f6" : "#fef2f2"
    e.target.style.color = isEdit ? "#13274f" : "#ef4444"
  }

  const handleActionBtnLeave = (e) => {
    e.target.style.backgroundColor = "transparent"
    e.target.style.color = "#6b7280"
  }

  // Drag handle specific handlers
  const handleDragAreaHover = (e) => {
    e.target.style.backgroundColor = "rgba(19, 39, 79, 0.05)"
  }

  const handleDragAreaLeave = (e) => {
    e.target.style.backgroundColor = "transparent"
  }

  // File upload area handlers
  const handleFileAreaHover = (e) => {
    e.target.style.borderColor = "#13274f"
    e.target.style.backgroundColor = "#f0f4ff"
  }

  const handleFileAreaLeave = (e) => {
    e.target.style.borderColor = "#d1d5db"
    e.target.style.backgroundColor = "#f9fafb"
  }

  // Add this function after handleEdit
  const preloadPdfForEdit = async (date) => {
    if (date.pdfUrl && !date.pdfFile) {
      try {
        // Fetch the PDF file
        const response = await fetch(date.pdfUrl)
        const blob = await response.blob()
        const file = new File([blob], date.pdfName || "document.pdf", { type: "application/pdf" })

        // Update the date with the file
        const updatedDate = { ...date, pdfFile: file }

        // Update in the dates array
        setDates(dates.map((d) => (d.id === date.id ? updatedDate : d)))

        // Update the editing form data
        setFormData((prev) => ({
          ...prev,
          pdfFile: file,
        }))

        return file
      } catch (error) {
        console.error("Error loading PDF for edit:", error)
        return null
      }
    }
    return null
  }

  return (
    <div style={styles.container}>
      {/* Global loading overlay */}
      {loading && (
        <div style={styles.overlay}>
          <div style={styles.loadingContainer}>
            <Loader style={{ width: "32px", height: "32px", animation: "spin 1s linear infinite" }} />
            <p style={styles.loadingText}>Loading...</p>
          </div>
        </div>
      )}

      <div style={styles.mainContent}>
        <div style={styles.header}>
          <h1 style={styles.pageTitle}>Important Dates</h1>
          <div style={styles.headerIcons}>
            <Mail
              style={styles.headerIcon}
              onMouseEnter={(e) => (e.target.style.color = "#13274f")}
              onMouseLeave={(e) => (e.target.style.color = "#6b7280")}
            />
            <Settings
              style={styles.headerIcon}
              onMouseEnter={(e) => (e.target.style.color = "#13274f")}
              onMouseLeave={(e) => (e.target.style.color = "#6b7280")}
            />
          </div>
        </div>

        <div style={styles.searchBarContainer}>
          <div style={styles.searchInputWrapper}>
            <Search style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by title, date, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
              onFocus={handleSearchInputFocus}
              onBlur={handleSearchInputBlur}
            />
          </div>
          <button
            style={{ ...styles.btn, ...styles.btnSearch }}
            onMouseEnter={(e) => handleButtonHover(e, { backgroundColor: "#0f1f3d" })}
            onMouseLeave={(e) => handleButtonLeave(e, styles.btnSearch)}
          >
            SEARCH
          </button>
          <button
            onClick={() => setIsFilterModalOpen(true)}
            style={{
              ...styles.btn,
              ...styles.btnFilter,
              ...(hasActiveFilters ? { backgroundColor: "#13274f", color: "white" } : {}),
            }}
            onMouseEnter={(e) => handleButtonHover(e, { backgroundColor: "#13274f", color: "white" })}
            onMouseLeave={(e) =>
              handleButtonLeave(e, hasActiveFilters ? { backgroundColor: "#13274f", color: "white" } : styles.btnFilter)
            }
          >
            <Filter style={styles.btnIcon} />
            Filter {hasActiveFilters && "(Active)"}
          </button>
          <button
            onClick={handleAddNew}
            style={{ ...styles.btn, ...styles.btnAdd }}
            onMouseEnter={(e) => handleButtonHover(e, { backgroundColor: "#f59e0b" })}
            onMouseLeave={(e) => handleButtonLeave(e, styles.btnAdd)}
          >
            <Plus style={styles.btnIcon} />
            ADD NEW
          </button>
        </div>

        <div style={styles.datesList}>
          {filteredDates.map((date) => (
            <div
              key={date.id}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, date)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, date)}
              onClick={() => handleViewDate(date)}
              style={{
                ...styles.dateItem,
                ...styles.dateItemClickable,
                borderLeft: `4px solid ${getDateColor(date.date)}`,
                ...(draggedItem?.id === date.id ? styles.dateItemDragging : {}),
                ...(dragOverItem?.id === date.id && draggedItem?.id !== date.id ? styles.dateItemDragOver : {}),
              }}
              onMouseEnter={handleDateItemHover}
              onMouseLeave={handleDateItemLeave}
            >
              {/* Drag Handle Area - Only this area is draggable */}
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, date)}
                onDragEnd={handleDragEnd}
                onClick={(e) => e.stopPropagation()}
                style={styles.dragHandleArea}
                onMouseEnter={handleDragAreaHover}
                onMouseLeave={handleDragAreaLeave}
              >
                <GripVertical
                  style={{
                    ...styles.dragHandle,
                    ...(draggedItem?.id === date.id ? styles.dragHandleActive : {}),
                  }}
                />
              </div>

              <div style={styles.dateContent}>
                <h3 style={styles.dateTitle}>{date.title}</h3>
                <div style={styles.dateDetails}>
                  <div style={styles.dateInfo}>
                    <Calendar style={styles.infoIcon} />
                    <span style={styles.infoText}>{formatDateDisplay(date.date, date.time)}</span>
                  </div>
                  <div style={styles.dateInfo}>
                    <MapPin style={styles.infoIcon} />
                    <span style={styles.infoText}>{date.location}</span>
                  </div>
                  {date.pdfUrl && (
                    <div style={styles.pdfIndicator}>
                      <FileText style={{ width: "12px", height: "12px" }} />
                      {date.pdfOriginalName || date.pdfName || "PDF Attachment"}
                    </div>
                  )}
                </div>
              </div>
              <div style={styles.dateActions}>
                {date.pdfUrl && (
                  <button
                    onClick={(e) => handleDownloadPdf(e, date.pdfUrl, date.pdfName)}
                    style={styles.actionBtn}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#f0f9ff"
                      e.target.style.color = "#0369a1"
                    }}
                    onMouseLeave={handleActionBtnLeave}
                    title="Download PDF"
                  >
                    <Download style={styles.actionIcon} />
                  </button>
                )}
                <button
                  onClick={(e) => handleEdit(e, date)}
                  style={styles.actionBtn}
                  onMouseEnter={(e) => handleActionBtnHover(e, true)}
                  onMouseLeave={handleActionBtnLeave}
                >
                  <Edit style={styles.actionIcon} />
                </button>
                <button
                  onClick={(e) => handleDelete(e, date.id)}
                  style={styles.actionBtn}
                  onMouseEnter={(e) => handleActionBtnHover(e, false)}
                  onMouseLeave={handleActionBtnLeave}
                >
                  <Trash2 style={styles.actionIcon} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {!loading && filteredDates.length === 0 && (
          <div style={styles.noResults}>
            <p style={styles.noResultsText}>
              {hasActiveFilters || searchTerm ? "No dates match your search criteria." : "No important dates found."}
            </p>
          </div>
        )}
      </div>

      {/* View Modal */}
      {isViewModalOpen && viewingDate && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.viewModalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>View Important Date</h2>
              <button
                onClick={closeModal}
                style={styles.modalClose}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#f3f4f6"
                  e.target.style.color = "#374151"
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent"
                  e.target.style.color = "#6b7280"
                }}
              >
                ×
              </button>
            </div>
            <div style={styles.viewContent}>
              <div style={styles.viewSection}>
                <h3 style={styles.viewSectionTitle}>Title</h3>
                <p style={styles.viewSectionContent}>{viewingDate.title}</p>
              </div>

              <div style={styles.viewSection}>
                <h3 style={styles.viewSectionTitle}>Date & Time</h3>
                <p style={styles.viewSectionContent}>{formatDateDisplay(viewingDate.date, viewingDate.time)}</p>
              </div>

              <div style={styles.viewSection}>
                <h3 style={styles.viewSectionTitle}>Location</h3>
                <p style={styles.viewSectionContent}>{viewingDate.location}</p>
              </div>

              <div style={styles.viewSection}>
                <div style={styles.pdfHeader}>
                  <h3 style={styles.viewSectionTitle}>Guideline (PDF)</h3>
                  {viewingDate.pdfUrl && (
                    <button
                      style={styles.downloadBtn}
                      onClick={(e) => handleDownloadPdf(e, viewingDate.pdfUrl, viewingDate.pdfName)}
                      onMouseEnter={(e) => handleButtonHover(e, { backgroundColor: "#1e3a8a" })}
                      onMouseLeave={(e) => handleButtonLeave(e, { backgroundColor: "#1e40af" })}
                    >
                      <Download style={{ width: "14px", height: "14px" }} />
                      Download PDF
                    </button>
                  )}
                </div>

                {viewingDate.loadingPdf ? (
                  <div style={styles.loadingContainer}>
                    <Loader style={{ width: "32px", height: "32px", animation: "spin 1s linear infinite" }} />
                    <p style={styles.loadingText}>Loading PDF...</p>
                  </div>
                ) : viewingDate.pdfError ? (
                  <div style={styles.noPdfMessage}>
                    <FileText style={{ width: "48px", height: "48px", margin: "0 auto 16px", color: "#ef4444" }} />
                    <p>Error loading PDF. Please try again.</p>
                  </div>
                ) : viewingDate.pdfFile ? (
                  <iframe src={URL.createObjectURL(viewingDate.pdfFile)} style={styles.pdfViewer} title="PDF Viewer" />
                ) : viewingDate.pdfUrl ? (
                  <iframe src={viewingDate.pdfUrl} style={styles.pdfViewer} title="PDF Viewer" />
                ) : (
                  <div style={styles.noPdfMessage}>
                    <FileText style={{ width: "48px", height: "48px", margin: "0 auto 16px", color: "#d1d5db" }} />
                    <p>No PDF guideline attached to this date.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Filter Important Dates</h2>
              <button
                onClick={closeModal}
                style={styles.modalClose}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#f3f4f6"
                  e.target.style.color = "#374151"
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent"
                  e.target.style.color = "#6b7280"
                }}
              >
                ×
              </button>
            </div>
            <div style={styles.modalForm}>
              <div style={styles.filterSection}>
                <label style={styles.filterLabel}>Date From:</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  style={styles.filterInput}
                  onFocus={handleFormInputFocus}
                  onBlur={handleFormInputBlur}
                />
              </div>
              <div style={styles.filterSection}>
                <label style={styles.filterLabel}>Date To:</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  style={styles.filterInput}
                  onFocus={handleFormInputFocus}
                  onBlur={handleFormInputBlur}
                />
              </div>
              <div style={styles.filterSection}>
                <label style={styles.filterLabel}>Location:</label>
                <input
                  type="text"
                  placeholder="Filter by location..."
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  style={styles.filterInput}
                  onFocus={handleFormInputFocus}
                  onBlur={handleFormInputBlur}
                />
              </div>
              <div style={styles.modalActions}>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    style={{ ...styles.btn, ...styles.clearFiltersBtn }}
                    onMouseEnter={(e) => handleButtonHover(e, { backgroundColor: "#dc2626" })}
                    onMouseLeave={(e) => handleButtonLeave(e, styles.clearFiltersBtn)}
                  >
                    Clear Filters
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeModal}
                  style={{ ...styles.btn, ...styles.btnCancel }}
                  onMouseEnter={(e) => handleButtonHover(e, { backgroundColor: "#f9fafb", color: "#374151" })}
                  onMouseLeave={(e) => handleButtonLeave(e, styles.btnCancel)}
                >
                  Cancel
                </button>
                <button
                  onClick={closeModal}
                  style={{ ...styles.btn, ...styles.btnSubmit }}
                  onMouseEnter={(e) => handleButtonHover(e, { backgroundColor: "#0f1f3d" })}
                  onMouseLeave={(e) => handleButtonLeave(e, styles.btnSubmit)}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Add New Important Date</h2>
              <button
                onClick={closeModal}
                style={styles.modalClose}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#f3f4f6"
                  e.target.style.color = "#374151"
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent"
                  e.target.style.color = "#6b7280"
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmitAdd} style={styles.modalForm}>
              <div style={styles.formGroup}>
                <label htmlFor="title" style={styles.formLabel}>
                  Title *
                </label>
                <textarea
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter event title"
                  required
                  style={styles.formTextarea}
                  rows={3}
                  onFocus={handleFormInputFocus}
                  onBlur={handleFormInputBlur}
                />
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label htmlFor="date" style={styles.formLabel}>
                    Start Date *
                  </label>
                  <input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    style={styles.formInput}
                    onFocus={handleFormInputFocus}
                    onBlur={handleFormInputBlur}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label htmlFor="time" style={styles.formLabel}>
                    End Date (Optional)
                  </label>
                  <input
                    id="time"
                    type="date"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    style={styles.formInput}
                    onFocus={handleFormInputFocus}
                    onBlur={handleFormInputBlur}
                  />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label htmlFor="location" style={styles.formLabel}>
                  Location *
                </label>
                <input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Enter location"
                  required
                  style={styles.formInput}
                  onFocus={handleFormInputFocus}
                  onBlur={handleFormInputBlur}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>PDF Guideline (Optional)</label>
                <div
                  style={styles.fileUploadArea}
                  onClick={() => fileInputRef.current?.click()}
                  onMouseEnter={handleFileAreaHover}
                  onMouseLeave={handleFileAreaLeave}
                >
                  <Upload style={{ width: "24px", height: "24px", color: "#6b7280", margin: "0 auto" }} />
                  <p style={styles.fileUploadText}>Click to upload PDF or drag and drop</p>
                  <p style={{ ...styles.fileUploadText, fontSize: "12px" }}>PDF files only, max 10MB</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileUpload(e, false)}
                  style={{ display: "none" }}
                />
                {formData.pdfFile && (
                  <div style={styles.fileSelected}>
                    <div style={styles.fileInfo}>
                      <FileText style={{ width: "16px", height: "16px" }} />
                      <span>{formData.pdfFile.name}</span>
                      <span style={{ color: "#9ca3af", fontSize: "12px" }}>
                        ({(formData.pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(false)}
                      style={styles.removeFileBtn}
                      onMouseEnter={(e) => (e.target.style.backgroundColor = "#fef2f2")}
                      onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
                    >
                      <X style={{ width: "16px", height: "16px" }} />
                    </button>
                  </div>
                )}
              </div>
              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{ ...styles.btn, ...styles.btnCancel }}
                  onMouseEnter={(e) => handleButtonHover(e, { backgroundColor: "#f9fafb", color: "#374151" })}
                  onMouseLeave={(e) => handleButtonLeave(e, styles.btnCancel)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ ...styles.btn, ...styles.btnSubmit }}
                  onMouseEnter={(e) => handleButtonHover(e, { backgroundColor: "#0f1f3d" })}
                  onMouseLeave={(e) => handleButtonLeave(e, styles.btnSubmit)}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} />
                      Adding...
                    </>
                  ) : (
                    "Add Date"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Edit Important Date</h2>
              <button
                onClick={closeModal}
                style={styles.modalClose}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#f3f4f6"
                  e.target.style.color = "#374151"
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "transparent"
                  e.target.style.color = "#6b7280"
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmitEdit} style={styles.modalForm}>
              <div style={styles.formGroup}>
                <label htmlFor="edit-title" style={styles.formLabel}>
                  Title *
                </label>
                <textarea
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter event title"
                  required
                  style={styles.formTextarea}
                  rows={3}
                  onFocus={handleFormInputFocus}
                  onBlur={handleFormInputBlur}
                />
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label htmlFor="edit-date" style={styles.formLabel}>
                    Start Date *
                  </label>
                  <input
                    id="edit-date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    style={styles.formInput}
                    onFocus={handleFormInputFocus}
                    onBlur={handleFormInputBlur}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label htmlFor="edit-time" style={styles.formLabel}>
                    End Date (Optional)
                  </label>
                  <input
                    id="edit-time"
                    type="date"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    style={styles.formInput}
                    onFocus={handleFormInputFocus}
                    onBlur={handleFormInputBlur}
                  />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label htmlFor="edit-location" style={styles.formLabel}>
                  Location *
                </label>
                <input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Enter location"
                  required
                  style={styles.formInput}
                  onFocus={handleFormInputFocus}
                  onBlur={handleFormInputBlur}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>PDF Guideline (Optional)</label>
                {formData.pdfUrl && !formData.pdfFile && (
                  <div style={styles.fileSelected}>
                    <div style={styles.fileInfo}>
                      <FileText style={{ width: "16px", height: "16px" }} />
                      <span>{formData.pdfName || "Current PDF"}</span>
                      <span style={{ color: "#0369a1", fontSize: "12px", marginLeft: "4px" }}>(Current PDF)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, pdfUrl: "", pdfName: "" })}
                      style={styles.removeFileBtn}
                      onMouseEnter={(e) => (e.target.style.backgroundColor = "#fef2f2")}
                      onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
                    >
                      <X style={{ width: "16px", height: "16px" }} />
                    </button>
                  </div>
                )}
                <div
                  style={styles.fileUploadArea}
                  onClick={() => editFileInputRef.current?.click()}
                  onMouseEnter={handleFileAreaHover}
                  onMouseLeave={handleFileAreaLeave}
                >
                  <Upload style={{ width: "24px", height: "24px", color: "#6b7280", margin: "0 auto" }} />
                  <p style={styles.fileUploadText}>Click to upload new PDF or drag and drop</p>
                  <p style={{ ...styles.fileUploadText, fontSize: "12px" }}>PDF files only, max 10MB</p>
                </div>
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileUpload(e, true)}
                  style={{ display: "none" }}
                />
                {formData.pdfFile && (
                  <div style={styles.fileSelected}>
                    <div style={styles.fileInfo}>
                      <FileText style={{ width: "16px", height: "16px" }} />
                      <span>{formData.pdfFile.name}</span>
                      <span style={{ color: "#9ca3af", fontSize: "12px" }}>
                        ({(formData.pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(true)}
                      style={styles.removeFileBtn}
                      onMouseEnter={(e) => (e.target.style.backgroundColor = "#fef2f2")}
                      onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
                    >
                      <X style={{ width: "16px", height: "16px" }} />
                    </button>
                  </div>
                )}
              </div>
              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{ ...styles.btn, ...styles.btnCancel }}
                  onMouseEnter={(e) => handleButtonHover(e, { backgroundColor: "#f9fafb", color: "#374151" })}
                  onMouseLeave={(e) => handleButtonLeave(e, styles.btnCancel)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ ...styles.btn, ...styles.btnSubmit }}
                  onMouseEnter={(e) => handleButtonHover(e, { backgroundColor: "#0f1f3d" })}
                  onMouseLeave={(e) => handleButtonLeave(e, styles.btnSubmit)}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} />
                      Updating...
                    </>
                  ) : (
                    "Update Date"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImportantDates