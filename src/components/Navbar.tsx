import React from 'react';
import {
  BookOpen,
  LogOut,
  Shield,
  GraduationCap,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';

interface NavbarProps {
  onOpenNewBook?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenNewBook }) => {
  const { userSession, logout, stats, resetCatalogToDefault } = useLibrary();
  const isManager = userSession?.role === 'librarian';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
            <BookOpen className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900">
              BiblioTech
            </span>
            <span className="hidden sm:inline-block text-[11px] font-medium text-slate-500 ml-2 border-l border-slate-200 pl-2">
              {isManager ? 'Espace Gestionnaire' : 'Catalogue Étudiant'}
            </span>
          </div>
        </div>

        {/* Center / Stats (desktop only) */}
        <div className="hidden md:flex items-center gap-4 text-xs font-medium text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-900" />
            <span>Fonds : <strong>{stats.totalBooks}</strong> titres</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Disponibles : <strong className="text-emerald-700">{stats.availableCount}</strong></span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Indisponibles : <strong className="text-rose-700">{stats.unavailableCount}</strong></span>
          </span>
        </div>

        {/* Right side: User Profile & Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Manager Action: Add Book */}
          {isManager && onOpenNewBook && (
            <button
              onClick={onOpenNewBook}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-amber-300" />
              <span>Nouveau livre</span>
            </button>
          )}

          {/* User Badge */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                isManager ? 'bg-slate-900' : 'bg-amber-600'
              }`}
            >
              {isManager ? (
                <Shield className="w-3.5 h-3.5 text-amber-300" />
              ) : (
                <GraduationCap className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="text-left leading-tight hidden xs:block">
              <p className="text-xs font-bold text-slate-900 truncate max-w-[130px]">
                {userSession?.name || 'Utilisateur'}
              </p>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                {isManager ? 'Gestionnaire' : 'Étudiant'}
              </p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="p-2 sm:px-3 sm:py-1.5 text-xs font-semibold text-slate-700 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Se déconnecter"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </div>
    </header>
  );
};
