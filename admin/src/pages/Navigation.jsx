import React, { useState, useEffect } from "react";
import { Search, Mail, Settings, MapPin, Edit, Trash2, Plus, X, Loader } from "lucide-react";

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
import styles from '../StyleSheetWeb/navigation.styles.js';

const Navigation = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    googleMapsUrl: "",
  });

  // Fetch locations from Firebase on component mount
  useEffect(() => {
    fetchLocations();
  }, []);

  // Fetch locations from Firestore
  const fetchLocations = async () => {
    try {
      setLoading(true);
      const locationsQuery = query(collection(db, "navigation"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(locationsQuery);

      const locationsData = [];
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();

        const locationItem = {
          id: docSnapshot.id,
          name: data.name,
          address: data.address,
          googleMapsUrl: data.googleMapsUrl || "",
          status: data.status || "active",
        };

        locationsData.push(locationItem);
      });

      setLocations(locationsData);
    } catch (error) {
      console.error("Error fetching locations:", error);
      alert("Failed to load locations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Enhanced filtering function
  const getFilteredLocations = () => {
    return locations.filter((location) => {
      const matchesSearch =
        location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.address.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  };

  const filteredLocations = getFilteredLocations();

  const handleAddNew = () => {
    setFormData({
      name: "",
      address: "",
      googleMapsUrl: "",
    });
    setIsAddModalOpen(true);
  };

  const handleEdit = (location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      address: location.address,
      googleMapsUrl: location.googleMapsUrl || "",
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this location?")) {
      try {
        await deleteDoc(doc(db, "navigation", id));
        setLocations(locations.filter((location) => location.id !== id));
      } catch (error) {
        console.error("Error deleting location:", error);
        alert("Failed to delete. Please try again.");
      }
    }
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const docRef = await addDoc(collection(db, "navigation"), {
        name: formData.name,
        address: formData.address,
        googleMapsUrl: formData.googleMapsUrl,
        status: "active",
        createdAt: serverTimestamp(),
      });

      const newLocation = {
        id: docRef.id,
        name: formData.name,
        address: formData.address,
        googleMapsUrl: formData.googleMapsUrl,
        status: "active",
      };

      setLocations([newLocation, ...locations]);
      setIsAddModalOpen(false);
      setFormData({
        name: "",
        address: "",
        googleMapsUrl: "",
      });
    } catch (error) {
      console.error("Error adding location:", error);
      alert(`Failed to add new location: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!editingLocation) return;

    try {
      setLoading(true);
      const locationRef = doc(db, "navigation", editingLocation.id);

      const updateData = {
        name: formData.name,
        address: formData.address,
        googleMapsUrl: formData.googleMapsUrl,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(locationRef, updateData);

      setLocations(
        locations.map((location) =>
          location.id === editingLocation.id
            ? {
                ...location,
                ...updateData,
              }
            : location
        )
      );

      setIsEditModalOpen(false);
      setEditingLocation(null);
      setFormData({
        name: "",
        address: "",
        googleMapsUrl: "",
      });
    } catch (error) {
      console.error("Error updating location:", error);
      alert(`Failed to update: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setEditingLocation(null);
    setFormData({
      name: "",
      address: "",
      googleMapsUrl: "",
    });
  };

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
          <h1 style={styles.pageTitle}>Navigation</h1>
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
              placeholder="Search by location"
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

        <div style={styles.locationsList}>
          {filteredLocations.map((location) => (
            <div key={location.id} style={styles.locationCard}>
              <div style={styles.locationContent}>
                <h3 style={styles.locationName}>{location.name}</h3>
                <div style={styles.locationAddress}>
                  <MapPin style={styles.addressIcon} />
                  <span style={styles.addressText}>Address: {location.address}</span>
                </div>
                {location.googleMapsUrl && (
                  <div style={styles.googleMapsLink}>
                    <a
                      href={location.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.mapsLinkButton}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#1e40af";
                        e.target.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "#2563eb";
                        e.target.style.transform = "translateY(0)";
                      }}
                    >
                      <MapPin style={{ width: "14px", height: "14px" }} />
                      View on Google Maps
                    </a>
                  </div>
                )}
              </div>
              <div style={styles.locationActions}>
                <button
                  onClick={() => handleEdit(location)}
                  style={styles.actionBtn}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#f3f4f6";
                    e.target.style.color = "#13274f";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "transparent";
                    e.target.style.color = "#6b7280";
                  }}
                >
                  <Edit style={styles.actionIcon} />
                </button>
                <button
                  onClick={() => handleDelete(location.id)}
                  style={styles.actionBtn}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = "#fef2f2";
                    e.target.style.color = "#ef4444";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "transparent";
                    e.target.style.color = "#6b7280";
                  }}
                >
                  <Trash2 style={styles.actionIcon} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {!loading && filteredLocations.length === 0 && (
          <div style={styles.noResults}>
            <p style={styles.noResultsText}>
              {searchTerm ? "No locations match your search criteria." : "No locations found."}
            </p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div style={styles.modalOverlay} onClick={closeModal}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Add New Location</h2>
              <button onClick={closeModal} style={styles.modalClose}>
                <X style={{ width: "20px", height: "20px" }} />
              </button>
            </div>
            <form onSubmit={handleSubmitAdd} style={styles.modalForm}>
              <div style={styles.formGroup}>
                <label htmlFor="name" style={styles.formLabel}>
                  Location Name *
                </label>
                <input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter location name"
                  required
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label htmlFor="address" style={styles.formLabel}>
                  Address *
                </label>
                <textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter full address"
                  required
                  style={styles.formTextarea}
                  rows={3}
                />
              </div>
              <div style={styles.formGroup}>
                <label htmlFor="googleMapsUrl" style={styles.formLabel}>
                  Google Maps Link (Optional)
                </label>
                <input
                  id="googleMapsUrl"
                  type="url"
                  value={formData.googleMapsUrl}
                  onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })}
                  placeholder="https://maps.google.com/..."
                  style={styles.formInput}
                />
                <p style={styles.fieldHint}>Paste the Google Maps link for this location</p>
              </div>
              <div style={styles.modalActions}>
                <button type="button" onClick={closeModal} style={{ ...styles.btn, ...styles.btnCancel }}>
                  Cancel
                </button>
                <button type="submit" style={{ ...styles.btn, ...styles.btnSubmit }} disabled={loading}>
                  {loading ? "Adding..." : "Add Location"}
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
              <h2 style={styles.modalTitle}>Edit Location</h2>
              <button onClick={closeModal} style={styles.modalClose}>
                <X style={{ width: "20px", height: "20px" }} />
              </button>
            </div>
            <form onSubmit={handleSubmitEdit} style={styles.modalForm}>
              <div style={styles.formGroup}>
                <label htmlFor="edit-name" style={styles.formLabel}>
                  Location Name *
                </label>
                <input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter location name"
                  required
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label htmlFor="edit-address" style={styles.formLabel}>
                  Address *
                </label>
                <textarea
                  id="edit-address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter full address"
                  required
                  style={styles.formTextarea}
                  rows={3}
                />
              </div>
              <div style={styles.formGroup}>
                <label htmlFor="googleMapsUrl" style={styles.formLabel}>
                  Google Maps Link (Optional)
                </label>
                <input
                  id="googleMapsUrl"
                  type="url"
                  value={formData.googleMapsUrl}
                  onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })}
                  placeholder="https://maps.google.com/..."
                  style={styles.formInput}
                />
                <p style={styles.fieldHint}>Paste the Google Maps link for this location</p>
              </div>
              <div style={styles.modalActions}>
                <button type="button" onClick={closeModal} style={{ ...styles.btn, ...styles.btnCancel }}>
                  Cancel
                </button>
                <button type="submit" style={{ ...styles.btn, ...styles.btnSubmit }} disabled={loading}>
                  {loading ? "Updating..." : "Update Location"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navigation;