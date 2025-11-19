export interface Notification {
  id: string;
  userId: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export class NotificationService {
  async sendNotification(
    userId: string,
    type: Notification["type"],
    title: string,
    message: string
  ): Promise<Notification> {
    // Mock implementation - in real app, send via email/push/websocket
    const notification: Notification = {
      id: `notif_${Date.now()}`,
      userId,
      type,
      title,
      message,
      read: false,
      createdAt: new Date().toISOString(),
    };

    console.log("Sending notification:", notification);

    return notification;
  }

  async getNotifications(userId: string, limit: number = 10): Promise<Notification[]> {
    // Mock implementation
    return Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
      id: `notif_${i}`,
      userId,
      type: (["info", "success", "warning"][i % 3] as any),
      title: `Notification ${i + 1}`,
      message: `This is notification message ${i + 1}`,
      read: i % 2 === 0,
      createdAt: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
    }));
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    // Mock implementation
    console.log(`Marking notification ${notificationId} as read`);
    return true;
  }

  async markAllAsRead(userId: string): Promise<number> {
    // Mock implementation
    console.log(`Marking all notifications as read for user ${userId}`);
    return 5; // Return count of marked notifications
  }

  async deleteNotification(notificationId: string): Promise<boolean> {
    // Mock implementation
    console.log(`Deleting notification ${notificationId}`);
    return true;
  }
}

export const notificationService = new NotificationService();

