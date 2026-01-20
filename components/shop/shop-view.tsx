'use client'

import { ShopList } from './shop-list'

export function ShopView() {
  return (
    <div className="md:ml-64">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold">Loja do Mario</h1>
          <p className="text-text-secondary mt-1">
            Use suas moedas para comprar power-ups, temas e itens especiais!
          </p>
        </div>

        <ShopList />
      </div>
    </div>
  )
}
