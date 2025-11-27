import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [selectedTab, setSelectedTab] = useState('all'); // 'all' or 'unread'
  const notificationListener = useRef();
  const responseListener = useRef();

  const projectID = "umconvo-app";

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
        }));

        setNotifications(formatted);
      }
    } catch (error) {
      console.log("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every 30 seconds (optional)
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

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
    // Add any additional navigation or action here
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
                      <Text style={styles.cardBody}>{item.body}</Text>
                      <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </ScrollView>
      )}
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
});