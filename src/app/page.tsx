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
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden font-sans selection:bg-blue-100 selection:text-[#0F2647]">
      {/* ============================================================ */}
      {/* 1. HERO BACKGROUND IMAGE — VIBRANT & CLEAR (MATCHING IMAGE 2) */}
      {/* ============================================================ */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <Image
          src="/campus_background.jpg"
          alt="NSRIET Campus"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-100"
        />
      </div>

      {/* ============================================================ */}
      {/* 2. FLOATING TOP NAVBAR (MATCHING IMAGE 2) */}
      {/* ============================================================ */}
      <header className="relative z-30 w-full pt-4 sm:pt-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <nav className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-full px-5 sm:px-8 py-2.5 sm:py-3 shadow-[0_4px_25px_rgba(0,0,0,0.08)] border border-slate-100 flex items-center justify-between transition-all">
          {/* Left Brand Badge */}
          <Link href="/" className="flex items-center gap-3 sm:gap-4 group">
            {/* NSRIET Logo Badge */}
            <div className="relative bg-[#0F2647] px-3.5 py-1.5 rounded-lg flex items-center justify-center shadow-inner group-hover:bg-[#0A1A32] transition-colors">
              {/* Red Top Accent Bar */}
              <div className="absolute -top-0.5 right-2 w-4 h-1 bg-[#DC2626] rounded-full" />
              <span className="font-extrabold text-white text-base sm:text-lg tracking-wider font-sans">
                NSRIET
              </span>
            </div>

            {/* Vertical Separator */}
            <div className="h-6 w-[1.5px] bg-slate-300" />

            {/* Full College Name */}
            <div className="flex flex-col text-left">
              <span className="text-[11px] sm:text-[13px] font-bold tracking-tight text-[#0F2647] leading-tight uppercase font-sans">
                N S Raju Institute of
              </span>
              <span className="text-[10px] sm:text-[12px] font-semibold tracking-wider text-[#0F2647] leading-tight uppercase font-sans opacity-95">
                Engineering & Technology
              </span>
            </div>
          </Link>

          {/* Right Navigation Menu (Desktop) */}
          <div className="hidden md:flex items-center gap-7 lg:gap-9">
            <Link
              href="/"
              className="text-[#0F2647] font-semibold text-sm relative py-1 border-b-2 border-blue-600 transition-colors"
            >
              Home
            </Link>
            <Link
              href="#about"
              className="text-slate-700 hover:text-[#0F2647] font-medium text-sm transition-colors"
            >
              About
            </Link>
            <Link
              href="#framework"
              className="text-slate-700 hover:text-[#0F2647] font-medium text-sm transition-colors"
            >
              Evaluation Framework
            </Link>
            <Link
              href="#contact"
              className="text-slate-700 hover:text-[#0F2647] font-medium text-sm transition-colors"
            >
              Contact
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[#0F2647] hover:bg-slate-100 transition"
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
              className="text-[#0F2647] font-semibold text-sm px-3 py-2 rounded-lg bg-blue-50"
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
          {/* ---------------------------------------------------- */}
          {/* HERO LEFT CONTENT */}
          {/* ---------------------------------------------------- */}
          <div className="lg:col-span-5 xl:col-span-5 flex flex-col justify-center text-left">
            {/* IQAC Line */}
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-8 h-[2px] bg-[#2563EB]" />
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.14em] text-[#0F2647]">
                INTERNAL QUALITY ASSURANCE CELL (IQAC)
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[48px] font-serif font-bold tracking-tight leading-[1.12] text-[#0F2647] drop-shadow-sm">
              Faculty Evaluation <br />
              <span className="text-[#1D4ED8] font-serif font-bold">Management System</span>
            </h1>

            {/* Short Subtext */}
            <p className="mt-4 sm:mt-5 text-sm sm:text-base text-slate-700 leading-relaxed max-w-lg font-normal drop-shadow-sm">
              A transparent, structured and technology-driven platform for faculty performance
              evaluation and document management.
            </p>
          </div>

          {/* ---------------------------------------------------- */}
          {/* HERO RIGHT: DUAL PORTAL CARDS (MATCHING IMAGE 2) */}
          {/* ---------------------------------------------------- */}
          <div className="lg:col-span-7 xl:col-span-7 flex justify-center lg:justify-end">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 w-full max-w-2xl">
              {/* ==================== CARD 1: FACULTY PORTAL ==================== */}
              <div className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_15px_45px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col justify-between text-center transform hover:-translate-y-1 transition-all duration-300">
                <div>
                  {/* Circular Maroon Badge */}
                  <div className="w-16 h-16 rounded-full bg-[#88131B] text-white flex items-center justify-center mx-auto shadow-md shadow-[#88131B]/30 mb-4">
                    <GraduationCap className="w-8 h-8" />
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl sm:text-[26px] font-serif font-bold text-[#88131B] mb-2 tracking-tight">
                    Faculty Portal
                  </h2>

                  {/* Description */}
                  <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed mb-6 font-normal">
                    Login to submit your monthly evaluation, upload reference documents, and track
                    your academic contributions.
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  {/* Primary Button */}
                  <Link href="/login" className="block w-full">
                    <button className="w-full py-3 px-5 rounded-full bg-[#88131B] hover:bg-[#721016] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(136,19,27,0.35)] hover:shadow-lg transition-all active:scale-[0.98]">
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
                      <span className="bg-white px-2.5 text-slate-400 font-medium">
                        New to the system?
                      </span>
                    </div>
                  </div>

                  {/* Secondary Button */}
                  <Link href="/register" className="block w-full">
                    <button className="w-full py-2.5 px-5 rounded-full border-[1.5px] border-[#88131B] text-[#88131B] hover:bg-[#88131B]/5 font-semibold text-sm transition-all active:scale-[0.98]">
                      Register as Faculty
                    </button>
                  </Link>
                </div>
              </div>

              {/* ==================== CARD 2: ADMIN PORTAL ==================== */}
              <div className="bg-white rounded-[28px] p-6 sm:p-8 shadow-[0_15px_45px_rgba(0,0,0,0.1)] border border-slate-100 flex flex-col justify-between text-center transform hover:-translate-y-1 transition-all duration-300">
                <div>
                  {/* Circular Blue Badge */}
                  <div className="w-16 h-16 rounded-full bg-[#1D4ED8] text-white flex items-center justify-center mx-auto shadow-md shadow-[#1D4ED8]/30 mb-4">
                    <Shield className="w-8 h-8" />
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl sm:text-[26px] font-serif font-bold text-[#0F2647] mb-2 tracking-tight">
                    Admin Portal
                  </h2>

                  {/* Description */}
                  <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed mb-6 font-normal">
                    Access the administrative dashboard to review submissions, manage faculty
                    records, and generate reports.
                  </p>
                </div>

                {/* Primary Button */}
                <div className="pt-2">
                  <Link href="/admin-login" className="block w-full">
                    <button className="w-full py-3 px-5 rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(29,78,216,0.35)] hover:shadow-lg transition-all active:scale-[0.98]">
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
      {/* 4. MULTI-LAYER TRANSLUCENT CYAN / BLUE BOTTOM WAVE ACCENTS */}
      {/* ============================================================ */}
      <div className="relative z-10 w-full overflow-hidden leading-none -mb-[1px]">
        <svg
          viewBox="0 0 1440 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-14 sm:h-20 lg:h-24 preserve-3d"
        >
          {/* Subtle rear sky blue wave */}
          <path
            d="M0,40 C360,95 540,15 900,55 C1200,85 1320,30 1440,45 L1440,100 L0,100 Z"
            fill="#38BDF8"
            fillOpacity="0.45"
          />
          {/* Mid translucent blue wave */}
          <path
            d="M0,55 C300,20 600,80 960,45 C1200,20 1350,65 1440,50 L1440,100 L0,100 Z"
            fill="#60A5FA"
            fillOpacity="0.55"
          />
          {/* Front solid dark navy wave connecting into footer */}
          <path
            d="M0,65 C320,35 640,85 960,50 C1200,25 1360,70 1440,58 L1440,100 L0,100 Z"
            fill="#091A36"
          />
        </svg>
      </div>

      {/* ============================================================ */}
      {/* 5. DARK NAVY INSTITUTIONAL FOOTER */}
      {/* ============================================================ */}
      <footer className="relative z-20 bg-[#091A36] text-white border-t border-blue-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 text-center md:text-left">
            {/* Left: NSRIET Brand Info */}
            <div className="flex items-center gap-3">
              <div className="relative bg-[#0F2647] px-3 py-1.5 rounded-lg border border-white/20 flex items-center justify-center">
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


