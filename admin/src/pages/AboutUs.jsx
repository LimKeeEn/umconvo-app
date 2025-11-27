import { useState, useEffect } from "react"
import { ChevronDown, Mail, Settings, Plus, Download, Edit, Trash2, Search, X } from "lucide-react"
import { storage, db } from "../firebaseConfig" // Assuming you have firebaseConfig correctly set up
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { collection, addDoc, onSnapshot, updateDoc, doc, deleteDoc, query, where, setDoc } from "firebase/firestore"

// --- Utility Components ---
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
    case "ghost":
      variantClasses = "bg-transparent text-gray-600 hover:bg-gray-100 disabled:opacity-50"
      break
    case "search":
      variantClasses = "bg-[#13274f] text-white hover:bg-[#0f1f41] disabled:opacity-50"
      break
    case "add":
      variantClasses = "bg-amber-400 text-black font-semibold hover:bg-amber-500 disabled:opacity-50"
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
  // For file type, value should be undefined if not used for display
  const controlledValue = type === 'file' ? undefined : value ?? '' 
  return (
    <input
      type={type}
      value={controlledValue}
      onChange={onChange}
      placeholder={placeholder}
      className={`${inputClasses} ${className}`}
      {...props}
    />
  )
}

const Dialog = ({ open, children, onClose }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-4" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

const DialogHeader = ({ children }) => {
  return <div className="px-6 pt-6 border-b border-gray-200 mb-6">{children}</div>
}

const DialogTitle = ({ children }) => {
  return <h3 className="text-xl font-semibold text-[#13274f] m-0 pb-3">{children}</h3>
}

const DialogFooter = ({ children }) => {
  return <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6 px-4">{children}</div>
}

const Label = ({ children, htmlFor }) => {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1.5">
      {children}
    </label>
  )
}

// --- AboutUs Component ---
const AboutUs = () => {
  const [activeTab, setActiveTab] = useState("the-maze")
  const [mazeSubTab, setMazeSubTab] = useState("the-maze")

  // Firebase state
  const [mazeImage, setMazeImage] = useState(null)
  const [regaliaImages, setRegaliaImages] = useState([])
  const [keyPeople, setKeyPeople] = useState([])
  const [campusImages, setCampusImages] = useState(null)
  const [contacts, setContacts] = useState([]) // MODIFIED: Array of contact objects
  const [uploading, setUploading] = useState(false)

  // Modal states
  const [showEditMazeModal, setShowEditMazeModal] = useState(false)
  const [showAddImageModal, setShowAddImageModal] = useState(false)
  const [showAddPersonModal, setShowAddPersonModal] = useState(false)
  const [showEditPersonModal, setShowEditPersonModal] = useState(false)
  const [editingPerson, setEditingPerson] = useState(null)
  const [showEditCampusModal, setShowEditCampusModal] = useState(false)
  const [editingRegalia, setEditingRegalia] = useState(null)
  const [showEditRegaliaModal, setShowEditRegaliaModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [editingContact, setEditingContact] = useState(null)

  // Form states
  const [selectedFile, setSelectedFile] = useState(null)
  const [imageTitle, setImageTitle] = useState("")
  const [imageCategory, setImageCategory] = useState("maze")
  const [personTitle, setPersonTitle] = useState("")
  const [personWebsite, setPersonWebsite] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  // Contact Form States (For multi-slot contacts)
  const [contactTitle, setContactTitle] = useState("")
  const [contactRole, setContactRole] = useState("")
  const [contactOrg, setContactOrg] = useState("")
  const [contactEmails, setContactEmails] = useState([""])
  const [contactPhones, setContactPhones] = useState([""])

  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [hoveredCard, setHoveredCard] = useState(null)

  // --- Utility Functions for Dynamic Inputs ---
  const handleAddInput = (type) => {
    if (type === 'email') {
      setContactEmails(prev => [...prev, ""])
    } else if (type === 'phone') {
      setContactPhones(prev => [...prev, ""])
    }
  }

  const handleRemoveInput = (type, index) => {
    if (type === 'email') {
      // Ensure there's always at least one empty input remaining if the array becomes empty
      setContactEmails(prev => {
        const newArr = prev.filter((_, i) => i !== index);
        return newArr.length === 0 ? [""] : newArr;
      })
    } else if (type === 'phone') {
      setContactPhones(prev => {
        const newArr = prev.filter((_, i) => i !== index);
        return newArr.length === 0 ? [""] : newArr;
      })
    }
  }

  const handleInputChange = (type, index, value) => {
    if (type === 'email') {
      setContactEmails(prev => prev.map((item, i) => i === index ? value : item))
    } else if (type === 'phone') {
      setContactPhones(prev => prev.map((item, i) => i === index ? value : item))
    }
  }
  
  // --- Modal Control Functions ---
  const resetContactForm = () => {
    setContactTitle("")
    setContactRole("")
    setContactOrg("")
    setContactEmails([""])
    setContactPhones([""])
    setEditingContact(null)
  }

  const closeContactModal = () => {
    setShowContactModal(false)
    resetContactForm()
  }

  const openAddContactModal = () => {
    resetContactForm()
    setShowContactModal(true)
  }

  const openEditContactModal = (contact) => {
    setEditingContact(contact)
    setContactTitle(contact.title || "")
    setContactRole(contact.role || "")
    setContactOrg(contact.organization || "")
    // Set to array content, defaulting to [""] if array is empty or missing
    setContactEmails(contact.emails && contact.emails.length > 0 ? contact.emails : [""])
    setContactPhones(contact.phones && contact.phones.length > 0 ? contact.phones : [""])
    setShowContactModal(true)
  }

  const closeEditMazeModal = () => {
    setShowEditMazeModal(false)
    setSelectedFile(null)
  }

  const closeAddImageModal = () => {
    setShowAddImageModal(false)
    setSelectedFile(null)
    setImageTitle("")
  }

  const closeEditRegaliaModal = () => {
    if (selectedFile && typeof selectedFile === 'object') {
      try {
        URL.revokeObjectURL(selectedFile)
      } catch (e) {
        console.warn("Could not revoke object URL:", e)
      }
    }
    setShowEditRegaliaModal(false)
    setEditingRegalia(null)
    setSelectedFile(null)
    setImageTitle("")
  }

  const closeAddPersonModal = () => {
    setShowAddPersonModal(false)
    setPersonTitle("")
    setPersonWebsite("")
  }

  const closeEditPersonModal = () => {
    setShowEditPersonModal(false)
    setEditingPerson(null)
    setPersonTitle("")
    setPersonWebsite("")
  }

  const closeEditCampusModal = () => {
    setShowEditCampusModal(false)
    setSelectedFile(null)
  }

  const openEditRegaliaModal = (image) => {
    setEditingRegalia(image)
    setImageTitle(image.title)
    setSelectedFile(null)
    setShowEditRegaliaModal(true)
  }

  const openEditPersonModal = (person) => {
    setEditingPerson(person)
    setPersonTitle(person.title)
    setPersonWebsite(person.website)
    setShowEditPersonModal(true)
  }


  // --- Data Fetching ---
  useEffect(() => {
    console.log("Setting up Firestore listeners...")

    try {
      const unsubMaze = onSnapshot(query(collection(db, "aboutus_images"), where("category", "==", "maze")), (snapshot) => {
        const images = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setMazeImage(images.length > 0 ? images[0] : null)
      }, (error) => { console.error("Error fetching maze images:", error) })

      const unsubRegalia = onSnapshot(query(collection(db, "aboutus_images"), where("category", "==", "regalia")), (snapshot) => {
        setRegaliaImages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
      }, (error) => { console.error("Error fetching regalia images:", error) })

      const unsubPeople = onSnapshot(collection(db, "key_people"), (snapshot) => {
        setKeyPeople(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
      }, (error) => { console.error("Error fetching key people:", error) })

      const unsubCampus = onSnapshot(query(collection(db, "aboutus_images"), where("category", "==", "campus")), (snapshot) => {
        const images = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setCampusImages(images.length > 0 ? images[0] : null)
      }, (error) => { console.error("Error fetching campus images:", error) })

      // Contact Info Listener
      const unsubContacts = onSnapshot(
        collection(db, "contacts"),
        (snapshot) => {
          console.log("Contacts updated:", snapshot.docs.length)
          setContacts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
        },
        (error) => { console.error("Error fetching contacts:", error) }
      )

      return () => {
        unsubMaze()
        unsubRegalia()
        unsubPeople()
        unsubCampus()
        unsubContacts()
      }
    } catch (error) {
      console.error("Error setting up Firestore listeners:", error)
      alert("Error connecting to database. Please check your Firebase configuration.")
    }
  }, [])

  // --- Data Management Handlers ---

  const handleAddImageUpload = async () => {
    if (!selectedFile || !imageTitle.trim()) {
      alert("Please select a file and enter a title.")
      return
    }

    if (imageCategory !== "regalia") {
      alert("Internal error: Image category is incorrect.")
      return
    }

    setUploading(true)
    try {
      const fileName = `${Date.now()}_${selectedFile.name.replace(/\s+/g, '_')}`
      const storageRef = ref(storage, `aboutus/regalia/${fileName}`)
      const snapshot = await uploadBytes(storageRef, selectedFile)
      const downloadURL = await getDownloadURL(snapshot.ref)

      const docRef = await addDoc(collection(db, "aboutus_images"), {
        title: imageTitle.trim(),
        url: downloadURL,
        category: imageCategory,
        createdAt: new Date(),
      })

      console.log("Regalia image added with ID:", docRef.id)
      closeAddImageModal()
      alert("Image added successfully!")
    } catch (error) {
      console.error("Upload error:", error)
      alert("Error adding image: " + (error.message || "Please try again."))
    } finally {
      setUploading(false)
    }
  }

  const handleEditImageUpload = async () => {
    if (!imageTitle.trim() || !editingRegalia) {
      alert("Please enter a title.")
      return
    }

    setUploading(true)
    try {
      let downloadURL = editingRegalia.url

      if (selectedFile) {
        if (editingRegalia.url && !editingRegalia.url.includes("placeholder")) {
          try {
            // Check if URL is a Firebase Storage URL before trying to delete
            if (editingRegalia.url.startsWith("gs://") || editingRegalia.url.includes("firebasestorage.googleapis.com")) {
              await deleteObject(ref(storage, editingRegalia.url))
              console.log("Old regalia image deleted from storage.")
            }
          } catch (deleteError) {
            console.warn("Could not delete old image (may not exist in storage or is not a storage URL):", deleteError)
          }
        }

        const fileName = `${Date.now()}_${selectedFile.name.replace(/\s+/g, '_')}`
        const storageRef = ref(storage, `aboutus/regalia/${fileName}`)
        const snapshot = await uploadBytes(storageRef, selectedFile)
        downloadURL = await getDownloadURL(snapshot.ref)
        console.log("New regalia image uploaded:", downloadURL)
      }

      await updateDoc(doc(db, "aboutus_images", editingRegalia.id), {
        title: imageTitle.trim(),
        url: downloadURL,
        updatedAt: new Date(),
      })

      console.log("Regalia image updated with ID:", editingRegalia.id)
      closeEditRegaliaModal()
      alert("Image updated successfully!")
    } catch (error) {
      console.error("Update error:", error)
      alert("Error updating image: " + (error.message || "Please try again."))
    } finally {
      setUploading(false)
    }
  }

  const handleCampusImageUpdate = async () => {
    if (!selectedFile) {
      alert("Please select a file")
      return
    }

    setUploading(true)
    try {
      if (campusImages) {
        try {
          if (campusImages.url.startsWith("gs://") || campusImages.url.includes("firebasestorage.googleapis.com")) {
            await deleteObject(ref(storage, campusImages.url))
          }
          await deleteDoc(doc(db, "aboutus_images", campusImages.id))
          console.log("Old campus image deleted")
        } catch (deleteError) {
          console.warn("Could not delete old image:", deleteError)
        }
      }

      const fileName = `${Date.now()}_${selectedFile.name.replace(/\s+/g, '_')}`
      const storageRef = ref(storage, `aboutus/campus/${fileName}`)
      const snapshot = await uploadBytes(storageRef, selectedFile)
      const downloadURL = await getDownloadURL(snapshot.ref)

      await addDoc(collection(db, "aboutus_images"), {
        title: "Campus Map",
        url: downloadURL,
        category: "campus",
        createdAt: new Date(),
      })

      console.log("Campus image updated successfully")
      closeEditCampusModal()
      alert("Campus image updated successfully!")
    } catch (error) {
      console.error("Upload error:", error)
      alert("Error updating campus image: " + (error.message || "Please try again."))
    } finally {
      setUploading(false)
    }
  }

  const handleMazeImageUpdate = async () => {
    if (!selectedFile) {
      alert("Please select a file")
      return
    }

    setUploading(true)
    try {
      if (mazeImage) {
        try {
          if (mazeImage.url.startsWith("gs://") || mazeImage.url.includes("firebasestorage.googleapis.com")) {
            await deleteObject(ref(storage, mazeImage.url))
          }
          await deleteDoc(doc(db, "aboutus_images", mazeImage.id))
          console.log("Old maze image deleted")
        } catch (deleteError) {
          console.warn("Could not delete old image:", deleteError)
        }
      }

      const fileName = `${Date.now()}_${selectedFile.name.replace(/\s+/g, '_')}`
      const storageRef = ref(storage, `aboutus/maze/${fileName}`)
      const snapshot = await uploadBytes(storageRef, selectedFile)
      const downloadURL = await getDownloadURL(snapshot.ref)

      await addDoc(collection(db, "aboutus_images"), {
        title: "The Maze",
        url: downloadURL,
        category: "maze",
        createdAt: new Date(),
      })

      console.log("Maze image updated successfully")
      closeEditMazeModal()
      alert("Maze image updated successfully!")
    } catch (error) {
      console.error("Upload error:", error)
      alert("Error updating maze image: " + (error.message || "Please try again."))
    } finally {
      setUploading(false)
    }
  }

  const handlePersonUpload = async () => {
    if (!personTitle.trim() || !personWebsite.trim()) {
      alert("Please enter title and website link")
      return
    }

    try {
      new URL(personWebsite.trim())
    } catch (e) {
      alert("Please enter a valid website URL (e.g., https://example.com)")
      return
    }

    console.log("Starting person upload...")
    setUploading(true)
    try {
      const docRef = await addDoc(collection(db, "key_people"), {
        title: personTitle.trim(),
        website: personWebsite.trim(),
        createdAt: new Date(),
      })

      console.log("Person added with ID:", docRef.id)
      closeAddPersonModal()
      alert("Person added successfully!")
    } catch (error) {
      console.error("Error adding person:", error)
      alert("Error adding person: " + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handlePersonEdit = async () => {
    if (!personTitle.trim() || !personWebsite.trim()) {
      alert("Please enter title and website link")
      return
    }

    try {
      new URL(personWebsite.trim())
    } catch (e) {
      alert("Please enter a valid website URL (e.g., https://example.com)")
      return
    }

    console.log("Starting person edit...")
    setUploading(true)
    try {
      await updateDoc(doc(db, "key_people", editingPerson.id), {
        title: personTitle.trim(),
        website: personWebsite.trim(),
        updatedAt: new Date(),
      })

      console.log("Person updated successfully")
      closeEditPersonModal()
      alert("Person updated successfully!")
    } catch (error) {
      console.error("Error updating person:", error)
      alert("Error updating person: " + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteImage = async (id, imageUrl) => {
    if (window.confirm("Are you sure you want to delete this image?")) {
      try {
        if (imageUrl && !imageUrl.includes("placeholder")) {
          if (imageUrl.startsWith("gs://") || imageUrl.includes("firebasestorage.googleapis.com")) {
            await deleteObject(ref(storage, imageUrl))
          }
        }
        await deleteDoc(doc(db, "aboutus_images", id))
        console.log("Image deleted successfully")
      } catch (error) {
        console.error("Error deleting image:", error)
        alert("Error deleting image: " + error.message)
      }
    }
  }

  const handleDeletePerson = async (id) => {
    if (window.confirm("Are you sure you want to delete this person?")) {
      try {
        await deleteDoc(doc(db, "key_people", id))
        console.log("Person deleted successfully")
      } catch (error) {
        console.error("Error deleting person:", error)
        alert("Error deleting person: " + error.message)
      }
    }
  }

  // Contact Handlers (FINALIZED)
  const handleContactSubmit = async () => {
    // Clean and filter arrays
    const finalEmails = contactEmails.map(e => e.trim()).filter(e => e !== "")
    const finalPhones = contactPhones.map(p => p.trim()).filter(p => p !== "")

    if (!contactTitle.trim() || !contactRole.trim() || !contactOrg.trim() || (finalEmails.length === 0 && finalPhones.length === 0)) {
      alert("Please enter a title, role, organization, and at least one email or phone number.")
      return
    }
    
    // Simple email validation check for non-empty entries
    if (finalEmails.some(email => !email.includes('@') || !email.includes('.'))) {
        alert("Please ensure all email addresses are valid.")
        return
    }

    setUploading(true)
    const contactData = {
      title: contactTitle.trim(),
      role: contactRole.trim(),
      organization: contactOrg.trim(),
      emails: finalEmails,
      phones: finalPhones,
    }

    try {
      if (editingContact) {
        // EDIT MODE
        await updateDoc(doc(db, "contacts", editingContact.id), {
          ...contactData,
          updatedAt: new Date(),
        })
        console.log("Contact updated successfully:", editingContact.id)
        alert("Contact updated successfully!")
      } else {
        // ADD MODE
        const docRef = await addDoc(collection(db, "contacts"), {
          ...contactData,
          createdAt: new Date(),
        })
        console.log("Contact added with ID:", docRef.id)
        alert("Contact added successfully!")
      }
      closeContactModal()

    } catch (error) {
      console.error("Error submitting contact:", error)
      alert("Error submitting contact: " + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteContact = async (id) => {
    if (window.confirm("Are you sure you want to delete this contact entry?")) {
      try {
        await deleteDoc(doc(db, "contacts", id))
        console.log("Contact deleted successfully")
      } catch (error) {
        console.error("Error deleting contact:", error)
        alert("Error deleting contact: " + error.message)
      }
    }
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only close if click is outside the dropdown itself
      if (isDropdownOpen && !event.target.closest('.relative button')) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener("click", handleClickOutside)
    return () => {
      document.removeEventListener("click", handleClickOutside)
    }
  }, [isDropdownOpen])


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#13274f] m-0">About Us</h1>
          <div className="flex items-center gap-4">
            <Mail className="w-6 h-6 text-gray-500 cursor-pointer transition duration-200 hover:text-gray-700" />
            <Settings className="w-6 h-6 text-gray-500 cursor-pointer transition duration-200 hover:text-gray-700" />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <div className="relative">
            <button
              className={`flex items-center gap-2 px-6 py-3 border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 ${
                activeTab === "the-maze" && (mazeSubTab === "the-maze" || mazeSubTab === "academic-regalia") ? "bg-[#13274f] text-white" : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-100"
              }`}
              onClick={(e) => {
                e.stopPropagation()
                setIsDropdownOpen(!isDropdownOpen)
              }}
            >
              <span>{mazeSubTab === "the-maze" ? "The Maze" : "Academic Regalia"}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {isDropdownOpen && (
              <div className="absolute top-full left-0 z-10 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                <div
                  className="block px-4 py-3 text-sm text-gray-700 cursor-pointer transition duration-200 hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveTab("the-maze")
                    setMazeSubTab("the-maze")
                    setIsDropdownOpen(false)
                  }}
                >
                  The Maze
                </div>
                <div
                  className="block px-4 py-3 text-sm text-gray-700 cursor-pointer transition duration-200 hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveTab("the-maze")
                    setMazeSubTab("academic-regalia")
                    setIsDropdownOpen(false)
                  }}
                >
                  Academic Regalia
                </div>
              </div>
            )}
          </div>

          <button
            className={`px-6 py-3 border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 ${
              activeTab === "key-people" ? "bg-[#13274f] text-white" : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab("key-people")}
          >
            Key People
          </button>
          <button
            className={`px-6 py-3 border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 ${
              activeTab === "campus-map" ? "bg-[#13274f] text-white" : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab("campus-map")}
          >
            Campus Map
          </button>
          <button
            className={`px-6 py-3 border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 ${
              activeTab === "contact-us" ? "bg-[#13274f] text-white" : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab("contact-us")}
          >
            Contact Us
          </button>
        </div>


        {/* Content Area */}
        <div className="bg-gray-50 min-h-[calc(100vh-200px)] relative">
          {/* The Maze Content */}
          {activeTab === "the-maze" && mazeSubTab === "the-maze" && (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              <div className="flex flex-col gap-4">
                {mazeImage ? (
                  <div
                    className="bg-white rounded-xl shadow-md p-6 border border-gray-200 relative group"
                    onMouseEnter={() => setHoveredCard("maze-image")}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <div className={`absolute top-2 right-2 flex gap-1 transition-opacity duration-200 ${hoveredCard === "maze-image" ? "opacity-100" : "opacity-0"}`}>
                      <Button variant="outline" size="sm" onClick={() => setShowEditMazeModal(true)} className="w-7 h-7 p-1">
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold text-[#13274f]">{mazeImage.title}</h3>
                    </div>
                    <div className="bg-gray-100 rounded-md p-4 h-80 flex items-center justify-center">
                      <img src={mazeImage.url || "/placeholder.svg"} alt={mazeImage.title} className="max-w-full max-h-full object-contain" />
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                    <div
                      className="bg-white rounded-xl p-6 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer transition duration-200 h-full hover:border-gray-500"
                      onClick={() => setShowEditMazeModal(true)}
                    >
                      <Plus className="w-12 h-12 text-gray-400 mb-4" />
                      <p className="text-lg text-gray-600">Add Maze Image</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Academic Regalia Content */}
          {activeTab === "the-maze" && mazeSubTab === "academic-regalia" && (
            <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {regaliaImages.map((image) => (
                <div
                  key={image.id}
                  className="bg-white rounded-xl shadow-md p-6 border border-gray-200 relative group"
                  onMouseEnter={() => setHoveredCard(image.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div className={`absolute top-2 right-2 flex gap-1 transition-opacity duration-200 ${hoveredCard === image.id ? "opacity-100" : "opacity-0"}`}>
                    <Button variant="outline" size="sm" onClick={() => openEditRegaliaModal(image)} className="w-7 h-7 p-1">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteImage(image.id, image.url)} className="w-7 h-7 p-1">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="bg-gray-100 rounded-md h-32 mb-3 flex items-center justify-center">
                    <img src={image.url || "/placeholder.svg"} alt={image.title} className="max-w-full max-h-full object-contain" />
                  </div>
                  <p className="text-sm font-medium text-center">{image.title}</p>
                </div>
              ))}

              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <div
                  className="bg-white rounded-xl p-6 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer transition duration-200 h-full hover:border-gray-500"
                  onClick={() => {
                    setImageCategory("regalia")
                    setShowAddImageModal(true)
                  }}
                >
                  <Plus className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Add New</p>
                </div>
              </div>
            </div>
          )}

          {/* Key People Content */}
          {activeTab === "key-people" && (
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-[#13274f] m-0">Key People</h2>
                <Button variant="add" onClick={() => setShowAddPersonModal(true)}>
                  <Plus className="w-4 h-4" />
                  Add Person
                </Button>
              </div>
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {keyPeople.map((person) => (
                  <div
                    key={person.id}
                    className="bg-gray-50 rounded-lg p-4 relative group cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => window.open(person.website, '_blank')}
                    onMouseEnter={() => setHoveredCard(person.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <div
                      className={`absolute top-2 right-2 flex gap-1 transition-opacity duration-200 ${hoveredCard === person.id ? "opacity-100" : "opacity-0"}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="outline" size="sm" onClick={() => openEditPersonModal(person)} className="w-7 h-7 p-1">
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeletePerson(person.id)} className="w-7 h-7 p-1">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <h4 className="font-medium text-base mb-2 text-gray-900 pr-16">{person.title}</h4>
                    <p className="text-sm text-blue-600 hover:underline break-all">{person.website}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Campus Map Content */}
          {activeTab === "campus-map" && (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              <div className="flex flex-col gap-4">
                {campusImages ? (
                  <div
                    className="bg-white rounded-xl shadow-md p-6 border border-gray-200 relative group"
                    onMouseEnter={() => setHoveredCard("campus-image")}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <div className={`absolute top-2 right-2 flex gap-1 transition-opacity duration-200 ${hoveredCard === "campus-image" ? "opacity-100" : "opacity-0"}`}>
                      <Button variant="outline" size="sm" onClick={() => setShowEditCampusModal(true)} className="w-7 h-7 p-1">
                        <Edit className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold text-[#13274f]">{campusImages.title}</h3>
                    </div>
                    <div className="bg-gray-100 rounded-md p-4 h-80 flex items-center justify-center">
                      <img src={campusImages.url || "/placeholder.svg"} alt={campusImages.title} className="max-w-full max-h-full object-contain" />
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                    <div
                      className="bg-white rounded-xl p-6 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer transition duration-200 h-full hover:border-gray-500"
                      onClick={() => setShowEditCampusModal(true)}
                    >
                      <Plus className="w-12 h-12 text-gray-400 mb-4" />
                      <p className="text-lg text-gray-600">Add Campus Map</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact Us Content (Displaying Multiple Slots/Methods) */}
          {activeTab === "contact-us" && (
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-[#13274f] m-0">Contact Directory</h2>
                <Button variant="add" onClick={openAddContactModal}>
                  <Plus className="w-4 h-4" />
                  Add New Contact
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {contacts.length > 0 ? (
                  contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="bg-gray-50 rounded-lg p-5 relative group hover:shadow-lg transition-shadow duration-200"
                      onMouseEnter={() => setHoveredCard(contact.id + "-contact")}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 pr-16">{contact.title}</h3>
                          <p className="text-sm font-medium text-[#13274f]">{contact.role} - {contact.organization}</p>
                        </div>
                        <div
                          className={`absolute top-2 right-2 flex gap-1 transition-opacity duration-200 ${hoveredCard === contact.id + "-contact" ? "opacity-100" : "opacity-0"}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button variant="outline" size="sm" onClick={() => openEditContactModal(contact)} className="w-7 h-7 p-1">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteContact(contact.id)} className="w-7 h-7 p-1">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2 text-sm text-gray-600">
                        {contact.emails && contact.emails.length > 0 && (
                          <div className="border-t pt-2">
                            <span className="font-medium text-gray-800 block mb-1">Emails:</span>
                            <ul className="list-disc pl-5">
                              {contact.emails.map((email, index) => (
                                <li key={`e-${index}`}><a href={`mailto:${email}`} className="text-blue-600 hover:underline break-all">{email}</a></li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {contact.phones && contact.phones.length > 0 && (
                          <div className="border-t pt-2">
                            <span className="font-medium text-gray-800 block mb-1">Phones:</span>
                            <ul className="list-disc pl-5">
                              {contact.phones.map((phone, index) => (
                                <li key={`p-${index}`}><a href={`tel:${phone}`} className="text-blue-600 hover:underline break-all">{phone}</a></li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="lg:col-span-2 text-center py-10 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                    No contact entries found. Click "Add New Contact" to begin.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}

      {/* Add Image Modal */}
      <Dialog open={showAddImageModal} onClose={closeAddImageModal}>
        <DialogHeader>
          <DialogTitle>Add New Academic Regalia Image</DialogTitle>
        </DialogHeader>
        <div className="px-6">
          <div className="mb-5">
            <Label htmlFor="image-title">Image Title (e.g., Bachelor's Gown)</Label>
            <Input
              id="image-title"
              value={imageTitle}
              onChange={(e) => setImageTitle(e.target.value)}
              placeholder="Enter image title"
            />
          </div>
          <div className="mb-5">
            <Label htmlFor="regalia-file">Image File</Label>
            <Input
              id="regalia-file"
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files[0])}
            />
          </div>
          {selectedFile && (
            <div className="text-sm text-gray-500">Selected: {selectedFile.name}</div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeAddImageModal}>
            Cancel
          </Button>
          <Button onClick={handleAddImageUpload} disabled={uploading || !selectedFile || !imageTitle.trim()}>
            {uploading ? "Uploading..." : "Add Image"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Edit Regalia Modal */}
      <Dialog open={showEditRegaliaModal} onClose={closeEditRegaliaModal}>
        <DialogHeader>
          <DialogTitle>Edit Academic Regalia Image</DialogTitle>
        </DialogHeader>
        {editingRegalia && (
          <div className="px-6">
            <div className="mb-5">
              <Label htmlFor="edit-regalia-title">Image Title (e.g., Bachelor's Gown)</Label>
              <Input
                id="edit-regalia-title"
                value={imageTitle}
                onChange={(e) => setImageTitle(e.target.value)}
                placeholder="Enter image title"
              />
            </div>

            <div className="mb-5">
              <Label htmlFor="edit-regalia-file">Replace Image File (optional)</Label>
              <Input
                id="edit-regalia-file"
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files[0])}
              />
            </div>

            {selectedFile && (
              <div className="text-sm text-gray-500 mb-4">New selected: {selectedFile.name}</div>
            )}

            <div className="mt-4">
              <Label>{selectedFile ? "New Image Preview" : "Current Image"}</Label>
              <div className="bg-gray-100 rounded-md p-4 h-64 flex items-center justify-center overflow-hidden">
                <img
                  src={selectedFile ? URL.createObjectURL(selectedFile) : editingRegalia.url}
                  alt={editingRegalia.title}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={closeEditRegaliaModal}>
            Cancel
          </Button>
          <Button onClick={handleEditImageUpload} disabled={uploading || !imageTitle.trim()}>
            {uploading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Edit Campus Map Modal */}
      <Dialog open={showEditCampusModal} onClose={closeEditCampusModal}>
        <DialogHeader>
          <DialogTitle>{campusImages ? "Update Campus Map" : "Add Campus Map"}</DialogTitle>
        </DialogHeader>
        <div className="px-6">
          <div className="mb-5">
            <Label htmlFor="campus-file">Image File</Label>
            <Input
              id="campus-file"
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files[0])}
            />
          </div>
          {selectedFile && (
            <div className="text-sm text-gray-500">Selected: {selectedFile.name}</div>
          )}
          {campusImages && !selectedFile && (
            <div className="mt-4">
              <Label>Current Image</Label>
              <div className="bg-gray-100 rounded-md p-4 max-h-52 flex items-center justify-center overflow-hidden">
                <img src={campusImages.url} alt="Current Campus Map" className="max-w-full max-h-full object-contain" />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeEditCampusModal}>
            Cancel
          </Button>
          <Button onClick={handleCampusImageUpdate} disabled={uploading || !selectedFile}>
            {uploading ? "Uploading..." : campusImages ? "Update Image" : "Add Image"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Edit Maze Image Modal */}
      <Dialog open={showEditMazeModal} onClose={closeEditMazeModal}>
        <DialogHeader>
          <DialogTitle>{mazeImage ? "Update Maze Image" : "Add Maze Image"}</DialogTitle>
        </DialogHeader>
        <div className="px-6">
          <div className="mb-5">
            <Label htmlFor="maze-file">Image File</Label>
            <Input
              id="maze-file"
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files[0])}
            />
          </div>
          {selectedFile && (
            <div className="text-sm text-gray-500">Selected: {selectedFile.name}</div>
          )}
          {mazeImage && !selectedFile && (
            <div className="mt-4">
              <Label>Current Image</Label>
              <div className="bg-gray-100 rounded-md p-4 max-h-52 flex items-center justify-center overflow-hidden">
                <img src={mazeImage.url} alt="Current Maze" className="max-w-full max-h-full object-contain" />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeEditMazeModal}>
            Cancel
          </Button>
          <Button onClick={handleMazeImageUpdate} disabled={uploading || !selectedFile}>
            {uploading ? "Uploading..." : mazeImage ? "Update Image" : "Add Image"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Add Person Modal */}
      <Dialog open={showAddPersonModal} onClose={closeAddPersonModal}>
        <DialogHeader>
          <DialogTitle>Add New Person</DialogTitle>
        </DialogHeader>
        <div className="px-6">
          <div className="mb-5">
            <Label htmlFor="title">Title/Position</Label>
            <Input
              id="title"
              value={personTitle}
              onChange={(e) => setPersonTitle(e.target.value)}
              placeholder="e.g., Dean of Engineering"
            />
          </div>
          <div className="mb-5">
            <Label htmlFor="website">Website Link</Label>
            <Input
              id="website"
              type="url"
              value={personWebsite}
              onChange={(e) => setPersonWebsite(e.target.value)}
              placeholder="https://example.com"
            />
            <p className="text-xs text-gray-500 mt-1">Enter the full URL including https://</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeAddPersonModal}>
            Cancel
          </Button>
          <Button onClick={handlePersonUpload} disabled={uploading || !personTitle.trim() || !personWebsite.trim()}>
            {uploading ? "Adding..." : "Add Person"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Edit Person Modal */}
      <Dialog open={showEditPersonModal} onClose={closeEditPersonModal}>
        <DialogHeader>
          <DialogTitle>Edit Person</DialogTitle>
        </DialogHeader>
        <div className="px-6">
          <div className="mb-5">
            <Label htmlFor="edit-title">Title/Position</Label>
            <Input
              id="edit-title"
              value={personTitle}
              onChange={(e) => setPersonTitle(e.target.value)}
              placeholder="e.g., Dean of Engineering"
            />
          </div>
          <div className="mb-5">
            <Label htmlFor="edit-website">Website Link</Label>
            <Input
              id="edit-website"
              type="url"
              value={personWebsite}
              onChange={(e) => setPersonWebsite(e.target.value)}
              placeholder="https://example.com"
            />
            <p className="text-xs text-gray-500 mt-1">Enter the full URL including https://</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeEditPersonModal}>
            Cancel
          </Button>
          <Button onClick={handlePersonEdit} disabled={uploading || !personTitle.trim() || !personWebsite.trim()}>
            {uploading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Edit/Add Contact Modal (Multi-Slot) */}
      <Dialog open={showContactModal} onClose={closeContactModal}>
        <DialogHeader>
          <DialogTitle>{editingContact ? "Edit Contact Information" : "Add New Contact"}</DialogTitle>
        </DialogHeader>
        <div className="px-6 grid grid-cols-1 gap-4">
          <div className="mb-2">
            <Label htmlFor="contact-title">Contact Name/Title</Label>
            <Input
              id="contact-title"
              value={contactTitle}
              onChange={(e) => setContactTitle(e.target.value)}
              placeholder="e.g., General Enquiries"
            />
          </div>
          <div className="mb-2">
            <Label htmlFor="contact-role">Role/Position</Label>
            <Input
              id="contact-role"
              value={contactRole}
              onChange={(e) => setContactRole(e.target.value)}
              placeholder="e.g., Main Contact"
            />
          </div>
          <div className="mb-2">
            <Label htmlFor="contact-org">Organization/Department</Label>
            <Input
              id="contact-org"
              value={contactOrg}
              onChange={(e) => setContactOrg(e.target.value)}
              placeholder="e.g., Administration Office"
            />
          </div>

          {/* Dynamic Email Inputs */}
          <div className="mb-2 pt-2 border-t border-gray-200">
            <Label>Email Addresses</Label>
            {contactEmails.map((email, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => handleInputChange('email', index, e.target.value)}
                  placeholder={`Email ${index + 1}`}
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleRemoveInput('email', index)} 
                  disabled={contactEmails.length === 1 && contactEmails[0] === ""}
                  className="p-1 w-8 h-auto flex-shrink-0"
                >
                  <X className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => handleAddInput('email')} className="mt-2">
              <Plus className="w-4 h-4" /> Add Email
            </Button>
          </div>

          {/* Dynamic Phone Inputs */}
          <div className="mb-2 pt-2 border-t border-gray-200">
            <Label>Phone Numbers</Label>
            {contactPhones.map((phone, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => handleInputChange('phone', index, e.target.value)}
                  placeholder={`Phone ${index + 1}`}
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleRemoveInput('phone', index)} 
                  disabled={contactPhones.length === 1 && contactPhones[0] === ""}
                  className="p-1 w-8 h-auto flex-shrink-0"
                >
                  <X className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => handleAddInput('phone')} className="mt-2">
              <Plus className="w-4 h-4" /> Add Phone
            </Button>
          </div>

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeContactModal}>
            Cancel
          </Button>
          <Button 
            onClick={handleContactSubmit} 
            disabled={uploading || !contactTitle.trim() || !contactRole.trim() || !contactOrg.trim() || (contactEmails.join('').trim() === '' && contactPhones.join('').trim() === '')}
          >
            {uploading ? (editingContact ? "Saving..." : "Adding...") : (editingContact ? "Save Changes" : "Add Contact")}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}

export default AboutUs