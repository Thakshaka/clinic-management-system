import { useState, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import LogoutButton from '../../../components/LogoutButton'
import { ArrowLeft, Pill, Plus, Minus, Save } from 'lucide-react'
import { collection, onSnapshot, query, addDoc, updateDoc, doc } from 'firebase/firestore'
import { db } from '../../../firebase/config'

export default function IssueDrugs() {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const prescription = location.state?.prescription
  
  const [medicines, setMedicines] = useState([])
  const [selectedMedicines, setSelectedMedicines] = useState([])
  const [notes, setNotes] = useState('')
  const [issuing, setIssuing] = useState(false)

  // Fetch available medicines
  useEffect(() => {
    const medicinesRef = collection(db, 'medicines')
    const medicinesQuery = query(medicinesRef)
    
    const unsubscribe = onSnapshot(medicinesQuery, (snapshot) => {
      const medicinesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setMedicines(medicinesData)
      
      // Pre-select medicines from prescription if available
      if (prescription?.medicines) {
        const preSelected = prescription.medicines.map(pm => {
          const medicine = medicinesData.find(m => m.name === pm.name)
          return medicine ? {
            ...medicine,
            quantityToIssue: 1,
            prescribedDosage: pm.dosage,
            prescribedFrequency: pm.frequency
          } : null
        }).filter(Boolean)
        setSelectedMedicines(preSelected)
      }
    })

    return () => unsubscribe()
  }, [prescription])

  const addMedicine = (medicine) => {
    if (!selectedMedicines.find(m => m.id === medicine.id)) {
      setSelectedMedicines([...selectedMedicines, { ...medicine, quantityToIssue: 1 }])
    }
  }

  const removeMedicine = (medicineId) => {
    setSelectedMedicines(selectedMedicines.filter(m => m.id !== medicineId))
  }

  const updateQuantity = (medicineId, change) => {
    setSelectedMedicines(selectedMedicines.map(m => {
      if (m.id === medicineId) {
        const newQuantity = Math.max(1, (m.quantityToIssue || 1) + change)
        return { ...m, quantityToIssue: newQuantity }
      }
      return m
    }))
  }

  const handleIssueDrugs = async () => {
    if (selectedMedicines.length === 0) {
      alert('Please select at least one medicine to issue')
      return
    }

    // Check stock availability
    const insufficientStock = selectedMedicines.find(m => 
      (m.stock || 0) < (m.quantityToIssue || 1)
    )
    if (insufficientStock) {
      alert(`Insufficient stock for ${insufficientStock.name}. Available: ${insufficientStock.stock}, Required: ${insufficientStock.quantityToIssue}`)
      return
    }

    setIssuing(true)
    try {
      // Create drug issuance record
      await addDoc(collection(db, 'drugIssuance'), {
        prescriptionId: prescription?.id || null,
        patientId: prescription?.patientId || null,
        patientName: prescription?.patientName || 'Walk-in',
        pharmacistId: currentUser.uid,
        pharmacistName: currentUser.email,
        medicines: selectedMedicines.map(m => ({
          medicineId: m.id,
          name: m.name,
          quantity: m.quantityToIssue,
          batchNumber: m.batchNumber || 'N/A'
        })),
        issuedAt: new Date().toISOString(),
        notes: notes
      })

      // Update medicine stock
      for (const medicine of selectedMedicines) {
        const newStock = (medicine.stock || 0) - (medicine.quantityToIssue || 1)
        await updateDoc(doc(db, 'medicines', medicine.id), {
          stock: newStock
        })
      }

      // Update prescription status if applicable
      if (prescription?.id) {
        await updateDoc(doc(db, 'prescriptions', prescription.id), {
          status: 'fulfilled',
          fulfilledBy: currentUser.uid,
          fulfilledAt: new Date().toISOString()
        })
      }

      alert('Drugs issued successfully!')
      navigate('/pharmacist')
    } catch (error) {
      console.error('Error issuing drugs:', error)
      alert('Error issuing drugs')
    } finally {
      setIssuing(false)
    }
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
              <h1 className="text-xl font-bold">Issue Drugs</h1>
              <p className="text-sm text-slate-400">Dispense medications to patients</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Prescription Info (if available) */}
        {prescription && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
            <h2 className="text-lg font-bold mb-4">Prescription Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-slate-400">Patient</p>
                <p className="font-semibold">{prescription.patientName}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Doctor</p>
                <p className="font-semibold">{prescription.doctorName}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Date</p>
                <p className="font-semibold">{prescription.prescriptionDate}</p>
              </div>
            </div>
          </div>
        )}

        {/* Selected Medicines */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <h2 className="text-lg font-bold mb-4">Medicines to Issue</h2>
          {selectedMedicines.length === 0 ? (
            <p className="text-slate-400">No medicines selected</p>
          ) : (
            <div className="space-y-3">
              {selectedMedicines.map((medicine) => (
                <div key={medicine.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{medicine.name}</h3>
                      <p className="text-sm text-slate-400">Available: {medicine.stock} units</p>
                      {medicine.prescribedDosage && (
                        <p className="text-sm text-slate-400">Prescribed: {medicine.prescribedDosage} - {medicine.prescribedFrequency}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(medicine.id, -1)}
                          className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center font-semibold">{medicine.quantityToIssue}</span>
                        <button
                          onClick={() => updateQuantity(medicine.id, 1)}
                          className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeMedicine(medicine.id)}
                        className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Medicines */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <h2 className="text-lg font-bold mb-4">Available Medicines</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {medicines.filter(m => !selectedMedicines.find(sm => sm.id === m.id)).map((medicine) => (
              <div key={medicine.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{medicine.name}</h3>
                    <p className="text-xs text-slate-400">Stock: {medicine.stock} units</p>
                  </div>
                  <button
                    onClick={() => addMedicine(medicine)}
                    className="px-3 py-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg transition-colors text-sm flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <h2 className="text-lg font-bold mb-4">Notes (Optional)</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this issuance..."
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 outline-none focus:border-orange-400 transition-colors resize-none"
            rows="3"
          />
        </div>

        {/* Issue Button */}
        <button
          onClick={handleIssueDrugs}
          disabled={issuing || selectedMedicines.length === 0}
          className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-slate-600 disabled:to-slate-700 text-white font-semibold rounded-xl transition-all disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <Save className="w-5 h-5" />
          <span>{issuing ? 'Issuing...' : 'Issue Drugs'}</span>
        </button>
      </main>
    </div>
  )
}
