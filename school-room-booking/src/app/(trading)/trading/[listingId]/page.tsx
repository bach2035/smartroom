import ListingDetailClient from './ListingDetailClient'

export const metadata = {
  title: 'Course Trading - Listing Detail',
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ listingId: string }>
}) {
  const { listingId } = await params
  return <ListingDetailClient listingId={listingId} />
}
