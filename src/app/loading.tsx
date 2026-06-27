export default function Loading() {
    return (
        <div className="min-h-screen bg-sand flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-dattes-200 border-t-dattes-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[#2C1A00] font-medium">Chargement...</p>
            </div>
        </div>
    );
}
