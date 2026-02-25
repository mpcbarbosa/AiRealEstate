export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">ImoRadar</h1>
          <p className="text-gray-400 mt-1">CRM Imobiliário</p>
        </div>
        {children}
      </div>
    </div>
  )
}
