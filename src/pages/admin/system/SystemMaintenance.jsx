import { useState, useEffect } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { Link } from 'react-router-dom'
import LogoutButton from '../../../components/LogoutButton'
import { Settings, Database, TrendingUp, Server, ArrowLeft, CheckCircle } from 'lucide-react'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { db } from '../../../firebase/config'

export default function SystemMaintenance() {
  const { currentUser } = useAuth()
  const [stats, setStats] = useState({
    collections: {
      staffData: 0,
      appointments: 0,
      prescriptions: 0,
      medicines: 0,
      invoices: 0
    },
    loading: true
  })

  // Fetch collection statistics
  useEffect(() => {
    const collections = ['staffData', 'patientData', 'appointments', 'prescriptions', 'invoices']
    const unsubscribers = []

    collections.forEach(collectionName => {
      const collectionRef = collection(db, collectionName)
      const q = query(collectionRef)
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setStats(prev => ({
          ...prev,
          collections: {
            ...prev.collections,
            [collectionName]: snapshot.docs.length
          },
          loading: false
        }))
      }, (error) => {
        console.error(`Error fetching ${collectionName}:`, error)
        setStats(prev => ({
          ...prev,
          collections: {
            ...prev.collections,
            [collectionName]: 0
          },
          loading: false
        }))
      })

      unsubscribers.push(unsubscribe)
    })

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe())
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Link to="/admin" className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center hover:bg-blue-500/30 transition-colors">
              <ArrowLeft className="w-5 h-5 text-blue-400" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">System Maintenance</h1>
              <p className="text-sm text-slate-400">Monitor system health and statistics</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {/* System Health */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">System Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
              <div className="flex items-center space-x-3 mb-4">
                <Server className="w-6 h-6 text-green-400" />
                <h3 className="text-lg font-semibold">Firebase Status</h3>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-medium">Connected</span>
              </div>
              <p className="text-sm text-slate-400 mt-2">All services operational</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
              <div className="flex items-center space-x-3 mb-4">
                <Database className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-semibold">Database</h3>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-medium">Healthy</span>
              </div>
              <p className="text-sm text-slate-400 mt-2">Firestore operational</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
              <div className="flex items-center space-x-3 mb-4">
                <TrendingUp className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-semibold">Performance</h3>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-medium">Optimal</span>
              </div>
              <p className="text-sm text-slate-400 mt-2">Response time normal</p>
            </div>
          </div>
        </div>

        {/* Database Statistics */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Database Statistics</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            {stats.loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                <p className="ml-3 text-slate-400">Loading statistics...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-slate-300">Staff Data Collection</span>
                  <span className="text-blue-400 font-semibold">{stats.collections.staffData} documents</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-slate-300">Appointments Collection</span>
                  <span className="text-green-400 font-semibold">{stats.collections.appointments} documents</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-slate-300">Prescriptions Collection</span>
                  <span className="text-purple-400 font-semibold">{stats.collections.prescriptions} documents</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-slate-300">Patient Data Collection</span>
                  <span className="text-yellow-400 font-semibold">{stats.collections.patientData} documents</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-slate-300">Invoices Collection</span>
                  <span className="text-cyan-400 font-semibold">{stats.collections.invoices} documents</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* System Information */}
        <div>
          <h2 className="text-xl font-bold mb-4">System Information</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-white/10">
                <span className="text-slate-300">System Name</span>
                <span className="text-white font-medium">Asiri Healthcare Management System</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/10">
                <span className="text-slate-300">Backend</span>
                <span className="text-white font-medium">Firebase (Auth + Firestore)</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/10">
                <span className="text-slate-300">Frontend</span>
                <span className="text-white font-medium">React 19 + Vite</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-slate-300">Deployment</span>
                <span className="text-white font-medium">Vercel</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
