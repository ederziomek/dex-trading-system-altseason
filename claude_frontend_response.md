Vou ajudar você a criar esse frontend seguindo as melhores práticas. Vamos por partes:

1. Primeiro, o `package.json` com as dependências necessárias:

```json
{
  "name": "dex-trading-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-slot": "^1.0.2",
    "@tanstack/react-query": "^5.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "date-fns": "^2.30.0",
    "jwt-decode": "^4.0.0",
    "lucide-react": "^0.290.0",
    "next": "14.0.0",
    "next-auth": "^4.24.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.9.0",
    "shadcn-ui": "^0.4.0",
    "socket.io-client": "^4.7.2",
    "tailwind-merge": "^1.14.0",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.8.9",
    "@types/react": "^18.2.33",
    "@types/react-dom": "^18.2.14",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.52.0",
    "eslint-config-next": "14.0.0",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5",
    "typescript": "^5.2.2"
  }
}
```

2. Configurações:

`next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*'
      }
    ]
  }
}

module.exports = nextConfig
```

`tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

3. Layout Principal (`src/app/layout.tsx`):

```tsx
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-background">
            <Header />
            <div className="flex">
              <Sidebar />
              <main className="flex-1 p-6">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}
```

4. Sistema de Autenticação (`src/lib/auth.ts`):

```typescript
import { create } from 'zustand'
import { jwtDecode } from 'jwt-decode'

interface AuthState {
  token: string | null
  user: any | null
  login: (token: string) => void
  logout: () => void
}

export const useAuth = create<AuthState>((set) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  user: null,
  login: (token) => {
    localStorage.setItem('token', token)
    const user = jwtDecode(token)
    set({ token, user })
  },
  logout: () => {
    localStorage.removeItem('token')
    set({ token: null, user: null })
  }
}))

export const api = {
  login: async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    if (!response.ok) throw new Error('Login failed')
    return response.json()
  }
}
```

5. Dashboard Principal (`src/app/dashboard/page.tsx`):

```tsx
import { Portfolio } from '@/components/dashboard/portfolio'
import { TradesList } from '@/components/dashboard/trades-list'
import { PerformanceChart } from '@/components/dashboard/performance-chart'
import { DexSettings } from '@/components/dashboard/dex-settings'

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Portfolio />
        <PerformanceChart />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <TradesList />
        <DexSettings />
      </div>
    </div>
  )
}
```

E um exemplo de componente do dashboard (`src/components/dashboard/portfolio.tsx`):

```tsx
import { Card } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'

export function Portfolio() {
  const { data, isLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => fetch('/api/dashboard/portfolio').then(res => res.json())
  })

  if (isLoading) return <div>Loading...</div>

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Portfolio Overview</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Total Value</p>
          <p className="text-2xl font-bold">${data?.totalValue}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">24h Change</p>
          <p className={`text-2xl font-bold ${data?.change24h > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {data?.change24h}%
          </p>
        </div>
      </div>
    </Card>
  )
}
```

Este é um setup básico mas completo para começar. Alguns pontos importantes:

1. Adicione WebSocket para dados em tempo real usando socket.io-client
2. Implemente proteção de rotas com middleware do Next.js
3. Adicione error boundaries e loading states
4. Configure interceptors para requisições HTTP
5. Implemente cache com React Query
6. Adicione animações suaves com Framer Motion

Você precisará implementar mais componentes específicos baseados nas necessidades do seu DEX, mas esta estrutura fornece uma base sólida para começar.