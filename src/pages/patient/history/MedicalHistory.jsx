import { useState, useEffect } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { Link } from 'react-router-dom'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import { FaClockRotateLeft, FaArrowLeft, FaCalendar, FaUser, FaPills, FaStethoscope } from 'react-icons/fa6'
import toast from 'react-hot-toast'

export default function MedicalHistory() {
  const { currentUser } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('all') // all, 30days, 90days, year

  // Fetch appointments
  useEffect(() => {
    if (!currentUser) return

    const appointmentsRef = collection(db, 'appointments')
    const q = query(
      appointmentsRef,
      where('patientEmail', '==', currentUser.email)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const appointmentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      // Sort by date in JavaScript to avoid composite index requirement
      appointmentsData.sort((a, b) => {
        const dateA = new Date(a.appointmentDate)
        const dateB = new Date(b.appointmentDate)
        return dateB - dateA // descending order (newest first)
      })
      setAppointments(appointmentsData)
    }, (error) => {
      console.error('Error fetching appointments:', error)
      toast.error('Failed to load appointments')
    })

    return unsubscribe
  }, [currentUser])

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
      // Sort by date in JavaScript to avoid composite index requirement
      prescriptionsData.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.prescriptionDate)
        const dateB = new Date(b.createdAt || b.prescriptionDate)
        return dateB - dateA // descending order (newest first)
      })
      setPrescriptions(prescriptionsData)
      setLoading(false)
    }, (error) => {
      console.error('Error fetching prescriptions:', error)
      toast.error('Failed to load prescriptions')
      setLoading(false)
    })

    return unsubscribe
  }, [currentUser])

  const filterByDate = (items, dateField) => {
    if (dateFilter === 'all') return items

    const now = new Date()
    const filterDate = new Date()

    switch (dateFilter) {
      case '30days':
        filterDate.setDate(now.getDate() - 30)
        break
      case '90days':
        filterDate.setDate(now.getDate() - 90)
        break
      case 'year':
        filterDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        return items
    }

    return items.filter(item => {
      const itemDate = new Date(item[dateField])
      return itemDate >= filterDate
    })
  }

  const filteredAppointments = filterByDate(appointments, 'appointmentDate')
  const filteredPrescriptions = filterByDate(prescriptions, 'prescriptionDate')

  // Combine and sort by date
  const combinedHistory = [
    ...filteredAppointments.map(apt => ({
      type: 'appointment',
      date: apt.appointmentDate,
      data: apt
    })),
    ...filteredPrescriptions.map(pres => ({
      type: 'prescription',
      date: pres.prescriptionDate,
      data: pres
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Link to="/patient" className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center hover:bg-blue-500/30 transition-colors">
              <FaArrowLeft className="w-5 h-5 text-blue-400" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Medical History</h1>
              <p className="text-sm text-slate-400">View your medical timeline</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {/* Filter Bar */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-400">Filter by:</span>
            <div className="flex space-x-2">
              {[
                { value: 'all', label: 'All Time' },
                { value: '30days', label: 'Last 30 Days' },
                { value: '90days', label: 'Last 90 Days' },
                { value: 'year', label: 'Last Year' }
              ].map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setDateFilter(filter.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    dateFilter === filter.value
                      ? 'bg-blue-500/30 text-blue-400'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
          </div>
        ) : combinedHistory.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 backdrop-blur-xl text-center">
            <FaClockRotateLeft className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Medical History</h3>
            <p className="text-slate-400">Your medical history will appear here after appointments and prescriptions</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-white/10"></div>

            {/* Timeline Items */}
            <div className="space-y-6">
              {combinedHistory.map((item, index) => (
                <div key={`${item.type}-${item.data.id}`} className="relative pl-20">
                  {/* Timeline Dot */}
                  <div className={`absolute left-6 w-5 h-5 rounded-full border-4 ${
                    item.type === 'appointment'
                      ? 'bg-green-400 border-slate-900'
                      : 'bg-purple-400 border-slate-900'
                  }`}></div>

                  {/* Content Card */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl hover:bg-white/10 transition-colors">
                    {item.type === 'appointment' ? (
                      // Appointment Card
                      <div>
                        <div className="flex items-center space-x-3 mb-3">
                          <FaCalendar className="w-5 h-5 text-green-400" />
                          <h3 className="text-lg font-semibold">Appointment</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            item.data.status === 'completed'
                              ? 'bg-blue-400/10 text-blue-400'
                              : item.data.status === 'cancelled'
                              ? 'bg-red-400/10 text-red-400'
                              : 'bg-yellow-400/10 text-yellow-400'
                          }`}>
                            {item.data.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center space-x-2 text-slate-300">
                            <FaCalendar className="w-4 h-4 text-green-400" />
                            <span>{new Date(item.data.appointmentDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-slate-300">
                            <FaUser className="w-4 h-4 text-green-400" />
                            <span>Dr. {item.data.doctorName}</span>
                          </div>
                        </div>
                        {item.data.reason && (
                          <div className="mt-3 text-sm text-slate-400">
                            <span className="font-medium text-slate-300">Reason: </span>
                            {item.data.reason}
                          </div>
                        )}
                        {item.data.tokenNumber && (
                          <div className="mt-2 text-sm">
                            <span className="text-slate-400">Token: </span>
                            <span className="text-green-400 font-bold">#{item.data.tokenNumber}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      // Prescription Card
                      <div>
                        <div className="flex items-center space-x-3 mb-3">
                          <FaPills className="w-5 h-5 text-purple-400" />
                          <h3 className="text-lg font-semibold">Prescription</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                          <div className="flex items-center space-x-2 text-slate-300">
                            <FaCalendar className="w-4 h-4 text-purple-400" />
                            <span>{new Date(item.data.prescriptionDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-slate-300">
                            <FaStethoscope className="w-4 h-4 text-purple-400" />
                            <span>{item.data.diagnosis || 'General Prescription'}</span>
                          </div>
                        </div>
                        {item.data.medicines && item.data.medicines.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {item.data.medicines.slice(0, 3).map((medicine, idx) => (
                              <span key={idx} className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs">
                                {medicine.name}
                              </span>
                            ))}
                            {item.data.medicines.length > 3 && (
                              <span className="bg-slate-500/20 text-slate-300 px-3 py-1 rounded-full text-xs">
                                +{item.data.medicines.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                        <Link
                          to={`/patient/prescriptions/view/${item.data.id}`}
                          className="inline-block mt-3 text-purple-400 text-sm hover:underline"
                        >
                          View Details →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
