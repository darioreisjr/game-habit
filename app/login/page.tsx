'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const userId = user.id
        const userName =
          typeof user.user_metadata?.name === 'string' && user.user_metadata.name.trim().length > 0
            ? user.user_metadata.name
            : 'Usuario'

        await supabase.from('profiles').upsert(
          {
            id: userId,
            name: userName,
          },
          { onConflict: 'id', ignoreDuplicates: true }
        )

        await supabase.from('stats').upsert(
          {
            user_id: userId,
            level: 1,
            xp: 0,
            coins: 0,
          },
          { onConflict: 'user_id', ignoreDuplicates: true }
        )
      }

      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-mario-red/10 to-mario-blue/10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-display">Game Habit</CardTitle>
          <CardDescription>Entre para continuar sua jornada</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-mario-red/10 border border-mario-red/20 text-mario-red text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                E-mail
              </label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Link
              href="/forgot-password"
              className="text-sm text-mario-blue hover:underline inline-block"
            >
              Esqueceu a senha?
            </Link>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
            <p className="text-sm text-text-secondary text-center">
              Não tem uma conta?{' '}
              <Link href="/signup" className="text-mario-blue hover:underline font-medium">
                Criar conta
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
