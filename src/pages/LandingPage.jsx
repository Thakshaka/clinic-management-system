import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Calendar, FileText, BarChart, ChevronRight, CheckCircle, Users, Activity, Clock } from 'lucide-react'
import clinicImage from '../assets/modern-clinic-interior.jpg'

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-cyan-500/30">
      
      {/* --- Navigation --- */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-900/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            {/* Logo placeholder or icon */}
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
              <Activity className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">Asiri HealthCare</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#about" className="text-sm font-medium text-slate-300 transition hover:text-cyan-400">About Us</a>
            <a href="#features" className="text-sm font-medium text-slate-300 transition hover:text-cyan-400">Why Choose Us</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-white transition hover:text-cyan-400">
              Login
            </Link>
            <Link
              to="/signup"
              className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-900 transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Register
            </Link>
          </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl mb-6">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Asiri HealthCare Clinic</span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg text-slate-400 mb-10">
            Making healthcare simple. Book your visit online anytime, anywhere without the wait. 
            Experience modern healthcare management designed for you.
          </p>

          <div className="flex justify-center gap-4 mb-16">
             <Link
              to="/signup"
              className="flex items-center gap-2 rounded-full bg-cyan-500 px-8 py-3 text-base font-bold text-slate-900 transition hover:bg-cyan-400 hover:scale-105 active:scale-95"
            >
              Get Started <ChevronRight className="h-4 w-4" />
            </Link>
            <a
              href="#about"
              className="rounded-full border border-slate-700 bg-slate-800/50 px-8 py-3 text-base font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              Learn More
            </a>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 max-w-4xl mx-auto">
            <StatsCard 
              icon={<Clock className="h-8 w-8 text-cyan-400" />} 
              number="5000+" 
              label="Appointments" 
            />
            <StatsCard 
              icon={<Users className="h-8 w-8 text-cyan-400" />} 
              number="50+" 
              label="Expert Doctors" 
            />
            <StatsCard 
              icon={<CheckCircle className="h-8 w-8 text-cyan-400" />} 
              number="98%" 
              label="Satisfaction Rate" 
            />
          </div>
        </div>

        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-1/2 -ml-[50%] w-[200%] h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-900/0 to-slate-900/0 -z-0 pointer-events-none" />
      </section>

      {/* --- About Us Section --- */}
      <section id="about" className="py-24 bg-slate-800/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Text Content */}
            <div>
              <div className="inline-flex items-center rounded-full bg-cyan-500/10 px-3 py-1 text-sm font-medium text-cyan-400 mb-6">
                About Us
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-6">
                Committed to Your Health and Well-being
              </h2>
              <div className="space-y-4 text-slate-400 leading-relaxed">
                <p>
                  At Asiri HealthCare, we believe that quality healthcare should be accessible, efficient, and patient-centered. 
                  Our clinic management system streamlines the entire process from appointment booking to medical records.
                </p>
                <p>
                  We combine cutting-edge technology with compassionate care to ensure you receive the best attention possible. 
                  Our team of dedicated professionals is here to support you on your health journey.
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-700/50">
                  {['24/7 Support', 'Qualified Doctors', 'Modern Facilities', 'Emergency Care'].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                       <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                       {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Image Placeholder */}
            <div className="relative group">
               <div className="absolute -inset-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 opacity-20 blur-lg group-hover:opacity-30 transition duration-500" />
               <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-800 border border-slate-700 shadow-2xl">
                  <img 
                    src={clinicImage} 
                    alt="Modern Clinic Interior" 
                    className="h-full w-full object-cover opacity-80"
                  />
               </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- Why Choose Us Section --- */}
      <section id="features" className="py-24 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">
              Why Choose Us
            </h2>
            <p className="max-w-2xl mx-auto text-slate-400">
              Comprehensive healthcare management at your fingertips.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <FeatureCard 
              icon={<Calendar className="h-8 w-8 text-cyan-400" />}
              title="Easy Scheduling"
              description="Book appointments with smart time-slot management to prevent conflict."
            />
            <FeatureCard 
              icon={<FileText className="h-8 w-8 text-cyan-400" />}
              title="Digital Records"
              description="Access prescriptions, medical records and billing information anytime."
            />
            <FeatureCard 
              icon={<BarChart className="h-8 w-8 text-cyan-400" />}
              title="Analytics & Reports"
              description="Comprehensive reporting and analytics for informed decision making."
            />
          </div>

          {/* AI Assistant Highlight */}
          <div className="relative rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/50 p-8 sm:p-12 text-center overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
             
             <div className="relative z-10">
               <div className="inline-flex items-center justify-center p-3 rounded-full bg-cyan-500/10 mb-6">
                 <div className="h-6 w-6 text-cyan-400 font-bold text-xl">AI</div>
               </div>
               <h3 className="text-2xl font-bold text-white mb-4">AI-Powered Assistant</h3>
               <p className="text-slate-400 max-w-2xl mx-auto mb-0">
                 Get instant help with our intelligent chatbot. Available 24/7 to answer your questions about appointments, prescriptions and clinic services.
               </p>
             </div>
          </div>

        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-slate-800 border border-slate-700">
                 <Activity className="h-6 w-6 text-cyan-500" />
               </div>
               <div className="text-left">
                 <h4 className="text-lg font-bold text-white">Asiri HealthCare Clinic</h4>
                 <p className="text-xs text-slate-500">Excellence in Care</p>
               </div>
            </div>

            <div className="text-sm text-slate-400 text-center sm:text-right space-y-1">
              <p>Contact: <a href="tel:+94779751397" className="hover:text-cyan-400 transition">+94779751397</a></p>
              <p>Email: <a href="mailto:info@asirihealthcare.com" className="hover:text-cyan-400 transition">info@asirihealthcare.com</a></p>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-slate-900 text-center text-xs text-slate-600">
            &copy; {new Date().getFullYear()} AsiriHealthCare Clinic. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

function StatsCard({ icon, number, label }) {
  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-6 flex flex-col items-center justify-center text-center transition hover:border-cyan-500/30 hover:bg-slate-800/50">
      <div className="mb-4 rounded-full bg-slate-900 p-3 ring-1 ring-white/10">
        {icon}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{number}</div>
      <div className="text-sm text-slate-400">{label}</div>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center transition hover:-translate-y-1 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-900/20">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-white group-hover:bg-cyan-500 group-hover:text-slate-900 transition-colors duration-300">
        {icon}
      </div>
      <h3 className="mb-3 text-lg font-bold text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-400">{description}</p>
    </div>
  )
}
