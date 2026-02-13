import { useState, useEffect } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { Link } from 'react-router-dom'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../../firebase/config'
import { FaUser, FaArrowLeft, FaFloppyDisk, FaPhone, FaLocationDot, FaCalendar, FaDroplet, FaTriangleExclamation } from 'react-icons/fa6'
import toast from 'react-hot-toast'
import EmailVerificationStatus from '../../../components/EmailVerificationStatus'

export default function Profile() {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileData, setProfileData] = useState({
    fullName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    medicalConditions: '',
    allergies: ''
  })

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!currentUser) return

      try {
        const profileRef = doc(db, 'patientData', currentUser.uid)
        const profileDoc = await getDoc(profileRef)

        if (profileDoc.exists()) {
          const data = profileDoc.data()
          setProfileData({
            fullName: data.fullName || currentUser.displayName || '',
            phone: data.phone || '',
            dateOfBirth: data.dateOfBirth || '',
            gender: data.gender || '',
            bloodGroup: data.bloodGroup || '',
            address: data.address || '',
            emergencyContactName: data.emergencyContact?.name || '',
            emergencyContactPhone: data.emergencyContact?.phone || '',
            emergencyContactRelationship: data.emergencyContact?.relationship || '',
            medicalConditions: data.medicalConditions || '',
            allergies: data.allergies || ''
          })
        } else {
          // Initialize with default values
          setProfileData(prev => ({
            ...prev,
            fullName: currentUser.displayName || ''
          }))
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [currentUser])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const profileRef = doc(db, 'patientData', currentUser.uid)
      const profileDoc = await getDoc(profileRef)

      const dataToSave = {
        uid: currentUser.uid,
        fullName: profileData.fullName,
        email: currentUser.email,
        phone: profileData.phone,
        dateOfBirth: profileData.dateOfBirth,
        gender: profileData.gender,
        bloodGroup: profileData.bloodGroup,
        address: profileData.address,
        emergencyContact: {
          name: profileData.emergencyContactName,
          phone: profileData.emergencyContactPhone,
          relationship: profileData.emergencyContactRelationship
        },
        medicalConditions: profileData.medicalConditions,
        allergies: profileData.allergies,
        role: 'patient',
        updatedAt: new Date().toISOString()
      }

      if (profileDoc.exists()) {
        await updateDoc(profileRef, dataToSave)
      } else {
        await setDoc(profileRef, {
          ...dataToSave,
          createdAt: new Date().toISOString()
        })
      }

      toast.success('Profile updated successfully!')
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Link to="/patient" className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center hover:bg-yellow-500/30 transition-colors">
              <FaArrowLeft className="w-5 h-5 text-yellow-400" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">My Profile</h1>
              <p className="text-sm text-slate-400">Manage your personal information</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account Information */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
              <FaUser className="w-5 h-5 text-yellow-400" />
              <span>Account Information</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  value={currentUser?.email}
                  disabled
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-slate-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email Verified</label>
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                  <EmailVerificationStatus />
                </div>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={profileData.fullName}
                  onChange={handleInputChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <FaPhone className="inline w-4 h-4 mr-1" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleInputChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <FaCalendar className="inline w-4 h-4 mr-1" />
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={profileData.dateOfBirth}
                  onChange={handleInputChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Gender</label>
                <select
                  name="gender"
                  value={profileData.gender}
                  onChange={handleInputChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="" className="bg-slate-800">Select Gender</option>
                  <option value="male" className="bg-slate-800">Male</option>
                  <option value="female" className="bg-slate-800">Female</option>
                  <option value="other" className="bg-slate-800">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <FaDroplet className="inline w-4 h-4 mr-1" />
                  Blood Group
                </label>
                <select
                  name="bloodGroup"
                  value={profileData.bloodGroup}
                  onChange={handleInputChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="" className="bg-slate-800">Select Blood Group</option>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(group => (
                    <option key={group} value={group} className="bg-slate-800">{group}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <FaLocationDot className="inline w-4 h-4 mr-1" />
                  Address
                </label>
                <textarea
                  name="address"
                  value={profileData.address}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold mb-4 text-red-400">Emergency Contact</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Contact Name</label>
                <input
                  type="text"
                  name="emergencyContactName"
                  value={profileData.emergencyContactName}
                  onChange={handleInputChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Contact Phone</label>
                <input
                  type="tel"
                  name="emergencyContactPhone"
                  value={profileData.emergencyContactPhone}
                  onChange={handleInputChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Relationship</label>
                <input
                  type="text"
                  name="emergencyContactRelationship"
                  value={profileData.emergencyContactRelationship}
                  onChange={handleInputChange}
                  placeholder="e.g., Spouse, Parent"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
              <FaTriangleExclamation className="w-5 h-5 text-yellow-400" />
              <span>Medical Information</span>
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Medical Conditions</label>
                <textarea
                  name="medicalConditions"
                  value={profileData.medicalConditions}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="List any existing medical conditions (e.g., Diabetes, Hypertension)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Allergies</label>
                <textarea
                  name="allergies"
                  value={profileData.allergies}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="List any known allergies (e.g., Penicillin, Peanuts)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 font-medium px-8 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-400"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FaFloppyDisk className="w-5 h-5" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
