import React, { useState, useEffect } from "react";
import { Search, Mail, Settings, MapPin, Edit, Trash2, Plus, X, Loader } from "lucide-react";

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
    <div className="min-h-screen bg-gray-50">
      {/* Global loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-[2000]">
          <div className="flex flex-col items-center justify-center p-10">
            {/* Using a custom class for spin animation since inline style wasn't possible */}
            <Loader className="w-8 h-8 animate-spin text-gray-400" />
            <p className="text-gray-600 mt-3 text-sm">Loading...</p>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-[#13274f] m-0">Navigation</h1>
          <div className="flex items-center space-x-4">
            {/* Mail Icon with Hover Effect */}
            <Mail
              className="w-6 h-6 text-gray-500 cursor-pointer transition duration-200 hover:text-[#13274f]"
            />
            {/* Settings Icon with Hover Effect */}
            <Settings
              className="w-6 h-6 text-gray-500 cursor-pointer transition duration-200 hover:text-[#13274f]"
            />
          </div>
        </div>

        {/* Search Bar and Buttons */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-lg min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by location"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-3 pr-3 pl-10 border border-gray-300 rounded-lg text-sm outline-none transition duration-200 focus:border-blue-500 box-border"
            />
          </div>
          {/* Search Button */}
          <button className="flex items-center gap-2 py-3 px-6 border-none rounded-lg text-sm font-semibold cursor-pointer transition duration-200 whitespace-nowrap bg-[#13274f] text-white hover:bg-opacity-90">
            SEARCH
          </button>
          {/* Add New Button */}
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 py-3 px-6 border-none rounded-lg text-sm font-semibold cursor-pointer transition duration-200 whitespace-nowrap bg-amber-400 text-black hover:bg-amber-500"
          >
            <Plus className="w-4 h-4" />
            ADD NEW
          </button>
        </div>

        {/* Locations List */}
        <div className="flex flex-col gap-4">
          {filteredLocations.map((location) => (
            <div
              key={location.id}
              className="bg-white rounded-xl shadow-sm p-6 transition duration-200 flex items-start justify-between border border-gray-200"
            >
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{location.name}</h3>
                <div className="flex items-start gap-2 text-gray-600">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="text-sm leading-relaxed">Address: {location.address}</span>
                </div>
                {location.googleMapsUrl && (
                  <div className="mt-3">
                    <a
                      href={location.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 py-2 px-3 bg-blue-600 text-white no-underline rounded-md text-xs font-medium transition duration-200 ease-in-out hover:bg-blue-800 transform hover:-translate-y-px"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      View on Google Maps
                    </a>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 ml-4">
                {/* Edit Button */}
                <button
                  onClick={() => handleEdit(location)}
                  className="flex items-center justify-center w-9 h-9 border-none rounded-md bg-transparent text-gray-500 cursor-pointer transition duration-200 hover:bg-gray-100 hover:text-[#13274f]"
                >
                  <Edit className="w-4 h-4" />
                </button>
                {/* Delete Button */}
                <button
                  onClick={() => handleDelete(location.id)}
                  className="flex items-center justify-center w-9 h-9 border-none rounded-md bg-transparent text-gray-500 cursor-pointer transition duration-200 hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {!loading && filteredLocations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg m-0">
              {searchTerm ? "No locations match your search criteria." : "No locations found."}
            </p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {(isAddModalOpen || isEditModalOpen) && ( // Combined rendering logic for cleaner modal structure
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]" onClick={closeModal}>
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 pb-0 border-b border-gray-200 mb-6">
              <h2 className="text-xl font-semibold text-[#13274f] m-0">
                {isAddModalOpen ? "Add New Location" : "Edit Location"}
              </h2>
              <button onClick={closeModal} className="bg-transparent border-none text-gray-500 cursor-pointer p-1 rounded-md transition duration-200 hover:text-gray-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={isAddModalOpen ? handleSubmitAdd : handleSubmitEdit} className="px-6 pb-6">
              {/* Location Name */}
              <div className="mb-5">
                <label htmlFor={isAddModalOpen ? "name" : "edit-name"} className="block text-sm font-medium text-gray-700 mb-1.5">
                  Location Name *
                </label>
                <input
                  id={isAddModalOpen ? "name" : "edit-name"}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter location name"
                  required
                  className="w-full py-2.5 px-3 border border-gray-300 rounded-md text-sm outline-none transition duration-200 focus:border-blue-500 box-border"
                />
              </div>
              {/* Address */}
              <div className="mb-5">
                <label htmlFor={isAddModalOpen ? "address" : "edit-address"} className="block text-sm font-medium text-gray-700 mb-1.5">
                  Address *
                </label>
                <textarea
                  id={isAddModalOpen ? "address" : "edit-address"}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter full address"
                  required
                  className="w-full py-2.5 px-3 border border-gray-300 rounded-md text-sm outline-none transition duration-200 focus:border-blue-500 box-border resize-y min-h-[80px]"
                  rows={3}
                />
              </div>
              {/* Google Maps Link */}
              <div className="mb-5">
                <label htmlFor="googleMapsUrl" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Google Maps Link (Optional)
                </label>
                <input
                  id="googleMapsUrl"
                  type="url"
                  value={formData.googleMapsUrl}
                  onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })}
                  placeholder="https://maps.google.com/..."
                  className="w-full py-2.5 px-3 border border-gray-300 rounded-md text-sm outline-none transition duration-200 focus:border-blue-500 box-border"
                />
                <p className="text-xs text-gray-500 mt-1 italic">Paste the Google Maps link for this location</p>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="py-3 px-6 border border-gray-300 rounded-lg text-sm font-semibold cursor-pointer transition duration-200 bg-transparent text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-3 px-6 border-none rounded-lg text-sm font-semibold cursor-pointer transition duration-200 bg-[#13274f] text-white hover:bg-opacity-90 disabled:opacity-50"
                  disabled={loading}
                >
                  {isAddModalOpen
                    ? (loading ? "Adding..." : "Add Location")
                    : (loading ? "Updating..." : "Update Location")}
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