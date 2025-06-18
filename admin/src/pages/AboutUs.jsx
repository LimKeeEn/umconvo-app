import { useState, useEffect } from "react"
import { ChevronDown, Mail, Settings, Plus, Download, Edit, Trash2, Search } from "lucide-react"
import { storage, db } from "../firebaseConfig"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { collection, addDoc, onSnapshot, updateDoc, doc, deleteDoc, query, where } from "firebase/firestore"
import styles from '../StyleSheetWeb/aboutus.styles.js';


// Move custom components outside to prevent re-creation on every render
const Button = ({ children, variant = "default", size = "default", onClick, disabled = false, style = {} }) => {
  let buttonStyle = { ...styles.btn }

  switch (variant) {
    case "destructive":
      buttonStyle = { ...buttonStyle, ...styles.btnDestructive }
      break
    case "outline":
      buttonStyle = { ...buttonStyle, ...styles.btnOutline }
      break
    case "ghost":
      buttonStyle = { ...buttonStyle, ...styles.btnGhost }
      break
    case "search":
      buttonStyle = { ...buttonStyle, ...styles.btnSearch }
      break
    case "add":
      buttonStyle = { ...buttonStyle, ...styles.btnAdd }
      break
    default:
      buttonStyle = { ...buttonStyle, ...styles.btnSubmit }
  }

  if (size === "sm") {
    buttonStyle = { ...buttonStyle, padding: "8px 16px", fontSize: "12px" }
  }

  return (
    <button style={{ ...buttonStyle, ...style }} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

const Input = ({ value, onChange, placeholder, type = "text", style = {}, ...props }) => {
  return (
    <input
      type={type}
      value={value || ""}
      onChange={onChange}
      placeholder={placeholder}
      style={{ ...styles.formInput, ...style }}
      {...props}
    />
  )
}

const Dialog = ({ open, children, onClose }) => {
  if (!open) return null
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

const DialogHeader = ({ children }) => {
  return <div style={styles.modalHeader}>{children}</div>
}

const DialogTitle = ({ children }) => {
  return <h3 style={styles.modalTitle}>{children}</h3>
}

const DialogFooter = ({ children }) => {
  return <div style={styles.modalActions}>{children}</div>
}

const Label = ({ children, htmlFor }) => {
  return (
    <label htmlFor={htmlFor} style={styles.formLabel}>
      {children}
    </label>
  )
}

const AboutUs = () => {
  const [activeTab, setActiveTab] = useState("the-maze")
  const [mazeSubTab, setMazeSubTab] = useState("the-maze")

  // Firebase state
  const [mazeImage, setMazeImage] = useState([])
  const [regaliaImages, setRegaliaImages] = useState([])
  const [keyPeople, setKeyPeople] = useState([])
  const [campusImages, setCampusImages] = useState([])
  const [uploading, setUploading] = useState(false)

  // Modal states
  const [showEditMazeModal, setShowEditMazeModal] = useState(false)
  const [showAddImageModal, setShowAddImageModal] = useState(false)
  const [showAddPersonModal, setShowAddPersonModal] = useState(false)
  const [showEditPersonModal, setShowEditPersonModal] = useState(false)
  const [editingPerson, setEditingPerson] = useState(null)

  // Form states
  const [selectedFile, setSelectedFile] = useState(null)
  const [imageTitle, setImageTitle] = useState("The Maze")
  const [imageCategory, setImageCategory] = useState("maze")
  const [personName, setPersonName] = useState("")
  const [personTitle, setPersonTitle] = useState("")
  const [personImage, setPersonImage] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")

  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [hoveredCard, setHoveredCard] = useState(null)

  // Reset form states when modals close
  const closeEditMazeModal = () => {
    setShowEditMazeModal(false)
    setSelectedFile(null)
  }

  const closeAddImageModal = () => {
    setShowAddImageModal(false)
    setSelectedFile(null)
    setImageTitle("")
  }

  const closeAddPersonModal = () => {
    setShowAddPersonModal(false)
    setPersonName("")
    setPersonTitle("")
    setPersonImage(null)
  }

  const closeEditPersonModal = () => {
    setShowEditPersonModal(false)
    setEditingPerson(null)
    setPersonName("")
    setPersonTitle("")
    setPersonImage(null)
  }

  // Fetch data from Firestore
  useEffect(() => {
    console.log("Setting up Firestore listeners...")

    try {
      // Fetch maze images
      const unsubMaze = onSnapshot(
        query(collection(db, "aboutus_images"), where("category", "==", "maze")),
        (snapshot) => {
          console.log("Maze images updated:", snapshot.docs.length)
          const images = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          setMazeImage(images.length > 0 ? images[0] : null)
        },
        (error) => {
          console.error("Error fetching maze images:", error)
        },
      )

      // Fetch regalia images
      const unsubRegalia = onSnapshot(
        query(collection(db, "aboutus_images"), where("category", "==", "regalia")),
        (snapshot) => {
          console.log("Regalia images updated:", snapshot.docs.length)
          setRegaliaImages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
        },
        (error) => {
          console.error("Error fetching regalia images:", error)
        },
      )

      // Fetch key people
      const unsubPeople = onSnapshot(
        collection(db, "key_people"),
        (snapshot) => {
          console.log("Key people updated:", snapshot.docs.length)
          setKeyPeople(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
        },
        (error) => {
          console.error("Error fetching key people:", error)
        },
      )

      // Fetch campus images
      const unsubCampus = onSnapshot(
        query(collection(db, "aboutus_images"), where("category", "==", "campus")),
        (snapshot) => {
          console.log("Campus images updated:", snapshot.docs.length)
          const images = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          setCampusImages(images.length > 0 ? images[0] : null)
        },
        (error) => {
          console.error("Error fetching campus images:", error)
        }
      )

      return () => {
        unsubMaze()
        unsubRegalia()
        unsubPeople()
        unsubCampus()
      }
    } catch (error) {
      console.error("Error setting up Firestore listeners:", error)
      alert("Error connecting to database. Please check your Firebase configuration.")
    }
  }, [])

  // Add handler for campus map image update
  const handleCampusImageUpdate = async () => {
    if (!selectedFile) {
      alert("Please select a file")
      return
    }

    setUploading(true)
    try {
      // If there's an existing image, delete it first
      if (campusImages) {
        try {
          await deleteObject(ref(storage, campusImages.url))
          await deleteDoc(doc(db, "aboutus_images", campusImages.id))
          console.log("Old campus image deleted")
        } catch (deleteError) {
          console.warn("Could not delete old image:", deleteError)
        }
      }

      // Upload new image
      const fileName = `${Date.now()}_${selectedFile.name.replace(/\s+/g, '_')}`
      const storageRef = ref(storage, `aboutus/campus/${fileName}`)
      const snapshot = await uploadBytes(storageRef, selectedFile)
      const downloadURL = await getDownloadURL(snapshot.ref)

      // Add to Firestore
      const docRef = await addDoc(collection(db, "aboutus_images"), {
        title: "Campus Map",
        url: downloadURL,
        category: "campus",
        createdAt: new Date(),
      })

      console.log("Campus image updated with ID:", docRef.id)
      closeEditCampusModal()
      alert("Campus image updated successfully!")
    } catch (error) {
      console.error("Upload error:", error)
      alert("Error updating campus image: " + (error.message || "Please try again."))
    } finally {
      setUploading(false)
    }
  }

    // Add modal state for campus map editing
  const [showEditCampusModal, setShowEditCampusModal] = useState(false)

  const closeEditCampusModal = () => {
    setShowEditCampusModal(false)
    setSelectedFile(null)
  }

  // Handle image upload with better error handling
  const handleMazeImageUpdate = async () => {
      if (!selectedFile) {
        alert("Please select a file")
        return
      }

      setUploading(true)
      try {
        // If there's an existing image, delete it first
        if (mazeImage) {
          try {
            await deleteObject(ref(storage, mazeImage.url))
            await deleteDoc(doc(db, "aboutus_images", mazeImage.id))
            console.log("Old maze image deleted")
          } catch (deleteError) {
            console.warn("Could not delete old image:", deleteError)
          }
        }

        // Upload new image
        const fileName = `${Date.now()}_${selectedFile.name.replace(/\s+/g, '_')}`
        const storageRef = ref(storage, `aboutus/maze/${fileName}`)
        const snapshot = await uploadBytes(storageRef, selectedFile)
        const downloadURL = await getDownloadURL(snapshot.ref)

        // Add to Firestore
        const docRef = await addDoc(collection(db, "aboutus_images"), {
          title: "The Maze",
          url: downloadURL,
          category: "maze",
          createdAt: new Date(),
        })

        console.log("Maze image updated with ID:", docRef.id)
        closeEditMazeModal()
        alert("Maze image updated successfully!")
      } catch (error) {
        console.error("Upload error:", error)
        alert("Error updating maze image: " + (error.message || "Please try again."))
      } finally {
        setUploading(false)
      }
    }
  
  // Handle person upload with better error handling
  const handlePersonUpload = async () => {
    if (!personName.trim() || !personTitle.trim()) {
      alert("Please enter name and title")
      return
    }

    console.log("Starting person upload...")
    setUploading(true)
    try {
      let imageUrl = "/placeholder.svg?height=80&width=80"

      if (personImage) {
        console.log("Uploading person image...")
        const fileName = `${Date.now()}_${personImage.name}`
        const storageRef = ref(storage, `people/${fileName}`)
        await uploadBytes(storageRef, personImage)
        imageUrl = await getDownloadURL(storageRef)
        console.log("Person image uploaded:", imageUrl)
      }

      const docRef = await addDoc(collection(db, "key_people"), {
        name: personName.trim(),
        title: personTitle.trim(),
        imageUrl,
        createdAt: new Date(),
      })

      console.log("Person added with ID:", docRef.id)
      closeAddPersonModal()
      alert("Person added successfully!")
    } catch (error) {
      console.error("Error adding person:", error)
      alert("Error adding person: " + error.message)
    }
    setUploading(false)
  }

  // Handle person edit with better error handling
  const handlePersonEdit = async () => {
    if (!personName.trim() || !personTitle.trim()) {
      alert("Please enter name and title")
      return
    }

    console.log("Starting person edit...")
    setUploading(true)
    try {
      let imageUrl = editingPerson.imageUrl

      if (personImage) {
        console.log("Uploading new person image...")

        // Delete old image if it's not a placeholder
        if (editingPerson.imageUrl && !editingPerson.imageUrl.includes("placeholder")) {
          try {
            await deleteObject(ref(storage, editingPerson.imageUrl))
            console.log("Old image deleted")
          } catch (deleteError) {
            console.warn("Could not delete old image:", deleteError)
          }
        }

        // Upload new image
        const fileName = `${Date.now()}_${personImage.name}`
        const storageRef = ref(storage, `people/${fileName}`)
        await uploadBytes(storageRef, personImage)
        imageUrl = await getDownloadURL(storageRef)
        console.log("New person image uploaded:", imageUrl)
      }

      await updateDoc(doc(db, "key_people", editingPerson.id), {
        name: personName.trim(),
        title: personTitle.trim(),
        imageUrl,
        updatedAt: new Date(),
      })

      console.log("Person updated successfully")
      closeEditPersonModal()
      alert("Person updated successfully!")
    } catch (error) {
      console.error("Error updating person:", error)
      alert("Error updating person: " + error.message)
    }
    setUploading(false)
  }

  // Handle delete image
  const handleDeleteImage = async (id, imageUrl) => {
    if (window.confirm("Are you sure you want to delete this image?")) {
      try {
        if (imageUrl && !imageUrl.includes("placeholder")) {
          await deleteObject(ref(storage, imageUrl))
        }
        await deleteDoc(doc(db, "aboutus_images", id))
        console.log("Image deleted successfully")
      } catch (error) {
        console.error("Error deleting image:", error)
        alert("Error deleting image: " + error.message)
      }
    }
  }

  // Handle delete person
  const handleDeletePerson = async (id, imageUrl) => {
    if (window.confirm("Are you sure you want to delete this person?")) {
      try {
        if (imageUrl && !imageUrl.includes("placeholder")) {
          await deleteObject(ref(storage, imageUrl))
        }
        await deleteDoc(doc(db, "key_people", id))
        console.log("Person deleted successfully")
      } catch (error) {
        console.error("Error deleting person:", error)
        alert("Error deleting person: " + error.message)
      }
    }
  }

  const openEditPersonModal = (person) => {
    setEditingPerson(person)
    setPersonName(person.name)
    setPersonTitle(person.title)
    setPersonImage(null)
    setShowEditPersonModal(true)
  }

  useEffect(() => {
    const handleClickOutside = () => {
      if (isDropdownOpen) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener("click", handleClickOutside)
    return () => {
      document.removeEventListener("click", handleClickOutside)
    }
  }, [isDropdownOpen])

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.mainContent}>
        <div style={styles.header}>
          <h1 style={styles.pageTitle}>About Us</h1>
          <div style={styles.headerIcons}>
            <Mail style={styles.headerIcon} />
            <Settings style={styles.headerIcon} />
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={styles.tabContainer}>
          <div style={styles.dropdownContainer}>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === "the-maze" ? styles.tabButtonActive : styles.tabButtonInactive),
              }}
              onClick={(e) => {
                e.stopPropagation()
                setIsDropdownOpen(!isDropdownOpen)
              }}
            >
              <span>{mazeSubTab === "the-maze" ? "The Maze" : "Academic Regalia"}</span>
              <ChevronDown style={styles.tabIcon} />
            </button>
            {isDropdownOpen && (
              <div style={styles.dropdownContent}>
                <div
                  style={styles.dropdownItem}
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveTab("the-maze")
                    setMazeSubTab("the-maze")
                    setIsDropdownOpen(false)
                  }}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = styles.dropdownItemHover.backgroundColor)}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
                >
                  The Maze
                </div>
                <div
                  style={styles.dropdownItem}
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveTab("the-maze")
                    setMazeSubTab("academic-regalia")
                    setIsDropdownOpen(false)
                  }}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = styles.dropdownItemHover.backgroundColor)}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
                >
                  Academic Regalia
                </div>
              </div>
            )}
          </div>

          <button
            style={{
              ...styles.tabButton,
              ...(activeTab === "key-people" ? styles.tabButtonActive : styles.tabButtonInactive),
            }}
            onClick={() => setActiveTab("key-people")}
          >
            Key People
          </button>
          <button
            style={{
              ...styles.tabButton,
              ...(activeTab === "campus-map" ? styles.tabButtonActive : styles.tabButtonInactive),
            }}
            onClick={() => setActiveTab("campus-map")}
          >
            Campus Map
          </button>
          <button
            style={{
              ...styles.tabButton,
              ...(activeTab === "contact-us" ? styles.tabButtonActive : styles.tabButtonInactive),
            }}
            onClick={() => setActiveTab("contact-us")}
          >
            Contact Us
          </button>
        </div>

        {/* Content Area */}
        <div style={styles.contentArea}>
          {/* Background watermark */}
          {activeTab === "the-maze" && mazeSubTab === "the-maze" && (
            <div style={{ ...styles.cardGrid, ...styles.cardGrid2 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {mazeImage ? (
                  <div
                    style={styles.card}
                    onMouseEnter={() => setHoveredCard("maze-image")}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <div
                      style={{
                        ...styles.actionButtons,
                        ...(hoveredCard === "maze-image" ? styles.actionButtonsVisible : {}),
                      }}
                    >
                      <button
                        style={{ ...styles.actionButton, ...styles.btnOutline }}
                        onClick={() => setShowEditMazeModal(true)}
                      >
                        <Edit style={{ width: "12px", height: "12px" }} />
                      </button>
                    </div>
                    <div style={{ textAlign: "center", marginBottom: "16px" }}>
                      <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#13274f" }}>{mazeImage.title}</h3>
                    </div>
                    <div style={styles.imageContainer}>
                      <img src={mazeImage.url || "/placeholder.svg"} alt={mazeImage.title} style={styles.image} />
                    </div>
                  </div>
                ) : (
                  <div style={styles.card}>
                    <div
                      style={styles.addNewCard}
                      onClick={() => setShowEditMazeModal(true)}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = styles.addNewCardHover.borderColor)}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#d1d5db")}
                    >
                      <Plus style={styles.addIcon} />
                      <p style={styles.addText}>Add Maze Image</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Academic Regalia Content */}
          {activeTab === "the-maze" && mazeSubTab === "academic-regalia" && (
            <div style={{ ...styles.cardGrid, ...styles.cardGrid4 }}>
              {regaliaImages.map((image) => (
                <div
                  key={image.id}
                  style={styles.card}
                  onMouseEnter={() => setHoveredCard(image.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div
                    style={{
                      ...styles.actionButtons,
                      ...(hoveredCard === image.id ? styles.actionButtonsVisible : {}),
                    }}
                  >
                    <button
                      style={{ ...styles.actionButton, ...styles.btnDestructive }}
                      onClick={() => handleDeleteImage(image.id, image.url)}
                    >
                      <Trash2 style={{ width: "12px", height: "12px" }} />
                    </button>
                  </div>
                  <div style={styles.imageContainerSmall}>
                    <img src={image.url || "/placeholder.svg"} alt={image.title} style={styles.image} />
                  </div>
                  <p style={{ fontSize: "14px", fontWeight: "500", textAlign: "center" }}>{image.title}</p>
                </div>
              ))}

              <div style={styles.card}>
                <div
                  style={{ ...styles.addNewCard, border: "2px dashed #d1d5db", height: "auto" }}
                  onClick={() => {
                    setImageCategory("regalia")
                    setShowAddImageModal(true)
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = styles.addNewCardHover.borderColor)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#d1d5db")}
                >
                  <div style={{ ...styles.imageContainerSmall, border: "none", backgroundColor: "transparent" }}>
                    <Plus style={styles.addIconSmall} />
                  </div>
                  <p style={styles.addTextSmall}>Add New</p>
                </div>
              </div>
            </div>
          )}

          {/* Key People Content */}
          {activeTab === "key-people" && (
            <div style={styles.card}>
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}
              >
                <h2 style={styles.sectionTitle}>Key People</h2>
                <Button variant="add" onClick={() => setShowAddPersonModal(true)}>
                  <Plus style={styles.btnIcon} />
                  Add Person
                </Button>
              </div>
              <div style={{ ...styles.cardGrid, ...styles.cardGrid4 }}>
                {keyPeople.map((person) => (
                  <div
                    key={person.id}
                    style={styles.personCard}
                    onMouseEnter={() => setHoveredCard(person.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <div
                      style={{
                        ...styles.actionButtons,
                        ...(hoveredCard === person.id ? styles.actionButtonsVisible : {}),
                      }}
                    >
                      <button
                        style={{ ...styles.actionButton, ...styles.btnOutline }}
                        onClick={() => openEditPersonModal(person)}
                      >
                        <Edit style={{ width: "12px", height: "12px" }} />
                      </button>
                      <button
                        style={{ ...styles.actionButton, ...styles.btnDestructive }}
                        onClick={() => handleDeletePerson(person.id, person.imageUrl)}
                      >
                        <Trash2 style={{ width: "12px", height: "12px" }} />
                      </button>
                    </div>
                    <div style={styles.personImage}>
                      <img
                        src={person.imageUrl || "/placeholder.svg"}
                        alt={person.name}
                        style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                      />
                    </div>
                    <h4 style={styles.personName}>{person.name}</h4>
                    <p style={styles.personTitle}>{person.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Campus Map Content */}
          {activeTab === "campus-map" && (
          <div style={{ ...styles.cardGrid, ...styles.cardGrid2 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {campusImages ? (
                <div
                  style={styles.card}
                  onMouseEnter={() => setHoveredCard("campus-image")}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div
                    style={{
                      ...styles.actionButtons,
                      ...(hoveredCard === "campus-image" ? styles.actionButtonsVisible : {}),
                    }}
                  >
                    <button
                      style={{ ...styles.actionButton, ...styles.btnOutline }}
                      onClick={() => setShowEditCampusModal(true)}
                    >
                      <Edit style={{ width: "12px", height: "12px" }} />
                    </button>
                  </div>
                  <div style={{ textAlign: "center", marginBottom: "16px" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#13274f" }}>{campusImages.title}</h3>
                  </div>
                  <div style={styles.imageContainer}>
                    <img src={campusImages.url || "/placeholder.svg"} alt={campusImages.title} style={styles.image} />
                  </div>
                </div>
              ) : (
                <div style={styles.card}>
                  <div
                    style={styles.addNewCard}
                    onClick={() => setShowEditCampusModal(true)}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = styles.addNewCardHover.borderColor)}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#d1d5db")}
                  >
                    <Plus style={styles.addIcon} />
                    <p style={styles.addText}>Add Campus Map</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit Campus Map Modal */}
      <Dialog open={showEditCampusModal} onClose={closeEditCampusModal}>
        <DialogHeader>
          <DialogTitle>{campusImages ? "Update Campus Map" : "Add Campus Map"}</DialogTitle>
        </DialogHeader>
        <div style={styles.modalForm}>
          <div style={styles.formGroup}>
            <Label htmlFor="file">Image File</Label>
            <Input 
              id="file" 
              type="file" 
              accept="image/*" 
              onChange={(e) => setSelectedFile(e.target.files[0])} 
            />
          </div>
          {selectedFile && (
            <div style={{ fontSize: "14px", color: "#6b7280" }}>Selected: {selectedFile.name}</div>
          )}
          {campusImages && !selectedFile && (
            <div style={{ marginTop: "16px" }}>
              <Label>Current Image</Label>
              <div style={{ ...styles.imageContainer, maxHeight: "200px" }}>
                <img src={campusImages.url} alt="Current Campus Map" style={styles.image} />
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

          {/* Contact Us Content */}
          {activeTab === "contact-us" && (
            <div style={styles.card}>
              <div style={styles.contactGrid}>
                <div>
                  <h3 style={styles.sectionTitle}>Contact Information</h3>
                  <div style={styles.contactSection}>
                    <h4 style={styles.contactLabel}>Address</h4>
                    <p style={styles.contactText}>
                      University of Malaya
                      <br />
                      50603 Kuala Lumpur
                      <br />
                      Malaysia
                    </p>
                  </div>
                  <div style={styles.contactSection}>
                    <h4 style={styles.contactLabel}>Phone</h4>
                    <p style={styles.contactText}>+60 3-7967 3000</p>
                  </div>
                  <div style={styles.contactSection}>
                    <h4 style={styles.contactLabel}>Email</h4>
                    <p style={styles.contactText}>info@um.edu.my</p>
                  </div>
                </div>
                <div>
                  <h3 style={styles.sectionTitle}>Office Hours</h3>
                  <div style={styles.scheduleItem}>
                    <span>Monday - Friday</span>
                    <span>8:00 AM - 5:00 PM</span>
                  </div>
                  <div style={styles.scheduleItem}>
                    <span>Saturday</span>
                    <span>8:00 AM - 12:00 PM</span>
                  </div>
                  <div style={styles.scheduleItem}>
                    <span>Sunday</span>
                    <span>Closed</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Image Modal */}
      <Dialog open={showEditMazeModal} onClose={closeEditMazeModal}>
        <DialogHeader>
          <DialogTitle>{mazeImage ? "Update Maze Image" : "Add Maze Image"}</DialogTitle>
        </DialogHeader>
        <div style={styles.modalForm}>
          <div style={styles.formGroup}>
            <Label htmlFor="file">Image File</Label>
            <Input 
              id="file" 
              type="file" 
              accept="image/*" 
              onChange={(e) => setSelectedFile(e.target.files[0])} 
            />
          </div>
          {selectedFile && (
            <div style={{ fontSize: "14px", color: "#6b7280" }}>Selected: {selectedFile.name}</div>
          )}
          {mazeImage && !selectedFile && (
            <div style={{ marginTop: "16px" }}>
              <Label>Current Image</Label>
              <div style={{ ...styles.imageContainer, maxHeight: "200px" }}>
                <img src={mazeImage.url} alt="Current Maze" style={styles.image} />
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
        <div style={styles.modalForm}>
          <div style={styles.formGroup}>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="Enter person's name"
            />
          </div>
          <div style={styles.formGroup}>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={personTitle}
              onChange={(e) => setPersonTitle(e.target.value)}
              placeholder="Enter person's title"
            />
          </div>
          <div style={styles.formGroup}>
            <Label htmlFor="image">Profile Image (optional)</Label>
            <Input id="image" type="file" accept="image/*" onChange={(e) => setPersonImage(e.target.files[0])} />
          </div>
          {personImage && <div style={{ fontSize: "14px", color: "#6b7280" }}>Selected: {personImage.name}</div>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeAddPersonModal}>
            Cancel
          </Button>
          <Button onClick={handlePersonUpload} disabled={uploading || !personName.trim() || !personTitle.trim()}>
            {uploading ? "Adding..." : "Add Person"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Edit Person Modal */}
      <Dialog open={showEditPersonModal} onClose={closeEditPersonModal}>
        <DialogHeader>
          <DialogTitle>Edit Person</DialogTitle>
        </DialogHeader>
        <div style={styles.modalForm}>
          <div style={styles.formGroup}>
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="Enter person's name"
            />
          </div>
          <div style={styles.formGroup}>
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={personTitle}
              onChange={(e) => setPersonTitle(e.target.value)}
              placeholder="Enter person's title"
            />
          </div>
          {editingPerson && (
            <div style={styles.formGroup}>
              <Label>Current Image</Label>
              <div style={styles.personImage}>
                <img
                  src={editingPerson.imageUrl || "/placeholder.svg"}
                  alt={editingPerson.name}
                  style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                />
              </div>
            </div>
          )}
          <div style={styles.formGroup}>
            <Label htmlFor="edit-image">Replace Image (optional)</Label>
            <Input id="edit-image" type="file" accept="image/*" onChange={(e) => setPersonImage(e.target.files[0])} />
          </div>
          {personImage && (
            <div style={{ fontSize: "14px", color: "#6b7280" }}>New image selected: {personImage.name}</div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeEditPersonModal}>
            Cancel
          </Button>
          <Button onClick={handlePersonEdit} disabled={uploading || !personName.trim() || !personTitle.trim()}>
            {uploading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}

export default AboutUs
