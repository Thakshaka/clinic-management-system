import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore'
import { db } from '../firebase/config'

/**
 * AI Chat Assistant Utility Functions
 * Provides intelligent responses based on pattern matching and context awareness
 */

// Response templates for different intents
const RESPONSES = {
  greeting: [
    "Hello! I'm your healthcare assistant. How can I help you today?",
    "Hi there! I'm here to help with your healthcare needs. What can I do for you?",
    "Welcome! I'm your virtual health assistant. How may I assist you?"
  ],
  
  farewell: [
    "Take care! Feel free to reach out anytime you need assistance.",
    "Goodbye! Wishing you good health. I'm here whenever you need me.",
    "Have a great day! Don't hesitate to ask if you have more questions."
  ],
  
  thanks: [
    "You're welcome! Is there anything else I can help you with?",
    "Happy to help! Let me know if you need anything else.",
    "My pleasure! Feel free to ask if you have more questions."
  ],
  
  appointmentHelp: [
    "I can help you with appointments! You can:\n\n• View your upcoming appointments\n• Check past appointment history\n• Book a new appointment through the Appointments page\n\nWould you like me to show your next appointment?",
    "For appointments, you can:\n\n1. **Book**: Go to Appointments → Book Appointment\n2. **View**: Check your upcoming appointments on the dashboard\n3. **Cancel**: Manage appointments from the Appointments page\n\nWhat would you like to do?"
  ],
  
  prescriptionHelp: [
    "I can help you access your prescriptions! Your prescription information includes:\n\n• Current medications and dosages\n• Prescription dates and doctors\n• Follow-up instructions\n\nWould you like me to show your recent prescriptions?",
    "For prescriptions, you can:\n\n• View all your prescriptions in the Prescriptions page\n• See medication details and dosages\n• Check follow-up dates\n\nShall I retrieve your prescription information?"
  ],
  
  symptomCheck: [
    "⚠️ **Important**: I can provide general health information, but I'm not a substitute for professional medical advice.\n\nFor urgent symptoms:\n• Severe chest pain\n• Difficulty breathing\n• Sudden severe headache\n• Loss of consciousness\n\n**Please call emergency services immediately (911) or visit the nearest emergency room.**\n\nFor non-urgent concerns, I recommend booking an appointment with your doctor. Would you like help with that?",
    "I can provide general health guidance, but please remember:\n\n✓ This is not a medical diagnosis\n✓ Always consult your doctor for health concerns\n✓ For emergencies, call 911 immediately\n\nIf you'd like to describe your symptoms, I can suggest whether you should book an appointment."
  ],
  
  clinicInfo: [
    "**Clinic Information:**\n\n📍 **Location**: Asiri Health Care, Colombo 07\n🕐 **Hours**: \n• Monday - Friday: 8:00 AM - 6:00 PM\n• Saturday: 9:00 AM - 2:00 PM\n• Sunday: Closed\n\n📞 **Contact**: \n• Phone: +94779751397\n• Email: info@asirihealthcare.com\n\n🚨 **Emergency**: For medical emergencies, call 911",
    "Here's our clinic information:\n\n**Operating Hours:**\nWeekdays: 8 AM - 6 PM\nSaturday: 9 AM - 2 PM\nSunday: Closed\n\n**Contact Us:**\nPhone: +94779751397\nEmail: info@asirihealthcare.com\n\nFor urgent medical needs outside these hours, please visit the nearest emergency room."
  ],
  
  unknown: [
    "I'm not sure I understand. I can help you with:\n\n• Appointment scheduling and information\n• Prescription details\n• Medical history\n• Clinic information\n• General health questions\n\nCould you please rephrase your question?",
    "I didn't quite catch that. Here's what I can assist with:\n\n✓ Appointments\n✓ Prescriptions\n✓ Medical records\n✓ Clinic hours and location\n✓ Health guidance\n\nWhat would you like to know more about?"
  ]
}

// Pattern matching for intent recognition
const INTENT_PATTERNS = {
  greeting: /^(hi|hello|hey|good morning|good afternoon|good evening|greetings)/i,
  farewell: /^(bye|goodbye|see you|take care|thanks bye|thank you bye)/i,
  thanks: /^(thanks|thank you|appreciate|grateful)/i,
  
  // Appointment related
  appointmentNext: /(next|upcoming|future|scheduled) (appointment|visit|checkup)/i,
  appointmentBook: /(book|schedule|make|create|new) (appointment|visit)/i,
  appointmentCancel: /(cancel|delete|remove) (appointment|visit)/i,
  appointmentHistory: /(past|previous|old|history) (appointment|visit)/i,
  
  // Prescription related
  prescriptionCurrent: /(current|active|my) (prescription|medication|medicine|drug)/i,
  prescriptionAll: /(all|show|view|list) (prescription|medication|medicine)/i,
  prescriptionRefill: /(refill|renew) (prescription|medication)/i,
  
  // Medical history
  medicalHistory: /(medical|health) (history|record|timeline)/i,
  recentVisits: /(recent|last|latest) (visit|appointment|checkup)/i,
  
  // Symptoms and health
  symptomCheck: /(symptom|feel|sick|pain|ache|fever|cough|cold)/i,
  healthTips: /(health tip|advice|recommendation|prevent|wellness)/i,
  
  // Clinic info
  clinicHours: /(clinic|office) (hour|time|open|close)/i,
  clinicLocation: /(clinic|office) (location|address|where)/i,
  clinicContact: /(contact|phone|email|call)/i,
}

/**
 * Detect user intent from message
 */
export function detectIntent(message) {
  const lowerMessage = message.toLowerCase().trim()
  
  for (const [intent, pattern] of Object.entries(INTENT_PATTERNS)) {
    if (pattern.test(lowerMessage)) {
      return intent
    }
  }
  
  return 'unknown'
}

/**
 * Get random response from array
 */
function getRandomResponse(responses) {
  return responses[Math.floor(Math.random() * responses.length)]
}

/**
 * Fetch patient's next appointment
 */
async function getNextAppointment(patientEmail) {
  try {
    const today = new Date().toISOString().split('T')[0]
    const appointmentsRef = collection(db, 'appointments')
    const q = query(
      appointmentsRef,
      where('patientEmail', '==', patientEmail)
    )
    
    const snapshot = await getDocs(q)
    const appointments = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(apt => apt.appointmentDate >= today && apt.status !== 'cancelled')
      .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))
    
    return appointments[0] || null
  } catch (error) {
    console.error('Error fetching appointment:', error)
    return null
  }
}

/**
 * Fetch patient's recent prescriptions
 */
async function getRecentPrescriptions(patientEmail, count = 3) {
  try {
    const prescriptionsRef = collection(db, 'prescriptions')
    const q = query(
      prescriptionsRef,
      where('patientEmail', '==', patientEmail)
    )
    
    const snapshot = await getDocs(q)
    const prescriptions = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => new Date(b.createdAt || b.prescriptionDate) - new Date(a.createdAt || a.prescriptionDate))
      .slice(0, count)
    
    return prescriptions
  } catch (error) {
    console.error('Error fetching prescriptions:', error)
    return []
  }
}

/**
 * Fetch patient's recent visits
 */
async function getRecentVisits(patientEmail, count = 3) {
  try {
    const appointmentsRef = collection(db, 'appointments')
    const q = query(
      appointmentsRef,
      where('patientEmail', '==', patientEmail)
    )
    
    const snapshot = await getDocs(q)
    const visits = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(apt => apt.status === 'completed')
      .sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate))
      .slice(0, count)
    
    return visits
  } catch (error) {
    console.error('Error fetching visits:', error)
    return []
  }
}

/**
 * Generate AI response based on intent and context
 */
/**
 * Generate AI response based on intent and context
 */
export async function generateResponse(message, patientEmail) {
  const intent = detectIntent(message)
  
  // Handle simple intents without data fetching
  if (RESPONSES[intent]) {
    return getRandomResponse(RESPONSES[intent])
  }
  
  // Handle context-aware intents
  switch (intent) {
    case 'appointmentNext': {
      const appointment = await getNextAppointment(patientEmail)
      if (appointment) {
        return `📅 **Your Next Appointment:**\n\n` +
               `**Doctor**: Dr. ${appointment.doctorName}\n` +
               `**Date**: ${new Date(appointment.appointmentDate).toLocaleDateString()}\n` +
               `**Time**: ${appointment.appointmentTime}\n` +
               `**Status**: ${appointment.status}\n\n` +
               (appointment.reason ? `**Reason**: ${appointment.reason}\n\n` : '') +
               `You can manage your appointments from the Appointments page.`
      } else {
        return "You don't have any upcoming appointments scheduled. Would you like to book one? You can do so from the Appointments page."
      }
    }
    
    case 'appointmentBook':
      return getRandomResponse(RESPONSES.appointmentHelp)
    
    case 'appointmentHistory':
    case 'recentVisits': {
      const visits = await getRecentVisits(patientEmail)
      if (visits.length > 0) {
        let response = `📋 **Your Recent Visits:**\n\n`
        visits.forEach((visit, index) => {
          response += `${index + 1}. **${new Date(visit.appointmentDate).toLocaleDateString()}** - Dr. ${visit.doctorName}\n`
          if (visit.reason) response += `   Reason: ${visit.reason}\n`
        })
        response += `\nView complete history in the Medical History page.`
        return response
      } else {
        return "You don't have any completed visits in your medical history yet."
      }
    }
    
    case 'prescriptionCurrent':
    case 'prescriptionAll': {
      const prescriptions = await getRecentPrescriptions(patientEmail)
      if (prescriptions.length > 0) {
        let response = `💊 **Your Recent Prescriptions:**\n\n`
        prescriptions.forEach((rx, index) => {
          response += `${index + 1}. **${rx.diagnosis || 'General Prescription'}**\n`
          response += `   Date: ${new Date(rx.prescriptionDate).toLocaleDateString()}\n`
          if (rx.medicines && rx.medicines.length > 0) {
            response += `   Medications: ${rx.medicines.map(m => m.name).join(', ')}\n`
          }
        })
        response += `\nView full details in the Prescriptions page.`
        return response
      } else {
        return "You don't have any prescriptions on record yet."
      }
    }
    
    case 'symptomCheck':
      return getRandomResponse(RESPONSES.symptomCheck)
    
    case 'clinicHours':
    case 'clinicLocation':
    case 'clinicContact':
      return getRandomResponse(RESPONSES.clinicInfo)
    
    default:
      // Fallback to AI if configured, otherwise use standard unknown response
      return await getAIResponse(message, patientEmail)
  }
}

// ------------------------------------------------------------------
// AI Integration
// ------------------------------------------------------------------

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

async function getAIResponse(userMessage, patientEmail) {
  if (!GEMINI_API_KEY) {
    console.warn('Gemini API Key missing')
    return getRandomResponse(RESPONSES.unknown)
  }

  try {
    // 1. Fetch relevant patient context
    const appointments = await getNextAppointment(patientEmail)
    const prescriptions = await getRecentPrescriptions(patientEmail)
    const history = await getRecentVisits(patientEmail)
    
    // Format context for the AI
    const appointmentContext = appointments 
      ? `Next Appointment: ${new Date(appointments.appointmentDate).toLocaleDateString()} at ${appointments.appointmentTime} with Dr. ${appointments.doctorName} (${appointments.status})` 
      : 'No upcoming appointments.'
      
    const prescriptionContext = prescriptions.length > 0
      ? `Recent Prescriptions: ${prescriptions.map(p => `${p.medicines.map(m=>m.name).join(', ')} (Date: ${new Date(p.prescriptionDate).toLocaleDateString()})`).join('; ')}`
      : 'No recent prescriptions.'

    const historyContext = history.length > 0
      ? `Recent Visits: ${history.map(h => `${new Date(h.appointmentDate).toLocaleDateString()} - Dr. ${h.doctorName}`).join('; ')}`
      : 'No recent medical history.'
    
    // 2. Construct system prompt with context
    const contextPrompt = `
      You are a helpful, empathetic, and professional medical clinic assistant for a patient.
      
      Patient Context:
      - ${appointmentContext}
      - ${prescriptionContext}
      - ${historyContext}
      - Clinic Hours: Mon-Fri 8AM-6PM, Sat 9AM-2PM, Sun Closed.
      
      Guidelines:
      1. Answer the user's question based on their context if available.
      2. If asking about medical advice, provide general guidance but ALWAYS verify you are an AI and recommend seeing a doctor for specific medical concerns.
      3. Be concise, friendly, and use formatting (bolding, lists) to make text readable.
      4. If the user asks to book/cancel appointments, guide them to the Appointments page.
      5. Keep responses under 150 words unless detailed explanation is needed.
      
      User Question: ${userMessage}
    `

    // 3. Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: contextPrompt }] }]
      })
    })

    const data = await response.json()
    
    if (data.error) {
      console.error('Gemini API Error:', data.error)
      return getRandomResponse(RESPONSES.unknown)
    }

    return data.candidates[0].content.parts[0].text
  } catch (error) {
    console.error('AI Error:', error)
    return getRandomResponse(RESPONSES.unknown)
  }
}

/**
 * Get quick action suggestions based on context
 */
export function getQuickActions() {
  return [
    { id: 1, text: "When is my next appointment?", icon: "calendar" },
    { id: 2, text: "Show my prescriptions", icon: "pills" },
    { id: 3, text: "What are my recent visits?", icon: "history" },
    { id: 4, text: "How do I book an appointment?", icon: "plus" },
    { id: 5, text: "Clinic hours and location", icon: "info" }
  ]
}

/**
 * Save chat history to localStorage
 */
export function saveChatHistory(messages) {
  try {
    localStorage.setItem('chatHistory', JSON.stringify(messages))
  } catch (error) {
    console.error('Error saving chat history:', error)
  }
}

/**
 * Load chat history from localStorage
 */
export function loadChatHistory() {
  try {
    const history = localStorage.getItem('chatHistory')
    return history ? JSON.parse(history) : []
  } catch (error) {
    console.error('Error loading chat history:', error)
    return []
  }
}

/**
 * Clear chat history
 */
export function clearChatHistory() {
  try {
    localStorage.removeItem('chatHistory')
  } catch (error) {
    console.error('Error clearing chat history:', error)
  }
}
