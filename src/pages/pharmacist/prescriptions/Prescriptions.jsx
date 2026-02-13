import { useState, useEffect } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { Link } from 'react-router-dom'
import LogoutButton from '../../../components/LogoutButton'
import { Search, Filter, Eye, ArrowLeft, CheckCircle, Clock } from 'lucide-react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../../../firebase/config'

export default function Prescriptions() {
  const { currentUser } = useAuth()
  const [prescriptions, setPrescriptions] = useState([])
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  // Fetch prescriptions
  useEffect(() => {
    const prescriptionsRef = collection(db, 'prescriptions')
    const prescriptionsQuery = query(prescriptionsRef, orderBy('createdAt', 'desc'))
    
    const unsubscribe = onSnapshot(prescriptionsQuery, (snapshot) => {
      const prescriptionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setPrescriptions(prescriptionsData)
      setFilteredPrescriptions(prescriptionsData)
      setLoading(false)
    }, (error) => {
      console.error('Error fetching prescriptions:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Filter prescriptions
  useEffect(() => {
    let filtered = prescriptions

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(prescription =>
        prescription.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.doctorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.id?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        // Treat undefined, null, empty string, and 'pending' as pending
        filtered = filtered.filter(p => 
          !p.status || 
          p.status === '' || 
          p.status === 'pending' ||
          p.status === 'active'
        )
      } else {
        filtered = filtered.filter(p => p.status === statusFilter)
      }
    }

    setFilteredPrescriptions(filtered)
  }, [prescriptions, searchTerm, statusFilter])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Link to="/pharmacist" className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center hover:bg-orange-500/30 transition-colors">
              <ArrowLeft className="w-5 h-5 text-orange-400" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Prescriptions</h1>
              <p className="text-sm text-slate-400">View and manage prescriptions</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {/* Search and Filter */}
        <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by patient, doctor, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 outline-none focus:border-orange-400 transition-colors"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-orange-400 transition-colors appearance-none cursor-pointer"
              >
                <option value="all" className="bg-slate-800">All Prescriptions</option>
                <option value="pending" className="bg-slate-800">Pending</option>
                <option value="fulfilled" className="bg-slate-800">Fulfilled</option>
                <option value="completed" className="bg-slate-800">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Prescriptions List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white text-lg">Loading prescriptions...</p>
            </div>
          </div>
        ) : filteredPrescriptions.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 backdrop-blur-xl text-center">
            <p className="text-slate-400 text-lg">No prescriptions found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredPrescriptions.map((prescription) => (
              <div key={prescription.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl hover:bg-white/10 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold">{prescription.patientName || 'Unknown Patient'}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        prescription.status === 'fulfilled' || prescription.status === 'completed'
                          ? 'bg-green-400/20 text-green-400'
                          : 'bg-yellow-400/20 text-yellow-400'
                      }`}>
                        {prescription.status === 'fulfilled' || prescription.status === 'completed' ? (
                          <span className="flex items-center space-x-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>Fulfilled</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>Pending</span>
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400">Doctor</p>
                        <p className="font-medium">{prescription.doctorName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Date</p>
                        <p className="font-medium">{prescription.prescriptionDate || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Medicines</p>
                        <p className="font-medium">{prescription.medicines?.length || 0} items</p>
                      </div>
                    </div>

                    {prescription.medicines && prescription.medicines.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-slate-400 mb-2">Prescribed Medicines:</p>
                        <div className="flex flex-wrap gap-2">
                          {prescription.medicines.slice(0, 3).map((medicine, index) => (
                            <span key={index} className="px-3 py-1 bg-white/5 rounded-lg text-sm">
                              {medicine.name}
                            </span>
                          ))}
                          {prescription.medicines.length > 3 && (
                            <span className="px-3 py-1 bg-white/5 rounded-lg text-sm text-slate-400">
                              +{prescription.medicines.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <Link
                    to={`/pharmacist/prescriptions/${prescription.id}`}
                    className="ml-4 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-xl transition-colors flex items-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
