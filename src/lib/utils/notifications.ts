export type NotificationType =
  | 'chat_message'
  | 'chat_mention'
  | 'meet_started'
  | 'calendar_event'
  | 'payroll_settled'
  | 'shift_approved'
  | 'shift_assigned'
  | 'timer_started'
  | 'timer_stopped'
  | 'leave_requested'
  | 'leave_status'
  | 'system_alert'

export interface NotificationItem {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  link?: string
  read: boolean
  metadata?: any
  created_at: string
}

export async function sendNotification(data: any) {
  return { success: true }
}

export async function sendBulkNotification(items: any[]) {
  return { success: true }
}
