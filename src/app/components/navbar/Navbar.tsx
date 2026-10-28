'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useContext, useEffect, useCallback, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars,
  faXmark,
  faChevronDown,
  faChevronUp,
  faSearch,
  faPhone,
  faLocationDot,
  faArrowRight,

} from '@fortawesome/free-solid-svg-icons';
import { useSession, signOut } from 'next-auth/react';
import { AuthContext } from '@/app/context/AuthContext';
import { faInstagram, faLinkedin, faWhatsapp } from '@fortawesome/free-brands-svg-icons';


// ─────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────
interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  scrolled: boolean;
  active?: boolean;
  onHover?: () => void;
  onLeave?: () => void;
}

interface MobileNavLinkProps {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  index?: number;
}

interface SocialLink {
  icon: any;
  href: string;
  label: string;
}

// ─────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function Navbar() {
  const { data: session } = useSession();
  const { userRole, setUserRole, userName, userEmail } = useContext(AuthContext);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDesktopCategoriesOpen, setIsDesktopCategoriesOpen] = useState(false);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);
  const [categories, setCategories] = useState<{ name: string; slug: string; count?: number }[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const watsapp = 5491132538837
  const mensaje = 'Hola,%20me%20interesa%20consultar%20por%20una%20propiedad'


  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setIsMounted(true);
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  }, []);

  const toggleDarkMode = useCallback(() => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);



  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
      if (isDesktopCategoriesOpen) setIsDesktopCategoriesOpen(false);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDesktopCategoriesOpen]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.body.style.overflow = isMenuOpen ? 'hidden' : '';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isMenuOpen]);

  const handleLogout = useCallback(() => {
    signOut({ callbackUrl: '/' });
    localStorage.removeItem('token');
    localStorage.removeItem('purchaseData');
    localStorage.removeItem('cart');
    setUserRole('guest');
  }, [setUserRole]);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
    setMobileCategoryOpen(false);
    setIsDesktopCategoriesOpen(false);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  const role = session?.user?.role || userRole;
  const name = session?.user?.name || userName;
  const email = session?.user?.email || userEmail;
  const image = session?.user?.image;



  // 🎨 Paleta Premium - Gradientes sofisticados
  const gradients = {
    primary: 'from-indigo-500 via-purple-500 to-pink-500',
    accent: 'from-cyan-400 via-blue-500 to-violet-500',
    subtle: 'from-slate-900 via-slate-900 to-slate-900',
    glow: 'from-violet-500/20 via-fuchsia-500/20 to-cyan-500/20',
  };

  const socialLinks: SocialLink[] = [
    { icon: faInstagram, href: 'https://instagram.com', label: 'Instagram' },
    { icon: faLinkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: faWhatsapp, href: `https://wa.me/${watsapp}?text=${mensaje}`, label: 'WhatsApp' },
  ];

  if (!isMounted) return null;


  return (
    <>
      {/* ═══════════════════════════════════════════════════════
          NAVBAR PRINCIPAL - ULTRA PREMIUM
          ═══════════════════════════════════════════════════════ */}
      <nav
        className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${scrolled
          ? 'bg-slate-900/80 backdrop-blur-2xl shadow-2xl shadow-purple-900/20 border-b border-white/5'
          : 'bg-gradient-to-b from-slate-900/70 via-slate-900/30 to-transparent'
          }`}
      >
        {/* ✨ Glow ambiental sutil */}
        <div
          className={`absolute inset-0 bg-gradient-to-r ${gradients.glow} opacity-0 transition-opacity duration-700 ${scrolled ? 'opacity-100' : 'opacity-0'
            }`}
          style={{ filter: 'blur(150px)' }}
          aria-hidden="true"
        />

        {/* ───────── MAIN NAV ───────── */}
        <div className={`max-w-7xl mx-auto px-4 lg:px-8 transition-all duration-500 ${scrolled ? 'py-3' : 'py-6'}`}>
          <div className="flex items-center justify-between">

            {/* ✨ LOGO CON EFECTO HOVER */}
            <div className="order-1 lg:order-2">
              <Link href="/" onClick={closeMenu} className="block group">
                <div className="flex flex-col items-center lg:items-start">
                  <div className="relative">
                    {/* Glow detrás del logo */}
                    <span className="absolute inset-0 bg-gradient-to-r from-cyan-400/30 via-purple-500/30 to-pink-500/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <Image
                      src="/Aula_Virtual__Aprender_es_Posible-removebg-preview.png"
                      alt="Aula Virtual"
                      width={scrolled ? 90 : 180}
                      height={scrolled ? 40 : 130}
                      priority
                      className="relative transition-all duration-500 drop-shadow-lg group-hover:drop-shadow-2xl"
                    />
                  </div>
                  <span className={`text-[15px] tracking-[0.4em] uppercase mt-0 font-light transition-colors duration-500 mt-0 ${scrolled ? 'text-slate-500' : 'text-slate-400'
                    } group-hover:text-purple-200`}>
                    Aula Virtual
                  </span>
                </div>
              </Link>
            </div>

            {/* ───────── DESKTOP NAV ───────── */}
            <div className="order-3 hidden lg:flex items-center space-x-1">
              <NavLink
                href="/"
                scrolled={scrolled}
                active={hoveredLink === 'home'}
                onHover={() => setHoveredLink('home')}
                onLeave={() => setHoveredLink(null)}
              >
                Inicio
              </NavLink>


              <NavLink href="/contact" scrolled={scrolled}>Contacto</NavLink>
              <NavLink href="/about" scrolled={scrolled}>Nosotros</NavLink>
            </div>

            {/* ───────── RIGHT ACTIONS ───────── */}
            <div className="order-2 lg:order-4 flex items-center space-x-3">



              {/* Auth - Desktop con botones premium */}
              {session ? (
                <div className="hidden lg:flex items-center space-x-4">
                  <Link href="/profile" className={`group flex items-center space-x-2.5 transition-all duration-300 ${scrolled ? 'text-slate-300' : 'text-white'
                    } hover:text-white`}>
                    <div className={`relative w-8 h-8 rounded-full bg-gradient-to-br ${gradients.accent} flex items-center justify-center text-white text-xs font-medium shadow-lg shadow-purple-900/40 group-hover:shadow-purple-900/60 transition-shadow duration-300`}>
                      <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {image ? (<img src={image} alt="Profile" className="w-8 h-8 rounded-full" />) : (name?.charAt(0) || 'U')}

                    </div>
                    <div className='flex flex-col'>
                      <span
                        className="text-xs font-light">Mi perfil</span>

                      <div>
                        <span className="font-medium tracking-wide">{name?.split(' ')[0]}</span>
                      </div>
                    </div>
                  </Link>

                  {(role === 'admin' || role === 'superadmin' || role === 'profesor' || role === 'alumno') && (
                    <Link
                      href="/gestion"
                      className={`group relative text-[10px] px-4 py-2 rounded-xl font-medium tracking-wide uppercase transition-all duration-500 overflow-hidden ${scrolled ? 'bg-gradient-to-r from-indigo-600/90 via-purple-600/90 to-pink-600/90' : `bg-gradient-to-r ${gradients.primary}`
                        } text-white hover:shadow-xl hover:shadow-purple-900/40`}
                    >
                      <span className="relative z-10">Panel</span>
                      <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (typeof handleLogout === "function") {
                        handleLogout();
                      }
                    }}
                    className={`
    relative z-50 pointer-events-auto cursor-pointer
    text-[10px] tracking-[0.25em] uppercase transition-all duration-300 
    ${scrolled ? 'text-slate-500 hover:text-purple-400' : 'text-slate-400 hover:text-purple-300'}
    hover:translate-x-0.5
  `}
                  >
                    Salir
                  </button>
                </div>
              ) : (
                <div className="hidden lg:flex items-center space-x-3">
                  {/* Botón Ingresar - Estilo minimalista premium */}
                  <Link
                    href="/login"
                    className={`group relative text-[11px] tracking-[0.25em] uppercase font-medium py-2 px-1 transition-all duration-300 ${scrolled ? 'text-slate-300' : 'text-white'
                      } hover:text-white`}
                  >
                    <span className="relative z-10">Ingresar</span>
                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 transition-all duration-500 group-hover:w-full" />
                  </Link>

                  {/* Botón Registrarse - Estilo premium con gradiente animado */}
                  <Link
                    href="/register"
                    className="group relative text-[10px] px-5 py-2.5 rounded-xl tracking-[0.18em] uppercase font-medium overflow-hidden"
                  >
                    {/* Gradiente base */}
                    <span className={`absolute inset-0 bg-gradient-to-r ${gradients.primary} transition-opacity duration-500`} />
                    {/* Shine effect */}
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                    {/* Border glow */}
                    <span className="absolute inset-0 rounded-xl border border-white/20 group-hover:border-white/40 transition-colors duration-300" />

                    <span className="relative z-10 text-white drop-shadow-sm">Registrarse</span>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button - Animado */}
              <button
                type="button"
                onClick={toggleMobileMenu}
                className={`lg:hidden group relative p-2.5 rounded-xl transition-all duration-300 ${scrolled ? 'text-white' : 'text-white'
                  } hover:bg-white/10`}
                aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={isMenuOpen}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-purple-500/20 to-pink-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                <FontAwesomeIcon
                  icon={isMenuOpen ? faXmark : faBars}
                  className="relative text-2xl transition-transform duration-300 group-hover:scale-110"
                />
              </button>
            </div>
          </div>
        </div>

        {/* Línea inferior animada */}
        <div className={`h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent transition-all duration-700 ${scrolled ? 'opacity-100' : 'opacity-0'
          }`} />
      </nav>

      {/* ═══════════════════════════════════════════════════════
          MOBILE MENU - ULTRA PREMIUM
          ═══════════════════════════════════════════════════════ */}
      {isMenuOpen && (
        <>
          {/* Backdrop con animación de entrada */}
          <div
            className="fixed inset-0 z-40 bg-slate-900/90 backdrop-blur-xl lg:hidden animate-fadeIn"
            onClick={closeMenu}
          >
            {/* Orbes de gradiente animados */}
            <div className="absolute top-1/4 -left-16 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 -right-16 w-64 h-64 bg-cyan-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          {/* Panel del menú con animación slide + stagger */}
          <div
            className="fixed top-0 right-0 h-full w-full max-w-sm z-50 bg-slate-900/95 backdrop-blur-2xl shadow-2xl lg:hidden animate-slideInRight"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">

              {/* Header elegante */}
              <div className="flex justify-between items-center p-7 border-b border-white/10">
                <span className="text-[10px] tracking-[0.35em] uppercase text-slate-500">Menú</span>
                <button
                  onClick={closeMenu}
                  className="group p-2.5 hover:bg-white/10 rounded-xl transition-all duration-300"
                  aria-label="Cerrar menú"
                >
                  <FontAwesomeIcon icon={faXmark} className="text-xl text-slate-400 group-hover:text-white group-hover:rotate-90 transition-all duration-300" />
                </button>
              </div>


              {/* Navigation Links con stagger animation */}
              <nav className="flex-1 overflow-y-auto py-4 px-6 space-y-1">
                <MobileNavLink href="/" onClick={closeMenu} index={0}>Inicio</MobileNavLink>



                <MobileNavLink href="/contact" onClick={closeMenu} index={1}>Contacto</MobileNavLink>
                <MobileNavLink href="/about" onClick={closeMenu} index={2}>Nosotros</MobileNavLink>

                {/* Auth Mobile */}
                {session ? (
                  <div className="pt-8 mt-6 border-t border-white/10">
                    <Link
                      href="/profile"
                      onClick={closeMenu}
                      className="group flex items-center space-x-4 py-4 px-4 text-slate-200 hover:text-white hover:bg-white/5 transition-all duration-300 rounded-xl"
                    >
                      <div className={`relative w-11 h-11 rounded-full bg-gradient-to-br ${gradients.accent} flex items-center justify-center text-white text-sm font-medium shadow-lg`}>
                        <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        {image ? (<img src={image} alt="Profile" className="w-8 h-8 rounded-full" />) : (name?.charAt(0) || 'U')}
                      </div>
                      <div>
                        <p className="font-medium">{name || email}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{role}</p>
                      </div>
                    </Link>

                    {(role === 'admin' || role === 'superadmin'|| role === 'profesor '|| role === 'alumno') && (
                      <Link
                        href="/gestion"
                        onClick={closeMenu}
                        className={`group block py-4 px-4 text-sm font-medium rounded-xl transition-all duration-500 bg-gradient-to-r ${gradients.primary} text-white mt-3 relative overflow-hidden`}
                      >
                        <span className="relative z-10">Panel de Gestión</span>
                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      </Link>
                    )}

                    <button
                      onClick={() => { closeMenu(); handleLogout(); }}
                      className="w-full text-left py-4 px-4 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300 rounded-xl font-medium mt-3 group"
                    >
                      <span className="flex items-center space-x-2">
                        <span>Cerrar Sesión</span>
                        <FontAwesomeIcon icon={faArrowRight} className="text-xs opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-8 mt-6 border-t border-white/10 space-y-3">
                    <Link
                      href="/login"
                      onClick={closeMenu}
                      className="group block w-full py-4 px-6 bg-gradient-to-r from-slate-800 to-slate-700 text-white text-center tracking-[0.2em] uppercase text-[11px] font-medium rounded-xl transition-all duration-500 hover:from-slate-700 hover:to-slate-600 relative overflow-hidden"
                    >
                      <span className="relative z-10">Iniciar Sesión</span>
                      <span className="absolute inset-0 rounded-xl border border-white/10 group-hover:border-purple-500/30 transition-colors duration-300" />
                    </Link>
                    <Link
                      href="/register"
                      onClick={closeMenu}
                      className={`group relative block w-full py-4 px-6 bg-gradient-to-r ${gradients.primary} text-white text-center tracking-[0.2em] uppercase text-[11px] font-medium rounded-xl transition-all duration-500 overflow-hidden`}
                    >
                      <span className="relative z-10">Crear Cuenta</span>
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    </Link>
                  </div>
                )}
              </nav>

              {/* Footer elegante */}
              <div className="p-7 border-t border-white/10 bg-slate-900/30">
                <div className="flex justify-center space-x-6">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative text-slate-500 hover:text-white transition-all duration-300"
                      aria-label={social.label}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-purple-500/20 to-pink-500/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <FontAwesomeIcon icon={social.icon} className="relative text-lg group-hover:scale-110 transition-transform duration-300" />
                    </a>
                  ))}
                </div>
                <p className="text-center text-[10px] text-slate-600 mt-5 tracking-[0.3em] uppercase">
                  en desarrollo · © {new Date().getFullYear()}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// NavLink - Efectos Premium
// ─────────────────────────────────────────────────────────────
function NavLink({ href, children, scrolled, active, onHover, onLeave }: NavLinkProps) {
  return (
    <Link
      href={href}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`group relative text-[11px] tracking-[0.3em] uppercase font-medium py-3 px-2 transition-all duration-300 ${scrolled ? 'text-slate-300' : 'text-white'
        } hover:text-white`}
    >
      {children}

      {/* Underline animado con gradiente */}
      <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-px bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${active ? 'w-full opacity-100' : 'w-0 opacity-0 group-hover:w-full group-hover:opacity-100'
        }`} />

      {/* Glow sutil debajo */}
      <span className="absolute inset-x-0 -bottom-1 h-px bg-gradient-to-r from-cyan-400/30 via-purple-500/30 to-pink-500/30 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
// MobileNavLink - Con stagger animation
// ─────────────────────────────────────────────────────────────
function MobileNavLink({ href, children, onClick, index = 0 }: MobileNavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group block py-4 px-4 text-slate-300 hover:text-white transition-all duration-300 rounded-xl text-sm tracking-[0.25em] uppercase font-medium relative overflow-hidden animate-fadeInUp"
      style={{ animationDelay: `${index * 50 + 100}ms`, animationFillMode: 'both' }}
    >
      {/* Indicador de gradiente lateral */}
      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-cyan-400 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-r-full blur-[1px]" />
      <span className="pl-5 relative flex items-center justify-between">
        {children}
        <FontAwesomeIcon icon={faArrowRight} className="text-xs text-slate-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
      </span>
    </Link>
  );
}