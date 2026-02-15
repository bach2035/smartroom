import nodemailer from 'nodemailer'
import { formatDate, formatTime } from '@/lib/utils'

const transporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null

const from = process.env.SMTP_FROM || 'School Room Booking <noreply@school.edu>'

function emailLayout(title: string, body: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f5f5">
  <div style="max-width:600px;margin:20px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
    <div style="background:#b11a1e;padding:20px 24px">
      <h1 style="margin:0;color:#fff;font-size:20px">${title}</h1>
    </div>
    <div style="padding:24px">
      ${body}
    </div>
    <div style="padding:16px 24px;background:#f9fafb;color:#6b7280;font-size:12px;text-align:center">
      School Room Booking System
    </div>
  </div>
</body>
</html>`
}

interface BookingEmailData {
  bookingTitle: string
  roomName: string
  roomNumber: string
  startTime: string
  endTime: string
  studentName: string
  studentEmail?: string
}

export async function sendBookingRequestEmail(
  adminEmails: string[],
  data: BookingEmailData
): Promise<void> {
  if (!transporter || adminEmails.length === 0) return

  const body = `
    <p>A new booking request has been submitted and requires your review.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:8px 12px;color:#6b7280;width:120px">Title</td><td style="padding:8px 12px;font-weight:600">${data.bookingTitle}</td></tr>
      <tr style="background:#f9fafb"><td style="padding:8px 12px;color:#6b7280">Room</td><td style="padding:8px 12px">${data.roomName} (${data.roomNumber})</td></tr>
      <tr><td style="padding:8px 12px;color:#6b7280">Date</td><td style="padding:8px 12px">${formatDate(data.startTime)}</td></tr>
      <tr style="background:#f9fafb"><td style="padding:8px 12px;color:#6b7280">Time</td><td style="padding:8px 12px">${formatTime(data.startTime)} – ${formatTime(data.endTime)}</td></tr>
      <tr><td style="padding:8px 12px;color:#6b7280">Requested by</td><td style="padding:8px 12px">${data.studentName}</td></tr>
    </table>
    <p style="color:#6b7280;font-size:14px">Please log in to the admin panel to approve or reject this request.</p>`

  try {
    await transporter.sendMail({
      from,
      to: adminEmails.join(', '),
      subject: `New Booking Request: ${data.bookingTitle}`,
      html: emailLayout('New Booking Request', body),
    })
  } catch (error) {
    console.error('Failed to send booking request email:', error)
  }
}

export async function sendBookingApprovedEmail(
  studentEmail: string,
  data: BookingEmailData
): Promise<void> {
  if (!transporter || !studentEmail) return

  const body = `
    <p>Great news! Your booking request has been <strong style="color:#16a34a">approved</strong>.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:8px 12px;color:#6b7280;width:120px">Title</td><td style="padding:8px 12px;font-weight:600">${data.bookingTitle}</td></tr>
      <tr style="background:#f9fafb"><td style="padding:8px 12px;color:#6b7280">Room</td><td style="padding:8px 12px">${data.roomName} (${data.roomNumber})</td></tr>
      <tr><td style="padding:8px 12px;color:#6b7280">Date</td><td style="padding:8px 12px">${formatDate(data.startTime)}</td></tr>
      <tr style="background:#f9fafb"><td style="padding:8px 12px;color:#6b7280">Time</td><td style="padding:8px 12px">${formatTime(data.startTime)} – ${formatTime(data.endTime)}</td></tr>
    </table>
    <p style="color:#6b7280;font-size:14px">Your room is confirmed. Please make sure to arrive on time.</p>`

  try {
    await transporter.sendMail({
      from,
      to: studentEmail,
      subject: `Booking Approved: ${data.bookingTitle}`,
      html: emailLayout('Booking Approved', body),
    })
  } catch (error) {
    console.error('Failed to send booking approved email:', error)
  }
}

export async function sendBookingRejectedEmail(
  studentEmail: string,
  data: BookingEmailData,
  reason?: string
): Promise<void> {
  if (!transporter || !studentEmail) return

  const reasonBlock = reason
    ? `<div style="margin:16px 0;padding:12px 16px;background:#fef2f2;border-left:4px solid #ef4444;border-radius:4px">
        <p style="margin:0;color:#991b1b;font-size:14px"><strong>Reason:</strong> ${reason}</p>
      </div>`
    : ''

  const body = `
    <p>Unfortunately, your booking request has been <strong style="color:#dc2626">rejected</strong>.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:8px 12px;color:#6b7280;width:120px">Title</td><td style="padding:8px 12px;font-weight:600">${data.bookingTitle}</td></tr>
      <tr style="background:#f9fafb"><td style="padding:8px 12px;color:#6b7280">Room</td><td style="padding:8px 12px">${data.roomName} (${data.roomNumber})</td></tr>
      <tr><td style="padding:8px 12px;color:#6b7280">Date</td><td style="padding:8px 12px">${formatDate(data.startTime)}</td></tr>
      <tr style="background:#f9fafb"><td style="padding:8px 12px;color:#6b7280">Time</td><td style="padding:8px 12px">${formatTime(data.startTime)} – ${formatTime(data.endTime)}</td></tr>
    </table>
    ${reasonBlock}
    <p style="color:#6b7280;font-size:14px">You may submit a new booking request for a different time or room.</p>`

  try {
    await transporter.sendMail({
      from,
      to: studentEmail,
      subject: `Booking Rejected: ${data.bookingTitle}`,
      html: emailLayout('Booking Rejected', body),
    })
  } catch (error) {
    console.error('Failed to send booking rejected email:', error)
  }
}
