'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button, Card, CardContent } from '@priskila/ui';
import {
  Layers,
  Box,
  CheckCircle2,
  Play,
  ArrowRight,
  ArrowLeft,
  Truck,
  ShieldCheck,
  FileText,
  BarChart3,
  Smartphone,
  Send,
  Menu,
  X,
  Zap,
} from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [currentBg, setCurrentBg] = useState(0);
  const bgImages = ['/hero/hero.jpeg', '/hero/hero2.jpeg', '/hero/hero3.jpeg'];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % bgImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [bgImages.length]);

  const testimonials = [
    {
      text: '"PRISKILA sangat membantu kami mengontrol inventory di banyak proyek sekaligus. Data akurat dan real-time sangat memudahkan pengambilan keputusan."',
      name: 'Budi Santoso',
      role: 'Project Manager',
      company: 'PT Binakarya Konstruksi',
      initials: 'BS',
    },
    {
      text: '"Laporan otomatis dan dashboard yang informatif membuat tim kami bekerja lebih efisien. Fitur alert stock minimum sangat membantu menghindari kekurangan material."',
      name: 'Dewi Lestari',
      role: 'Head of Procurement',
      company: 'PT Megabuild Indonesia',
      initials: 'DL',
    },
    {
      text: '"Sistemnya mudah digunakan dan bisa diakses kapan saja. Tim lapangan dan kantor jadi lebih terhubung dalam satu sistem."',
      name: 'Rudi Hermawan',
      role: 'Logistic Manager',
      company: 'PT Nusantara Infrastruktur',
      initials: 'RH',
    },
  ];

  const handleNextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const handlePrevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-[#1E293B] font-sans antialiased selection:bg-orange-500 selection:text-white transition-colors duration-200">
      {/* Navbar Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/40 bg-[#0B0F19]/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-[#F97316] text-white shadow-md font-bold">
                P
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg leading-none tracking-tight text-white">
                  PRISKILA
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">
                  inventory & logistics
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
              <Link
                href="#"
                className="hover:text-white hover:text-[#F97316] transition-colors relative after:absolute after:bottom-[-29px] after:left-0 after:right-0 after:h-[2px] after:bg-[#F97316] text-white"
              >
                Beranda
              </Link>
              <Link
                href="#fitur"
                className="hover:text-white hover:text-[#F97316] transition-colors"
              >
                Fitur
              </Link>
              <Link
                href="#modul"
                className="hover:text-white hover:text-[#F97316] transition-colors"
              >
                Modul
              </Link>
              <Link
                href="#keunggulan"
                className="hover:text-white hover:text-[#F97316] transition-colors"
              >
                Keunggulan
              </Link>
              <Link
                href="#harga"
                className="hover:text-white hover:text-[#F97316] transition-colors"
              >
                Harga
              </Link>
              <Link
                href="#tentang-kami"
                className="hover:text-white hover:text-[#F97316] transition-colors"
              >
                Tentang Kami
              </Link>
              <Link
                href="#kontak"
                className="hover:text-white hover:text-[#F97316] transition-colors"
              >
                Kontak
              </Link>
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/login">
                <Button
                  variant="secondary"
                  className="bg-transparent border border-slate-700/80 text-white hover:bg-white/10 shadow-none px-5 py-2 text-sm"
                >
                  Login
                </Button>
              </Link>
              <Link href="#cta">
                <Button variant="primary" className="px-5 py-2 text-sm">
                  Request Demo
                </Button>
              </Link>
            </div>

            {/* Hamburger menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg border border-slate-800 text-slate-300 md:hidden hover:bg-slate-900"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-[#0B0F19] px-4 py-6 space-y-4">
          <nav className="flex flex-col space-y-3.5 text-sm font-semibold text-slate-300">
            <Link
              href="#"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-white hover:text-[#F97316] text-white"
            >
              Beranda
            </Link>
            <Link
              href="#fitur"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-white hover:text-[#F97316]"
            >
              Fitur
            </Link>
            <Link
              href="#modul"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-white hover:text-[#F97316]"
            >
              Modul
            </Link>
            <Link
              href="#keunggulan"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-white hover:text-[#F97316]"
            >
              Keunggulan
            </Link>
            <Link
              href="#harga"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-white hover:text-[#F97316]"
            >
              Harga
            </Link>
            <Link
              href="#tentang-kami"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-white hover:text-[#F97316]"
            >
              Tentang Kami
            </Link>
            <Link
              href="#kontak"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-white hover:text-[#F97316]"
            >
              Kontak
            </Link>
          </nav>
          <hr className="border-slate-800" />
          <div className="flex flex-col gap-2">
            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block w-full">
              <Button
                variant="secondary"
                className="w-full border border-slate-700/80 text-white hover:bg-white/10"
              >
                Login
              </Button>
            </Link>
            <Link href="#cta" onClick={() => setMobileMenuOpen(false)} className="block w-full">
              <Button variant="primary" className="w-full">
                Request Demo
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative min-h-[600px] lg:min-h-[700px] flex items-center overflow-hidden border-b border-slate-200/60 dark:border-slate-800/80">
        {/* Full-size warehouse background image with slide transition */}
        <div className="absolute inset-0 w-full h-full z-0">
          {bgImages.map((src, index) => (
            <div
              key={src}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                currentBg === index ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Image
                src={src}
                alt={`PRISKILA Warehouse ${index + 1}`}
                fill
                priority={index === 0}
                className="object-cover"
              />
            </div>
          ))}
          {/* Dark overlay to increase contrast */}
          <div className="absolute inset-0 bg-black/45 dark:bg-black/60 z-10" />
        </div>

        {/* Diagonal and vertical gradient overlays */}
        <div className="absolute inset-0 w-full h-full z-10 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_45%,rgba(255,255,255,0.7)_100%)] dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.97)_45%,rgba(15,23,42,0.8)_100%)] lg:bg-[linear-gradient(115deg,#ffffff_52%,transparent_52.1%)] lg:dark:bg-[linear-gradient(115deg,#0f172a_52%,transparent_52.1%)]" />

        {/* Manual Background Slider Controls */}
        <div className="absolute bottom-6 right-6 z-20 hidden lg:flex items-center gap-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-4 py-2.5 text-white">
          <button
            onClick={() => setCurrentBg((prev) => (prev - 1 + bgImages.length) % bgImages.length)}
            className="p-1 rounded-full hover:bg-white/10 transition-colors"
            title="Previous Background"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-mono select-none">
            0{currentBg + 1} / 0{bgImages.length}
          </span>
          <button
            onClick={() => setCurrentBg((prev) => (prev + 1) % bgImages.length)}
            className="p-1 rounded-full hover:bg-white/10 transition-colors"
            title="Next Background"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Left side text copy */}
        <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full py-16 lg:py-24">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-100/50 dark:bg-orange-950/20 dark:border-orange-900/30 text-xs font-semibold text-[#F97316]">
                <span className="flex h-1.5 w-1.5 rounded-full bg-[#F97316]" />
                Sistem Inventory & Logistik Terintegrasi
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#1E293B] dark:text-slate-50 sm:text-4xl md:text-5xl leading-tight">
                Kelola Inventory Proyek <br />
                Lebih Mudah, Akurat <br />
                dan <span className="text-[#F97316]">Terintegrasi</span>
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg">
                PRISKILA membantu perusahaan mengelola barang, supplier, penerimaan, pemakaian, dan
                stock secara real-time untuk mendukung kelancaran setiap proyek.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href="#cta">
                  <Button variant="primary" className="h-12 px-6 font-semibold shadow-md">
                    <span>Request Demo</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#video">
                  <Button
                    variant="secondary"
                    className="h-12 px-6 font-semibold bg-white border border-slate-200 dark:bg-transparent dark:border-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  >
                    <Play className="h-4 w-4 fill-orange-500 text-orange-500" />
                    <span>Lihat Video</span>
                  </Button>
                </Link>
              </div>

              <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800/40 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[#F97316]" />
                  <span>Real-time Data</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#F97316]" />
                  <span>Aman & Terpercaya</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#F97316]" />
                  <span>Mudah Digunakan</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted Clients Bar */}
      <section className="py-10 bg-white border-y border-slate-100 dark:bg-slate-900/60 dark:border-slate-800/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <p className="text-xs font-semibold text-slate-450 dark:text-slate-500 uppercase tracking-widest">
            Dipercaya oleh perusahaan dari berbagai industri
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-60 grayscale dark:invert">
            <span className="font-bold text-slate-650 tracking-wider">BINAKARYA</span>
            <span className="font-bold text-slate-650 tracking-wider">MEGABUILD</span>
            <span className="font-bold text-slate-650 tracking-wider">NUSANTARA</span>
            <span className="font-bold text-slate-650 tracking-wider">TITAN ENG</span>
            <span className="font-bold text-slate-650 tracking-wider">CAKRA</span>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="fitur" className="py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-[#F97316] uppercase tracking-wider">
              Fitur Unggulan
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#1E293B] dark:text-slate-50 sm:text-3xl lg:text-4xl">
              Semua yang Anda Butuhkan dalam <span className="text-[#F97316]">Satu Sistem</span>
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              PRISKILA didesain khusus untuk mendukung pengelolaan rantai pasok dan pemakaian
              logistik proyek secara mulus dan terkomputasi otomatis.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <Card className="hover:scale-[1.01] hover:shadow-lg transition-all duration-300 border-slate-100 dark:border-slate-800">
              <CardContent className="p-6 space-y-4">
                <div className="p-3 w-fit rounded-xl bg-orange-50 text-[#F97316] dark:bg-orange-950/20">
                  <Box className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-[#1E293B] dark:text-slate-50">
                  Kelola Barang Lebih Mudah
                </h3>
                <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
                  Kelola master barang, kategori, satuan, deskripsi, gambar, hingga penentuan stock
                  minimum secara terstruktur dan komprehensif.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="hover:scale-[1.01] hover:shadow-lg transition-all duration-300 border-slate-100 dark:border-slate-800">
              <CardContent className="p-6 space-y-4">
                <div className="p-3 w-fit rounded-xl bg-orange-50 text-[#F97316] dark:bg-orange-950/20">
                  <Truck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-[#1E293B] dark:text-slate-50">
                  Penerimaan Barang Lebih Cepat
                </h3>
                <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
                  Pencatatan barang masuk dari supplier ke gudang proyek menjadi lebih mudah,
                  otomatis memperbarui stock dan mengkalkulasi harga.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="hover:scale-[1.01] hover:shadow-lg transition-all duration-300 border-slate-100 dark:border-slate-800">
              <CardContent className="p-6 space-y-4">
                <div className="p-3 w-fit rounded-xl bg-orange-50 text-[#F97316] dark:bg-orange-950/20">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-[#1E293B] dark:text-slate-50">
                  Pemakaian Barang Terkontrol
                </h3>
                <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
                  Pengambilan dan pemakaian barang untuk proyek harus melalui sistem permohonan
                  dengan workflow persetujuan (approval) bertingkat.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="hover:scale-[1.01] hover:shadow-lg transition-all duration-300 border-slate-100 dark:border-slate-800">
              <CardContent className="p-6 space-y-4">
                <div className="p-3 w-fit rounded-xl bg-orange-50 text-[#F97316] dark:bg-orange-950/20">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-[#1E293B] dark:text-slate-50">
                  Laporan Lengkap dan Akurat
                </h3>
                <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
                  Laporan stok saat ini, riwayat mutasi barang masuk/keluar, dan kartu stok digital
                  yang selalu mutakhir untuk audit andal.
                </p>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="hover:scale-[1.01] hover:shadow-lg transition-all duration-300 border-slate-100 dark:border-slate-800">
              <CardContent className="p-6 space-y-4">
                <div className="p-3 w-fit rounded-xl bg-orange-50 text-[#F97316] dark:bg-orange-950/20">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-[#1E293B] dark:text-slate-50">
                  Aman & Terpercaya
                </h3>
                <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
                  Pembatasan otorisasi peran (Admin, Manager, Staff) untuk menjaga keamanan data dan
                  riwayat penanggung jawab transaksi.
                </p>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="hover:scale-[1.01] hover:shadow-lg transition-all duration-300 border-slate-100 dark:border-slate-800">
              <CardContent className="p-6 space-y-4">
                <div className="p-3 w-fit rounded-xl bg-orange-50 text-[#F97316] dark:bg-orange-950/20">
                  <Smartphone className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-[#1E293B] dark:text-slate-50">
                  Akses Kapan Saja di Mana Saja
                </h3>
                <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
                  Didesain responsif. Akses PRISKILA dengan nyaman dari perangkat laptop kantor
                  maupun handphone tim lapangan di lokasi proyek.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Dashboard Showcase Details Section */}
      <section
        id="modul"
        className="py-20 bg-white border-y border-slate-100 dark:bg-slate-900/60 dark:border-slate-800/80"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Mockup Showcase */}
            <div className="lg:col-span-7 flex justify-center order-last lg:order-first">
              <div className="relative w-full max-w-[500px]">
                {/* Desktop browser mockup */}
                <div className="rounded-xl border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 shadow-xl overflow-hidden w-[85%]">
                  <div className="h-8 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 px-3 flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  </div>
                  <div className="p-3 bg-slate-50/50 dark:bg-slate-950/30 space-y-3">
                    <div className="h-4.5 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-md" />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg p-2 space-y-1">
                        <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-800 rounded" />
                        <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-850 rounded" />
                      </div>
                      <div className="h-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg p-2 space-y-1">
                        <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-800 rounded" />
                        <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-850 rounded" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile overlapping mockup */}
                <div className="absolute -bottom-8 -right-4 w-44 rounded-2xl border-4 border-slate-900 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden aspect-[9/18]">
                  <div className="h-4 bg-slate-950 flex items-center justify-center">
                    <div className="w-14 h-3 bg-black rounded-b-md" />
                  </div>
                  <div className="p-2 space-y-2.5">
                    <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-20 bg-slate-50 dark:bg-slate-950 rounded border border-slate-100 dark:border-slate-850" />
                    <div className="h-8 bg-slate-50 dark:bg-slate-950 rounded" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Copy */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-bold text-[#F97316] uppercase tracking-wider">
                Dashboard Real-Time
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight text-[#1E293B] dark:text-slate-50 sm:text-3xl lg:text-4xl">
                Pantau Semua Aktivitas Proyek dalam <span className="text-[#F97316]">Sekejap</span>
              </h2>
              <p className="text-sm text-slate-550 dark:text-slate-400 leading-relaxed">
                Dashboard interaktif memberikan Anda gambaran menyeluruh tentang kondisi inventory,
                arus barang masuk dan keluar, serta peringatan stock kritis secara real-time.
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-[#F97316] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                      Ringkasan data penting secara real-time
                    </h4>
                    <p className="text-xs text-slate-500">
                      Melihat langsung total aset proyek, pengiriman barang, dan stock ledger.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-[#F97316] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                      Grafik interaktif dan informatif
                    </h4>
                    <p className="text-xs text-slate-500">
                      Visualisasi data arus barang masuk dan pemakaian bulanan secara dinamis.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-[#F97316] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                      Peringatan stock minimum otomatis
                    </h4>
                    <p className="text-xs text-slate-500">
                      Pemberitahuan warna merah/kuning jika ada material kritis di bawah batas aman.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link href="/login">
                  <Button variant="primary" className="h-12 px-6 shadow-md">
                    <span>Coba Dashboard</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Bar Section */}
      <section id="keunggulan" className="py-12 bg-[#1E293B] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-5 text-center">
            <div className="space-y-1">
              <div className="text-3xl font-extrabold text-[#F97316]">120+</div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Pengguna Aktif</p>
            </div>

            <div className="space-y-1">
              <div className="text-3xl font-extrabold text-[#F97316]">50+</div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Perusahaan Mitra</p>
            </div>

            <div className="space-y-1 col-span-2 md:col-span-1">
              <div className="text-3xl font-extrabold text-[#F97316]">300+</div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Proyek Sukses</p>
            </div>

            <div className="space-y-1">
              <div className="text-3xl font-extrabold text-[#F97316]">10.000+</div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Item Barang</p>
            </div>

            <div className="space-y-1">
              <div className="text-3xl font-extrabold text-[#F97316]">99.9%</div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Uptime Sistem</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Slider */}
      <section id="harga" className="py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-[#F97316] uppercase tracking-wider">
              Testimoni
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#1E293B] dark:text-slate-50 sm:text-3xl">
              Apa Kata Mereka tentang PRISKILA?
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Ulasan langsung dari para profesional pengelola logistik dan logistik proyek di
              Indonesia.
            </p>
          </div>

          {/* Testimonial slider UI */}
          <div className="flex flex-col items-center justify-center max-w-3xl mx-auto">
            <Card className="w-full bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-lg relative min-h-[220px] flex items-center">
              <CardContent className="p-8 sm:p-10 flex flex-col justify-between h-full w-full">
                <p className="text-base sm:text-lg italic text-slate-700 dark:text-slate-350 leading-relaxed">
                  {testimonials[currentTestimonial].text}
                </p>

                <div className="flex items-center gap-4 mt-6 pt-6 border-t border-slate-50 dark:border-slate-800">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-orange-50 border border-orange-100/50 text-[#F97316] font-bold select-none text-base">
                    {testimonials[currentTestimonial].initials}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-50 text-sm">
                      {testimonials[currentTestimonial].name}
                    </h4>
                    <p className="text-xs text-slate-450 dark:text-slate-500">
                      {testimonials[currentTestimonial].role} •{' '}
                      {testimonials[currentTestimonial].company}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Nav Arrows & Dots */}
            <div className="flex items-center justify-between w-full mt-6 px-4">
              <div className="flex items-center gap-1.5">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentTestimonial(i)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      currentTestimonial === i
                        ? 'w-6 bg-[#F97316]'
                        : 'w-2.5 bg-slate-300 dark:bg-slate-700'
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevTestimonial}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={handleNextTestimonial}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="py-12 bg-white dark:bg-slate-950/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 lg:p-16 rounded-3xl bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="space-y-3 z-10">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                Siap Mengoptimalkan Pengelolaan Inventory Proyek Anda?
              </h2>
              <p className="text-orange-50 text-sm max-w-2xl">
                Bergabunglah dengan ratusan perusahaan konstruksi dan manufaktur yang telah
                mempercayakan pengelolaan inventory-nya pada PRISKILA.
              </p>
            </div>
            <div className="z-10 shrink-0">
              <Link href="https://wa.me/628123456789" target="_blank" rel="noopener noreferrer">
                <Button className="bg-white hover:bg-slate-50 text-[#F97316] font-bold h-13 px-8 shadow-md focus:ring-white">
                  <span>Request Demo Sekarang</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            {/* Background design accents */}
            <div className="absolute right-0 bottom-0 top-0 opacity-15 flex items-center justify-center w-1/3 pointer-events-none">
              <Layers className="h-56 w-56" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer
        id="tentang-kami"
        className="bg-[#1E293B] text-slate-350 py-16 dark:bg-slate-950 dark:border-t dark:border-slate-900"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 gap-12 md:grid-cols-5 border-b border-slate-800/80 pb-12 mb-8">
          {/* Logo & Description */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-[#F97316] text-white font-bold shrink-0">
                P
              </div>
              <span className="font-bold text-lg text-white leading-none">PRISKILA</span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Solusi inventory, stock, & logistik terintegrasi khusus untuk industri konstruksi,
              ketenagalistrikan, dan operasional proyek multi-gudang.
            </p>
            <div className="flex items-center gap-3.5 pt-2">
              <Link href="#" className="hover:text-white transition-colors" title="Facebook">
                <svg className="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
                </svg>
              </Link>
              <Link href="#" className="hover:text-white transition-colors" title="Twitter / X">
                <svg className="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </Link>
              <Link href="#" className="hover:text-white transition-colors" title="LinkedIn">
                <svg className="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </Link>
              <Link href="#" className="hover:text-white transition-colors" title="YouTube">
                <svg className="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.52 3.5 12 3.5 12 3.5s-7.52 0-9.388.555A3.002 3.002 0 0 0 .502 6.163C0 8.07 0 12 0 12s0 3.93.502 5.837a3.003 3.003 0 0 0 2.11 2.108C4.48 20.5 12 20.5 12 20.5s7.52 0 9.388-.555a3.002 3.002 0 0 0 2.11-2.108C24 15.93 24 12 24 12s0-3.93-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Links Col 1 - Produk */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Produk</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="#" className="hover:text-white">
                  Fitur Utama
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Modul Transaksi
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Harga Berlangganan
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Catatan Rilis
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Col 2 - Perusahaan */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Perusahaan</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="#" className="hover:text-white">
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Karir (We&apos;re Hiring)
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Artikel & Berita
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Hubungi Kami
                </Link>
              </li>
            </ul>
          </div>

          {/* Links Col 3 - Bantuan & Newsletter */}
          <div id="kontak" className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Newsletter</h4>
            <p className="text-xs text-slate-400 leading-normal">
              Dapatkan informasi pembaruan fitur terbaru langsung di email Anda.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
              <input
                type="email"
                placeholder="Alamat email Anda"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#F97316] font-medium"
              />
              <button
                type="submit"
                className="p-2 bg-[#F97316] text-white rounded-xl hover:bg-orange-650 shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} PRISKILA. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white">
              Pusat Bantuan
            </Link>
            <Link href="#" className="hover:text-white">
              Kebijakan Privasi
            </Link>
            <Link href="#" className="hover:text-white">
              Syarat & Ketentuan
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
