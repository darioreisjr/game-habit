'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');
    setAwaitingConfirmation(false);

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    const supabase = createClient();

    try {
      // Passo 1: Criar usuário (sem trigger no banco)
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        },
      });

      if (signUpError) {
        setError(`Erro ao criar conta: ${signUpError.message}`);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError('Erro ao criar usuário. Tente novamente.');
        setLoading(false);
        return;
      }

      // Aguardar um pouco para garantir que o usuário está autenticado
      if (!authData.session) {
        setNotice('Conta criada. Confirme o email para continuar.');
        setAwaitingConfirmation(true);
        setLoading(false);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      // Passo 2: Criar profile manualmente (OBRIGATÓRIO)
      const userId = authData.user.id;
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          name: name || 'Usuário',
        })
        .select()
        .single();

      if (profileError) {
        // Verificar se já existe
        if (profileError.code === '23505' || profileError.message.includes('duplicate')) {
        } else {
          // Tentar fazer logout do usuário criado
          await supabase.auth.signOut();
          setError('Erro ao criar perfil. Por favor, tente novamente.');
          setLoading(false);
          return;
        }
      } else {
      }

      // Passo 3: Criar stats manualmente (OBRIGATÓRIO)
      const { error: statsError } = await supabase
        .from('stats')
        .insert({
          user_id: userId,
          level: 1,
          xp: 0,
          coins: 0,
        })
        .select()
        .single();

      if (statsError) {
        // Verificar se já existe
        if (statsError.code === '23505' || statsError.message.includes('duplicate')) {
        } else {
          // Tentar fazer logout do usuário criado
          await supabase.auth.signOut();
          setError('Erro ao criar estatísticas. Por favor, tente novamente.');
          setLoading(false);
          return;
        }
      } else {
      }

      // Sucesso total! Redirecionar para onboarding
      router.push('/onboarding');
      router.refresh();
    } catch (_err) {
      setError('Erro ao criar conta. Verifique sua conexão e tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-mario-red/10 to-mario-blue/10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-display">Game Habit</CardTitle>
          <CardDescription>Crie sua conta e comece a aventura</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-mario-red/10 border border-mario-red/20 text-mario-red text-sm">
                {error}
              </div>
            )}
            {notice && (
              <div className="p-3 rounded-xl bg-mario-blue/10 border border-mario-blue/20 text-mario-blue text-sm">
                {notice}
              </div>
            )}
            {awaitingConfirmation && (
              <p className="text-sm text-text-secondary">
                Verifique seu email e clique no link de confirmacao para continuar.
              </p>
            )}
            {!awaitingConfirmation && (
              <>
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Nome
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
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
                    placeholder=""
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <p className="text-xs text-text-secondary">Minimo de 6 caracteres</p>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            {!awaitingConfirmation ? (
              <>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Criando conta...' : 'Criar conta'}
                </Button>
                <p className="text-sm text-text-secondary text-center">
                  Ja tem uma conta?{' '}
                  <Link href="/login" className="text-mario-blue hover:underline font-medium">
                    Entrar
                  </Link>
                </p>
              </>
            ) : (
              <p className="text-sm text-text-secondary text-center">
                Ja confirmou o email?{' '}
                <Link href="/login" className="text-mario-blue hover:underline font-medium">
                  Entrar
                </Link>
              </p>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
