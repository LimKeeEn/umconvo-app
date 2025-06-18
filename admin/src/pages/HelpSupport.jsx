import { useState, useEffect } from "react"
import { Search, Mail, Settings, Edit, Trash2, Plus, X, Loader, MessageCircle, HelpCircle } from "lucide-react"

// Firebase imports
import { db } from "../firebaseConfig"
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
import styles from '../StyleSheetWeb/helpsupport.styles.js';

const HelpSupport = () => {
  const [activeTab, setActiveTab] = useState("FAQ")
  const [faqs, setFaqs] = useState([])
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    title: "",
    url: "",
  })

  // Fetch data from Firebase on component mount
  useEffect(() => {
    fetchFAQs()
    fetchFeedbacks()
  }, [])

  // Fetch FAQs from Firestore
  const fetchFAQs = async () => {
    try {
      setLoading(true)
      const faqsQuery = query(collection(db, "faqs"), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(faqsQuery)

      const faqsData = []
      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data()

        const faqItem = {
          id: docSnapshot.id,
          question: data.question,
          answer: data.answer,
          status: data.status || "active",
        }

        faqsData.push(faqItem)
      }

      setFaqs(faqsData)
    } catch (error) {
      console.error("Error fetching FAQs:", error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch Feedbacks from Firestore
  const fetchFeedbacks = async () => {
    try {
      const feedbacksQuery = query(collection(db, "feedbacks"), orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(feedbacksQuery)

      const feedbacksData = []
      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data()

        const feedbackItem = {
          id: docSnapshot.id,
          title: data.title,
          url: data.url,
          status: data.status || "active",
        }

        feedbacksData.push(feedbackItem)
      }

      setFeedbacks(feedbacksData)
    } catch (error) {
      console.error("Error fetching feedbacks:", error)
    }
  }

  // Enhanced filtering function
  const getFilteredItems = () => {
    const items = activeTab === "FAQ" ? faqs : feedbacks
    return items.filter((item) => {
      if (activeTab === "FAQ") {
        return (
          item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.answer.toLowerCase().includes(searchTerm.toLowerCase())
        )
      } else {
        return item.title.toLowerCase().includes(searchTerm.toLowerCase())
      }
    })
  }

  const filteredItems = getFilteredItems()

  const handleAddNew = () => {
    if (activeTab === "FAQ") {
      setFormData({
        question: "",
        answer: "",
        title: "",
        url: "",
      })
    } else {
      setFormData({
        question: "",
        answer: "",
        title: "",
        url: "",
      })
    }
    setIsAddModalOpen(true)
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    if (activeTab === "FAQ") {
      setFormData({
        question: item.question,
        answer: item.answer,
        title: "",
        url: "",
      })
    } else {
      setFormData({
        question: "",
        answer: "",
        title: item.title,
        url: item.url,
      })
    }
    setIsEditModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm(`Are you sure you want to delete this ${activeTab.toLowerCase()}?`)) {
      try {
        const collection_name = activeTab === "FAQ" ? "faqs" : "feedbacks"
        await deleteDoc(doc(db, collection_name, id))

        if (activeTab === "FAQ") {
          setFaqs(faqs.filter((faq) => faq.id !== id))
        } else {
          setFeedbacks(feedbacks.filter((feedback) => feedback.id !== id))
        }
      } catch (error) {
        console.error("Error deleting item:", error)
        alert("Failed to delete. Please try again.")
      }
    }
  }

  const handleSubmitAdd = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)

      const collection_name = activeTab === "FAQ" ? "faqs" : "feedbacks"
      const data =
        activeTab === "FAQ"
          ? {
              question: formData.question,
              answer: formData.answer,
              status: "active",
              createdAt: serverTimestamp(),
            }
          : {
              title: formData.title,
              url: formData.url,
              status: "active",
              createdAt: serverTimestamp(),
            }

      const docRef = await addDoc(collection(db, collection_name), data)

      const newItem = {
        id: docRef.id,
        ...data,
      }

      if (activeTab === "FAQ") {
        setFaqs([newItem, ...faqs])
      } else {
        setFeedbacks([newItem, ...feedbacks])
      }

      setIsAddModalOpen(false)
      setFormData({
        question: "",
        answer: "",
        title: "",
        url: "",
      })
    } catch (error) {
      console.error("Error adding item:", error)
      alert(`Failed to add new ${activeTab.toLowerCase()}: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitEdit = async (e) => {
    e.preventDefault()
    if (!editingItem) return

    try {
      setLoading(true)
      const collection_name = activeTab === "FAQ" ? "faqs" : "feedbacks"
      const itemRef = doc(db, collection_name, editingItem.id)

      const updateData =
        activeTab === "FAQ"
          ? {
              question: formData.question,
              answer: formData.answer,
              updatedAt: serverTimestamp(),
            }
          : {
              title: formData.title,
              url: formData.url,
              updatedAt: serverTimestamp(),
            }

      await updateDoc(itemRef, updateData)

      if (activeTab === "FAQ") {
        setFaqs(
          faqs.map((faq) =>
            faq.id === editingItem.id
              ? {
                  ...faq,
                  ...updateData,
                }
              : faq,
          ),
        )
      } else {
        setFeedbacks(
          feedbacks.map((feedback) =>
            feedback.id === editingItem.id
              ? {
                  ...feedback,
                  ...updateData,
                }
              : feedback,
          ),
        )
      }

      setIsEditModalOpen(false)
      setEditingItem(null)
      setFormData({
        question: "",
        answer: "",
        title: "",
        url: "",
      })
    } catch (error) {
      console.error("Error updating item:", error)
      alert(`Failed to update: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const closeModal = () => {
    setIsAddModalOpen(false)
    setIsEditModalOpen(false)
    setEditingItem(null)
    setFormData({
      question: "",
      answer: "",
      title: "",
      url: "",
    })
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
          <h1 style={styles.pageTitle}>Help & Support</h1>
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

        {/* Tab Navigation */}
        <div style={styles.tabContainer}>
          <button
            onClick={() => setActiveTab("FAQ")}
            style={{
              ...styles.tabButton,
              ...(activeTab === "FAQ" ? styles.tabButtonActive : styles.tabButtonInactive),
            }}
          >
            <HelpCircle style={styles.tabIcon} />
            FAQ
          </button>
          <button
            onClick={() => setActiveTab("Feedback")}
            style={{
              ...styles.tabButton,
              ...(activeTab === "Feedback" ? styles.tabButtonActive : styles.tabButtonInactive),
            }}
          >
            <MessageCircle style={styles.tabIcon} />
            Feedback
          </button>
        </div>

        <div style={styles.searchBarContainer}>
          <div style={styles.searchInputWrapper}>
            <Search style={styles.searchIcon} />
            <input
              type="text"
              placeholder={`Search ${activeTab.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          <button style={{ ...styles.btn, ...styles.btnSearch }}>SEARCH</button>
          <button onClick={handleAddNew} style={{ ...styles.btn, ...styles.btnAdd }}>
            <Plus style={styles.btnIcon} />
            ADD NEW
          </button>
        </div>

        <div style={styles.itemsList}>
          {filteredItems.map((item, index) => (
            <div key={item.id} style={styles.itemCard}>
              <div style={styles.itemContent}>
                <div style={styles.itemHeader}>
                  <div style={styles.questionNumber}>
                    {activeTab === "FAQ" ? (
                      <>
                        <span style={styles.questionNumberText}>{index + 1}</span>
                      </>
                    ) : (
                      <MessageCircle style={styles.feedbackIcon} />
                    )}
                  </div>
                  <div style={styles.itemDetails}>
                    <h3 style={styles.itemTitle}>{activeTab === "FAQ" ? item.question : item.title}</h3>
                    {activeTab === "FAQ" ? (
                      <p style={styles.itemAnswer}>{item.answer}</p>
                    ) : (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.feedbackUrl}
                        onMouseEnter={(e) => {
                          e.target.style.color = "#1e40af"
                          e.target.style.textDecoration = "underline"
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.color = "#2563eb"
                          e.target.style.textDecoration = "none"
                        }}
                      >
                        {item.url}
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div style={styles.itemActions}>
                <button
                  onClick={() => handleEdit(item)}
                  style={styles.actionBtn}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#f3f4f6"
                    e.target.style.color = "#13274f"
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "transparent"
                    e.target.style.color = "#6b7280"
                  }}
                >
                  <Edit style={styles.actionIcon} />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  style={styles.actionBtn}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#fef2f2"
                    e.target.style.color = "#ef4444"
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "transparent"
                    e.target.style.color = "#6b7280"
                  }}
                >
                  <Trash2 style={styles.actionIcon} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {!loading && filteredItems.length === 0 && (
          <div style={styles.noResults}>
            <p style={styles.noResultsText}>
              {searchTerm
                ? `No ${activeTab.toLowerCase()} items match your search criteria.`
                : `No ${activeTab.toLowerCase()} items found.`}
            </p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Add New {activeTab}</h2>
              <button onClick={closeModal} style={styles.modalClose}>
                <X style={{ width: "20px", height: "20px" }} />
              </button>
            </div>
            <form onSubmit={handleSubmitAdd} style={styles.modalForm}>
              {activeTab === "FAQ" ? (
                <>
                  <div style={styles.formGroup}>
                    <label htmlFor="question" style={styles.formLabel}>
                      Question *
                    </label>
                    <textarea
                      id="question"
                      value={formData.question}
                      onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                      placeholder="Enter the FAQ question"
                      required
                      style={styles.formTextarea}
                      rows={2}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label htmlFor="answer" style={styles.formLabel}>
                      Answer *
                    </label>
                    <textarea
                      id="answer"
                      value={formData.answer}
                      onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                      placeholder="Enter the answer to the question"
                      required
                      style={styles.formTextarea}
                      rows={4}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div style={styles.formGroup}>
                    <label htmlFor="title" style={styles.formLabel}>
                      Feedback Form Title *
                    </label>
                    <input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter feedback form title"
                      required
                      style={styles.formInput}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label htmlFor="url" style={styles.formLabel}>
                      Feedback Form URL *
                    </label>
                    <input
                      id="url"
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="https://forms.google.com/..."
                      required
                      style={styles.formInput}
                    />
                    <p style={styles.fieldHint}>Paste the link to your feedback form (Google Forms, etc.)</p>
                  </div>
                </>
              )}
              <div style={styles.modalActions}>
                <button type="button" onClick={closeModal} style={{ ...styles.btn, ...styles.btnCancel }}>
                  Cancel
                </button>
                <button type="submit" style={{ ...styles.btn, ...styles.btnSubmit }} disabled={loading}>
                  {loading ? "Adding..." : `Add ${activeTab}`}
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
              <h2 style={styles.modalTitle}>Edit {activeTab}</h2>
              <button onClick={closeModal} style={styles.modalClose}>
                <X style={{ width: "20px", height: "20px" }} />
              </button>
            </div>
            <form onSubmit={handleSubmitEdit} style={styles.modalForm}>
              {activeTab === "FAQ" ? (
                <>
                  <div style={styles.formGroup}>
                    <label htmlFor="edit-question" style={styles.formLabel}>
                      Question *
                    </label>
                    <textarea
                      id="edit-question"
                      value={formData.question}
                      onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                      placeholder="Enter the FAQ question"
                      required
                      style={styles.formTextarea}
                      rows={2}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label htmlFor="edit-answer" style={styles.formLabel}>
                      Answer *
                    </label>
                    <textarea
                      id="edit-answer"
                      value={formData.answer}
                      onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                      placeholder="Enter the answer to the question"
                      required
                      style={styles.formTextarea}
                      rows={4}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div style={styles.formGroup}>
                    <label htmlFor="edit-title" style={styles.formLabel}>
                      Feedback Form Title *
                    </label>
                    <input
                      id="edit-title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter feedback form title"
                      required
                      style={styles.formInput}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label htmlFor="edit-url" style={styles.formLabel}>
                      Feedback Form URL *
                    </label>
                    <input
                      id="edit-url"
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="https://forms.google.com/..."
                      required
                      style={styles.formInput}
                    />
                    <p style={styles.fieldHint}>Paste the link to your feedback form (Google Forms, etc.)</p>
                  </div>
                </>
              )}
              <div style={styles.modalActions}>
                <button type="button" onClick={closeModal} style={{ ...styles.btn, ...styles.btnCancel }}>
                  Cancel
                </button>
                <button type="submit" style={{ ...styles.btn, ...styles.btnSubmit }} disabled={loading}>
                  {loading ? "Updating..." : `Update ${activeTab}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default HelpSupport;