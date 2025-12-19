'use client'

export default function PlaceholderPage({ title }: { title: string }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
            <h1 className="text-4xl font-bold text-emerald-900">{title}</h1>
            <p className="text-stone-500 max-w-md">
                We are working hard to bring this feature to your branch. Stay tuned!
            </p>
        </div>
    )
}
