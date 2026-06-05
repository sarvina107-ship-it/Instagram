// pages/explore — kashf qilish gridi (placeholder)

export default function ExplorePage() {
  return (
    <div className="py-6">
      <h2 className="mb-4 text-lg font-semibold">Kashf qilish</h2>
      <div className="grid grid-cols-3 gap-1 sm:gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-square rounded bg-gray-200" />
        ))}
      </div>
    </div>
  )
}
