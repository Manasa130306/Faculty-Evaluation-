'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import {
  GraduationCap,
  Shield,
  BarChart3,
  Users,
  ArrowRight,
  Menu,
  X
} from 'lucide-react';

export default function HomePage() {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      if (role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/faculty');
      }
    }
  }, [user, role, isLoading, router]);

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden bg-slate-50 font-sans selection:bg-blue-100 selection:text-[#123B73]">
      {/* ============================================================ */}
      {/* 1. HERO BACKGROUND IMAGE WITH REFINED GRADIENT OVERLAYS */}
      {/* ============================================================ */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Campus Background Image */}
        <Image
          src="/campus_background.jpg"
          alt="NSRIET Campus"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-100 transition-transform duration-1000"
        />

        {/* Left side subtle white-to-transparent gradient for crisp text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-transparent w-full md:w-[75%] lg:w-[60%]" />

        {/* Global gentle top-to-bottom atmospheric wash */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-blue-900/10" />
      </div>

      {/* ============================================================ */}
      {/* 2. TOP FLOATING NAVBAR */}
      {/* ============================================================ */}
      <header className="relative z-30 w-full pt-4 sm:pt-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <nav className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-full px-4 sm:px-8 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100/80 flex items-center justify-between transition-all">
          {/* Left Brand Badge */}
          <Link href="/" className="flex items-center gap-3 sm:gap-4 group">
            {/* NSRIET Logo Badge */}
            <div className="relative bg-[#123B73] px-3.5 py-1.5 rounded-lg flex items-center justify-center shadow-inner group-hover:bg-[#0e2f5c] transition-colors">
              {/* Red Top Accent Bar */}
              <div className="absolute -top-0.5 right-2 w-4 h-1 bg-[#DC2626] rounded-full" />
              <span className="font-extrabold text-white text-base sm:text-lg tracking-wider font-sans">
                NSRIET
              </span>
            </div>

            {/* Vertical Separator */}
            <div className="h-7 w-[1.5px] bg-slate-300 hidden xs:block" />

            {/* Full College Name */}
            <div className="hidden xs:flex flex-col text-left">
              <span className="text-[11px] sm:text-[13px] font-bold tracking-tight text-[#123B73] leading-tight uppercase font-sans">
                N S Raju Institute of
              </span>
              <span className="text-[10px] sm:text-[12px] font-semibold tracking-wider text-[#123B73] leading-tight uppercase font-sans opacity-95">
                Engineering & Technology
              </span>
            </div>
          </Link>

          {/* Right Navigation Menu (Desktop) */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            <Link
              href="/"
              className="text-[#123B73] font-semibold text-sm relative py-1 border-b-2 border-blue-600 transition-colors"
            >
              Home
            </Link>
            <Link
              href="#about"
              className="text-slate-600 hover:text-[#123B73] font-medium text-sm transition-colors"
            >
              About
            </Link>
            <Link
              href="#framework"
              className="text-slate-600 hover:text-[#123B73] font-medium text-sm transition-colors"
            >
              Evaluation Framework
            </Link>
            <Link
              href="#contact"
              className="text-slate-600 hover:text-[#123B73] font-medium text-sm transition-colors"
            >
              Contact
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[#123B73] hover:bg-slate-100 transition"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-slate-100 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="text-[#123B73] font-semibold text-sm px-3 py-2 rounded-lg bg-blue-50"
            >
              Home
            </Link>
            <Link
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-700 font-medium text-sm px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              About
            </Link>
            <Link
              href="#framework"
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-700 font-medium text-sm px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              Evaluation Framework
            </Link>
            <Link
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-700 font-medium text-sm px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              Contact
            </Link>
          </div>
        )}
      </header>

      {/* ============================================================ */}
      {/* 3. HERO BODY (LEFT TEXT & RIGHT PORTAL CARDS) */}
      {/* ============================================================ */}
      <main className="relative z-20 flex-1 flex items-center max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center w-full">
          {/* ---------------------------------------------------- */}
          {/* HERO LEFT CONTENT */}
          {/* ---------------------------------------------------- */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center text-left">
            {/* Small Label with accent line */}
            <div className="flex items-center gap-2.5 mb-3 sm:mb-4">
              <span className="w-6 h-[2px] bg-[#2563EB]" />
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#123B73]/90">
                INTERNAL QUALITY ASSURANCE CELL (IQAC)
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[46px] xl:text-[50px] font-extrabold tracking-tight leading-[1.12] text-[#123B73]">
              Faculty Evaluation <br />
              <span className="text-[#2563EB]">Management System</span>
            </h1>

            {/* Short Subtext */}
            <p className="mt-4 sm:mt-5 text-sm sm:text-base text-slate-600 leading-relaxed max-w-lg font-normal">
              A transparent, structured and technology-driven platform for faculty performance
              evaluation and document management.
            </p>
          </div>

          {/* ---------------------------------------------------- */}
          {/* HERO RIGHT: DUAL PORTAL CARDS (SIDE-BY-SIDE ON DESKTOP) */}
          {/* ---------------------------------------------------- */}
          <div className="lg:col-span-6 xl:col-span-7 flex justify-center lg:justify-end">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 w-full max-w-2xl">
              {/* ==================== CARD 1: FACULTY PORTAL ==================== */}
              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-7 shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-white/80 flex flex-col justify-between text-center transform hover:-translate-y-1.5 transition-all duration-300">
                <div>
                  {/* Circular Maroon Badge */}
                  <div className="w-14 h-14 rounded-full bg-[#8B1E1E] text-white flex items-center justify-center mx-auto shadow-md shadow-[#8B1E1E]/20">
                    <GraduationCap className="w-7 h-7" />
                  </div>

                  {/* Title */}
                  <h2 className="text-xl sm:text-2xl font-bold text-[#8B1E1E] mt-4 mb-2 tracking-tight">
                    Faculty Portal
                  </h2>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6 font-normal">
                    Login to submit your monthly evaluation, upload reference documents, and track
                    your academic contributions.
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  {/* Primary Button */}
                  <Link href="/login" className="block w-full">
                    <button className="w-full py-3 px-4 rounded-full bg-[#8B1E1E] hover:bg-[#731717] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98]">
                      <span>Login as Faculty</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>

                  {/* Divider */}
                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-[11px]">
                      <span className="bg-white/95 px-2.5 text-slate-400 font-medium">
                        New to the system?
                      </span>
                    </div>
                  </div>

                  {/* Secondary Button */}
                  <Link href="/register" className="block w-full">
                    <button className="w-full py-2.5 px-4 rounded-full border border-[#8B1E1E] text-[#8B1E1E] hover:bg-[#8B1E1E]/5 font-semibold text-xs sm:text-sm transition-all active:scale-[0.98]">
                      Register as Faculty
                    </button>
                  </Link>
                </div>
              </div>

              {/* ==================== CARD 2: ADMIN PORTAL ==================== */}
              <div className="bg-[#EDF5FF]/95 backdrop-blur-md rounded-3xl p-6 sm:p-7 shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-blue-100/90 flex flex-col justify-between text-center transform hover:-translate-y-1.5 transition-all duration-300">
                <div>
                  {/* Circular Blue Badge */}
                  <div className="w-14 h-14 rounded-full bg-[#2563EB] text-white flex items-center justify-center mx-auto shadow-md shadow-[#2563EB]/20">
                    <Shield className="w-7 h-7" />
                  </div>

                  {/* Title */}
                  <h2 className="text-xl sm:text-2xl font-bold text-[#123B73] mt-4 mb-2 tracking-tight">
                    Admin Portal
                  </h2>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6 font-normal">
                    Access the administrative dashboard to review submissions, manage faculty
                    records, and generate reports.
                  </p>
                </div>

                {/* Primary Button */}
                <div className="pt-2">
                  <Link href="/admin-login" className="block w-full">
                    <button className="w-full py-3 px-4 rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98]">
                      <span>Login as Admin</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ============================================================ */}
      {/* 4. SUBTLE BOTTOM CURVED WAVE ACCENTS */}
      {/* ============================================================ */}
      <div className="relative z-10 w-full overflow-hidden leading-none -mb-[1px]">
        <svg
          viewBox="0 0 1440 85"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-12 sm:h-16 lg:h-20 preserve-3d"
        >
          {/* Subtle back wave */}
          <path
            d="M0,30 C320,70 480,10 720,40 C960,70 1200,20 1440,35 L1440,85 L0,85 Z"
            fill="#60A5FA"
            fillOpacity="0.25"
          />
          {/* Front wave matching footer top */}
          <path
            d="M0,45 C280,15 540,65 820,35 C1100,5 1300,55 1440,40 L1440,85 L0,85 Z"
            fill="#0F274A"
          />
        </svg>
      </div>

      {/* ============================================================ */}
      {/* 5. DARK NAVY INSTITUTIONAL FOOTER */}
      {/* ============================================================ */}
      <footer className="relative z-20 bg-[#0F274A] text-white border-t border-blue-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 text-center md:text-left">
            {/* Left: NSRIET Brand Info */}
            <div className="flex items-center gap-3">
              <div className="relative bg-[#123B73] px-3 py-1.5 rounded-lg border border-white/20 flex items-center justify-center">
                <span className="font-bold text-white text-sm tracking-wider">NSRIET</span>
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-slate-100 uppercase leading-tight tracking-tight">
                  N S Raju Institute of
                </span>
                <span className="text-[11px] font-semibold text-slate-300 uppercase leading-tight tracking-wider">
                  Engineering & Technology
                </span>
              </div>
            </div>

            {/* Center Items: Quality Pillars */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 lg:gap-8 text-xs sm:text-[13px] text-slate-200">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-blue-300 shrink-0" />
                <span className="font-medium">Empowering Educators</span>
              </div>
              <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-slate-500" />
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-300 shrink-0" />
                <span className="font-medium">Enhancing Quality</span>
              </div>
              <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-slate-500" />
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-300 shrink-0" />
                <span className="font-medium">Building a Better Future</span>
              </div>
            </div>

            {/* Right: IQAC Cell Info */}
            <div className="flex items-center gap-2.5 text-right md:border-l md:border-slate-700/60 md:pl-6">
              <div className="flex flex-col text-center md:text-right">
                <span className="text-sm font-extrabold text-white tracking-wider">IQAC</span>
                <span className="text-[10px] text-slate-300 leading-tight">
                  Internal Quality <br className="hidden md:inline" /> Assurance Cell
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
