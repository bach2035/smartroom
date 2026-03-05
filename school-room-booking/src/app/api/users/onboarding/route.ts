import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data } = await supabaseAdmin
      .from('users')
      .select('onboarding_completed')
      .eq('id', session.user.id)
      .single()

    return NextResponse.json({ onboardingCompleted: data?.onboarding_completed ?? true })
  } catch (error) {
    console.error('Error fetching onboarding status:', error)
    return NextResponse.json({ onboardingCompleted: true }, { status: 500 })
  }
}

export async function PATCH() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await supabaseAdmin
      .from('users')
      .update({ onboarding_completed: true })
      .eq('id', session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating onboarding status:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
