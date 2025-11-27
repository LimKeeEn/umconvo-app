"use client"
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
  GripVertical, // Keep for now, but will be removed from general view
  FileText,
  Upload,
  X,
  Download,
  Loader,
  Clock,
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
  // Removed orderBy for initial fetch, as we'll do the logic-based sort ourselves
  serverTimestamp,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { 
  notifyImportantDateAdded,
  notifyImportantDateUpdated,
  notifyImportantDateDeleted,
  notifyConvocationScheduleAdded,
  notifyConvocationScheduleUpdated,
  notifyConvocationScheduleDeleted,
  notifyAttireScheduleAdded,
  notifyAttireScheduleUpdated,
  notifyAttireScheduleDeleted
} from "../services/notificationService"

// Helper function to get status color - **Modified to return a sortable priority value as well**
const getStatusColorAndPriority = (dateString, timeString) => {
  const now = new Date();
  const startDate = new Date(dateString);
  startDate.setHours(0, 0, 0, 0);

  let color = "#4CAF50"; // Default: Green/Past
  let priority = 3; // Default: Lowest priority

  // Helper to safely parse date/time for range check if a timeString exists
  let endTime = null;
  if (timeString) {
    try {
      const parts = timeString.split("-");
      // Use the *end* time/date for the completion marker in a range
      const endDateString = parts.length > 1 ? parts[1].trim() : timeString.trim(); 
      // Assuming timeString/endDateString stores the *end date* for a period date
      endTime = new Date(endDateString);
      endTime.setHours(23, 59, 59, 999);
    } catch (e) {
      // If parsing fails, fall back to simple single date check
      endTime = null;
    }
  }

  // Logic to determine status
  if (endTime) {
    // Range/End Date logic
    if (now >= startDate && now <= endTime) {
      color = "#F44336"; // Red: Ongoing (Current)
      priority = 1;
    } else if (now < startDate) {
      const diffDays = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
      if (diffDays <= 7) {
        color = "#F44336"; // Red: Urgent (Within 7 days)
        priority = 1;
      } else {
        color = "#FFC107"; // Yellow: Upcoming
        priority = 2;
      }
    } else {
      // now > endTime, so it's past
      color = "#4CAF50"; // Green: Past/Completed
      priority = 3;
    }
  } else {
    // Single date logic
    const diffDays = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      color = "#4CAF50"; // Green: Past/Completed
      priority = 3;
    } else if (diffDays === 0) {
      color = "#F44336"; // Red: Today/Urgent
      priority = 1;
    } else {
      if (diffDays <= 7) {
        color = "#F44336"; // Red: Urgent (Within 7 days)
        priority = 1;
      } else {
        color = "#FFC107"; // Yellow: Upcoming
        priority = 2;
      }
    }
  }

  return { color, priority };
}

// Function to get the date object for sorting (Start Date, or End Date if present)
const getSortableDate = (dateString, timeString) => {
    if (!dateString) return new Date(0); // Epoch for safety
    
    let date = new Date(dateString);
    date.setHours(0, 0, 0, 0);

    // If timeString is used for a date range, try to use the end date for a more meaningful sort
    if (timeString) {
        try {
             // Assuming timeString contains the end date if it's a date range
            const parts = timeString.split("-");
            const endDateString = parts.length > 1 ? parts[1].trim() : timeString.trim(); 
            const endDate = new Date(endDateString);
            endDate.setHours(0, 0, 0, 0);
            
            // If the end date is later than the start date, use the start date for the main sort (to appear first chronologically)
            // If both are the same, use the original date
            // Let's stick to the start date for chronological sorting
            return date;
        } catch (e) {
            return date; // Fallback
        }
    }

    return date;
}

const sortDates = (a, b) => {
    const aStatus = getStatusColorAndPriority(a.date, a.time);
    const bStatus = getStatusColorAndPriority(b.date, b.time);

    // 1. Sort by Priority (Red:1, Yellow:2, Green:3) - Ascending (Urgent first)
    if (aStatus.priority !== bStatus.priority) {
        return aStatus.priority - bStatus.priority;
    }

    // 2. If priorities are the same, sort by Date - Ascending (Older date first)
    const aDate = getSortableDate(a.date, a.time);
    const bDate = getSortableDate(b.date, b.time);

    return aDate.getTime() - bDate.getTime();
}


const ImportantDates = () => {
  const [activeTab, setActiveTab] = useState("general")
  const [dates, setDates] = useState([])
  const [convocationSchedule, setConvocationSchedule] = useState([])
  const [attireSchedule, setAttireSchedule] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [editingDate, setEditingDate] = useState(null)
  const [viewingDate, setViewingDate] = useState(null)
  
  // Removed drag-and-drop state
  // const [draggedItem, setDraggedItem] = useState(null)
  // const [dragOverItem, setDragOverItem] = useState(null)

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
    faculty: "",
    timeSlot: "",
  })

  const fileInputRef = useRef(null)
  const editFileInputRef = useRef(null)

  const FACULTY_OPTIONS = [ 
    { label: "Faculty of Built Environment", value: "Faculty-of-Built-Environment" },
    { label: "Faculty of Languages and Linguistics", value: "Faculty of Languages and Linguistics" },
    { label: "Faculty of Pharmacy", value: "Faculty of Pharmacy" },
    { label: "Faculty of Engineering", value: "Faculty of Engineering" },
    { label: "Faculty of Education", value: "Faculty of Education" },
    { label: "Faculty of Dentistry", value: "Faculty of Dentistry" },
    { label: "Faculty of Business and Economics", value: "Faculty of Business and Economics" },
    { label: "Faculty of Medicine", value: "Faculty of Medicine" },
    { label: "Faculty of Science", value: "Faculty of Science" },
    { label: "Faculty of Computer Science & Information Technology", value: "Faculty of Computer Science & Information Technology" },
    { label: "Faculty of Arts And Social Sciences", value: "Faculty of Arts And Social Sciences" },
    { label: "Faculty of Creative Arts", value: "Faculty of Creative Arts" },
    { label: "Faculty of Law", value: "Faculty of Law" },
    { label: "Faculty of Sports and Exercise Sciences", value: "Faculty of Sports and Exercise Science" },
    { label: "Academy of Islamic Studies", value: "Academy of Islamic Studies" },
    { label: "Academy of Malay Studies", value: "Academy of Malay Studies" },
  ];
  
  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchDates(),
        fetchConvocationSchedule(),
        fetchAttireSchedule()
      ])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDates = async () => {
    try {
      // Removed orderBy in query, sort will be applied after fetching
      const datesQuery = collection(db, "importantDates") 
      const querySnapshot = await getDocs(datesQuery)

      const datesData = []
      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data()
        const dateItem = {
          id: docSnapshot.id,
          title: data.title,
          date: data.date,
          time: data.time || "",
          location: data.location,
          status: data.status || "active",
          pdfUrl: data.pdfUrl || "",
          pdfName: data.pdfName || "",
          pdfOriginalName: data.pdfOriginalName || data.pdfName || "", // Ensure we have the original name if possible
          pdfFile: null,
          // Removed order field as it's no longer used for manual drag-and-drop
        }
        datesData.push(dateItem)
      }

      // 1. Sort by Priority (Red -> Yellow -> Green)
      // 2. Then by Date (Ascending)
      datesData.sort(sortDates) 
      setDates(datesData)
    } catch (error) {
      console.error("Error fetching dates:", error)
    }
  }

  const fetchConvocationSchedule = async () => {
    try {
      const scheduleQuery = query(collection(db, "convocationSchedule")) // Removed orderBy, could add `orderBy("date", "asc")` if date sorting is desired for non-general tabs
      const querySnapshot = await getDocs(scheduleQuery)

      const scheduleData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      // Optional: Sort Convocation schedule by date
      scheduleData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setConvocationSchedule(scheduleData)
    } catch (error) {
      console.error("Error fetching convocation schedule:", error)
    }
  }

  const fetchAttireSchedule = async () => {
    try {
      const scheduleQuery = query(collection(db, "attireSchedule")) // Removed orderBy
      const querySnapshot = await getDocs(scheduleQuery)

      const scheduleData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      // Optional: Sort Attire schedule by date
      scheduleData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setAttireSchedule(scheduleData)
    } catch (error) {
      console.error("Error fetching attire schedule:", error)
    }
  }

  // Removed updateOrderInFirestore function as manual reordering is removed

  const formatDateDisplay = (date, time) => {
    if (!date) return ""
    const dateObj = new Date(date)
    const options = { day: "numeric", month: "short", year: "numeric" }
    let formatted = dateObj.toLocaleDateString("en-US", options)

    if (time) {
      // Assuming time is an end date in this context
      const timeObj = new Date(time)
      const timeFormatted = timeObj.toLocaleDateString("en-US", options)
      formatted = `${formatted} - ${timeFormatted}`
    }

    return formatted
  }

  // Removed formatTimeDisplay (unused)

  // Renamed to clarify its purpose
  const getDateColor = (date, time) => getStatusColorAndPriority(date, time).color;


  const getFilteredDates = () => {
    const filtered = dates.filter((date) => {
      const matchesSearch =
        date.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        date.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        date.date.includes(searchTerm) ||
        formatDateDisplay(date.date, date.time).toLowerCase().includes(searchTerm.toLowerCase())

      const matchesDateRange =
        (!filters.dateFrom || new Date(date.date) >= new Date(filters.dateFrom)) &&
        (!filters.dateTo || new Date(date.date) <= new Date(filters.dateTo))

      const matchesLocation = !filters.location || date.location.toLowerCase().includes(filters.location.toLowerCase())

      return matchesSearch && matchesDateRange && matchesLocation
    })
    
    // Sort filtered results as well
    filtered.sort(sortDates);
    
    return filtered;
  }

  const getFilteredSchedule = (schedule) => {
    return schedule.filter((item) => {
      const matchesSearch =
        item.faculty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase())

      return matchesSearch
    })
  }

  const filteredDates = getFilteredDates()
  const filteredConvocation = getFilteredSchedule(convocationSchedule)
  const filteredAttire = getFilteredSchedule(attireSchedule)

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file && file.type === "application/pdf") {
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
      pdfUrl: isEdit ? formData.pdfUrl : "",
      pdfName: isEdit ? formData.pdfName : "",
    })

    if (isEdit && editFileInputRef.current) {
      editFileInputRef.current.value = ""
    } else if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const uploadPdfToFirebase = async (file, dateId) => {
    if (!file) return { url: "", name: "" }

    try {
      if (file.type !== "application/pdf") {
        throw new Error("File must be a PDF")
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File size must be less than 10MB")
      }

      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const storageRef = ref(storage, `importantDates/${dateId}/${fileName}`);

      const uploadTask = uploadBytes(storageRef, file, {
        contentType: "application/pdf",
        customMetadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      })

      const uploadPromise = Promise.race([
        uploadTask,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Upload timed out after 60 seconds")), 60000)),
      ])

      const uploadResult = await uploadPromise
      const downloadUrl = await getDownloadURL(storageRef)

      return {
        url: downloadUrl,
        name: fileName,
        originalName: file.name,
      }
    } catch (error) {
      console.error("Detailed upload error:", error)
      throw new Error(`Upload failed: ${error.message || "Unknown error"}`)
    }
  }

  const deletePdfFromFirebase = async (dateId, fileName) => {
    if (!fileName) return

    try {
      const fileRef = ref(storage, `importantDates/${dateId}/${fileName}`)
      await deleteObject(fileRef)
    } catch (error) {
      console.error("Error deleting file from Firebase Storage:", error)
    }
  }

  const handleViewDate = async (date) => {
    if (date.pdfUrl && !date.pdfFile) {
      try {
        setViewingDate({ ...date, loadingPdf: true })
        setIsViewModalOpen(true)

        const response = await fetch(date.pdfUrl)
        const blob = await response.blob()
        const file = new File([blob], date.pdfOriginalName || date.pdfName || "document.pdf", { type: "application/pdf" }) // Use original name

        const updatedDate = { ...date, pdfFile: file, loadingPdf: false }
        setViewingDate(updatedDate)

        setDates(dates.map((d) => (d.id === date.id ? { ...d, pdfFile: file } : d)))
      } catch (error) {
        console.error("Error loading PDF:", error)
        setViewingDate({ ...date, loadingPdf: false, pdfError: true })
      }
    } else {
      setViewingDate(date)
      setIsViewModalOpen(true)
    }
  }

  // Removed all drag-and-drop handler functions:
  // handleDragStart, handleDragOver, handleDragEnter, handleDragLeave, handleDrop, handleDragEnd

  const handleAddNew = () => {
    setFormData({
      title: "",
      date: "",
      time: "",
      location: "",
      pdfFile: null,
      pdfUrl: "",
      pdfName: "",
      faculty: "",
      timeSlot: "",
    })
    setIsAddModalOpen(true)
  }

  const handleEdit = (e, item) => {
    e.stopPropagation()
    setEditingDate(item)

    if (activeTab === "general") {
      setFormData({
        title: item.title,
        date: item.date,
        time: item.time,
        location: item.location,
        pdfFile: item.pdfFile,
        pdfUrl: item.pdfUrl || "",
        pdfName: item.pdfName || "",
        pdfOriginalName: item.pdfOriginalName || item.pdfName || "",
        faculty: "",
        timeSlot: "",
      })

      if (item.pdfUrl && !item.pdfFile) {
        preloadPdfForEdit(item)
      }
    } else {
      setFormData({
        title: "",
        date: item.date,
        time: "",
        location: item.location,
        pdfFile: null,
        pdfUrl: "",
        pdfName: "",
        faculty: item.faculty,
        timeSlot: item.timeSlot,
      })
    }

    setIsEditModalOpen(true)
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        if (activeTab === "general") {
          const dateToDelete = dates.find((date) => date.id === id)
          await deleteDoc(doc(db, "importantDates", id))
          if (dateToDelete.pdfName) {
            await deletePdfFromFirebase(id, dateToDelete.pdfName)
          }
          const newDates = dates.filter((date) => date.id !== id);
          newDates.sort(sortDates); // Re-sort after deletion
          setDates(newDates);
          await notifyImportantDateDeleted()
        } else if (activeTab === "convocation") {
          await deleteDoc(doc(db, "convocationSchedule", id))
          setConvocationSchedule(convocationSchedule.filter((item) => item.id !== id))
          await notifyConvocationScheduleDeleted()
        } else if (activeTab === "attire") {
          await deleteDoc(doc(db, "attireSchedule", id))
          setAttireSchedule(attireSchedule.filter((item) => item.id !== id))
          await notifyAttireScheduleDeleted()
        }
      } catch (error) {
        console.error("Error deleting:", error)
        alert("Failed to delete. Please try again.")
      }
    }
  }

  const handleSubmitAdd = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)

      if (activeTab === "general") {
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
          // Removed order field
        })

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
          // Removed order field
        }

        if (formData.pdfFile) {
          try {
            const pdfData = await uploadPdfToFirebase(formData.pdfFile, docRef.id)
            await updateDoc(docRef, {
              pdfUrl: pdfData.url,
              pdfName: pdfData.name,
              pdfOriginalName: pdfData.originalName || formData.pdfFile.name,
            })

            newDate.pdfUrl = pdfData.url
            newDate.pdfName = pdfData.name
            newDate.pdfOriginalName = pdfData.originalName || formData.pdfFile.name
            newDate.pdfFile = formData.pdfFile
          } catch (pdfError) {
            console.error("PDF upload failed:", pdfError)
            alert(`PDF upload failed: ${pdfError.message}`)
          }
        }
        
        // Re-sort the array after adding the new item
        const updatedDates = [newDate, ...dates];
        updatedDates.sort(sortDates);
        setDates(updatedDates);
        
        await notifyImportantDateAdded(formData.title, formData.date)
      } else if (activeTab === "convocation") {
        const docRef = await addDoc(collection(db, "convocationSchedule"), {
          faculty: formData.faculty,
          date: formData.date,
          timeSlot: formData.timeSlot,
          location: formData.location,
          createdAt: serverTimestamp(),
        })

        const newSchedule = {
          id: docRef.id,
          faculty: formData.faculty,
          date: formData.date,
          timeSlot: formData.timeSlot,
          location: formData.location,
        }
        
        // Sort convocation schedule by date after adding
        const updatedSchedule = [...convocationSchedule, newSchedule];
        updatedSchedule.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setConvocationSchedule(updatedSchedule)

        const facultyName = FACULTY_OPTIONS.find(f => f.value === formData.faculty)?.label || formData.faculty
        await notifyConvocationScheduleAdded(facultyName, formData.date, formData.timeSlot)

      } else if (activeTab === "attire") {
        const docRef = await addDoc(collection(db, "attireSchedule"), {
          faculty: formData.faculty,
          date: formData.date,
          timeSlot: formData.timeSlot,
          location: formData.location,
          createdAt: serverTimestamp(),
        })

        const newSchedule = {
          id: docRef.id,
          faculty: formData.faculty,
          date: formData.date,
          timeSlot: formData.timeSlot,
          location: formData.location,
        }
        
        // Sort attire schedule by date after adding
        const updatedSchedule = [...attireSchedule, newSchedule];
        updatedSchedule.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setAttireSchedule(updatedSchedule)

        const facultyName = FACULTY_OPTIONS.find(f => f.id === formData.faculty)?.name || formData.faculty
        await notifyAttireScheduleAdded(facultyName, formData.date, formData.timeSlot)
      }

      setIsAddModalOpen(false)
      setFormData({
        title: "",
        date: "",
        time: "",
        location: "",
        pdfFile: null,
        pdfUrl: "",
        pdfName: "",
        faculty: "",
        timeSlot: "",
      })

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Error adding:", error)
      alert(`Failed to add: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!editingDate) return;

    try {
      setLoading(true);

      if (activeTab === "general") {
        const dateRef = doc(db, "importantDates", editingDate.id);
        let updateData = {
          title: formData.title,
          date: formData.date,
          time: formData.time,
          location: formData.location,
          updatedAt: serverTimestamp(),
        };
        
        let newPdfUrl = formData.pdfUrl;
        let newPdfName = formData.pdfName;
        let newPdfOriginalName = formData.pdfOriginalName;
        let newPdfFile = formData.pdfFile;
        
        const isNewFileSelected = formData.pdfFile && formData.pdfFile !== editingDate.pdfFile;
        const isFileRemoved = formData.pdfUrl === "" && editingDate.pdfUrl;
        
        if (isNewFileSelected) {
          try {
            const pdfData = await uploadPdfToFirebase(formData.pdfFile, editingDate.id);
            updateData.pdfUrl = pdfData.url;
            updateData.pdfName = pdfData.name;
            updateData.pdfOriginalName = pdfData.originalName || formData.pdfFile.name;
            newPdfUrl = pdfData.url;
            newPdfName = pdfData.name;
            newPdfOriginalName = pdfData.originalName || formData.pdfFile.name;
            
            if (editingDate.pdfName && editingDate.pdfName !== pdfData.name) {
              await deletePdfFromFirebase(editingDate.id, editingDate.pdfName);
            }
          } catch (pdfError) {
            console.error("PDF upload failed during edit:", pdfError);
            alert(`Warning: ${pdfError.message}`);
          }
        } else if (isFileRemoved) {
          try {
            await deletePdfFromFirebase(editingDate.id, editingDate.pdfName);
            updateData.pdfUrl = "";
            updateData.pdfName = "";
            updateData.pdfOriginalName = "";
            newPdfUrl = "";
            newPdfName = "";
            newPdfOriginalName = "";
            newPdfFile = null;
          } catch (deleteError) {
            console.error("Failed to delete PDF:", deleteError);
          }
        }

        await updateDoc(dateRef, updateData);
        
        const updatedDates = dates.map((date) => 
          date.id === editingDate.id ? { 
            ...date, 
            ...updateData,
            pdfFile: newPdfFile,
            pdfUrl: newPdfUrl,
            pdfName: newPdfName,
            pdfOriginalName: newPdfOriginalName,
          } : date
        );
        updatedDates.sort(sortDates);
        setDates(updatedDates);
        
        await notifyImportantDateUpdated(formData.title)
      } else if (activeTab === "convocation") {
        const scheduleRef = doc(db, "convocationSchedule", editingDate.id);
        const updateData = {
          faculty: formData.faculty,
          date: formData.date,
          timeSlot: formData.timeSlot,
          location: formData.location,
          updatedAt: serverTimestamp(),
        };

        await updateDoc(scheduleRef, updateData);
        
        const updatedSchedule = convocationSchedule.map((item) =>
          item.id === editingDate.id ? { ...item, ...updateData } : item
        );
        updatedSchedule.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setConvocationSchedule(updatedSchedule);

        const facultyName = FACULTY_OPTIONS.find(f => f.id === formData.faculty)?.name || formData.faculty
        await notifyConvocationScheduleUpdated(facultyName)

      } else if (activeTab === "attire") {
        const scheduleRef = doc(db, "attireSchedule", editingDate.id);
        const updateData = {
          faculty: formData.faculty,
          date: formData.date,
          timeSlot: formData.timeSlot,
          location: formData.location,
          updatedAt: serverTimestamp(),
        };

        await updateDoc(scheduleRef, updateData);
        
        const updatedSchedule = attireSchedule.map((item) =>
          item.id === editingDate.id ? { ...item, ...updateData } : item
        );
        updatedSchedule.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setAttireSchedule(updatedSchedule);

        const facultyName = FACULTY_OPTIONS.find(f => f.id === formData.faculty)?.name || formData.faculty
        await notifyAttireScheduleUpdated(facultyName)
      }

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
        faculty: "",
        timeSlot: "",
      });

      if (editFileInputRef.current) {
        editFileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error updating:", error);
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
      faculty: "",
      timeSlot: "",
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

  const handleDownloadPdf = (e, pdfUrl, fileName) => {
    e.stopPropagation()
    const link = document.createElement("a")
    link.href = pdfUrl
    link.download = fileName || "document.pdf"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const preloadPdfForEdit = async (date) => {
    if (date.pdfUrl && !date.pdfFile) {
      try {
        const response = await fetch(date.pdfUrl)
        const blob = await response.blob()
        const file = new File([blob], date.pdfOriginalName || date.pdfName || "document.pdf", { type: "application/pdf" })

        const updatedDate = { ...date, pdfFile: file }
        setDates(dates.map((d) => (d.id === date.id ? updatedDate : d)))
        setFormData((prev) => ({ ...prev, pdfFile: file }))

        return file
      } catch (error) {
        console.error("Error loading PDF for edit:", error)
        return null
      }
    }
    return null
  }

  const dateItemBaseClasses = "bg-white rounded-xl shadow-md p-6 transition-all duration-200 flex items-start justify-between relative cursor-pointer"
  // Removed drag-and-drop specific classes:
  // const dateItemDraggingClasses = "opacity-50 transform rotate-2 shadow-xl"
  // const dateItemDragOverClasses = "border-t-4 border-[#13274f] mt-1"


  return (
    <div className="min-h-screen bg-gray-50">
      {loading && (
        <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-[2000]">
          <div className="flex flex-col items-center justify-center p-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <Loader className="w-8 h-8 text-[#13274f] animate-spin" style={{ animation: "spin 1s linear infinite" }} />
            <p className="text-gray-600 mt-3 text-sm">Loading...</p>
          </div>
        </div>
      )}

      <div className="p-6 md:p-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[#13274f] m-0">Important Dates</h1>
          <div className="flex items-center gap-4">
            <Mail className="w-6 h-6 text-gray-500 cursor-pointer hover:text-[#13274f] transition-colors" />
            <Settings className="w-6 h-6 text-gray-500 cursor-pointer hover:text-[#13274f] transition-colors" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("general")}
            className={`px-6 py-3 font-semibold text-sm transition-all duration-200 border-b-2 ${
              activeTab === "general"
                ? "text-[#13274f] border-[#13274f]"
                : "text-gray-500 border-transparent hover:text-[#13274f]"
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab("convocation")}
            className={`px-6 py-3 font-semibold text-sm transition-all duration-200 border-b-2 ${
              activeTab === "convocation"
                ? "text-[#13274f] border-[#13274f]"
                : "text-gray-500 border-transparent hover:text-[#13274f]"
            }`}
          >
            Convocation Ceremony
          </button>
          <button
            onClick={() => setActiveTab("attire")}
            className={`px-6 py-3 font-semibold text-sm transition-all duration-200 border-b-2 ${
              activeTab === "attire"
                ? "text-[#13274f] border-[#13274f]"
                : "text-gray-500 border-transparent hover:text-[#13274f]"
            }`}
          >
            Academic Attire Collection
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={activeTab === "general" ? "Search by title, date, location..." : "Search by faculty, location..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-3 pl-10 pr-4 border border-gray-300 rounded-lg text-sm outline-none transition-all duration-200 focus:border-[#13274f] focus:ring-3 focus:ring-[#13274f]/10"
            />
          </div>
          <button
            className="flex items-center gap-2 px-6 py-3 border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap bg-[#13274f] text-white hover:bg-black"
          >
            SEARCH
          </button>
          {activeTab === "general" && (
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap ${
                hasActiveFilters 
                  ? 'bg-[#13274f] text-white border border-[#13274f] hover:bg-black' 
                  : 'bg-transparent text-[#13274f] border border-[#13274f] hover:bg-[#13274f] hover:text-white'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filter {hasActiveFilters && "(Active)"}
            </button>
          )}
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-6 py-3 border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap bg-[#fbbf24] text-black hover:bg-amber-500"
          >
            <Plus className="w-4 h-4" />
            ADD NEW
          </button>
        </div>

        {/* General Tab Content - Retains side color, no drag functionality */}
        {activeTab === "general" && (
          <div className="flex flex-col gap-4">
            {filteredDates.map((date) => (
              <div
                key={date.id}
                onClick={() => handleViewDate(date)}
                style={{
                  borderLeft: `4px solid ${getDateColor(date.date, date.time)}`, 
                }}
                // Removed drag-and-drop related classes and attributes
                className={`${dateItemBaseClasses} hover:shadow-xl`}
              >
                {/* Removed GripVertical and all drag-related handlers/logic */}
                {/* <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center cursor-grab rounded-l-lg transition-colors duration-200 hover:bg-[#13274f]/5">
                  <GripVertical className="text-gray-400 transition-colors duration-200" />
                </div> */}

                <div className="flex-1 ml-4"> {/* Adjusted margin from ml-12 to ml-4 */}
                  <h3 className="text-lg font-semibold text-gray-800 m-0 mb-3">{date.title}</h3>
                  <div className="flex items-center gap-6 text-gray-600 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">{formatDateDisplay(date.date, date.time)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{date.location}</span>
                    </div>
                    {date.pdfUrl && (
                      <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                        <FileText className="w-3 h-3" />
                        {date.pdfOriginalName || date.pdfName || "PDF Attachment"}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {date.pdfUrl && (
                    <button
                      onClick={(e) => handleDownloadPdf(e, date.pdfUrl, date.pdfName)}
                      className="flex items-center justify-center w-9 h-9 border-none rounded-md bg-transparent text-gray-500 cursor-pointer transition-all duration-200 hover:bg-sky-50 hover:text-sky-700"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleEdit(e, date)}
                    className="flex items-center justify-center w-9 h-9 border-none rounded-md bg-transparent text-gray-500 cursor-pointer transition-all duration-200 hover:bg-gray-100 hover:text-[#13274f]"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, date.id)}
                    className="flex items-center justify-center w-9 h-9 border-none rounded-md bg-transparent text-gray-500 cursor-pointer transition-all duration-200 hover:bg-red-50 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {!loading && filteredDates.length === 0 && (
              <div className="text-center py-12">
                <p className="text-lg text-gray-600 m-0">
                  {hasActiveFilters || searchTerm ? "No dates match your search criteria." : "No important dates found."}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Convocation Ceremony Tab Content - Removed side color */}
        {activeTab === "convocation" && (
          <div className="flex flex-col gap-4">
            {filteredConvocation.map((schedule) => (
              <div
                key={schedule.id}
                // Removed inline style for borderLeft color
                className="bg-white rounded-xl shadow-md p-6 transition-all duration-200 hover:shadow-xl border-l-4 border-gray-200" // Added a neutral light gray border for consistency
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 m-0 mb-3">{FACULTY_OPTIONS.find(f => f.id === schedule.faculty)?.name || schedule.faculty}</h3>
                    <div className="flex items-center gap-6 text-gray-600 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">{formatDateDisplay(schedule.date, "")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{schedule.timeSlot}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{schedule.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={(e) => handleEdit(e, schedule)}
                      className="flex items-center justify-center w-9 h-9 border-none rounded-md bg-transparent text-gray-500 cursor-pointer transition-all duration-200 hover:bg-gray-100 hover:text-[#13274f]"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, schedule.id)}
                      className="flex items-center justify-center w-9 h-9 border-none rounded-md bg-transparent text-gray-500 cursor-pointer transition-all duration-200 hover:bg-red-50 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {!loading && filteredConvocation.length === 0 && (
              <div className="text-center py-12">
                <p className="text-lg text-gray-600 m-0">
                  {searchTerm ? "No schedules match your search criteria." : "No convocation ceremony schedules found."}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Academic Attire Collection Tab Content - Removed side color */}
        {activeTab === "attire" && (
          <div className="flex flex-col gap-4">
            {filteredAttire.map((schedule) => (
              <div
                key={schedule.id}
                // Removed inline style for borderLeft color
                className="bg-white rounded-xl shadow-md p-6 transition-all duration-200 hover:shadow-xl border-l-4 border-gray-200" // Added a neutral light gray border for consistency
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 m-0 mb-3">{FACULTY_OPTIONS.find(f => f.id === schedule.faculty)?.name || schedule.faculty}</h3>
                    <div className="flex items-center gap-6 text-gray-600 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">{formatDateDisplay(schedule.date, "")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{schedule.timeSlot}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{schedule.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={(e) => handleEdit(e, schedule)}
                      className="flex items-center justify-center w-9 h-9 border-none rounded-md bg-transparent text-gray-500 cursor-pointer transition-all duration-200 hover:bg-gray-100 hover:text-[#13274f]"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, schedule.id)}
                      className="flex items-center justify-center w-9 h-9 border-none rounded-md bg-transparent text-gray-500 cursor-pointer transition-all duration-200 hover:bg-red-50 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {!loading && filteredAttire.length === 0 && (
              <div className="text-center py-12">
                <p className="text-lg text-gray-600 m-0">
                  {searchTerm ? "No schedules match your search criteria." : "No academic attire collection schedules found."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* View Modal, Filter Modal, Add Modal, and Edit Modal remain the same */}
      {/* ... (View Modal JSX) ... */}
      {/* ... (Filter Modal JSX) ... */}
      {/* ... (Add Modal JSX) ... */}
      {/* ... (Edit Modal JSX) ... */}

      {/* View Modal */}
      {isViewModalOpen && viewingDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={closeModal}>
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto m-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 mb-6">
              <h2 className="text-xl font-semibold text-[#13274f] m-0">View Important Date</h2>
              <button
                onClick={closeModal}
                className="bg-transparent border-none text-gray-500 text-2xl cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded-md transition-all duration-200 hover:bg-gray-100 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            <div className="p-6 pt-0">
              <div className="mb-6">
                <h3 className="text-base font-semibold text-gray-700 mb-2">Title</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{viewingDate.title}</p>
              </div>

              <div className="mb-6">
                <h3 className="text-base font-semibold text-gray-700 mb-2">Date & Time</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{formatDateDisplay(viewingDate.date, viewingDate.time)}</p>
              </div>

              <div className="mb-6">
                <h3 className="text-base font-semibold text-gray-700 mb-2">Location</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{viewingDate.location}</p>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-base font-semibold text-gray-700 m-0">Guideline (PDF)</h3>
                  {viewingDate.pdfUrl && (
                    <button
                      className="flex items-center gap-1 px-3 py-1 bg-blue-800 text-white rounded-md text-xs font-medium cursor-pointer border-none transition-colors duration-200 hover:bg-blue-900"
                      onClick={(e) => handleDownloadPdf(e, viewingDate.pdfUrl, viewingDate.pdfName)}
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download PDF
                    </button>
                  )}
                </div>

                {viewingDate.loadingPdf ? (
                  <div className="flex flex-col items-center justify-center p-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <Loader className="w-8 h-8 text-[#13274f] animate-spin" />
                    <p className="text-gray-600 mt-3 text-sm">Loading PDF...</p>
                  </div>
                ) : viewingDate.pdfError ? (
                  <div className="text-center p-10 text-red-500 bg-gray-50 rounded-lg border border-dashed border-red-300">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-red-500" />
                    <p>Error loading PDF. Please try again.</p>
                  </div>
                ) : viewingDate.pdfFile ? (
                  <iframe src={URL.createObjectURL(viewingDate.pdfFile)} className="w-full h-[400px] border border-gray-300 rounded-lg" title="PDF Viewer" />
                ) : viewingDate.pdfUrl ? (
                  <iframe src={viewingDate.pdfUrl} className="w-full h-[400px] border border-gray-300 rounded-lg" title="PDF Viewer" />
                ) : (
                  <div className="text-center p-10 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={closeModal}>
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 mb-6">
              <h2 className="text-xl font-semibold text-[#13274f] m-0">Filter Important Dates</h2>
              <button
                onClick={closeModal}
                className="bg-transparent border-none text-gray-500 text-2xl cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded-md transition-all duration-200 hover:bg-gray-100 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            <div className="p-6 pt-0">
              <div className="flex items-center gap-3 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <label className="text-sm font-medium text-gray-700 min-w-[80px]">Date From:</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="p-2 border border-gray-300 rounded-md text-sm outline-none transition-all duration-200 focus:border-[#13274f] focus:ring-3 focus:ring-[#13274f]/10"
                />
              </div>
              <div className="flex items-center gap-3 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <label className="text-sm font-medium text-gray-700 min-w-[80px]">Date To:</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="p-2 border border-gray-300 rounded-md text-sm outline-none transition-all duration-200 focus:border-[#13274f] focus:ring-3 focus:ring-[#13274f]/10"
                />
              </div>
              <div className="flex items-center gap-3 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <label className="text-sm font-medium text-gray-700 min-w-[80px]">Location:</label>
                <input
                  type="text"
                  placeholder="Filter by location..."
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className="p-2 border border-gray-300 rounded-md text-sm outline-none transition-all duration-200 focus:border-[#13274f] focus:ring-3 focus:ring-[#13274f]/10 flex-1"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg text-white bg-red-500 hover:bg-red-700 transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 bg-transparent hover:bg-gray-50 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={closeModal}
                  className="px-6 py-3 rounded-lg text-sm font-semibold text-white bg-[#13274f] hover:bg-black transition-colors"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={closeModal}>
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 mb-6">
              <h2 className="text-xl font-semibold text-[#13274f] m-0">
                Add New {activeTab === "general" ? "Important Date" : activeTab === "convocation" ? "Convocation Ceremony" : "Attire Collection Schedule"}
              </h2>
              <button
                onClick={closeModal}
                className="bg-transparent border-none text-gray-500 text-2xl cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded-md transition-all duration-200 hover:bg-gray-100 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmitAdd} className="p-6 pt-0">
              {activeTab === "general" ? (
                <>
                  <div className="mb-5">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Title *
                    </label>
                    <textarea
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter event title"
                      required
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none transition-all duration-200 resize-y min-h-[80px] focus:border-[#13274f] focus:ring-3 focus:ring-[#13274f]/10"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="mb-5">
                      <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Start Date *
                      </label>
                      <input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none transition-all duration-200 focus:border-[#13274f] focus:ring-3 focus:ring-[#13274f]/10"
                      />
                    </div>
                    <div className="mb-5">
                      <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1.5">
                        End Date (Optional)
                      </label>
                      <input
                        id="time"
                        type="date"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none transition-all duration-200 focus:border-[#13274f] focus:ring-3 focus:ring-[#13274f]/10"
                      />
                    </div>
                  </div>
                  <div className="mb-5">
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Platform/Location *
                    </label>
                    <input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Enter location"
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none transition-all duration-200 focus:border-[#13274f] focus:ring-3 focus:ring-[#13274f]/10"
                    />
                  </div>
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">PDF Guideline (Optional)</label>
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 transition-all duration-200 cursor-pointer hover:border-[#13274f] hover:bg-blue-50"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-6 h-6 text-gray-500 mx-auto" />
                      <p className="text-gray-600 text-sm mt-2 mb-0">Click to upload PDF or drag and drop</p>
                      <p className="text-gray-600 text-xs mt-0">PDF files only, max 10MB</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {formData.pdfFile && (
                      <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-500 rounded-lg mt-2">
                        <div className="flex items-center gap-2 text-blue-700 text-sm">
                          <FileText className="w-4 h-4" />
                          <span>{formData.pdfFile.name}</span>
                          <span className="text-gray-400 text-xs ml-1">
                            ({(formData.pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(false)}
                          className="bg-transparent border-none text-red-500 cursor-pointer p-1 rounded-sm transition-colors duration-200 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-5">
                    <label htmlFor="faculty" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Faculty *
                    </label>
                    <select
                      id="faculty"
                      value={formData.faculty}
                      onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none transition-all duration-200 focus:border-[#13274f] focus:ring-3 focus:ring-[#13274f]/10"
                  >
                      <option value="">Select Faculty</option>
                      {FACULTY_OPTIONS.map((faculty) => (
                          <option key={faculty.value} value={faculty.value}>
                              {faculty.label}
                          </option>
                      ))}
                  </select>
                  </div>
                  <div className="mb-5">
                    <label htmlFor="schedule-date" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Date *
                    </label>
                    <input
                      id="schedule-date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none transition-all duration-200 focus:border-[#13274f] focus:ring-3 focus:ring-[#13274f]/10"
                    />
                  </div>
                  <div className="mb-5">
                    <label htmlFor="timeSlot" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Time Slot *
                    </label>
                    <input
                      id="timeSlot"
                      type="text"
                      value={formData.timeSlot}
                      onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                      placeholder="e.g., 9:00 AM - 11:00 AM"
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none transition-all duration-200 focus:border-[#13274f] focus:ring-3 focus:ring-[#13274f]/10"
                    />
                  </div>
                  <div className="mb-5">
                    <label htmlFor="schedule-location" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Location *
                    </label>
                    <input
                      id="schedule-location"
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Enter location"
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none transition-all duration-200 focus:border-[#13274f] focus:ring-3 focus:ring-[#13274f]/10"
                    />
                  </div>
                </>
              )}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 bg-transparent hover:bg-gray-50 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white bg-[#13274f] hover:bg-black transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    `Add ${activeTab === "general" ? "Date" : "Schedule"}`
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={closeModal}>
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 mb-6">
              <h2 className="text-xl font-semibold text-[#13274f] m-0">
                Edit {activeTab === "general" ? "Important Date" : activeTab === "convocation" ? "Convocation Ceremony" : "Attire Collection Schedule"}
              </h2>
              <button
                onClick={closeModal}
                className="bg-transparent border-none text-gray-500 text-2xl cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded-md transition-all duration-200 hover:bg-gray-100 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmitEdit} className="p-6 pt-0">
              {activeTab === "general" ? (
                <>
                  <div className="mb-5">
                    <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Title *
                    </label>
                    <textarea
                      id="edit-title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter event title"
                      required
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none transition-all duration-200 resize-y min-h-[80px] focus:border-[#13274f] focus:ring-3 focus:ring-[#13274f]/10"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="mb-5">
                      <label htmlFor="edit-date" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Start Date *
                      </label>
                      <input
                        id="edit-date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none transition-all duration-200 focus:border-[#13274f] focus:ring-3 focus:ring-[#13274f]/10"
                      />
                    </div>
                    <div className="mb-5">
                      <label htmlFor="edit-time" className="block text-sm font-medium text-gray-700 mb-1.5">
                        End Date (Optional)
                      </label>
                      <input
                        id="edit-time"
                        type="date"
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none transition-all duration-200 focus:border-[#13274f] focus:ring-3 focus:ring-[#13274f]/10"
                      />
                    </div>
                  </div>
                  <div className="mb-5">
                    <label htmlFor="edit-location" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Platform / Location *
                    </label>
                    <input
                      id="edit-location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Enter location"
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none transition-all duration-200 focus:border-[#13274f] focus:ring-3 focus:ring-[#13274f]/10"
                    />
                  </div>
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">PDF Guideline (Optional)</label>

                    {formData.pdfUrl && !formData.pdfFile && (
                      <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-500 rounded-lg mb-2">
                        <div className="flex items-center gap-2 text-blue-700 text-sm">
                          <FileText className="w-4 h-4" />
                          <span>{formData.pdfOriginalName || formData.pdfName || "Current PDF"}</span>
                          <span className="text-blue-700 text-xs ml-1">(Current PDF)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, pdfUrl: "", pdfName: "", pdfFile: null })} // Remove URL and file reference
                          className="bg-transparent border-none text-red-500 cursor-pointer p-1 rounded-sm transition-colors duration-200 hover:bg-red-50"
                          title="Remove current PDF"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 transition-all duration-200 cursor-pointer hover:border-[#13274f] hover:bg-blue-50"
                      onClick={() => editFileInputRef.current?.click()}
                    >
                      <Upload className="w-6 h-6 text-gray-500 mx-auto" />
                      <p className="text-gray-600 text-sm mt-2 mb-0">Click to upload new PDF or drag and drop</p>
                      <p className="text-gray-600 text-xs mt-0">PDF files only, max 10MB</p>
                    </div>
                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileUpload(e, true)}
                      className="hidden"
                    />

                    {formData.pdfFile && (
                      <div className={`flex items-center justify-between p-3 border rounded-lg mt-2 ${formData.pdfUrl && !editFileInputRef.current?.value ? 'bg-blue-50 border-blue-500' : 'bg-green-50 border-green-500'}`}>
                        <div className="flex items-center gap-2 text-green-700 text-sm">
                          <FileText className="w-4 h-4" />
                          <span>{formData.pdfFile.name}</span>
                          <span className="text-gray-400 text-xs ml-1">
                            ({(formData.pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(true)}
                          className="bg-transparent border-none text-red-500 cursor-pointer p-1 rounded-sm transition-colors duration-200 hover:bg-red-50"
                          title="Remove uploaded file"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-5">
                    <label htmlFor="edit-faculty" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Faculty *
                    </label>
                    <select
                      id="edit-faculty"
                      value={formData.faculty}
                      onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none transition-all duration-200 focus:border-[#13274f] focus:ring-3 focus:ring-[#13274f]/10"
                    >
                      <option value="">Select Faculty</option>
                      {FACULTY_OPTIONS.map((faculty) => (
                        <option key={faculty.id} value={faculty.id}>
                          {faculty.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-5">
                    <label htmlFor="edit-schedule-date" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Date *
                    </label>
                    <input
                      id="edit-schedule-date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none transition-all duration-200 focus:border-[#13274f] focus:ring-3 focus:ring-[#13274f]/10"
                    />
                  </div>
                  <div className="mb-5">
                    <label htmlFor="edit-timeSlot" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Time Slot *
                    </label>
                    <input
                      id="edit-timeSlot"
                      type="text"
                      value={formData.timeSlot}
                      onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                      placeholder="e.g., 9:00 AM - 11:00 AM"
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none transition-all duration-200 focus:border-[#13274f] focus:ring-3 focus:ring-[#13274f]/10"
                    />
                  </div>
                  <div className="mb-5">
                    <label htmlFor="edit-schedule-location" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Location *
                    </label>
                    <input
                      id="edit-schedule-location"
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Enter location"
                      required
                      className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none transition-all duration-200 focus:border-[#13274f] focus:ring-3 focus:ring-[#13274f]/10"
                    />
                  </div>
                </>
              )}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 bg-transparent hover:bg-gray-50 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white bg-[#13274f] hover:bg-black transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    `Update ${activeTab === "general" ? "Date" : "Schedule"}`
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