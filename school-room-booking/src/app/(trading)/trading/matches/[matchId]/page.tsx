import MatchDetailClient from './MatchDetailClient'

export const metadata = {
  title: 'Course Trading - Match Detail',
}

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ matchId: string }>
}) {
  const { matchId } = await params
  return <MatchDetailClient matchId={matchId} />
}
