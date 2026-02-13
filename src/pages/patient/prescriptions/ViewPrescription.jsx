import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import { FaArrowLeft, FaDownload, FaPills, FaCalendar, FaUser } from 'react-icons/fa6'
import toast from 'react-hot-toast'

export default function ViewPrescription() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [prescription, setPrescription] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPrescription = async () => {
      try {
        const prescriptionRef = doc(db, 'prescriptions', id)
        const prescriptionDoc = await getDoc(prescriptionRef)
        
        if (prescriptionDoc.exists()) {
          setPrescription({ id: prescriptionDoc.id, ...prescriptionDoc.data() })
        } else {
          toast.error('Prescription not found')
          navigate('/patient/prescriptions')
        }
      } catch (error) {
        console.error('Error fetching prescription:', error)
        toast.error('Failed to load prescription')
      } finally {
        setLoading(false)
      }
    }

    fetchPrescription()
  }, [id, navigate])

  const handleDownloadPDF = () => {
    toast.success('PDF download feature coming soon!')
    // TODO: Implement PDF generation similar to receptionist's prescription PDF
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    )
  }

  if (!prescription) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Link to="/patient/prescriptions" className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center hover:bg-purple-500/30 transition-colors">
              <FaArrowLeft className="w-5 h-5 text-purple-400" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Prescription Details</h1>
              <p className="text-sm text-slate-400">View prescription information</p>
            </div>
          </div>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center space-x-2 bg-purple-500/20 hover:bg-purple-500/30 px-4 py-2 rounded-xl transition-colors"
          >
            <FaDownload className="w-4 h-4 text-purple-400" />
            <span className="text-purple-400 font-medium">Download PDF</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
          {/* Header Info */}
          <div className="border-b border-white/10 pb-6 mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <FaPills className="w-8 h-8 text-purple-400" />
              <h2 className="text-2xl font-bold">Medical Prescription</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400">Prescription Date</p>
                <p className="text-white font-medium flex items-center space-x-2">
                  <FaCalendar className="w-4 h-4 text-purple-400" />
                  <span>{new Date(prescription.prescriptionDate).toLocaleDateString()}</span>
                </p>
              </div>
              <div>
                <p className="text-slate-400">Doctor</p>
                <p className="text-white font-medium flex items-center space-x-2">
                  <FaUser className="w-4 h-4 text-purple-400" />
                  <span>{prescription.doctorName || 'N/A'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Patient Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-purple-400">Patient Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400">Name</p>
                <p className="text-white font-medium">{prescription.patientName}</p>
              </div>
              <div>
                <p className="text-slate-400">Age</p>
                <p className="text-white font-medium">{prescription.patientAge || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-400">Gender</p>
                <p className="text-white font-medium capitalize">{prescription.patientGender || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-400">Phone</p>
                <p className="text-white font-medium">{prescription.patientPhone || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Diagnosis & Symptoms */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-purple-400">Diagnosis & Symptoms</h3>
            <div className="space-y-3">
              {prescription.diagnosis && (
                <div>
                  <p className="text-slate-400 text-sm">Diagnosis</p>
                  <p className="text-white">{prescription.diagnosis}</p>
                </div>
              )}
              {prescription.symptoms && (
                <div>
                  <p className="text-slate-400 text-sm">Symptoms</p>
                  <p className="text-white">{prescription.symptoms}</p>
                </div>
              )}
            </div>
          </div>

          {/* Medicines */}
          {prescription.medicines && prescription.medicines.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-purple-400">Prescribed Medicines</h3>
              <div className="space-y-4">
                {prescription.medicines.map((medicine, index) => (
                  <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-white">{index + 1}. {medicine.name}</h4>
                      <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs">
                        {medicine.dosage}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-slate-400">Frequency: </span>
                        <span className="text-white">{medicine.frequency}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Duration: </span>
                        <span className="text-white">{medicine.duration}</span>
                      </div>
                    </div>
                    {medicine.instructions && (
                      <div className="mt-2 text-sm">
                        <span className="text-slate-400">Instructions: </span>
                        <span className="text-white">{medicine.instructions}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* General Instructions */}
          {prescription.instructions && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-purple-400">General Instructions</h3>
              <p className="text-white bg-white/5 border border-white/10 rounded-xl p-4">
                {prescription.instructions}
              </p>
            </div>
          )}

          {/* Follow-up */}
          {prescription.followUpDate && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-purple-400">Follow-up</h3>
              <div className="flex items-center space-x-2 text-white">
                <FaCalendar className="w-4 h-4 text-purple-400" />
                <span>Next visit: {new Date(prescription.followUpDate).toLocaleDateString()}</span>
              </div>
            </div>
          )}

          {/* Notes */}
          {prescription.notes && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-purple-400">Additional Notes</h3>
              <p className="text-slate-300 text-sm">{prescription.notes}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
