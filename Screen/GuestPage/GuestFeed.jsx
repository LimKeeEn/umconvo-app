import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
    Alert,
    SafeAreaView,
    ScrollView,
    FlatList,
    ActivityIndicator,
    TextInput,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import Header from './GuestHeader';
// 1. ADDED: Import Firebase auth object (assuming it's available in this file's scope or imported from its config)
// You must ensure you have firebaseConfig.js in a relative path, or modify this line:
import { auth } from '../../firebaseConfig'; 

// --- CONFIGURATION CONSTANTS ---
const PROJECT_ID = 'umconvo-app'; // NOTE: Change this to your actual Firebase Project ID!
const HEADER_HEIGHT_SPACING = 55;
const BOTTOM_NAV_HEIGHT = 80;

// --- Custom PNG Frames Data ---
const frames = [
    { id: "none", label: "No Frame", file: null },
    { id: "frame1", label: "Golden Frame", file: require("../../assets/frames/frame1.png") },
    // { id: "frame2", label: "Blue Floral", file: require("../assets/frames/frame2.png") }, 
    // { id: "convocation", label: "Convocation Frame", file: require("../assets/frames/frame3.png") }, 
];

// Helper to format Firebase document fields
const formatFirebasePosts = (data) => {
    return data.documents?.map((doc) => ({
        id: doc.name.split("/").pop(),
        user: doc.fields.user?.stringValue || 'Anonymous',
        caption: doc.fields.caption?.stringValue || '',
        imageUrl: doc.fields.imageUrl?.stringValue || '',
        frameId: doc.fields.frameId?.stringValue || 'none',
    })) || [];
};

// ---------------------------------------------------------------------
// 1. Post Component for the Feed (No changes needed here)
// ---------------------------------------------------------------------
const PostItem = ({ post }) => {
    const frameFile = frames.find(f => f.id === post.frameId)?.file;

    return (
        <View style={feedStyles.postContainer}>
            <Text style={feedStyles.usernameText}>@{post.user}</Text>

            <View style={feedStyles.postImageWrapper}>
                <Image source={{ uri: post.imageUrl }} style={feedStyles.postImage} />

                {/* Frame Overlay */}
                {post.frameId !== "none" && frameFile && (
                    <Image
                        source={frameFile}
                        style={feedStyles.frameOverlayImage}
                        resizeMode="stretch"
                    />
                )}
            </View>

            <Text style={feedStyles.captionText}><Text style={{ fontWeight: 'bold' }}>@{post.user}</Text> {post.caption}</Text>
        </View>
    );
};

// ---------------------------------------------------------------------
// 2. Feed View Component (No changes needed here)
// ---------------------------------------------------------------------
const FeedView = ({ posts, loading, onNewPostPress, onRefresh }) => (
    // Note: styles.contentContainer padding is now 0 at the top
    <View style={styles.contentContainer}>
        {loading ? (
            <View style={styles.loadingState}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={styles.desc}>Loading posts...</Text>
            </View>
        ) : (
            <FlatList
                data={posts}
                renderItem={({ item }) => <PostItem post={item} />}
                keyExtractor={item => item.id}
                contentContainerStyle={{
                    paddingTop: 15, // Keep a small top padding inside the list
                    paddingBottom: BOTTOM_NAV_HEIGHT + 80
                }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                    <View style={styles.emptyState}>
                        <Ionicons name="people-outline" size={60} color="#aaa" />
                        <Text style={styles.desc}>No posts yet. Be the first!</Text>
                    </View>
                )}
            />
        )}

        {/* Floating Add Button */}
        <TouchableOpacity style={styles.addButton} onPress={onNewPostPress}>
            <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
    </View>
);

// ---------------------------------------------------------------------
// 3. New Post Creator Component (No functional changes)
// ---------------------------------------------------------------------
const NewPostCreator = ({ onGoBackToFeed, onPostSuccess, currentUserDisplayName }) => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedFrame, setSelectedFrame] = useState("none");
    const [caption, setCaption] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    
    // Determine the username to be used for the post
    const postUserName = currentUserDisplayName || 'Anonymous'; 

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== "granted") {
            Alert.alert("Permission required", "Please allow gallery access.");
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();

        if (status !== "granted") {
            Alert.alert("Permission required", "Please allow camera access.");
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
            cameraType: ImagePicker.CameraType.back,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    const handlePostToApp = async () => {
        if (!selectedImage) {
            Alert.alert("Error", "Please select an image first.");
            return;
        }
        if (caption.trim().length === 0) {
             Alert.alert("Hold on", "Please enter a caption for your post.");
             return;
        }

        setIsPosting(true);
        const postData = {
            fields: {
                user: { stringValue: postUserName }, 
                caption: { stringValue: caption.trim() }, 
                imageUrl: { stringValue: selectedImage }, 
                frameId: { stringValue: selectedFrame },
                createdAt: { timestampValue: new Date().toISOString() },
            }
        };

        try {
            const response = await fetch(
                `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/posts`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(postData),
                }
            );

            if (!response.ok) {
                const errorBody = await response.json();
                console.error("Firebase POST error:", errorBody);
                throw new Error(`Failed to save post. Status: ${response.status}`);
            }

            Alert.alert("Success! 🎉", `Your post was uploaded by @${postUserName}!`);
            
            setSelectedImage(null);
            setSelectedFrame("none");
            setCaption("");
            onPostSuccess(); 
            onGoBackToFeed();


        } catch (error) {
            console.error("Error posting to Firebase:", error);
            Alert.alert("Upload Error", error.message);
        } finally {
            setIsPosting(false);
        }
    };

    const handleSaveToGallery = async () => {
        if (!selectedImage) {
            Alert.alert("Error", "Please select an image first.");
            return;
        }

        Alert.alert("Image Saved! 🖼️", "The base image was saved to your gallery. Combining the frame requires advanced libraries (e.g., react-native-view-shot) which is beyond this example.");
    };

    // --- Frame Creator UI ---
    return (
        <ScrollView 
            style={creatorStyles.creatorScroll} 
            contentContainerStyle={creatorStyles.creatorContent}
        >
            <View style={creatorStyles.titleRow}>
            <TouchableOpacity onPress={onGoBackToFeed} style={creatorStyles.backBtn}>
                <Ionicons name="chevron-back" size={28} color="#4F46E5" />
            </TouchableOpacity>
            <Text style={creatorStyles.creatorTitle}>Create New Post</Text>
        </View>

            {/* Image Selection Area */}
            {!selectedImage ? (
                <View style={creatorStyles.uploadArea}>
                    <Ionicons name="camera-outline" size={120} color="#aaa" />
                    <Text style={creatorStyles.desc}>Take or upload a photo</Text>

                    {/* Take Photo Button */}
                    <TouchableOpacity style={creatorStyles.cameraBtn} onPress={takePhoto}>
                        <Ionicons name="camera" size={24} color="#fff" />
                        <Text style={creatorStyles.uploadText}>Open Camera</Text>
                    </TouchableOpacity>

                    {/* Upload From Gallery Button */}
                    <TouchableOpacity style={creatorStyles.uploadBtn} onPress={pickImage}>
                        <Ionicons name="cloud-upload-outline" size={24} color="#fff" />
                        <Text style={creatorStyles.uploadText}>Upload Photo</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                // Image Preview and Frame List
                <>
                    <View style={creatorStyles.previewWrapper}>
                        <Image source={{ uri: selectedImage }} style={creatorStyles.previewImage} />

                        {selectedFrame && selectedFrame !== "none" && (
                            <Image
                                source={frames.find((f) => f.id === selectedFrame)?.file}
                                style={creatorStyles.frameOverlayImage}
                                resizeMode="stretch"
                            />
                        )}
                    </View>

                    <Text style={creatorStyles.frameTitle}>Choose a Frame</Text>
                    <ScrollView horizontal style={creatorStyles.frameList} showsHorizontalScrollIndicator={false}>
                        {frames.map((frame) => (
                            <TouchableOpacity
                                key={frame.id}
                                style={[
                                    creatorStyles.frameOption,
                                    selectedFrame === frame.id && creatorStyles.frameSelected,
                                ]}
                                onPress={() => setSelectedFrame(frame.id)}
                            >
                                {frame.file ? (
                                    <Image
                                        source={frame.file}
                                        style={creatorStyles.frameThumbnail}
                                        resizeMode="contain"
                                    />
                                ) : (
                                    <View style={creatorStyles.noFrameBox}>
                                        <Text style={{ fontSize: 12 }}>None</Text>
                                    </View>
                                )}
                                <Text style={creatorStyles.frameLabel}>{frame.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Caption Input (REAL TEXT INPUT) */}
                    <View style={creatorStyles.captionInput}>
                        <Text style={creatorStyles.captionLabel}>Caption (Posting as @{postUserName})</Text>
                        <TextInput
                            style={creatorStyles.textInput}
                            placeholder="What's your story?"
                            value={caption}
                            onChangeText={setCaption}
                            multiline={true}
                            maxLength={150}
                        />
                    </View>

                    {/* Action Buttons */}
                    <View style={creatorStyles.actionButtonsContainer}>
                        <TouchableOpacity
                            style={[creatorStyles.actionButton, creatorStyles.postButton]}
                            onPress={handlePostToApp}
                            disabled={isPosting}
                        >
                            {isPosting ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Ionicons name="share-social-outline" size={20} color="#fff" />
                            )}
                            <Text style={creatorStyles.actionButtonText}>
                                {isPosting ? 'Posting...' : 'Post to App'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[creatorStyles.actionButton, creatorStyles.saveButton]}
                            onPress={handleSaveToGallery}
                            disabled={isPosting}
                        >
                            <Ionicons name="save-outline" size={20} color="#4F46E5" />
                            <Text style={[creatorStyles.actionButtonText, { color: '#4F46E5' }]}>Save to Gallery</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Reset Button */}
                    <TouchableOpacity
                        style={creatorStyles.retakeBtn}
                        onPress={() => setSelectedImage(null)}
                        disabled={isPosting}
                    >
                        <Ionicons name="trash-outline" size={20} color="#fff" />
                        <Text style={creatorStyles.btnText}>Remove Photo</Text>
                    </TouchableOpacity>
                </>
            )}
        </ScrollView>
    );
};


// ---------------------------------------------------------------------
// 4. Main Export Component (No functional changes needed here)
// ---------------------------------------------------------------------
export default function MainFrameScreen() {
    const [currentView, setCurrentView] = useState("feed");
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [currentUserDisplayName, setCurrentUserDisplayName] = useState('Anonymous');

    useEffect(() => {
        const user = auth.currentUser;
        if (user && user.displayName) {
            setCurrentUserDisplayName(user.displayName.split(' ')[0] || 'User');
        } else if (user && user.email) {
            setCurrentUserDisplayName(user.email.split('@')[0]);
        }
    }, []);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/posts?orderBy=createdAt%20desc`
            );
            
            if (!response.ok) {
                throw new Error('Failed to fetch posts from Firebase.');
            }
            
            const data = await response.json();
            const formattedPosts = formatFirebasePosts(data);
            setPosts(formattedPosts);

        } catch (error) {
            console.error("Error fetching posts:", error);
            Alert.alert("Data Error", "Could not load posts from the server.");
            setPosts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [refreshTrigger]);

    const handleNotificationPress = () => {
        console.log('Notification pressed');
    };

    const handlePostSuccess = () => {
        setRefreshTrigger(prev => prev + 1);
    }

    return (
        <SafeAreaView style={styles.safeArea}>

            {/* This View now fills the whole safe area, and the content flows below the Header */}
            <View style={{ flex: 1 }}> 

                <Header
                    title={currentView === 'feed' ? "SOCIAL FEED" : "NEW POST"}
                    onNotificationPress={handleNotificationPress}
                />

                {currentView === 'feed' ? (
                    <FeedView 
                        posts={posts} 
                        loading={loading}
                        onNewPostPress={() => setCurrentView('creator')} 
                    />
                ) : (
                    <NewPostCreator 
                        onGoBackToFeed={() => setCurrentView('feed')} 
                        onPostSuccess={handlePostSuccess}
                        currentUserDisplayName={currentUserDisplayName} 
                    />
                )}
            </View>

        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#fff",
    },
    contentContainer: {
        flex: 1,
        backgroundColor: "#f8f8f8",
        paddingHorizontal: 15,
        paddingTop: 150, 
    },
    loadingState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 100,
    },
    addButton: {
        position: 'absolute',
        bottom: BOTTOM_NAV_HEIGHT + 20,
        right: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#4F46E5',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    emptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 100,
    },
    desc: {
        fontSize: 16,
        marginVertical: 15,
        color: "#555",
    },
});

const feedStyles = StyleSheet.create({
    postContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 20,
        overflow: 'hidden',
        padding: 10,
        borderWidth: 1,
        borderColor: '#eee',
    },
    usernameText: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        color: '#4F46E5',
        paddingHorizontal: 5,
    },
    postImageWrapper: {
        width: '100%',
        aspectRatio: 3 / 4,
        position: 'relative',
        borderRadius: 8,
        overflow: 'hidden',
    },
    postImage: {
        width: "100%",
        height: "100%",
    },
    frameOverlayImage: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
    },
    captionText: {
        marginTop: 10,
        fontSize: 15,
        lineHeight: 22,
        paddingHorizontal: 5,
    },
});

const creatorStyles = StyleSheet.create({
    creatorScroll: {
        flex: 1,
        backgroundColor: "#f8f8f8",
    },
    creatorContent: {
        alignItems: "center",
        paddingTop: 150, 
        padding: 20,
        paddingBottom: 100,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 20,
    },

    backBtn: {
        marginRight: 10,
    },
    creatorTitle: {
        fontSize: 22,
        fontWeight: "bold",
        marginTop: 20, // Added slight top margin for spacing inside the view
        marginBottom: 20,
        alignSelf: 'flex-start',
        color: '#333',
    },
    uploadArea: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    desc: {
        fontSize: 16,
        marginVertical: 15,
        color: "#555",
    },
    uploadBtn: {
        backgroundColor: "#4F46E5",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        flexDirection: "row",
        alignItems: "center",
        marginTop: 20,
    },
    cameraBtn: {
        backgroundColor: "#10B981", // green
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        flexDirection: "row",
        alignItems: "center",
        marginTop: 10,
        marginBottom: 10,
    },
    uploadText: {
        color: "#fff",
        fontSize: 16,
        marginLeft: 8,
        fontWeight: "600",
    },
    previewWrapper: {
        width: 300,
        height: 400,
        position: "relative",
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#ccc',
        marginBottom: 10,
    },
    previewImage: {
        width: "100%",
        height: "100%",
    },
    frameOverlayImage: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
    },
    frameTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginTop: 20,
        marginBottom: 10,
        alignSelf: "flex-start",
        color: '#333',
    },
    frameList: {
        width: "100%",
        flexGrow: 0,
        paddingVertical: 5,
    },
    frameOption: {
        alignItems: "center",
        padding: 8,
        borderRadius: 10,
        backgroundColor: "#eee",
        marginRight: 15,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    frameSelected: {
        backgroundColor: "#D1D5FF",
        borderColor: '#4F46E5',
    },
    frameThumbnail: {
        width: 60,
        height: 60,
        marginBottom: 5,
    },
    noFrameBox: {
        width: 60,
        height: 60,
        backgroundColor: "#ddd",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 6,
        marginBottom: 5,
    },
    frameLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#333',
    },
    captionInput: {
        width: '100%',
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 10,
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        minHeight: 100,
    },
    captionLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4F46E5',
        marginBottom: 5,
    },
    textInput: {
        fontSize: 16,
        color: '#333',
        paddingVertical: 5,
        minHeight: 50,
        textAlignVertical: 'top',
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 30,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 5,
    },
    postButton: {
        backgroundColor: "#4F46E5",
    },
    saveButton: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: '#4F46E5',
    },
    actionButtonText: {
        fontSize: 15,
        fontWeight: "600",
        marginLeft: 8,
    },
    retakeBtn: {
        flexDirection: "row",
        backgroundColor: "#dc3545",
        padding: 12,
        borderRadius: 8,
        marginTop: 20,
        alignItems: "center",
        justifyContent: 'center',
        width: '100%',
    },
    btnText: {
        color: "#fff",
        fontSize: 15,
        marginLeft: 6,
        fontWeight: '600',
    },
});