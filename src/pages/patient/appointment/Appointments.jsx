import { useState, useEffect } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { Link } from 'react-router-dom'
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, getDocs } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import { FaCalendar, FaArrowLeft, FaPlus, FaTrash, FaClock, FaUser } from 'react-icons/fa6'
import toast from 'react-hot-toast'

export default function Appointments() {
  const { currentUser } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [formData, setFormData] = useState({
    doctorId: '',
    doctorName: '',
    appointmentDate: '',
    appointmentTime: '',
    reason: '',
    patientPhone: ''
  })

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
      // Sort by date in JavaScript instead of Firestore to avoid composite index requirement
      appointmentsData.sort((a, b) => {
        const dateA = new Date(a.appointmentDate)
        const dateB = new Date(b.appointmentDate)
        return dateB - dateA // descending order (newest first)
      })
      setAppointments(appointmentsData)
      setLoading(false)
    }, (error) => {
      console.error('Error fetching appointments:', error)
      toast.error('Failed to load appointments')
      setLoading(false)
    })

    return unsubscribe
  }, [currentUser])

  // Fetch doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const staffRef = collection(db, 'staffData')
        const q = query(staffRef, where('role', '==', 'doctor'))
        const snapshot = await getDocs(q)
        const doctorsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setDoctors(doctorsData)
      } catch (error) {
        console.error('Error fetching doctors:', error)
        toast.error('Failed to load doctors')
      }
    }

    fetchDoctors()
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    if (name === 'doctorId') {
      const selectedDoctor = doctors.find(doc => doc.id === value)
      setFormData(prev => ({
        ...prev,
        doctorId: value,
        doctorName: selectedDoctor ? selectedDoctor.fullName : ''
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.doctorId || !formData.appointmentDate || !formData.appointmentTime || !formData.patientPhone) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const appointmentData = {
        patientName: currentUser.displayName || 'Patient',
        patientEmail: currentUser.email,
        patientPhone: formData.patientPhone,
        doctorId: formData.doctorId,
        doctorName: formData.doctorName,
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime,
        reason: formData.reason,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await addDoc(collection(db, 'appointments'), appointmentData)
      
      toast.success('Appointment booked successfully!')
      setShowBookingForm(false)
      setFormData({
        doctorId: '',
        doctorName: '',
        appointmentDate: '',
        appointmentTime: '',
        reason: '',
        patientPhone: ''
      })
    } catch (error) {
      console.error('Error booking appointment:', error)
      toast.error('Failed to book appointment')
    }
  }

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return
    }

    try {
      const appointmentRef = doc(db, 'appointments', appointmentId)
      await updateDoc(appointmentRef, {
        status: 'cancelled',
        updatedAt: new Date().toISOString()
      })
      toast.success('Appointment cancelled successfully')
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      toast.error('Failed to cancel appointment')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-400/10'
      case 'confirmed': return 'text-green-400 bg-green-400/10'
      case 'completed': return 'text-blue-400 bg-blue-400/10'
      case 'cancelled': return 'text-red-400 bg-red-400/10'
      default: return 'text-slate-400 bg-slate-400/10'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Link to="/patient" className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center hover:bg-green-500/30 transition-colors">
              <FaArrowLeft className="w-5 h-5 text-green-400" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">My Appointments</h1>
              <p className="text-sm text-slate-400">Manage your appointments</p>
            </div>
          </div>
          <button
            onClick={() => setShowBookingForm(!showBookingForm)}
            className="flex items-center space-x-2 bg-green-500/20 hover:bg-green-500/30 px-4 py-2 rounded-xl transition-colors"
          >
            <FaPlus className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-medium">Book Appointment</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {/* Booking Form */}
        {showBookingForm && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl mb-6">
            <h2 className="text-xl font-bold mb-4">Book New Appointment</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Select Doctor *
                  </label>
                  <select
                    name="doctorId"
                    value={formData.doctorId}
                    onChange={handleInputChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                    required
                  >
                    <option value="">Choose a doctor</option>
                    {doctors.map(doctor => (
                      <option key={doctor.id} value={doctor.id} className="bg-slate-800">
                        {doctor.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="patientPhone"
                    value={formData.patientPhone}
                    onChange={handleInputChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                    placeholder="Enter your phone number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Appointment Date *
                  </label>
                  <input
                    type="date"
                    name="appointmentDate"
                    value={formData.appointmentDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Appointment Time *
                  </label>
                  <input
                    type="time"
                    name="appointmentTime"
                    value={formData.appointmentTime}
                    onChange={handleInputChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Reason for Visit
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="Describe your symptoms or reason for visit"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 font-medium px-6 py-3 rounded-xl transition-colors"
                >
                  Book Appointment
                </button>
                <button
                  type="button"
                  onClick={() => setShowBookingForm(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium px-6 py-3 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Appointments List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 backdrop-blur-xl text-center">
            <FaCalendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Appointments Yet</h3>
            <p className="text-slate-400 mb-4">Book your first appointment to get started</p>
            <button
              onClick={() => setShowBookingForm(true)}
              className="bg-green-500/20 hover:bg-green-500/30 text-green-400 font-medium px-6 py-3 rounded-xl transition-colors"
            >
              Book Appointment
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map(appointment => (
              <div key={appointment.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl hover:bg-white/10 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <FaUser className="w-5 h-5 text-green-400" />
                      <h3 className="text-lg font-semibold">Dr. {appointment.doctorName}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2 text-slate-300">
                        <FaCalendar className="w-4 h-4 text-green-400" />
                        <span>{new Date(appointment.appointmentDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-300">
                        <FaClock className="w-4 h-4 text-green-400" />
                        <span>{appointment.appointmentTime}</span>
                      </div>
                    </div>

                    {appointment.reason && (
                      <div className="mt-3 text-sm text-slate-400">
                        <span className="font-medium text-slate-300">Reason: </span>
                        {appointment.reason}
                      </div>
                    )}

                    {appointment.tokenNumber && (
                      <div className="mt-2 text-sm">
                        <span className="text-slate-400">Token Number: </span>
                        <span className="text-green-400 font-bold">#{appointment.tokenNumber}</span>
                      </div>
                    )}
                  </div>

                  {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                    <button
                      onClick={() => handleCancelAppointment(appointment.id)}
                      className="ml-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 p-3 rounded-xl transition-colors"
                      title="Cancel Appointment"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
