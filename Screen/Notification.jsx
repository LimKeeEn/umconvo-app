import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from "firebase/auth";

// Configure how notifications are displayed when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Icon mapping based on notification types
const NOTIFICATION_ICON_MAP = {
  news_added: "newspaper",
  news_updated: "create",
  news_deleted: "trash",
  event_added: "calendar",
  event_updated: "create",
  event_deleted: "trash",
  announcement_added: "megaphone",
  announcement_updated: "create",
  announcement_deleted: "trash",
  gallery_added: "images",
  gallery_updated: "create",
  gallery_deleted: "trash",
  custom: "notifications",
};

// Color mapping for different notification types
const NOTIFICATION_COLOR_MAP = {
  news_added: "#4CAF50",
  news_updated: "#2196F3",
  news_deleted: "#F44336",
  event_added: "#9C27B0",
  event_updated: "#2196F3",
  event_deleted: "#F44336",
  announcement_added: "#FF9800",
  announcement_updated: "#2196F3",
  announcement_deleted: "#F44336",
  gallery_added: "#00BCD4",
  gallery_updated: "#2196F3",
  gallery_deleted: "#F44336",
  custom: "#13274f",
};

const STORAGE_KEY = '@read_notifications';

const NotificationScreen = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readNotifications, setReadNotifications] = useState(new Set());
  const [selectedTab, setSelectedTab] = useState('all');
  const [userFaculty, setUserFaculty] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  const projectID = "umconvo-app";

  // Fetch current user's faculty from Firestore
  useEffect(() => {
    const fetchUserFaculty = async () => {
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;

        if (currentUser?.email) {
          const email = encodeURIComponent(currentUser.email);

          const url = `https://firestore.googleapis.com/v1/projects/${projectID}/databases/(default)/documents/students/${email}`;

          const response = await fetch(url);
          const data = await response.json();

          if (data.fields?.faculty?.stringValue) {
            setUserFaculty(data.fields.faculty.stringValue);
          } else {
            console.log("Faculty not found in Firestore.");
          }
        }
      } catch (error) {
        console.error("Error fetching user faculty:", error);
      }
    };

    fetchUserFaculty();
  }, []);

  // Load read notifications from AsyncStorage
  useEffect(() => {
    loadReadNotifications();
  }, []);

  const loadReadNotifications = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setReadNotifications(new Set(JSON.parse(stored)));
      }
    } catch (error) {
      console.log("Error loading read notifications:", error);
    }
  };

  const saveReadNotifications = async (readSet) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...readSet]));
    } catch (error) {
      console.log("Error saving read notifications:", error);
    }
  };

  const markAsRead = async (notificationId) => {
    const newReadSet = new Set(readNotifications);
    newReadSet.add(notificationId);
    setReadNotifications(newReadSet);
    await saveReadNotifications(newReadSet);
  };

  const markAllAsRead = async () => {
    const allIds = notifications.map(n => n.id);
    const newReadSet = new Set(allIds);
    setReadNotifications(newReadSet);
    await saveReadNotifications(newReadSet);
  };

  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification received:", notification);
        fetchNotifications();
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log("Notification tapped:", response);
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // Filter notifications based on user's faculty
  const filterNotificationsByFaculty = (notificationsList) => {
    if (!userFaculty) {
      return notificationsList;
    }

    return notificationsList.filter((notification) => {
      const targetFaculty = notification.targetFaculty;
      return targetFaculty === "all" || targetFaculty === userFaculty;
    });
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${projectID}/databases/(default)/documents/notifications?orderBy=createdAt%20desc`
      );

      const json = await response.json();

      if (!json.documents) {
        setNotifications([]);
      } else {
        const formatted = json.documents.map((doc) => ({
          id: doc.name.split("/").pop(),
          title: doc.fields.title.stringValue,
          body: doc.fields.body.stringValue,
          createdAt: doc.fields.createdAt.integerValue,
          type: doc.fields.type?.stringValue || "custom",
          category: doc.fields.metadata?.mapValue?.fields?.category?.stringValue || "general",
          targetFaculty: doc.fields.targetFaculty?.stringValue || "all",
        }));

        const filteredNotifications = filterNotificationsByFaculty(formatted);
        setNotifications(filteredNotifications);
      }
    } catch (error) {
      console.log("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userFaculty !== null) {
      fetchNotifications();

      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [userFaculty]);

  // Format timestamp → readable date
  const formatDate = (ms) => {
    if (!ms) return "";
    const d = new Date(parseInt(ms));
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatFullDate = (ms) => {
    if (!ms) return "";
    const d = new Date(parseInt(ms));
    return d.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationIcon = (type) => {
    return NOTIFICATION_ICON_MAP[type] || "notifications";
  };

  const getNotificationColor = (type) => {
    return NOTIFICATION_COLOR_MAP[type] || "#13274f";
  };

  const getCategoryBadge = (category) => {
    const badges = {
      news: "📰 News",
      events: "📅 Event",
      announcements: "📢 Announcement",
      gallery: "🖼️ Gallery",
      important_dates: "📆 Important Date",
      convocation: "🎓 Convocation",
      attire: "👔 Attire Collection",
      general: "ℹ️ General",
    };
    return badges[category] || badges.general;
  };

  const isUnread = (notificationId) => {
    return !readNotifications.has(notificationId);
  };

  // Filter notifications based on selected tab
  const filteredNotifications = selectedTab === 'unread' 
    ? notifications.filter(n => isUnread(n.id))
    : notifications;

  const unreadCount = notifications.filter(n => isUnread(n.id)).length;

  const handleNotificationPress = (notification) => {
    if (isUnread(notification.id)) {
      markAsRead(notification.id);
    }
    setSelectedNotification(notification);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedNotification(null);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fc" }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NOTIFICATIONS</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'all' && styles.activeTab]}
          onPress={() => setSelectedTab('all')}
        >
          <Text style={[styles.tabText, selectedTab === 'all' && styles.activeTabText]}>
            All ({notifications.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'unread' && styles.activeTab]}
          onPress={() => setSelectedTab('unread')}
        >
          <Text style={[styles.tabText, selectedTab === 'unread' && styles.activeTabText]}>
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loading */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#13274f" />
          <Text style={{ marginTop: 10, color: "#666" }}>Loading notifications...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
          {/* No Notifications */}
          {filteredNotifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>
                {selectedTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </Text>
              <Text style={styles.emptySubtext}>
                {selectedTab === 'unread' 
                  ? 'All caught up! Check back later for updates.'
                  : "You'll see updates here when there are new announcements"
                }
              </Text>
            </View>
          ) : (
            <>
              {/* Section Header with Mark All Read Button */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {filteredNotifications.length} Notification{filteredNotifications.length !== 1 ? "s" : ""}
                </Text>
                {unreadCount > 0 && (
                  <TouchableOpacity 
                    style={styles.markAllButton}
                    onPress={markAllAsRead}
                  >
                    <Text style={styles.markAllButtonText}>Mark all as read</Text>
                  </TouchableOpacity>
                )}
              </View>
              {filteredNotifications.map((item) => {
                const iconColor = getNotificationColor(item.type);
                const iconName = getNotificationIcon(item.type);
                const unread = isUnread(item.id);

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.card, unread && styles.unreadCard]}
                    activeOpacity={0.7}
                    onPress={() => handleNotificationPress(item)}
                  >
                    {/* Unread indicator dot */}
                    {unread && <View style={styles.unreadDot} />}

                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: iconColor + "20" },
                      ]}
                    >
                      <Ionicons name={iconName} size={24} color={iconColor} />
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={styles.cardHeader}>
                        <Text style={[styles.cardTitle, unread && styles.unreadTitle]}>
                          {item.title}
                        </Text>
                        <Text style={styles.categoryBadge}>
                          {getCategoryBadge(item.category)}
                        </Text>
                      </View>
                      <Text style={styles.cardBody} numberOfLines={2}>
                        {item.body}
                      </Text>
                      <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </ScrollView>
      )}

      {/* Notification Detail Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={closeModal}
        >
          <Pressable 
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            {selectedNotification && (
              <>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.modalIconContainer}>
                      <View
                        style={[
                          styles.modalIconBadge,
                          { backgroundColor: getNotificationColor(selectedNotification.type) + "20" },
                        ]}
                      >
                        <Ionicons 
                          name={getNotificationIcon(selectedNotification.type)} 
                          size={28} 
                          color={getNotificationColor(selectedNotification.type)} 
                        />
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity 
                    onPress={closeModal}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={28} color="#666" />
                  </TouchableOpacity>
                </View>

                {/* Modal Body */}
                <ScrollView style={styles.modalBody}>
                  <Text style={styles.modalCategoryBadge}>
                    {getCategoryBadge(selectedNotification.category)}
                  </Text>
                  <Text style={styles.modalTitle}>{selectedNotification.title}</Text>
                  <Text style={styles.modalDate}>
                    {formatFullDate(selectedNotification.createdAt)}
                  </Text>
                  <View style={styles.modalDivider} />
                  <Text style={styles.modalBodyText}>{selectedNotification.body}</Text>
                </ScrollView>

                {/* Modal Footer */}
                <View style={styles.modalFooter}>
                  <TouchableOpacity 
                    style={styles.modalCloseButton}
                    onPress={closeModal}
                  >
                    <Text style={styles.modalCloseButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

export default NotificationScreen;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 50,
    padding: 15,
    backgroundColor: "white",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#13274f",
  },
  tabText: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#13274f",
    fontWeight: "700",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
    marginLeft: 4,
  },
  markAllButtonText: {
    color: "#2196F3",
    fontSize: 13,
    fontWeight: "600",
  },
  card: {
    flexDirection: "row",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    position: "relative",
  },
  unreadCard: {
    backgroundColor: "#f8f9ff",
    borderColor: "#e3e7ff",
  },
  unreadDot: {
    position: "absolute",
    top: 12,
    left: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F44336",
    zIndex: 10,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginLeft: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a1a",
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    color: "#13274f",
  },
  categoryBadge: {
    fontSize: 11,
    color: "#666",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  cardBody: {
    fontSize: 14,
    color: "#555",
    marginBottom: 8,
    lineHeight: 20,
  },
  cardDate: {
    fontSize: 12,
    color: "#999",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    marginTop: 100,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 16,
    color: "#666",
    fontSize: 18,
    fontWeight: "600",
  },
  emptySubtext: {
    marginTop: 8,
    color: "#999",
    fontSize: 14,
    textAlign: "center",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    width: "100%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    paddingBottom: 10,
  },
  modalIconContainer: {
    alignItems: "flex-start",
  },
  modalIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalCategoryBadge: {
    fontSize: 13,
    color: "#666",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 12,
    fontWeight: "600",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#13274f",
    marginBottom: 8,
    lineHeight: 28,
  },
  modalDate: {
    fontSize: 13,
    color: "#999",
    marginBottom: 16,
  },
  modalDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginBottom: 16,
  },
  modalBodyText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 24,
  },
  modalFooter: {
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  modalCloseButton: {
    backgroundColor: "#13274f",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  modalCloseButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});