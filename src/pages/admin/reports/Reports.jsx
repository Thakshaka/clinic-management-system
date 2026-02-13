import { useState, useEffect } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { Link } from 'react-router-dom'
import LogoutButton from '../../../components/LogoutButton'
import { FileText, Download, Calendar, ArrowLeft, Users, Pill, DollarSign, TrendingUp } from 'lucide-react'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '../../../firebase/config'

export default function Reports() {
  const { currentUser } = useAuth()
  const [reportType, setReportType] = useState('users')
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(false)

  const generateReport = async () => {
    setLoading(true)
    try {
      let data = {}

      switch(reportType) {
        case 'users':
          // Fetch staff data
          const staffRef = collection(db, 'staffData')
          const staffSnapshot = await getDocs(staffRef)
          const staffUsers = staffSnapshot.docs.map(doc => doc.data())
          
          // Fetch patient data
          const patientRef = collection(db, 'patientData')
          const patientSnapshot = await getDocs(patientRef)
          const patientsList = patientSnapshot.docs.map(doc => ({ ...doc.data(), role: 'patient' }))

          const allUsers = [...staffUsers, ...patientsList]
          
          data = {
            totalUsers: allUsers.length,
            doctors: staffUsers.filter(u => u.role === 'doctor').length,
            receptionists: staffUsers.filter(u => u.role === 'receptionist').length,
            patients: patientsList.length,
            admins: staffUsers.filter(u => u.role === 'admin').length,
            users: allUsers
          }
          break

        case 'appointments':
          const appointmentsRef = collection(db, 'appointments')
          const appointmentsSnapshot = await getDocs(query(appointmentsRef, orderBy('createdAt', 'desc')))
          const appointments = appointmentsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))

          // Filter by date range
          const filteredAppointments = appointments.filter(apt => {
            const aptDate = new Date(apt.appointmentDate)
            const start = new Date(dateRange.startDate)
            const end = new Date(dateRange.endDate)
            return aptDate >= start && aptDate <= end
          })

          data = {
            total: filteredAppointments.length,
            pending: filteredAppointments.filter(a => a.status === 'pending').length,
            confirmed: filteredAppointments.filter(a => a.status === 'confirmed').length,
            completed: filteredAppointments.filter(a => a.status === 'completed').length,
            appointments: filteredAppointments
          }
          break

        case 'prescriptions':
          const prescriptionsRef = collection(db, 'prescriptions')
          const prescriptionsSnapshot = await getDocs(query(prescriptionsRef, orderBy('createdAt', 'desc')))
          const prescriptions = prescriptionsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))

          // Filter by date range
          const filteredPrescriptions = prescriptions.filter(pres => {
            const presDate = new Date(pres.prescriptionDate)
            const start = new Date(dateRange.startDate)
            const end = new Date(dateRange.endDate)
            return presDate >= start && presDate <= end
          })

          data = {
            total: filteredPrescriptions.length,
            prescriptions: filteredPrescriptions
          }
          break

        case 'billing':
          const invoicesRef = collection(db, 'invoices')
          const invoicesSnapshot = await getDocs(query(invoicesRef, orderBy('createdAt', 'desc')))
          const invoices = invoicesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))

          // Filter by date range
          const filteredInvoices = invoices.filter(inv => {
            const invDate = new Date(inv.createdAt)
            const start = new Date(dateRange.startDate)
            const end = new Date(dateRange.endDate)
            return invDate >= start && invDate <= end
          })

          const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0)
          const paidInvoices = filteredInvoices.filter(i => i.status === 'paid')
          const pendingInvoices = filteredInvoices.filter(i => i.status === 'pending')

          data = {
            total: filteredInvoices.length,
            totalRevenue: totalRevenue,
            paid: paidInvoices.length,
            pending: pendingInvoices.length,
            invoices: filteredInvoices
          }
          break

        default:
          data = {}
      }

      setReportData(data)
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = () => {
    if (!reportData) return

    const reportContent = JSON.stringify(reportData, null, 2)
    const blob = new Blob([reportContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Link to="/admin" className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center hover:bg-green-500/30 transition-colors">
              <ArrowLeft className="w-5 h-5 text-green-400" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Generate Reports</h1>
              <p className="text-sm text-slate-400">Create comprehensive system reports</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {/* Report Configuration */}
        <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <h2 className="text-lg font-bold mb-4">Report Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Report Type */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-green-400 transition-colors appearance-none cursor-pointer"
              >
                <option value="users" className="bg-slate-800">User Statistics</option>
                <option value="appointments" className="bg-slate-800">Appointments Report</option>
                <option value="prescriptions" className="bg-slate-800">Prescriptions Report</option>
                <option value="billing" className="bg-slate-800">Billing Report</option>
              </select>
            </div>

            {/* Start Date */}
            {reportType !== 'users' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-green-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-2">End Date</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-green-400 transition-colors"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex space-x-4">
            <button
              onClick={generateReport}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold rounded-xl transition-all disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <TrendingUp className="w-4 h-4" />
              <span>{loading ? 'Generating...' : 'Generate Report'}</span>
            </button>

            {reportData && (
              <button
                onClick={downloadReport}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download JSON</span>
              </button>
            )}
          </div>
        </div>

        {/* Report Results */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white text-lg">Generating report...</p>
            </div>
          </div>
        )}

        {!loading && reportData && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <h2 className="text-lg font-bold mb-4">Report Summary</h2>
            
            {reportType === 'users' && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white/5 rounded-xl p-4">
                  <Users className="w-6 h-6 text-purple-400 mb-2" />
                  <p className="text-2xl font-bold">{reportData.totalUsers}</p>
                  <p className="text-sm text-slate-400">Total Users</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-2xl font-bold text-blue-400">{reportData.doctors}</p>
                  <p className="text-sm text-slate-400">Doctors</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-2xl font-bold text-cyan-400">{reportData.receptionists}</p>
                  <p className="text-sm text-slate-400">Receptionists</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-2xl font-bold text-green-400">{reportData.patients}</p>
                  <p className="text-sm text-slate-400">Patients</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-2xl font-bold text-purple-400">{reportData.admins}</p>
                  <p className="text-sm text-slate-400">Admins</p>
                </div>
              </div>
            )}

            {reportType === 'appointments' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-xl p-4">
                  <Calendar className="w-6 h-6 text-green-400 mb-2" />
                  <p className="text-2xl font-bold">{reportData.total}</p>
                  <p className="text-sm text-slate-400">Total</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-2xl font-bold text-yellow-400">{reportData.pending}</p>
                  <p className="text-sm text-slate-400">Pending</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-2xl font-bold text-blue-400">{reportData.confirmed}</p>
                  <p className="text-sm text-slate-400">Confirmed</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-2xl font-bold text-green-400">{reportData.completed}</p>
                  <p className="text-sm text-slate-400">Completed</p>
                </div>
              </div>
            )}

            {reportType === 'prescriptions' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4">
                  <Pill className="w-6 h-6 text-blue-400 mb-2" />
                  <p className="text-2xl font-bold">{reportData.total}</p>
                  <p className="text-sm text-slate-400">Total Prescriptions</p>
                </div>
              </div>
            )}

            {reportType === 'billing' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-xl p-4">
                  <DollarSign className="w-6 h-6 text-cyan-400 mb-2" />
                  <p className="text-2xl font-bold">${reportData.totalRevenue?.toFixed(2) || '0.00'}</p>
                  <p className="text-sm text-slate-400">Total Revenue</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-2xl font-bold">{reportData.total}</p>
                  <p className="text-sm text-slate-400">Total Invoices</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-2xl font-bold text-green-400">{reportData.paid}</p>
                  <p className="text-sm text-slate-400">Paid</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4">
                  <p className="text-2xl font-bold text-yellow-400">{reportData.pending}</p>
                  <p className="text-sm text-slate-400">Pending</p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
