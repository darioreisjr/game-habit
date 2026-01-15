import { ShopList } from '@/components/shop/shop-list'

export default function ShopPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">🏪 Loja do Mario</h1>
          <p className="text-lg text-gray-600">
            Use suas moedas para comprar power-ups, temas e itens especiais!
          </p>
        </div>

        <ShopList />
      </div>
    </div>
  )
}
