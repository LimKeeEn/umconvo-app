import React, { useState, useEffect } from "react";
import { storage, db } from "../firebaseConfig";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import styles from '../StyleSheetWeb/services.styles.js';
import { FaPlus, FaTrash, FaEdit } from "react-icons/fa";


const AdminServices = () => {
  const [images, setImages] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [hovered, setHovered] = useState(null);

  // Fetch images from Firestore in real-time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "images"), (snapshot) => {
      setImages(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    });
    return unsub;
  }, []);

  // Handle File Selection
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  // Upload Image to Storage and Firestore
  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    const storageRef = ref(storage, `images/${selectedFile.name}`);
    await uploadBytes(storageRef, selectedFile);
    const url = await getDownloadURL(storageRef);

    await addDoc(collection(db, "images"), {
      name: selectedFile.name,
      url,
    });

    setUploading(false);
    setSelectedFile(null);
  };

  // Delete Image
  const handleDelete = async (id, imageUrl) => {
    const storageRef = ref(storage, imageUrl);
    await deleteObject(storageRef);
    await deleteDoc(doc(db, "images", id));
  };

  const handleReplace = async (e, image) => {
    const file = e.target.files[0];
    if (!file) return;

    await deleteObject(ref(storage, image.url));
    const storageRef = ref(storage, `images/${file.name}`);
    await uploadBytes(storageRef, file);
    const newUrl = await getDownloadURL(storageRef);

    await updateDoc(doc(db, "images", image.id), {
      name: file.name,
      url: newUrl,
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.heading}>Services</h1>
        <div style={styles.buttonGroup}>
          {/* Add your top-right icons if needed */}
        </div>
      </div>

      <div style={styles.contentGrid}>
        {images.map((image) => (
          <div
            key={image.id}
            style={styles.card}
            onMouseEnter={() => setHovered(image.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <div style={styles.imageWrapper}>
              <img src={image.url} alt={image.name} style={styles.image} />
              <div
                style={{
                  ...styles.overlay,
                  ...(hovered === image.id ? styles.overlayVisible : {}),
                }}
              >
                {/* Change Button */}
                <label
                  style={{ ...styles.overlayButton, ...styles.editButton }}
                >
                  <FaEdit />
                  Change
                  <input
                    type="file"
                    className="hidden"
                    style={{ display: "none" }}
                    onChange={(e) => handleReplace(e, image)}
                  />
                </label>

                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(image.id, image.url)}
                  style={{ ...styles.overlayButton, ...styles.deleteButton }}
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
            <p style={styles.imageName}>{image.name}</p>
          </div>
        ))}

        {/* Add New Image Card */}
        <div
          style={{
            ...styles.addCard,
            ...(hovered === "add" ? styles.addCardHover : {}),
          }}
          onMouseEnter={() => setHovered("add")}
          onMouseLeave={() => setHovered(null)}
        >
          <label>
            <div style={styles.addIconWrapper}>
              <FaPlus size={24} />
            </div>
            <div>Add New Image</div>
            <input
              type="file"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </label>
          {selectedFile && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              style={{
                marginTop: "10px",
                padding: "8px 16px",
                backgroundColor: "#3182ce", // blue-600
                color: "white",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
              }}
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminServices;