import { useState, useEffect } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { Link } from 'react-router-dom'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import { FaPills, FaArrowLeft, FaEye, FaMagnifyingGlass, FaCalendar } from 'react-icons/fa6'
import toast from 'react-hot-toast'

export default function Prescriptions() {
  const { currentUser } = useAuth()
  const [prescriptions, setPrescriptions] = useState([])
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch prescriptions
  useEffect(() => {
    if (!currentUser) return

    const prescriptionsRef = collection(db, 'prescriptions')
    const q = query(
      prescriptionsRef,
      where('patientEmail', '==', currentUser.email)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prescriptionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      // Sort by createdAt in JavaScript to avoid composite index requirement
      prescriptionsData.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.prescriptionDate)
        const dateB = new Date(b.createdAt || b.prescriptionDate)
        return dateB - dateA // descending order (newest first)
      })
      setPrescriptions(prescriptionsData)
      setFilteredPrescriptions(prescriptionsData)
      setLoading(false)
    }, (error) => {
      console.error('Error fetching prescriptions:', error)
      toast.error('Failed to load prescriptions')
      setLoading(false)
    })

    return unsubscribe
  }, [currentUser])

  // Filter prescriptions based on search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPrescriptions(prescriptions)
    } else {
      const filtered = prescriptions.filter(prescription => 
        prescription.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.medicines?.some(med => 
          med.name?.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        prescription.prescriptionDate?.includes(searchTerm)
      )
      setFilteredPrescriptions(filtered)
    }
  }, [searchTerm, prescriptions])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Link to="/patient" className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center hover:bg-purple-500/30 transition-colors">
              <FaArrowLeft className="w-5 h-5 text-purple-400" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">My Prescriptions</h1>
              <p className="text-sm text-slate-400">View your medical prescriptions</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {/* Search Bar */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl mb-6">
          <div className="flex items-center space-x-3">
            <FaMagnifyingGlass className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by diagnosis, medicine, or date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-slate-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Prescriptions List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
          </div>
        ) : filteredPrescriptions.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 backdrop-blur-xl text-center">
            <FaPills className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchTerm ? 'No Prescriptions Found' : 'No Prescriptions Yet'}
            </h3>
            <p className="text-slate-400">
              {searchTerm ? 'Try adjusting your search terms' : 'Your prescriptions will appear here after doctor visits'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPrescriptions.map(prescription => (
              <div key={prescription.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl hover:bg-white/10 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <FaPills className="w-5 h-5 text-purple-400" />
                      <h3 className="text-lg font-semibold">{prescription.diagnosis || 'General Prescription'}</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                      <div className="flex items-center space-x-2 text-slate-300">
                        <FaCalendar className="w-4 h-4 text-purple-400" />
                        <span>Date: {new Date(prescription.prescriptionDate).toLocaleDateString()}</span>
                      </div>
                      <div className="text-slate-300">
                        <span className="font-medium">Doctor: </span>
                        {prescription.doctorName || 'N/A'}
                      </div>
                    </div>

                    {prescription.symptoms && (
                      <div className="mb-3 text-sm">
                        <span className="text-slate-400">Symptoms: </span>
                        <span className="text-slate-300">{prescription.symptoms}</span>
                      </div>
                    )}

                    {prescription.medicines && prescription.medicines.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-slate-400 mb-2">Medicines:</p>
                        <div className="flex flex-wrap gap-2">
                          {prescription.medicines.slice(0, 3).map((medicine, index) => (
                            <span key={index} className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs">
                              {medicine.name}
                            </span>
                          ))}
                          {prescription.medicines.length > 3 && (
                            <span className="bg-slate-500/20 text-slate-300 px-3 py-1 rounded-full text-xs">
                              +{prescription.medicines.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {prescription.followUpDate && (
                      <div className="text-sm text-slate-400">
                        <span className="font-medium text-slate-300">Follow-up: </span>
                        {new Date(prescription.followUpDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <Link
                    to={`/patient/prescriptions/view/${prescription.id}`}
                    className="ml-4 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 p-3 rounded-xl transition-colors"
                    title="View Details"
                  >
                    <FaEye className="w-4 h-4" />
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
