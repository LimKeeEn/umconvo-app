import { useState, useEffect } from "react";
import { Search, Mail, Settings, Edit, Trash2, Plus, X, Loader, MessageCircle, HelpCircle } from "lucide-react";

// Firebase imports
import { db } from "../firebaseConfig";
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
} from "firebase/firestore";

const HelpSupport = () => {
  const [activeTab, setActiveTab] = useState("FAQ");
  const [faqs, setFaqs] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    title: "",
    url: "",
  });

  // Fetch data from Firebase on component mount
  useEffect(() => {
    fetchFAQs();
    fetchFeedbacks();
  }, []);

  // Fetch FAQs from Firestore
  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const faqsQuery = query(collection(db, "faqs"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(faqsQuery);

      const faqsData = [];
      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();

        const faqItem = {
          id: docSnapshot.id,
          question: data.question,
          answer: data.answer,
          status: data.status || "active",
        };

        faqsData.push(faqItem);
      }

      setFaqs(faqsData);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Feedbacks from Firestore
  const fetchFeedbacks = async () => {
    try {
      const feedbacksQuery = query(collection(db, "feedbacks"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(feedbacksQuery);

      const feedbacksData = [];
      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();

        const feedbackItem = {
          id: docSnapshot.id,
          title: data.title,
          url: data.url,
          status: data.status || "active",
        };

        feedbacksData.push(feedbackItem);
      }

      setFeedbacks(feedbacksData);
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
    }
  };

  // Enhanced filtering function
  const getFilteredItems = () => {
    const items = activeTab === "FAQ" ? faqs : feedbacks;
    return items.filter((item) => {
      const searchTermLower = searchTerm.toLowerCase();
      if (activeTab === "FAQ") {
        return (
          item.question.toLowerCase().includes(searchTermLower) ||
          item.answer.toLowerCase().includes(searchTermLower)
        );
      } else {
        return item.title.toLowerCase().includes(searchTermLower);
      }
    });
  };

  const filteredItems = getFilteredItems();

  const handleAddNew = () => {
    // Note: The logic here ensures that the form data is reset 
    // regardless of the active tab, matching the original code's effect.
    setFormData({
      question: "",
      answer: "",
      title: "",
      url: "",
    });
    setIsAddModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    if (activeTab === "FAQ") {
      setFormData({
        question: item.question,
        answer: item.answer,
        title: "",
        url: "",
      });
    } else {
      setFormData({
        question: "",
        answer: "",
        title: item.title,
        url: item.url,
      });
    }
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm(`Are you sure you want to delete this ${activeTab.toLowerCase()}?`)) {
      try {
        const collection_name = activeTab === "FAQ" ? "faqs" : "feedbacks";
        await deleteDoc(doc(db, collection_name, id));

        if (activeTab === "FAQ") {
          setFaqs(faqs.filter((faq) => faq.id !== id));
        } else {
          setFeedbacks(feedbacks.filter((feedback) => feedback.id !== id));
        }
      } catch (error) {
        console.error("Error deleting item:", error);
        alert("Failed to delete. Please try again.");
      }
    }
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const collection_name = activeTab === "FAQ" ? "faqs" : "feedbacks";
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
            };

      const docRef = await addDoc(collection(db, collection_name), data);

      const newItem = {
        id: docRef.id,
        ...data,
      };

      if (activeTab === "FAQ") {
        // Prepend new item to list to show newest first, as per orderBy("createdAt", "desc")
        setFaqs([newItem, ...faqs]); 
      } else {
        setFeedbacks([newItem, ...feedbacks]);
      }

      setIsAddModalOpen(false);
      setFormData({
        question: "",
        answer: "",
        title: "",
        url: "",
      });
    } catch (error) {
      console.error("Error adding item:", error);
      alert(`Failed to add new ${activeTab.toLowerCase()}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      setLoading(true);
      const collection_name = activeTab === "FAQ" ? "faqs" : "feedbacks";
      const itemRef = doc(db, collection_name, editingItem.id);

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
            };

      await updateDoc(itemRef, updateData);

      // Update local state with new data
      const updateState = (prevItems, updatedItem) =>
        prevItems.map((item) =>
          item.id === updatedItem.id
            ? {
                ...item,
                ...updatedItem,
              }
            : item
        );

      if (activeTab === "FAQ") {
        setFaqs(updateState(faqs, { id: editingItem.id, ...updateData }));
      } else {
        setFeedbacks(updateState(feedbacks, { id: editingItem.id, ...updateData }));
      }

      setIsEditModalOpen(false);
      setEditingItem(null);
      setFormData({
        question: "",
        answer: "",
        title: "",
        url: "",
      });
    } catch (error) {
      console.error("Error updating item:", error);
      alert(`Failed to update: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setEditingItem(null);
    setFormData({
      question: "",
      answer: "",
      title: "",
      url: "",
    });
  };

  // Helper for tab class names
  const getTabClassNames = (tabName) => {
    const baseClasses = "flex items-center gap-2 px-6 py-3 border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200";
    if (activeTab === tabName) {
      return `${baseClasses} bg-[#13274f] text-white`; // tabButtonActive
    } else {
      return `${baseClasses} bg-white text-gray-500 border border-gray-300 hover:bg-gray-50`; // tabButtonInactive
    }
  };

  // Helper for button class names
  const getBtnClasses = (type) => {
    const baseClasses = "flex items-center gap-2 px-6 py-3 border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap";
    if (type === "search") {
      return `${baseClasses} bg-[#13274f] text-white hover:bg-[#1f376a]`; // btnSearch
    } else if (type === "add") {
      return `${baseClasses} bg-amber-400 text-black font-semibold hover:bg-amber-500`; // btnAdd
    } else if (type === "cancel") {
      return `${baseClasses} bg-transparent text-gray-500 border border-gray-300 hover:bg-gray-50`; // btnCancel
    } else if (type === "submit") {
      return `${baseClasses} bg-[#13274f] text-white hover:bg-[#1f376a] disabled:opacity-50`; // btnSubmit
    }
    return baseClasses;
  };

  // Icon hover logic is simplified using a class that is dynamically applied 
  // or a simple inline transition if the full complexity of the original JS is needed.
  // Tailwind's hover classes are used directly where possible.

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Global loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-[2000]">
          <div className="flex flex-col items-center justify-center p-10">
            <Loader className="w-8 h-8 text-gray-500 animate-spin" />
            <p className="text-gray-500 mt-3 text-sm">Loading...</p>
          </div>
        </div>
      )}

      <div className="p-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-[#13274f] m-0">Help & Support</h1>
          <div className="flex items-center gap-4">
            <Mail 
              className="w-6 h-6 text-gray-500 cursor-pointer transition-colors duration-200 hover:text-[#13274f]"
            />
            <Settings
              className="w-6 h-6 text-gray-500 cursor-pointer transition-colors duration-200 hover:text-[#13274f]"
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("FAQ")}
            className={getTabClassNames("FAQ")}
          >
            <HelpCircle className="w-4 h-4" />
            FAQ
          </button>
          <button
            onClick={() => setActiveTab("Feedback")}
            className={getTabClassNames("Feedback")}
          >
            <MessageCircle className="w-4 h-4" />
            Feedback
          </button>
        </div>

        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[300px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm outline-none transition-colors duration-200 focus:border-indigo-500 box-border"
            />
          </div>
          <button className={getBtnClasses("search")}>SEARCH</button>
          <button onClick={handleAddNew} className={getBtnClasses("add")}>
            <Plus className="w-4 h-4" />
            ADD NEW
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {filteredItems.map((item, index) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm p-6 transition-all duration-200 flex items-start justify-between border border-gray-200">
              <div className="flex-1">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-[#13274f] text-white rounded-full text-sm font-semibold flex-shrink-0">
                    {activeTab === "FAQ" ? (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    ) : (
                      <MessageCircle className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-800 mt-0 mb-2 leading-tight">
                      {activeTab === "FAQ" ? item.question : item.title}
                    </h3>
                    {activeTab === "FAQ" ? (
                      <p className="text-sm text-gray-500 leading-snug m-0">{item.answer}</p>
                    ) : (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 transition-colors duration-200 hover:text-blue-800 hover:underline break-all"
                      >
                        {item.url}
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleEdit(item)}
                  className="flex items-center justify-center w-9 h-9 border-none rounded-md bg-transparent text-gray-500 cursor-pointer transition-all duration-200 hover:bg-gray-100 hover:text-[#13274f]"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="flex items-center justify-center w-9 h-9 border-none rounded-md bg-transparent text-gray-500 cursor-pointer transition-all duration-200 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {!loading && filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg m-0">
              {searchTerm
                ? `No ${activeTab.toLowerCase()} items match your search criteria.`
                : `No ${activeTab.toLowerCase()} items found.`}
            </p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={closeModal}>
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 pb-0 border-b border-gray-200 mb-6">
              <h2 className="text-xl font-semibold text-[#13274f] m-0">Add New {activeTab}</h2>
              <button onClick={closeModal} className="bg-none border-none text-gray-500 cursor-pointer p-1 rounded-md transition-colors duration-200 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitAdd} className="px-6 pb-6">
              {activeTab === "FAQ" ? (
                <>
                  <div className="mb-5">
                    <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-1">
                      Question *
                    </label>
                    <textarea
                      id="question"
                      value={formData.question}
                      onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                      placeholder="Enter the FAQ question"
                      required
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none transition-colors duration-200 focus:border-blue-500 resize-y min-h-[60px] box-border"
                    />
                  </div>
                  <div className="mb-5">
                    <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-1">
                      Answer *
                    </label>
                    <textarea
                      id="answer"
                      value={formData.answer}
                      onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                      placeholder="Enter the answer to the question"
                      required
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none transition-colors duration-200 focus:border-blue-500 resize-y min-h-[100px] box-border"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-5">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                      Feedback Form Title *
                    </label>
                    <input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter feedback form title"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none transition-colors duration-200 focus:border-blue-500 box-border"
                    />
                  </div>
                  <div className="mb-5">
                    <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                      Feedback Form URL *
                    </label>
                    <input
                      id="url"
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="https://forms.google.com/..."
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none transition-colors duration-200 focus:border-blue-500 box-border"
                    />
                    <p className="text-xs text-gray-500 mt-1 italic">
                      Paste the link to your feedback form (Google Forms, etc.)
                    </p>
                  </div>
                </>
              )}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
                <button type="button" onClick={closeModal} className={getBtnClasses("cancel")}>
                  Cancel
                </button>
                <button type="submit" className={getBtnClasses("submit")} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 text-white animate-spin" />
                      {`Adding...`}
                    </>
                  ) : (
                    `Add ${activeTab}`
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
            <div className="flex items-center justify-between p-6 pb-0 border-b border-gray-200 mb-6">
              <h2 className="text-xl font-semibold text-[#13274f] m-0">Edit {activeTab}</h2>
              <button onClick={closeModal} className="bg-none border-none text-gray-500 cursor-pointer p-1 rounded-md transition-colors duration-200 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitEdit} className="px-6 pb-6">
              {activeTab === "FAQ" ? (
                <>
                  <div className="mb-5">
                    <label htmlFor="edit-question" className="block text-sm font-medium text-gray-700 mb-1">
                      Question *
                    </label>
                    <textarea
                      id="edit-question"
                      value={formData.question}
                      onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                      placeholder="Enter the FAQ question"
                      required
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none transition-colors duration-200 focus:border-blue-500 resize-y min-h-[60px] box-border"
                    />
                  </div>
                  <div className="mb-5">
                    <label htmlFor="edit-answer" className="block text-sm font-medium text-gray-700 mb-1">
                      Answer *
                    </label>
                    <textarea
                      id="edit-answer"
                      value={formData.answer}
                      onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                      placeholder="Enter the answer to the question"
                      required
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none transition-colors duration-200 focus:border-blue-500 resize-y min-h-[100px] box-border"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-5">
                    <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">
                      Feedback Form Title *
                    </label>
                    <input
                      id="edit-title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter feedback form title"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none transition-colors duration-200 focus:border-blue-500 box-border"
                    />
                  </div>
                  <div className="mb-5">
                    <label htmlFor="edit-url" className="block text-sm font-medium text-gray-700 mb-1">
                      Feedback Form URL *
                    </label>
                    <input
                      id="edit-url"
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="https://forms.google.com/..."
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none transition-colors duration-200 focus:border-blue-500 box-border"
                    />
                    <p className="text-xs text-gray-500 mt-1 italic">
                      Paste the link to your feedback form (Google Forms, etc.)
                    </p>
                  </div>
                </>
              )}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
                <button type="button" onClick={closeModal} className={getBtnClasses("cancel")}>
                  Cancel
                </button>
                <button type="submit" className={getBtnClasses("submit")} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 text-white animate-spin" />
                      {`Updating...`}
                    </>
                  ) : (
                    `Update ${activeTab}`
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpSupport;