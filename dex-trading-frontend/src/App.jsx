import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  BarChart3, 
  Settings, 
  LogOut,
  Bot,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react'
import './App.css'

// Backend URL - Railway production
const BACKEND_URL = 'https://dex-trading-system-altseason-production.up.railway.app'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Login state
  const [email, setEmail] = useState('ederziomek@upbet.com')
  const [password, setPassword] = useState('password123')

  // Dashboard data
  const [dashboardData, setDashboardData] = useState({
    capital_usdt: 0,
    active_trades: 0,
    daily_pnl: 0,
    total_trades: 0,
    win_rate: 0,
    total_pnl: 0,
    total_pnl_percent: 0
  })

  const [engineStatus, setEngineStatus] = useState({
    active: false,
    connected: false
  })

  const [portfolio, setPortfolio] = useState({
    totalValue: 0,
    positions: [],
    pnl: 0
  })

  // Check authentication on mount
  useEffect(() => {
    if (token) {
      setIsAuthenticated(true)
      fetchDashboardData()
      fetchEngineStatus()
      fetchPortfolio()
    }
  }, [token])

  // API calls
  const apiCall = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers
        },
        ...options
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error)
      throw error
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await apiCall('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })

      if (response.success) {
        const newToken = response.token
        setToken(newToken)
        localStorage.setItem('token', newToken)
        setUser(response.user)
        setIsAuthenticated(true)
        
        // Fetch initial data
        await Promise.all([
          fetchDashboardData(),
          fetchEngineStatus(),
          fetchPortfolio()
        ])
      } else {
        setError(response.message || 'Login failed')
      }
    } catch (error) {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setToken(null)
    localStorage.removeItem('token')
    setIsAuthenticated(false)
    setUser(null)
  }

  const fetchDashboardData = async () => {
    try {
      const response = await apiCall('/api/dashboard/stats')
      if (response.success) {
        setDashboardData(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    }
  }

  const fetchEngineStatus = async () => {
    try {
      const response = await apiCall('/api/engine/status')
      if (response.success) {
        setEngineStatus({
          active: response.data.active,
          connected: true
        })
      }
    } catch (error) {
      setEngineStatus({ active: false, connected: false })
    }
  }

  const fetchPortfolio = async () => {
    try {
      const response = await apiCall('/api/trading/portfolio')
      if (response.success) {
        setPortfolio(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch portfolio:', error)
    }
  }

  const toggleEngine = async () => {
    try {
      const endpoint = engineStatus.active ? '/api/engine/stop' : '/api/engine/start'
      const response = await apiCall(endpoint, { method: 'POST' })
      
      if (response.success) {
        setEngineStatus(prev => ({ ...prev, active: !prev.active }))
        await fetchDashboardData()
      }
    } catch (error) {
      setError('Failed to toggle engine')
    }
  }

  const executeTestTrade = async () => {
    try {
      const response = await apiCall('/api/trading/execute', {
        method: 'POST',
        body: JSON.stringify({
          pair: 'ETH/USDT',
          side: 'buy',
          amount: 1,
          price: 2500
        })
      })

      if (response.success) {
        await Promise.all([fetchDashboardData(), fetchPortfolio()])
        setError('') // Clear any previous errors
      }
    } catch (error) {
      setError('Failed to execute trade')
    }
  }

  // Login Form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-2xl">DEX Trading System</CardTitle>
            <CardDescription>
              Sistema de Trading Automatizado para Altseason
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main Dashboard
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">DEX Trading System</h1>
              <p className="text-sm text-slate-500">Altseason Edition</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant={engineStatus.connected ? "default" : "destructive"}>
              {engineStatus.connected ? "Connected" : "Disconnected"}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Capital USDT</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${dashboardData.capital_usdt}</div>
              <p className="text-xs text-muted-foreground">Available for trading</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Trades</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.active_trades}</div>
              <p className="text-xs text-muted-foreground">Currently running</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily P&L</CardTitle>
              {dashboardData.daily_pnl >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${dashboardData.daily_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${dashboardData.daily_pnl.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Today's performance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(dashboardData.win_rate * 100).toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Success rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trading Engine Control */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bot className="w-5 h-5 mr-2" />
                Trading Engine
              </CardTitle>
              <CardDescription>
                Control the automated trading system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge variant={engineStatus.active ? "default" : "secondary"}>
                  {engineStatus.active ? "Running" : "Stopped"}
                </Badge>
              </div>
              
              <Button 
                onClick={toggleEngine} 
                className="w-full"
                variant={engineStatus.active ? "destructive" : "default"}
              >
                {engineStatus.active ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Stop Engine
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Engine
                  </>
                )}
              </Button>

              <Button 
                onClick={executeTestTrade} 
                variant="outline" 
                className="w-full"
                disabled={!engineStatus.connected}
              >
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Execute Test Trade
              </Button>

              <Button 
                onClick={() => {
                  fetchDashboardData()
                  fetchEngineStatus()
                  fetchPortfolio()
                }} 
                variant="outline" 
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </Button>
            </CardContent>
          </Card>

          {/* Portfolio Overview */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wallet className="w-5 h-5 mr-2" />
                Portfolio Overview
              </CardTitle>
              <CardDescription>
                Current positions and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">${portfolio.totalValue}</div>
                  <div className="text-sm text-muted-foreground">Total Value</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${portfolio.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${portfolio.pnl.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">Unrealized P&L</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{portfolio.positions?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Open Positions</div>
                </div>
              </div>

              {portfolio.positions && portfolio.positions.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="font-medium">Active Positions</h4>
                  {portfolio.positions.map((position, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <div className="font-medium">{position.pair}</div>
                        <div className="text-sm text-muted-foreground">
                          {position.side} • {position.amount} @ ${position.avg_price}
                        </div>
                      </div>
                      <div className={`text-right ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        <div className="font-medium">${position.pnl.toFixed(2)}</div>
                        <div className="text-sm">
                          {position.pnl >= 0 ? '+' : ''}{((position.pnl / (position.amount * position.avg_price)) * 100).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No active positions</p>
                  <p className="text-sm">Start the trading engine to begin automated trading</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}

export default App

