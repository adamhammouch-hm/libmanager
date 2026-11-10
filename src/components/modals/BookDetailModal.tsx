import React, { useState } from 'react';
import {
  X,
  BookOpen,
  MapPin,
  Calendar,
  Layers,
  FileText,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { Book } from '../../types';

interface BookDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string | null;
  isManager?: boolean;
  onEdit: (book: Book) => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  isOpen,
  onClose,
  bookId,
  isManager = false,
  onEdit,
}) => {
  const { books, deleteBook, toggleBookAvailability } = useLibrary();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !bookId) return null;

  const book = books.find(b => b.id === bookId);
  if (!book) return null;

  const isAvailable = book.status === 'Disponible';

  const handleDelete = () => {
    deleteBook(book.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Cover / Header Section */}
        <div
          className={`p-5 sm:p-6 relative overflow-hidden bg-gradient-to-br ${book.coverColor} text-white min-h-[170px] sm:min-h-[190px] flex flex-col justify-between`}
        >
          {book.coverImage && (
            <>
              <img
                src={book.coverImage}
                alt={book.title}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover"
                onError={e => (e.currentTarget.style.display = 'none')}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-slate-950/30 pointer-events-none" />
            </>
          )}

          <div className="relative z-10 flex items-start justify-between gap-3">
            <div>
              <span className="text-xs uppercase tracking-widest text-amber-300 font-bold drop-shadow-sm">
                {book.category}
              </span>
              <h2 className="text-lg sm:text-2xl font-bold mt-1 text-white leading-tight drop-shadow-sm">
                {book.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 mt-1 font-medium drop-shadow-sm">
                par {book.author}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1.5 bg-black/40 hover:bg-black/60 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-white/90 font-mono relative z-10 drop-shadow-sm">
            <span className="bg-black/40 px-2 py-0.5 rounded">{book.year}</span>
            <span aria-hidden="true">·</span>
            <span>{book.pages} pages</span>
            <span aria-hidden="true">·</span>
            <span>{book.publisher}</span>
            <span aria-hidden="true">·</span>
            <span>{book.language}</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 flex-1">
          {/* Availability & Location Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Disponibilité Status */}
            <div
              className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                isAvailable
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50/80 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isAvailable ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                  }`}
                >
                  {isAvailable ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider block opacity-75">
                    Disponibilité
                  </span>
                  <p className="text-sm sm:text-base font-bold">
                    {book.status}
                  </p>
                </div>
              </div>

              {/* Manager quick toggle directly inside availability card */}
              {isManager && (
                <button
                  type="button"
                  onClick={() => toggleBookAvailability(book.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-xs ${
                    isAvailable
                      ? 'bg-rose-100 hover:bg-rose-200 text-rose-800'
                      : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                  }`}
                >
                  {isAvailable ? 'Rendre Indisponible' : 'Rendre Disponible'}
                </button>
              )}
            </div>

            {/* Emplacement / Location */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                  Emplacement physique
                </span>
                <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                  {book.location}
                </p>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5 truncate">
                  ISBN: {book.isbn}
                </p>
              </div>
            </div>
          </div>

          {/* Description / Synopsis */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Présentation & Résumé
            </h4>
            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 text-xs sm:text-sm text-slate-700 leading-relaxed">
              {book.description || 'Aucune description détaillée n\'a été renseignée pour cet ouvrage.'}
            </div>
          </div>

          {/* Manager Action Buttons */}
          {isManager && (
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEdit(book)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                  <span>Modifier les informations</span>
                </button>
              </div>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Supprimer l'ouvrage</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-rose-50 p-1.5 rounded-xl border border-rose-200">
                  <span className="text-xs text-rose-800 font-medium px-2">Confirmer la suppression ?</span>
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Oui, supprimer
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Student Notice (No borrowing or modifying) */}
          {!isManager && (
            <div className="pt-3 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                Ouvrage consultable dans les locaux de la bibliothèque universitaire.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
