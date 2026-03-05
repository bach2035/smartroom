import { supabaseAdmin } from '@/lib/supabase'
import type { NotificationType } from '@/types'

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
}

export async function createNotification({ userId, type, title, message, link }: CreateNotificationParams) {
  try {
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        link: link || null,
      })
  } catch (error) {
    console.error('Failed to create notification:', error)
  }
}
