import { type ClassValue, clsx } from 'clsx'

export const TZ = 'Asia/Bangkok' // GMT+7

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

/** Get today's date as YYYY-MM-DD in GMT+7 */
export function getTodayString(): string {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(now) // en-CA gives YYYY-MM-DD
  return parts
}

/** Convert a YYYY-MM-DD + HH:mm to an ISO string in GMT+7 */
export function toGMT7ISO(date: string, time: string): string {
  return new Date(`${date}T${time}:00+07:00`).toISOString()
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: TZ })
  const parts = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: TZ }).format(d)
  return `${weekday}, ${parts}`
}

export function formatDateFromString(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00+07:00')
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: TZ })
  const parts = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: TZ }).format(d)
  return `${weekday}, ${parts}`
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: TZ,
  })
}

export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} at ${formatTime(date)}`
}

export function generateTimeSlots(
  startHour: number = 7,
  endHour: number = 22,
  intervalMinutes: number = 30
): string[] {
  const slots: string[] = []
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      slots.push(
        `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      )
    }
  }
  return slots
}

export function isTimeInRange(
  time: Date,
  startTime: Date,
  endTime: Date
): boolean {
  return time >= startTime && time < endTime
}

/** Get current time as HH:mm in GMT+7 */
export function getCurrentTimeGMT7(): string {
  const now = new Date()
  return now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ,
  })
}

/** Round up to the next 30-min slot boundary. e.g. 14:05 → 14:30, 14:30 → 14:30, 14:31 → 15:00 */
export function getNextSlotTime(time: string = getCurrentTimeGMT7()): string {
  const [h, m] = time.split(':').map(Number)
  let nextM = m <= 0 ? 0 : m <= 30 ? 30 : 60
  let nextH = h
  if (nextM === 60) { nextH++; nextM = 0 }
  if (nextH >= 22) return '22:00'
  return `${nextH.toString().padStart(2, '0')}:${nextM.toString().padStart(2, '0')}`
}

export function getDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(date)
}

export function relativeTime(dateStr: string): string {
  const now = Date.now()
  const diff = now - new Date(dateStr).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}
