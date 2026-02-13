import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Link } from 'react-router-dom'
import LogoutButton from '../../components/LogoutButton'
import EmailVerificationStatus from '../../components/EmailVerificationStatus'
import { FaUserShield, FaUserDoctor, FaUserTie, FaUserInjured } from 'react-icons/fa6'
import { Users, Calendar, Pill, DollarSign, TrendingUp, Settings, FileText } from 'lucide-react'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { db } from '../../firebase/config'

export default function Admin() {
  const { currentUser, userRole } = useAuth()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    totalReceptionists: 0,
    totalPatients: 0,
    totalAdmins: 0,
    totalAppointments: 0,
    totalPrescriptions: 0,
    totalInvoices: 0,
    loading: true
  })

  // Fetch real-time statistics
  useEffect(() => {
    // Fetch staff data (doctors, receptionists, admins)
    const staffRef = collection(db, 'staffData')
    const staffQuery = query(staffRef)
    
    const unsubscribeStaff = onSnapshot(staffQuery, (snapshot) => {
      const staffData = snapshot.docs.map(doc => doc.data())
      const doctors = staffData.filter(user => user.role === 'doctor').length
      const receptionists = staffData.filter(user => user.role === 'receptionist').length
      const admins = staffData.filter(user => user.role === 'admin').length
      
      setStats(prev => ({
        ...prev,
        totalDoctors: doctors,
        totalReceptionists: receptionists,
        totalAdmins: admins
      }))
    })

    // Fetch patient data
    const patientsRef = collection(db, 'patientData')
    const patientsQuery = query(patientsRef)
    
    const unsubscribePatients = onSnapshot(patientsQuery, (snapshot) => {
      setStats(prev => ({
        ...prev,
        totalPatients: snapshot.docs.length
      }))
    }, (error) => {
      console.error('Error fetching patients:', error)
      // If patientData collection doesn't exist, set to 0
      setStats(prev => ({ ...prev, totalPatients: 0 }))
    })

    // Fetch appointments
    const appointmentsRef = collection(db, 'appointments')
    const appointmentsQuery = query(appointmentsRef)
    
    const unsubscribeAppointments = onSnapshot(appointmentsQuery, (snapshot) => {
      setStats(prev => ({
        ...prev,
        totalAppointments: snapshot.docs.length
      }))
    })

    // Fetch prescriptions
    const prescriptionsRef = collection(db, 'prescriptions')
    const prescriptionsQuery = query(prescriptionsRef)
    
    const unsubscribePrescriptions = onSnapshot(prescriptionsQuery, (snapshot) => {
      setStats(prev => ({
        ...prev,
        totalPrescriptions: snapshot.docs.length
      }))
    })

    // Fetch invoices
    const invoicesRef = collection(db, 'invoices')
    const invoicesQuery = query(invoicesRef)
    
    const unsubscribeInvoices = onSnapshot(invoicesQuery, (snapshot) => {
      setStats(prev => ({
        ...prev,
        totalInvoices: snapshot.docs.length,
        loading: false
      }))
    })

    // Calculate total users
    setStats(prev => ({
      ...prev,
      totalUsers: prev.totalDoctors + prev.totalReceptionists + prev.totalPatients + prev.totalAdmins
    }))

    return () => {
      unsubscribeStaff()
      unsubscribePatients()
      unsubscribeAppointments()
      unsubscribePrescriptions()
      unsubscribeInvoices()
    }
  }, [])

  // Update total users when individual counts change
  useEffect(() => {
    setStats(prev => ({
      ...prev,
      totalUsers: prev.totalDoctors + prev.totalReceptionists + prev.totalPatients + prev.totalAdmins
    }))
  }, [stats.totalDoctors, stats.totalReceptionists, stats.totalPatients, stats.totalAdmins])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <FaUserShield className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-slate-400">Welcome, {currentUser?.displayName || 'Admin'}</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {/* System Statistics */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">System Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Users */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Users className="w-6 h-6 text-purple-400" />
                  <h3 className="text-lg font-semibold">Total Users</h3>
                </div>
              </div>
              {stats.loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
                  <p className="text-lg text-slate-400">Loading...</p>
                </div>
              ) : (
                <>
                  <p className="text-3xl font-bold text-purple-400">{stats.totalUsers}</p>
                  <div className="mt-3 space-y-1 text-sm text-slate-400">
                    <p><FaUserDoctor className="inline w-3 h-3 mr-1" /> {stats.totalDoctors} Doctors</p>
                    <p><FaUserTie className="inline w-3 h-3 mr-1" /> {stats.totalReceptionists} Receptionists</p>
                    <p><FaUserInjured className="inline w-3 h-3 mr-1" /> {stats.totalPatients} Patients</p>
                    <p><FaUserShield className="inline w-3 h-3 mr-1" /> {stats.totalAdmins} Admins</p>
                  </div>
                </>
              )}
            </div>

            {/* Total Appointments */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-6 h-6 text-green-400" />
                  <h3 className="text-lg font-semibold">Appointments</h3>
                </div>
              </div>
              {stats.loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-400"></div>
                  <p className="text-lg text-slate-400">Loading...</p>
                </div>
              ) : (
                <>
                  <p className="text-3xl font-bold text-green-400">{stats.totalAppointments}</p>
                  <p className="text-sm text-slate-400 mt-2">Total appointments</p>
                </>
              )}
            </div>

            {/* Total Prescriptions */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Pill className="w-6 h-6 text-blue-400" />
                  <h3 className="text-lg font-semibold">Prescriptions</h3>
                </div>
              </div>
              {stats.loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                  <p className="text-lg text-slate-400">Loading...</p>
                </div>
              ) : (
                <>
                  <p className="text-3xl font-bold text-blue-400">{stats.totalPrescriptions}</p>
                  <p className="text-sm text-slate-400 mt-2">Total prescriptions</p>
                </>
              )}
            </div>

            {/* Total Invoices */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-6 h-6 text-cyan-400" />
                  <h3 className="text-lg font-semibold">Invoices</h3>
                </div>
              </div>
              {stats.loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
                  <p className="text-lg text-slate-400">Loading...</p>
                </div>
              ) : (
                <>
                  <p className="text-3xl font-bold text-cyan-400">{stats.totalInvoices}</p>
                  <p className="text-sm text-slate-400 mt-2">Total invoices</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link to="/admin/users" className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="font-semibold">User Management</h3>
                  <p className="text-sm text-slate-400">Manage all system users</p>
                </div>
              </div>
            </Link>

            <Link to="/admin/system" className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
              <div className="flex items-center space-x-3">
                <Settings className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-semibold">System Maintenance</h3>
                  <p className="text-sm text-slate-400">View system health & logs</p>
                </div>
              </div>
            </Link>

            <Link to="/admin/reports" className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-green-400" />
                <div>
                  <h3 className="font-semibold">Generate Reports</h3>
                  <p className="text-sm text-slate-400">Create comprehensive reports</p>
                </div>
              </div>
            </Link>

            <Link to="/admin/reports" className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
                <div>
                  <h3 className="font-semibold">Analytics</h3>
                  <p className="text-sm text-slate-400">View system analytics</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Account Information */}
        <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <h2 className="text-xl font-bold mb-4">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 text-sm">Email</p>
              <p className="text-white font-medium">{currentUser?.email}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Role</p>
              <p className="text-purple-400 font-medium capitalize">{userRole}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Full Name</p>
              <p className="text-white font-medium">{currentUser?.displayName}</p>
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
