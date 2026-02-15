'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

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

interface RoomGuideEditorProps {
  isOpen: boolean
  onClose: () => void
  roomId: string
  roomName: string
}

export default function RoomGuideEditor({ isOpen, onClose, roomId, roomName }: RoomGuideEditorProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [instructions, setInstructions] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [documentUrl, setDocumentUrl] = useState('')
  const [documentName, setDocumentName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [steps, setSteps] = useState<ApprovalStep[]>([])

  useEffect(() => {
    if (isOpen && roomId) {
      fetchGuide()
    }
  }, [isOpen, roomId])

  const fetchGuide = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/rooms/${roomId}/guide`)
      if (res.ok) {
        const data = await res.json()
        if (data) {
          setInstructions(data.instructions || '')
          setContactName(data.contact_name || '')
          setContactEmail(data.contact_email || '')
          setContactPhone(data.contact_phone || '')
          setDocumentUrl(data.document_url || '')
          setDocumentName(data.document_name || '')
          setSteps(data.approval_steps || [])
        } else {
          resetForm()
        }
      }
    } catch (error) {
      console.error('Error fetching guide:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setInstructions('')
    setContactName('')
    setContactEmail('')
    setContactPhone('')
    setDocumentUrl('')
    setDocumentName('')
    setSteps([])
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/rooms/${roomId}/guide`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructions,
          contactName,
          contactEmail,
          contactPhone,
          documentUrl: documentUrl || null,
          documentName: documentName || null,
          approvalSteps: steps.map((s, i) => ({ ...s, order: i + 1 })),
        }),
      })

      if (res.ok) {
        onClose()
      }
    } catch (error) {
      console.error('Error saving guide:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`/api/admin/rooms/${roomId}/guide/document`, {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        setDocumentUrl(data.url)
        setDocumentName(data.fileName)
      }
    } catch (error) {
      console.error('Error uploading document:', error)
    } finally {
      setUploading(false)
    }
  }

  const addStep = () => {
    setSteps([
      ...steps,
      {
        order: steps.length + 1,
        title: '',
        description: '',
        type: 'approval',
        members: [],
      },
    ])
  }

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index))
  }

  const updateStep = (index: number, field: keyof ApprovalStep, value: string) => {
    setSteps(
      steps.map((s, i) =>
        i === index ? { ...s, [field]: value } : s
      )
    )
  }

  const addMember = (stepIndex: number) => {
    setSteps(
      steps.map((s, i) =>
        i === stepIndex
          ? { ...s, members: [...s.members, { name: '' }] }
          : s
      )
    )
  }

  const removeMember = (stepIndex: number, memberIndex: number) => {
    setSteps(
      steps.map((s, i) =>
        i === stepIndex
          ? { ...s, members: s.members.filter((_, mi) => mi !== memberIndex) }
          : s
      )
    )
  }

  const updateMember = (stepIndex: number, memberIndex: number, name: string) => {
    setSteps(
      steps.map((s, i) =>
        i === stepIndex
          ? {
              ...s,
              members: s.members.map((m, mi) =>
                mi === memberIndex ? { ...m, name } : m
              ),
            }
          : s
      )
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Booking Guide — ${roomName}`} size="xl">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instructions
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={4}
              placeholder="Enter booking instructions, required paperwork, etc."
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>

          {/* Paperwork Document */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paperwork Template (Word/PDF)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Upload a document that users need to fill out for this room. Each room can have a different form.
            </p>
            {documentUrl ? (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <svg className="w-5 h-5 text-red-700 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm text-gray-700 truncate flex-1">{documentName}</span>
                <button
                  type="button"
                  onClick={() => { setDocumentUrl(''); setDocumentName('') }}
                  className="text-red-400 hover:text-red-600 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-red-400 transition-colors">
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-500">Uploading...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm text-gray-500">Click to upload document</span>
                  </>
                )}
                <input
                  type="file"
                  accept=".doc,.docx,.pdf,.xls,.xlsx"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          {/* Contact Person */}
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3">Contact Person</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                id="contactName"
                label="Name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Nguyen Van A"
              />
              <Input
                id="contactEmail"
                label="Email"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="email@example.com"
              />
              <Input
                id="contactPhone"
                label="Phone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+84..."
              />
            </div>
          </div>

          {/* Approval Steps */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-800">Approval Steps</h4>
              <Button variant="ghost" size="sm" onClick={addStep}>
                + Add Step
              </Button>
            </div>

            <div className="space-y-4">
              {steps.map((step, stepIndex) => (
                <div
                  key={stepIndex}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-medium text-gray-500">
                      Step {stepIndex + 1}
                    </span>
                    <button
                      onClick={() => removeStep(stepIndex)}
                      className="text-red-400 hover:text-red-600 text-sm"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <Input
                      id={`step-title-${stepIndex}`}
                      label="Title"
                      value={step.title}
                      onChange={(e) => updateStep(stepIndex, 'title', e.target.value)}
                      placeholder="e.g. Approval from department"
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <select
                        value={step.type}
                        onChange={(e) => updateStep(stepIndex, 'type', e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                      >
                        <option value="approval">Approval</option>
                        <option value="cc">CC</option>
                      </select>
                    </div>
                    <Input
                      id={`step-desc-${stepIndex}`}
                      label="Description"
                      value={step.description}
                      onChange={(e) => updateStep(stepIndex, 'description', e.target.value)}
                      placeholder="Optional description"
                    />
                  </div>

                  {/* Members */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500">Members</span>
                      <button
                        onClick={() => addMember(stepIndex)}
                        className="text-red-700 hover:text-red-800 text-xs font-medium"
                      >
                        + Add Member
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {step.members.map((member, memberIndex) => (
                        <div
                          key={memberIndex}
                          className="flex items-center gap-1 bg-gray-50 rounded-full pl-1 pr-2 py-1"
                        >
                          <input
                            value={member.name}
                            onChange={(e) =>
                              updateMember(stepIndex, memberIndex, e.target.value)
                            }
                            placeholder="Name"
                            className="bg-transparent text-sm w-32 px-2 py-0.5 focus:outline-none"
                          />
                          <button
                            onClick={() => removeMember(stepIndex, memberIndex)}
                            className="text-gray-400 hover:text-red-500 text-xs"
                          >
                            x
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {steps.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  No approval steps configured. Click &quot;+ Add Step&quot; to begin.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button loading={saving} onClick={handleSave}>
          Save Guide
        </Button>
      </div>
    </Modal>
  )
}
