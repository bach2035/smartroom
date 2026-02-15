'use client'

interface BookingGuideInfoProps {
  instructions: string | null
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  documentUrl: string | null
  documentName: string | null
}

const PROCESS_STEPS = [
  {
    label: 'Select your time slots and fill in the booking form below',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    label: 'Download the paperwork template below, fill it in, collect the required signatures, then scan and attach it to the booking form',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: 'Submit at least 12 hours before your desired time',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: 'An admin will review and approve or reject your request',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: 'You will receive an email notification once your booking is approved',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: 'Cancellations must be made at least 2 hours before the scheduled time',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
]

export default function BookingGuideInfo({
  instructions,
  contactName,
  contactEmail,
  contactPhone,
  documentUrl,
  documentName,
}: BookingGuideInfoProps) {
  const hasContact = contactName || contactEmail || contactPhone

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
      {/* Booking process steps */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">How to Book</h2>
        <ol className="space-y-3">
          {PROCESS_STEPS.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-bold shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="text-sm text-slate-600 leading-relaxed">{step.label}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Paperwork document download */}
      <div className="pt-4 border-t border-slate-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Required Paperwork</h2>
        {documentUrl ? (
          <>
            <p className="text-sm text-slate-600 mb-3">
              Please download the form below, fill it out, and attach it to your booking request.
            </p>
            <a
              href={documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="inline-flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 hover:bg-red-100 transition-colors"
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <p className="text-sm font-medium">{documentName || 'Download Form'}</p>
                <p className="text-xs text-red-500">Click to download</p>
              </div>
            </a>
          </>
        ) : (
          <p className="text-sm text-slate-400">No document attached for this room.</p>
        )}
      </div>

      {/* Custom instructions from admin */}
      {instructions && (
        <div className="pt-4 border-t border-slate-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Notes</h2>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
            {instructions}
          </p>
        </div>
      )}

      {/* Contact person */}
      {hasContact && (
        <div className="pt-4 border-t border-slate-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Person</h2>
          <div className="space-y-1.5">
            {contactName && (
              <p className="text-sm font-medium text-slate-700">{contactName}</p>
            )}
            {contactEmail && (
              <a
                href={`mailto:${contactEmail}`}
                className="flex items-center gap-2 text-sm text-red-700 hover:text-red-900 transition-colors"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {contactEmail}
              </a>
            )}
            {contactPhone && (
              <a
                href={`tel:${contactPhone}`}
                className="flex items-center gap-2 text-sm text-red-700 hover:text-red-900 transition-colors"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {contactPhone}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
