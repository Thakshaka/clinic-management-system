import { useState, useEffect } from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { Link } from 'react-router-dom'
import LogoutButton from '../../../components/LogoutButton'
import { Search, ArrowLeft, Plus, Edit2, Trash2, AlertTriangle, Package } from 'lucide-react'
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../../firebase/config'

export default function Inventory() {
  const { currentUser } = useAuth()
  const [medicines, setMedicines] = useState([])
  const [filteredMedicines, setFilteredMedicines] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingMedicine, setEditingMedicine] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    stock: 0,
    minStock: 10,
    price: 0,
    expiryDate: '',
    batchNumber: ''
  })

  // Fetch medicines
  useEffect(() => {
    const medicinesRef = collection(db, 'medicines')
    const medicinesQuery = query(medicinesRef, orderBy('name', 'asc'))
    
    const unsubscribe = onSnapshot(medicinesQuery, (snapshot) => {
      const medicinesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setMedicines(medicinesData)
      setFilteredMedicines(medicinesData)
      setLoading(false)
    }, (error) => {
      console.error('Error fetching medicines:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Filter medicines
  useEffect(() => {
    if (searchTerm) {
      const filtered = medicines.filter(medicine =>
        medicine.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.category?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredMedicines(filtered)
    } else {
      setFilteredMedicines(medicines)
    }
  }, [medicines, searchTerm])

  const handleAddMedicine = async (e) => {
    e.preventDefault()
    try {
      await addDoc(collection(db, 'medicines'), {
        ...formData,
        stock: Number(formData.stock),
        minStock: Number(formData.minStock),
        price: Number(formData.price),
        createdAt: new Date().toISOString(),
        createdBy: currentUser.uid
      })
      setShowAddModal(false)
      resetForm()
      alert('Medicine added successfully!')
    } catch (error) {
      console.error('Error adding medicine:', error)
      alert('Error adding medicine')
    }
  }

  const handleUpdateMedicine = async (e) => {
    e.preventDefault()
    try {
      await updateDoc(doc(db, 'medicines', editingMedicine.id), {
        ...formData,
        stock: Number(formData.stock),
        minStock: Number(formData.minStock),
        price: Number(formData.price),
        updatedAt: new Date().toISOString()
      })
      setEditingMedicine(null)
      resetForm()
      alert('Medicine updated successfully!')
    } catch (error) {
      console.error('Error updating medicine:', error)
      alert('Error updating medicine')
    }
  }

  const handleDeleteMedicine = async (id) => {
    if (window.confirm('Are you sure you want to delete this medicine?')) {
      try {
        await deleteDoc(doc(db, 'medicines', id))
        alert('Medicine deleted successfully!')
      } catch (error) {
        console.error('Error deleting medicine:', error)
        alert('Error deleting medicine')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      stock: 0,
      minStock: 10,
      price: 0,
      expiryDate: '',
      batchNumber: ''
    })
  }

  const openEditModal = (medicine) => {
    setEditingMedicine(medicine)
    setFormData({
      name: medicine.name || '',
      category: medicine.category || '',
      stock: medicine.stock || 0,
      minStock: medicine.minStock || 10,
      price: medicine.price || 0,
      expiryDate: medicine.expiryDate || '',
      batchNumber: medicine.batchNumber || ''
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Link to="/pharmacist" className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center hover:bg-orange-500/30 transition-colors">
              <ArrowLeft className="w-5 h-5 text-orange-400" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Inventory Management</h1>
              <p className="text-sm text-slate-400">Manage medicines and stock levels</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {/* Search and Add */}
        <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search medicines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 outline-none focus:border-orange-400 transition-colors"
              />
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-xl transition-all flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Medicine</span>
            </button>
          </div>
        </div>

        {/* Medicines Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white text-lg">Loading inventory...</p>
            </div>
          </div>
        ) : filteredMedicines.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 backdrop-blur-xl text-center">
            <Package className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No medicines found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMedicines.map((medicine) => {
              const isLowStock = (medicine.stock || 0) <= (medicine.minStock || 10)
              return (
                <div key={medicine.id} className={`bg-white/5 border rounded-2xl p-6 backdrop-blur-xl ${
                  isLowStock ? 'border-red-400/50' : 'border-white/10'
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">{medicine.name}</h3>
                      <p className="text-sm text-slate-400">{medicine.category || 'Uncategorized'}</p>
                    </div>
                    {isLowStock && (
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-sm">Stock:</span>
                      <span className={`font-semibold ${isLowStock ? 'text-red-400' : 'text-green-400'}`}>
                        {medicine.stock || 0} units
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-sm">Min Stock:</span>
                      <span className="font-medium">{medicine.minStock || 10} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 text-sm">Price:</span>
                      <span className="font-medium">${medicine.price || 0}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEditModal(medicine)}
                      className="flex-1 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors flex items-center justify-center space-x-1"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span className="text-sm">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteMedicine(medicine.id)}
                      className="flex-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex items-center justify-center space-x-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm">Delete</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      {(showAddModal || editingMedicine) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">{editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}</h2>
            <form onSubmit={editingMedicine ? handleUpdateMedicine : handleAddMedicine} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Medicine Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-orange-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-orange-400 appearance-none cursor-pointer"
                >
                  <option value="" className="bg-slate-800">Select Category</option>
                  <option value="Antibiotic" className="bg-slate-800">Antibiotic</option>
                  <option value="Painkiller" className="bg-slate-800">Painkiller</option>
                  <option value="Antiviral" className="bg-slate-800">Antiviral</option>
                  <option value="Antifungal" className="bg-slate-800">Antifungal</option>
                  <option value="Antihistamine" className="bg-slate-800">Antihistamine</option>
                  <option value="Vitamin" className="bg-slate-800">Vitamin</option>
                  <option value="Supplement" className="bg-slate-800">Supplement</option>
                  <option value="Antiseptic" className="bg-slate-800">Antiseptic</option>
                  <option value="Other" className="bg-slate-800">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Stock *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: e.target.value})}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Min Stock *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.minStock}
                    onChange={(e) => setFormData({...formData, minStock: e.target.value})}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-orange-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Price *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white outline-none focus:border-orange-400"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-lg transition-all"
                >
                  {editingMedicine ? 'Update' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingMedicine(null)
                    resetForm()
                  }}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
