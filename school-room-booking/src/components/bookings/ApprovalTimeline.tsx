'use client'

interface ApprovalStepMember {
  name: string
}

interface ApprovalStep {
  order: number
  title: string
  description: string
  type: 'approval' | 'cc'
  members: ApprovalStepMember[]
}

interface ApprovalTimelineProps {
  steps: ApprovalStep[]
  bookingStatus: string
}

export default function ApprovalTimeline({ steps, bookingStatus }: ApprovalTimelineProps) {
  if (steps.length === 0) return null

  const sortedSteps = [...steps].sort((a, b) => a.order - b.order)

  const getInitial = (name: string) => {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <h3 className="text-lg font-semibold text-slate-800 mb-5">Approval Process</h3>

      <div className="relative">
        {/* Start node */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative z-10 w-6 h-6 rounded-full bg-red-700 flex items-center justify-center shrink-0">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
          <span className="text-sm font-medium text-red-700">Start</span>
          {bookingStatus === 'PENDING' && (
            <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
              Awaiting
            </span>
          )}
        </div>

        {/* Steps */}
        {sortedSteps.map((step, index) => (
          <div key={index} className="relative flex gap-3 mb-6">
            {/* Dashed line connecting to previous */}
            <div className="absolute left-3 top-[-12px] w-px h-[calc(100%+12px)] border-l-2 border-dashed border-red-200" />

            {/* Step dot */}
            <div className="relative z-10 w-6 h-6 rounded-full bg-red-100 border-2 border-red-400 flex items-center justify-center shrink-0 mt-0.5">
              {step.type === 'approval' ? (
                <svg className="w-3 h-3 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3 h-3 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              )}
            </div>

            {/* Step content */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-slate-800">{step.title}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    step.type === 'approval'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {step.type === 'approval' ? 'Approval' : 'CC'}
                </span>
              </div>
              {step.description && (
                <p className="text-xs text-slate-500 mb-2">{step.description}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {step.members.map((member, mi) => (
                  <div
                    key={mi}
                    className="flex items-center gap-2 bg-slate-50 rounded-full px-3 py-1.5"
                  >
                    <div className="w-6 h-6 rounded-full bg-red-100 text-red-800 flex items-center justify-center text-[10px] font-bold">
                      {getInitial(member.name)}
                    </div>
                    <span className="text-xs font-medium text-slate-700">{member.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* End node */}
        <div className="relative flex items-center gap-3">
          <div className="absolute left-3 top-[-12px] w-px h-[12px] border-l-2 border-dashed border-red-200" />
          <div className="relative z-10 w-6 h-6 rounded-full bg-red-700 flex items-center justify-center shrink-0">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
          <span className="text-sm font-medium text-red-700">End</span>
        </div>
      </div>
    </div>
  )
}
