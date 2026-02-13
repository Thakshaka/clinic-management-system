import { useState, useEffect } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { Link } from 'react-router-dom'
import LogoutButton from '../../../components/LogoutButton'
import { FaUserShield, FaUserDoctor, FaUserTie, FaUserInjured } from 'react-icons/fa6'
import { Search, Filter, Mail, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../../../firebase/config'

export default function UserManagement() {
  const { currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  // Fetch all users
  useEffect(() => {
    const staffRef = collection(db, 'staffData')
    const staffQuery = query(staffRef, orderBy('createdAt', 'desc'))
    
    const patientRef = collection(db, 'patientData')
    const patientQuery = query(patientRef, orderBy('createdAt', 'desc'))

    let staffData = []
    let patientData = []

    const updateUsers = () => {
      // Merge and sort
      const allUsers = [...staffData, ...patientData].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0)
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0)
        return dateB - dateA
      })
      
      setUsers(allUsers)
      // We also need to update filteredUsers, but we should respect the current search/filter state.
      // However, usually filtering is done in a separate useEffect dependent on 'users', 'searchTerm', 'roleFilter'.
      // Looking at the original code, there is a separate useEffect for filtering.
      // So checking line 75 (original) -> line numbers shifted.
      // Let's just update 'users' state. The filtering useEffect will run when 'users' changes.
    }

    const unsubStaff = onSnapshot(staffQuery, (snapshot) => {
      staffData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }))
      updateUsers()
      setLoading(false)
    }, (error) => {
      console.error('Error fetching staff:', error)
      setLoading(false)
    })

    const unsubPatient = onSnapshot(patientQuery, (snapshot) => {
      patientData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(), 
        role: 'patient' // Ensure role is set
      }))
      updateUsers()
      setLoading(false)
    }, (error) => {
      console.error('Error fetching patients:', error)
      // Don't verify loading here strictly as staff might still be loading, but good enough
    })

    return () => {
      unsubStaff()
      unsubPatient()
    }
  }, [])

  // Filter users based on search and role filter
  useEffect(() => {
    let filtered = users

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredUsers(filtered)
  }, [searchTerm, roleFilter, users])

  const getRoleIcon = (role) => {
    switch(role) {
      case 'doctor': return <FaUserDoctor className="w-4 h-4" />
      case 'receptionist': return <FaUserTie className="w-4 h-4" />
      case 'patient': return <FaUserInjured className="w-4 h-4" />
      case 'admin': return <FaUserShield className="w-4 h-4" />
      default: return null
    }
  }

  const getRoleColor = (role) => {
    switch(role) {
      case 'doctor': return 'text-blue-400'
      case 'receptionist': return 'text-cyan-400'
      case 'patient': return 'text-green-400'
      case 'admin': return 'text-purple-400'
      default: return 'text-slate-400'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Link to="/admin" className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center hover:bg-purple-500/30 transition-colors">
              <ArrowLeft className="w-5 h-5 text-purple-400" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">User Management</h1>
              <p className="text-sm text-slate-400">Manage all system users</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {/* Filters and Search */}
        <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 outline-none focus:border-purple-400 transition-colors"
              />
            </div>

            {/* Role Filter */}
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-purple-400 transition-colors appearance-none cursor-pointer"
              >
                <option value="all" className="bg-slate-800">All Roles</option>
                <option value="doctor" className="bg-slate-800">Doctors</option>
                <option value="receptionist" className="bg-slate-800">Receptionists</option>
                <option value="patient" className="bg-slate-800">Patients</option>
                <option value="admin" className="bg-slate-800">Admins</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-slate-400">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white text-lg">Loading users...</p>
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 backdrop-blur-xl text-center">
            <p className="text-slate-400 text-lg">No users found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl hover:bg-white/10 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* User Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      user.role === 'doctor' ? 'bg-blue-500/20' :
                      user.role === 'receptionist' ? 'bg-cyan-500/20' :
                      user.role === 'patient' ? 'bg-green-500/20' :
                      'bg-purple-500/20'
                    }`}>
                      <span className={getRoleColor(user.role)}>
                        {getRoleIcon(user.role)}
                      </span>
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-semibold">{user.fullName || 'Unknown User'}</h3>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          user.role === 'doctor' ? 'bg-blue-500/20 text-blue-400' :
                          user.role === 'receptionist' ? 'bg-cyan-500/20 text-cyan-400' :
                          user.role === 'patient' ? 'bg-green-500/20 text-green-400' :
                          'bg-purple-500/20 text-purple-400'
                        }`}>
                          {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-slate-400">
                        <Mail className="w-3 h-3" />
                        <span>{user.email}</span>
                      </div>

                      {user.createdAt && (
                        <div className="mt-2 text-xs text-slate-500">
                          Joined: {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center space-x-2">
                    {user.emailVerified !== false ? (
                      <div className="flex items-center space-x-1 text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs">Verified</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 text-yellow-400">
                        <XCircle className="w-4 h-4" />
                        <span className="text-xs">Unverified</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
