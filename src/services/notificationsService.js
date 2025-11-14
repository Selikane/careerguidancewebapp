// Add these functions to your StudentDashboard component
// Removed emojis from log messages and comments. All comments are now clear and direct.

// Enhanced mark as read function
const handleMarkAsRead = async (notificationId) => {
  try {
    await notificationsService.markAsRead(notificationId);
    // The real-time listener will automatically update the UI
  } catch (error) {
    console.error('Error marking notification as read:', error);
    showSnackbar('Error marking notification as read', 'error');
  }
};

// Mark all as read function
const handleMarkAllAsRead = async () => {
  try {
    await notificationsService.markAllAsRead(studentId);
    showSnackbar('All notifications marked as read', 'success');
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    showSnackbar('Error marking notifications as read', 'error');
  }
};

// Enhanced notifications listener setup
const setupNotificationsListener = (uid) => {
  try {
    notificationsUnsubscribe.current = notificationsService.getStudentNotifications(uid, (snapshot) => {
      if (snapshot.docs) {
        const notificationsData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            message: data.message || 'No message',
            type: data.type || 'info',
            read: data.read || false,
            createdAt: data.createdAt,
            readAt: data.readAt,
            actionUrl: data.actionUrl,
            ...data
          };
        });
        console.log('Notifications listener updated:', notificationsData.length, 'notifications');
        setNotifications(notificationsData);
      }
    });
    return true;
  } catch (error) {
    console.error('Error setting up notifications listener:', error);
    return false;
  }
};