// pages/feed — asosiy lenta (hozircha placeholder, API keyin ulanadi)

export default function FeedPage() {
  return (
    <div className="mx-auto max-w-[470px] py-6">
      <h2 className="mb-4 text-lg font-semibold">Lenta</h2>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center gap-3 p-3">
              <div className="h-9 w-9 rounded-full bg-gray-200" />
              <div className="h-3 w-24 rounded bg-gray-200" />
            </div>
            <div className="aspect-square w-full bg-gray-100" />
            <div className="space-y-2 p-3">
              <div className="h-3 w-32 rounded bg-gray-200" />
              <div className="h-3 w-48 rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
