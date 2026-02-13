import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Link } from 'react-router-dom'
import LogoutButton from '../../components/LogoutButton'
import EmailVerificationStatus from '../../components/EmailVerificationStatus'
import { FaUserInjured, FaCalendar, FaPills, FaClockRotateLeft, FaUser, FaCalendarDay, FaFileLines, FaRobot } from 'react-icons/fa6'
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'

export default function Patient() {
  const { currentUser, userRole } = useAuth()
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    totalPrescriptions: 0,
    recentVisits: 0,
    loading: true
  })
  const [patientName, setPatientName] = useState('')

  // Fetch patient's name from patientData collection
  useEffect(() => {
    if (!currentUser) return

    const fetchPatientName = async () => {
      try {
        const userDocRef = doc(db, 'patientData', currentUser.uid)
        const userDoc = await getDoc(userDocRef)
        
        if (userDoc.exists()) {
          const userData = userDoc.data()
          const name = userData.fullName || currentUser.displayName || 'Patient'
          setPatientName(name)
        } else {
          setPatientName(currentUser.displayName || 'Patient')
        }
      } catch (error) {
        console.error('Error fetching patient name:', error)
        setPatientName(currentUser.displayName || 'Patient')
      }
    }

    fetchPatientName()
  }, [currentUser])

  // Fetch real-time stats
  useEffect(() => {
    if (!currentUser) return

    const today = new Date().toISOString().split('T')[0]
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Query for upcoming appointments
    const upcomingAppointmentsRef = collection(db, 'appointments')
    const upcomingQuery = query(
      upcomingAppointmentsRef,
      where('patientEmail', '==', currentUser.email)
    )

    // Query for all prescriptions
    const prescriptionsRef = collection(db, 'prescriptions')
    const prescriptionsQuery = query(
      prescriptionsRef,
      where('patientEmail', '==', currentUser.email)
    )

    // Query for recent visits (last 30 days)
    const recentVisitsRef = collection(db, 'appointments')
    const recentVisitsQuery = query(
      recentVisitsRef,
      where('patientEmail', '==', currentUser.email)
    )

    // Set up real-time listeners
    const unsubscribeUpcoming = onSnapshot(upcomingQuery, (snapshot) => {
      // Filter for upcoming appointments in JavaScript to avoid composite index
      const upcomingCount = snapshot.docs.filter(doc => {
        const data = doc.data()
        const appointmentDate = data.appointmentDate
        return appointmentDate >= today && data.status !== 'cancelled' && data.status !== 'completed'
      }).length
      setStats(prev => ({ ...prev, upcomingAppointments: upcomingCount }))
    })

    const unsubscribePrescriptions = onSnapshot(prescriptionsQuery, (snapshot) => {
      const prescriptionCount = snapshot.docs.length
      setStats(prev => ({ ...prev, totalPrescriptions: prescriptionCount }))
    })

    const unsubscribeRecent = onSnapshot(recentVisitsQuery, (snapshot) => {
      // Filter for completed appointments in last 30 days in JavaScript to avoid composite index
      const recentCount = snapshot.docs.filter(doc => {
        const data = doc.data()
        const appointmentDate = new Date(data.appointmentDate)
        return appointmentDate >= thirtyDaysAgo && data.status === 'completed'
      }).length
      setStats(prev => ({ ...prev, recentVisits: recentCount, loading: false }))
    })

    return () => {
      unsubscribeUpcoming()
      unsubscribePrescriptions()
      unsubscribeRecent()
    }
  }, [currentUser])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
              <FaUserInjured className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Patient Dashboard</h1>
              <p className="text-sm text-slate-400">Welcome, {patientName}</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Quick Stats */}
          <Link to="/patient/appointments" className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl hover:bg-white/10 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <FaCalendar className="w-6 h-6 text-green-400" />
                <h3 className="text-lg font-semibold">Upcoming Appointments</h3>
              </div>
              <FaCalendarDay className="w-4 h-4 text-green-400" />
            </div>
            {stats.loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-400"></div>
                <p className="text-lg text-slate-400">Loading...</p>
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold text-green-400">{stats.upcomingAppointments}</p>
                <p className="text-sm text-slate-400 mt-2">
                  {stats.upcomingAppointments === 0 ? 'No upcoming appointments' : 
                   stats.upcomingAppointments === 1 ? 'appointment scheduled' : 
                   'appointments scheduled'}
                </p>
              </>
            )}
            <p className="text-xs text-green-400 mt-2">Click to manage appointments →</p>
          </Link>

          <Link to="/patient/prescriptions" className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl hover:bg-white/10 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <FaPills className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-semibold">My Prescriptions</h3>
              </div>
              <FaFileLines className="w-4 h-4 text-purple-400" />
            </div>
            {stats.loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
                <p className="text-lg text-slate-400">Loading...</p>
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold text-purple-400">{stats.totalPrescriptions}</p>
                <p className="text-sm text-slate-400 mt-2">
                  {stats.totalPrescriptions === 0 ? 'No prescriptions yet' :
                   'total prescriptions'}
                </p>
              </>
            )}
            <p className="text-xs text-purple-400 mt-2">Click to view prescriptions →</p>
          </Link>

          <Link to="/patient/history" className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl hover:bg-white/10 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <FaClockRotateLeft className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-semibold">Recent Visits</h3>
              </div>
              <FaClockRotateLeft className="w-4 h-4 text-blue-400" />
            </div>
            {stats.loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                <p className="text-lg text-slate-400">Loading...</p>
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold text-blue-400">{stats.recentVisits}</p>
                <p className="text-sm text-slate-400 mt-2">
                  {stats.recentVisits === 0 ? 'No recent visits' :
                   'visits in last 30 days'}
                </p>
              </>
            )}
            <p className="text-xs text-blue-400 mt-2">Click to view history →</p>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Link to="/patient/appointments" className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
              <div className="flex items-center space-x-3">
                <FaCalendar className="w-5 h-5 text-green-400" />
                <div>
                  <h3 className="font-semibold">Book Appointment</h3>
                  <p className="text-sm text-slate-400">Schedule a new visit</p>
                </div>
              </div>
            </Link>

            <Link to="/patient/prescriptions" className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
              <div className="flex items-center space-x-3">
                <FaPills className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="font-semibold">View Prescriptions</h3>
                  <p className="text-sm text-slate-400">Access your prescriptions</p>
                </div>
              </div>
            </Link>

            <Link to="/patient/history" className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
              <div className="flex items-center space-x-3">
                <FaClockRotateLeft className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-semibold">Medical History</h3>
                  <p className="text-sm text-slate-400">View past appointments</p>
                </div>
              </div>
            </Link>

            <Link to="/patient/profile" className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
              <div className="flex items-center space-x-3">
                <FaUser className="w-5 h-5 text-yellow-400" />
                <div>
                  <h3 className="font-semibold">My Profile</h3>
                  <p className="text-sm text-slate-400">Manage your information</p>
                </div>
              </div>
            </Link>

            <Link to="/patient/chat" className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
              <div className="flex items-center space-x-3">
                <FaRobot className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="font-semibold">Ask Assistant</h3>
                  <p className="text-sm text-slate-400">Get instant answers</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* User Info Card */}
        <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <h2 className="text-xl font-bold mb-4">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 text-sm">Email</p>
              <p className="text-white font-medium">{currentUser?.email}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Role</p>
              <p className="text-green-400 font-medium capitalize">{userRole}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Full Name</p>
              <p className="text-white font-medium">{patientName}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Email Verified</p>
              <EmailVerificationStatus />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
