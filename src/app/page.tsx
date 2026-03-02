import { redirect } from 'next/navigation'

// A verificação de sessão é feita pelo middleware
// A página raiz redireciona diretamente para login
export default function Home() {
  redirect('/login')
}
