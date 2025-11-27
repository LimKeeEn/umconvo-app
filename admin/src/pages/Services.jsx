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
    <div className="p-10 bg-[#f7fafc] min-h-[95vh]">
      <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-5 bg-white">
        <h1 className="text-4xl font-bold text-[#13274f] m-0">Services</h1>
        <div className="flex gap-3">
          {/* Add your top-right icons if needed */}
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
        {images.map((image) => (
          <div
            key={image.id}
            className="relative bg-white rounded-xl shadow-md overflow-hidden cursor-default h-[28rem]"
            onMouseEnter={() => setHovered(image.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="relative">
              <img 
                src={image.url} 
                alt={image.name} 
                className="w-full h-[25rem] object-contain"
              />
              <div
                className={`absolute inset-0 bg-black/50 flex justify-center items-center gap-2.5 transition-opacity duration-300 ${
                  hovered === image.id ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {/* Change Button */}
                <label className="px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 cursor-pointer border-none bg-white text-black">
                  <FaEdit />
                  Change
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleReplace(e, image)}
                  />
                </label>

                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(image.id, image.url)}
                  className="px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 cursor-pointer border-none bg-red-500 text-white"
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
            <p className="my-3 mx-4 font-semibold text-base text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis">
              {image.name}
            </p>
          </div>
        ))}

        {/* Add New Image Card */}
        <div
          className={`bg-white rounded-xl shadow-md border-2 border-dashed cursor-pointer flex flex-col items-center justify-center h-[28rem] w-full transition-colors duration-300 ml-[30px] ${
            hovered === "add" 
              ? 'border-gray-600 text-gray-700' 
              : 'border-gray-300 text-gray-400'
          }`}
          onMouseEnter={() => setHovered("add")}
          onMouseLeave={() => setHovered(null)}
        >
          <label className="flex flex-col items-center cursor-pointer">
            <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full cursor-pointer mb-4 ml-5">
              <FaPlus size={24} />
            </div>
            <div>Add New Image</div>
            <input
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          {selectedFile && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="mt-2.5 px-4 py-2 bg-blue-600 text-white rounded-md border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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