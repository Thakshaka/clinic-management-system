import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import LogoutButton from '../../../components/LogoutButton'
import { ArrowLeft, User, Calendar, Pill, CheckCircle } from 'lucide-react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../../firebase/config'

export default function ViewPrescription() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [prescription, setPrescription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    const fetchPrescription = async () => {
      try {
        const prescriptionDoc = await getDoc(doc(db, 'prescriptions', id))
        if (prescriptionDoc.exists()) {
          setPrescription({ id: prescriptionDoc.id, ...prescriptionDoc.data() })
        }
        setLoading(false)
      } catch (error) {
        console.error('Error fetching prescription:', error)
        setLoading(false)
      }
    }

    fetchPrescription()
  }, [id])

  const handleMarkAsFulfilled = async () => {
    setUpdating(true)
    try {
      await updateDoc(doc(db, 'prescriptions', id), {
        status: 'fulfilled',
        fulfilledBy: currentUser.uid,
        fulfilledAt: new Date().toISOString()
      })
      setPrescription(prev => ({ ...prev, status: 'fulfilled' }))
      alert('Prescription marked as fulfilled!')
    } catch (error) {
      console.error('Error updating prescription:', error)
      alert('Error updating prescription')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading prescription...</p>
        </div>
      </div>
    )
  }

  if (!prescription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg">Prescription not found</p>
          <Link to="/pharmacist/prescriptions" className="mt-4 inline-block text-orange-400 hover:underline">
            Back to Prescriptions
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Link to="/pharmacist/prescriptions" className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center hover:bg-orange-500/30 transition-colors">
              <ArrowLeft className="w-5 h-5 text-orange-400" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Prescription Details</h1>
              <p className="text-sm text-slate-400">View and manage prescription</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Patient and Doctor Info */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <h2 className="text-lg font-bold mb-4">Prescription Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <User className="w-4 h-4 text-slate-400" />
                <p className="text-sm text-slate-400">Patient</p>
              </div>
              <p className="font-semibold text-lg">{prescription.patientName || 'N/A'}</p>
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <User className="w-4 h-4 text-slate-400" />
                <p className="text-sm text-slate-400">Doctor</p>
              </div>
              <p className="font-semibold text-lg">{prescription.doctorName || 'N/A'}</p>
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <p className="text-sm text-slate-400">Date</p>
              </div>
              <p className="font-semibold">{prescription.prescriptionDate || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-2">Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                prescription.status === 'fulfilled' || prescription.status === 'completed'
                  ? 'bg-green-400/20 text-green-400'
                  : 'bg-yellow-400/20 text-yellow-400'
              }`}>
                {prescription.status === 'fulfilled' || prescription.status === 'completed' ? 'Fulfilled' : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* Medicines */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <div className="flex items-center space-x-2 mb-4">
            <Pill className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-bold">Prescribed Medicines ({prescription.medicines?.length || 0})</h2>
          </div>
          
          {prescription.medicines && prescription.medicines.length > 0 ? (
            <div className="space-y-3">
              {prescription.medicines.map((medicine, index) => (
                <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{medicine.name}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-slate-400">Dosage</p>
                          <p className="font-medium">{medicine.dosage || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Frequency</p>
                          <p className="font-medium">{medicine.frequency || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Duration</p>
                          <p className="font-medium">{medicine.duration || 'N/A'}</p>
                        </div>
                      </div>
                      {medicine.instructions && (
                        <div className="mt-3">
                          <p className="text-slate-400 text-sm">Instructions</p>
                          <p className="text-sm">{medicine.instructions}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400">No medicines prescribed</p>
          )}
        </div>

        {/* Actions */}
        {prescription.status !== 'fulfilled' && prescription.status !== 'completed' && (
          <div className="flex space-x-4">
            <button
              onClick={handleMarkAsFulfilled}
              disabled={updating}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold rounded-xl transition-all disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <CheckCircle className="w-5 h-5" />
              <span>{updating ? 'Updating...' : 'Mark as Fulfilled'}</span>
            </button>
            <Link
              to="/pharmacist/issue-drugs"
              state={{ prescription }}
              className="flex-1 px-6 py-3 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 font-semibold rounded-xl transition-all flex items-center justify-center space-x-2"
            >
              <Pill className="w-5 h-5" />
              <span>Issue Drugs</span>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
