export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">📡</div>
        <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">Você está offline</h1>
        <p className="text-lg text-gray-600 mb-8">
          Sem problemas! Você pode continuar usando o Game Habit. Suas ações serão sincronizadas
          quando você voltar a ter conexão.
        </p>
        <div className="bg-mario-blue/10 border-2 border-mario-blue rounded-2xl p-6">
          <h3 className="font-display font-bold text-lg mb-2">💡 Modo Offline Ativo</h3>
          <p className="text-sm text-gray-700">
            Complete seus hábitos normalmente. Tudo será salvo automaticamente quando você recuperar
            a conexão.
          </p>
        </div>
      </div>
    </div>
  )
}
