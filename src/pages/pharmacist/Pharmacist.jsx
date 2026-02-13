import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Link } from 'react-router-dom'
import LogoutButton from '../../components/LogoutButton'
import { Pill, FileText, Package, AlertTriangle, TrendingUp, Eye } from 'lucide-react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../../firebase/config'

export default function Pharmacist() {
  const { currentUser } = useAuth()
  const [stats, setStats] = useState({
    totalPrescriptions: 0,
    pendingPrescriptions: 0,
    issuedToday: 0,
    lowStockItems: 0,
    totalInventory: 0
  })

  // Fetch real-time statistics
  useEffect(() => {
    // Fetch prescriptions
    const prescriptionsRef = collection(db, 'prescriptions')
    const prescriptionsQuery = query(prescriptionsRef)
    
    const unsubscribePrescriptions = onSnapshot(prescriptionsQuery, (snapshot) => {
      const prescriptions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      const pending = prescriptions.filter(p => p.status !== 'fulfilled' && p.status !== 'completed').length
      
      setStats(prev => ({
        ...prev,
        totalPrescriptions: prescriptions.length,
        pendingPrescriptions: pending
      }))
    }, (error) => {
      console.error('Error fetching prescriptions:', error)
    })

    // Fetch medicines inventory
    const medicinesRef = collection(db, 'medicines')
    const medicinesQuery = query(medicinesRef)
    
    const unsubscribeMedicines = onSnapshot(medicinesQuery, (snapshot) => {
      const medicines = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      const lowStock = medicines.filter(m => (m.stock || 0) <= (m.minStock || 10)).length
      
      setStats(prev => ({
        ...prev,
        totalInventory: medicines.length,
        lowStockItems: lowStock
      }))
    }, (error) => {
      console.error('Error fetching medicines:', error)
    })

    // Fetch drug issuance for today
    const drugIssuanceRef = collection(db, 'drugIssuance')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStart = today.toISOString()
    
    const unsubscribeIssuance = onSnapshot(drugIssuanceRef, (snapshot) => {
      // Filter in memory for today's issuances
      const todayIssuances = snapshot.docs.filter(doc => {
        const issuedAt = doc.data().issuedAt
        if (!issuedAt) return false
        const issuedDate = new Date(issuedAt)
        const today = new Date()
        return issuedDate.toDateString() === today.toDateString()
      })
      
      setStats(prev => ({
        ...prev,
        issuedToday: todayIssuances.length
      }))
    }, (error) => {
      console.error('Error fetching drug issuance:', error)
      // Collection might not exist yet, set to 0
      setStats(prev => ({ ...prev, issuedToday: 0 }))
    })

    return () => {
      unsubscribePrescriptions()
      unsubscribeMedicines()
      unsubscribeIssuance()
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              Pharmacist Dashboard
            </h1>
            <p className="text-sm text-slate-400">Manage inventory and dispense medications</p>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Prescriptions */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-semibold">Prescriptions</h3>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-blue-400">{stats.totalPrescriptions}</p>
              <p className="text-sm text-slate-400">Total prescriptions</p>
            </div>
          </div>

          {/* Pending Prescriptions */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
                <h3 className="text-lg font-semibold">Pending</h3>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-yellow-400">{stats.pendingPrescriptions}</p>
              <p className="text-sm text-slate-400">Awaiting fulfillment</p>
            </div>
          </div>

          {/* Issued Today */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-6 h-6 text-green-400" />
                <h3 className="text-lg font-semibold">Issued Today</h3>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-green-400">{stats.issuedToday}</p>
              <p className="text-sm text-slate-400">Medications dispensed</p>
            </div>
          </div>

          {/* Low Stock Items */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 text-red-400" />
                <h3 className="text-lg font-semibold">Low Stock</h3>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-red-400">{stats.lowStockItems}</p>
              <p className="text-sm text-slate-400">Items need restock</p>
            </div>
          </div>

          {/* Total Inventory */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Package className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-semibold">Inventory</h3>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-purple-400">{stats.totalInventory}</p>
              <p className="text-sm text-slate-400">Total medicines</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link to="/pharmacist/prescriptions" className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
              <div className="flex items-center space-x-3">
                <Eye className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-semibold">View Prescriptions</h3>
                  <p className="text-sm text-slate-400">Review and fulfill prescriptions</p>
                </div>
              </div>
            </Link>

            <Link to="/pharmacist/inventory" className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
              <div className="flex items-center space-x-3">
                <Package className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="font-semibold">Manage Inventory</h3>
                  <p className="text-sm text-slate-400">Update stock and add medicines</p>
                </div>
              </div>
            </Link>

            <Link to="/pharmacist/issue-drugs" className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
              <div className="flex items-center space-x-3">
                <Pill className="w-5 h-5 text-green-400" />
                <div>
                  <h3 className="font-semibold">Issue Drugs</h3>
                  <p className="text-sm text-slate-400">Dispense medications to patients</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <h2 className="text-xl font-bold mb-4">Account Information</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <span className="text-slate-400">Email</span>
              <span className="font-medium">{currentUser?.email}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <span className="text-slate-400">Role</span>
              <span className="font-medium text-orange-400">Pharmacist</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-400">User ID</span>
              <span className="font-medium text-sm">{currentUser?.uid}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
