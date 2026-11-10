import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  LayoutGrid,
  List,
  BookOpen,
  MapPin,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Book, BookCategory } from '../types';

interface CatalogViewProps {
  isManager?: boolean;
  onOpenNewBook: () => void;
  onEditBook: (book: Book) => void;
  onSelectBook: (bookId: string) => void;
}

const ALL_CATEGORIES: Array<'Toutes' | BookCategory> = [
  'Toutes',
  'Littérature classique',
  'Science-fiction & Fantasy',
  'Histoire & Géographie',
  'Philosophie & Essais',
  'Bande Dessinée & Manga',
  'Sciences & Techniques',
  'Jeunesse & Contes',
  'Arts & Culture',
  'Développement personnel',
];

export const CatalogView: React.FC<CatalogViewProps> = ({
  isManager = false,
  onOpenNewBook,
  onEditBook,
  onSelectBook,
}) => {
  const { books, deleteBook, toggleBookAvailability } = useLibrary();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'Toutes' | BookCategory>('Toutes');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'unavailable'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'title' | 'author' | 'year'>('title');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Deletion inline confirm
  const [deletingBookId, setDeletingBookId] = useState<string | null>(null);

  // Active filters count for badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'Toutes') count++;
    if (availabilityFilter !== 'all') count++;
    if (sortBy !== 'title') count++;
    return count;
  }, [selectedCategory, availabilityFilter, sortBy]);

  // Filtered books
  const filteredBooks = useMemo(() => {
    return books
      .filter(b => {
        const query = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !query ||
          b.title.toLowerCase().includes(query) ||
          b.author.toLowerCase().includes(query) ||
          b.isbn.toLowerCase().includes(query) ||
          b.category.toLowerCase().includes(query) ||
          b.location.toLowerCase().includes(query);

        const matchesCategory =
          selectedCategory === 'Toutes' || b.category === selectedCategory;

        const isAvailable = b.status === 'Disponible';
        const matchesAvailability =
          availabilityFilter === 'all' ||
          (availabilityFilter === 'available' && isAvailable) ||
          (availabilityFilter === 'unavailable' && !isAvailable);

        return matchesSearch && matchesCategory && matchesAvailability;
      })
      .sort((a, b) => {
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'author') return a.author.localeCompare(b.author);
        if (sortBy === 'year') return b.year - a.year;
        return 0;
      });
  }, [books, searchQuery, selectedCategory, availabilityFilter, sortBy]);

  return (
    <div className="space-y-4 sm:space-y-6 pb-12">
      {/* Top Bar: Search & Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-3 sm:p-4 sticky top-16 z-20 backdrop-blur-md bg-white/95">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher par titre, auteur ou ISBN..."
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                title="Effacer la recherche"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Toggle Filters Drawer */}
            <button
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                isFiltersOpen || activeFiltersCount > 0
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filtres</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* View Mode (Grid vs Table) */}
            <div className="hidden sm:flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Affichage en cartes"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Affichage en liste"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Manager: Add Book Button */}
            {isManager && (
              <button
                onClick={onOpenNewBook}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-sm cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 text-amber-300" />
                <span>Ajouter un livre</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters Drawer */}
        {isFiltersOpen && (
          <div className="pt-3.5 mt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Category filter */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Catégorie
              </label>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white"
              >
                {ALL_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'Toutes' ? 'Toutes les catégories' : cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Availability filter */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Disponibilité
              </label>
              <select
                value={availabilityFilter}
                onChange={e => setAvailabilityFilter(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white"
              >
                <option value="all">Tous les états</option>
                <option value="available">Disponible uniquement</option>
                <option value="unavailable">Indisponible uniquement</option>
              </select>
            </div>

            {/* Sort order */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Trier par
              </label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white"
              >
                <option value="title">Titre (A-Z)</option>
                <option value="author">Auteur (A-Z)</option>
                <option value="year">Année de parution</option>
              </select>
            </div>

            {/* Reset button inside filter drawer */}
            {activeFiltersCount > 0 && (
              <div className="sm:col-span-3 pt-1 flex justify-end">
                <button
                  onClick={() => {
                    setSelectedCategory('Toutes');
                    setAvailabilityFilter('all');
                    setSortBy('title');
                  }}
                  className="text-xs text-rose-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Réinitialiser les filtres</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Catalog Counts */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          <strong className="font-bold text-slate-800">{filteredBooks.length}</strong> ouvrage{filteredBooks.length > 1 ? 's' : ''}
          {searchQuery ? ` trouvé${filteredBooks.length > 1 ? 's' : ''} pour « ${searchQuery} »` : ''}
          {selectedCategory !== 'Toutes' ? ` · ${selectedCategory}` : ''}
          {availabilityFilter !== 'all' ? ` · ${availabilityFilter === 'available' ? 'Disponibles' : 'Indisponibles'}` : ''}
        </span>
        <span className="font-mono text-[11px] text-slate-400">
          Total bibliothèque : {books.length}
        </span>
      </div>

      {/* Empty State */}
      {filteredBooks.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 shadow-xs">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">Aucun ouvrage trouvé</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Aucun livre ne correspond à vos critères. Essayez d'ajuster votre recherche ou vos filtres.
          </p>
          {(searchQuery || activeFiltersCount > 0) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Toutes');
                setAvailabilityFilter('all');
              }}
              className="mt-4 px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Effacer la recherche et les filtres
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* ================= GRID VIEW ================= */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBooks.map(book => {
            const isAvailable = book.status === 'Disponible';
            const isDeleting = deletingBookId === book.id;

            return (
              <div
                key={book.id}
                className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all duration-200"
              >
                {/* Book Header / Cover */}
                <div
                  onClick={() => onSelectBook(book.id)}
                  className={`h-44 relative overflow-hidden bg-gradient-to-br ${book.coverColor} p-3.5 flex flex-col justify-between text-white cursor-pointer group`}
                >
                  {book.coverImage && (
                    <>
                      <img
                        src={book.coverImage}
                        alt={book.title}
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={e => (e.currentTarget.style.display = 'none')}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/20 pointer-events-none" />
                    </>
                  )}

                  {/* Top Badges */}
                  <div className="relative z-10 flex items-center justify-between text-xs font-mono">
                    <span className="bg-black/50 px-2 py-0.5 rounded text-[10px] font-medium backdrop-blur-xs">
                      {book.year}
                    </span>
                    {/* Prominent Availability Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-xs ${
                        isAvailable
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      <span>{book.status}</span>
                    </span>
                  </div>

                  {/* Title & Category on Cover */}
                  <div className="relative z-10 drop-shadow-sm">
                    <span className="text-[10px] uppercase tracking-wider text-amber-300 font-bold block">
                      {book.category}
                    </span>
                    <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight mt-0.5 group-hover:underline">
                      {book.title}
                    </h3>
                  </div>
                </div>

                {/* Details & Actions */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div onClick={() => onSelectBook(book.id)} className="cursor-pointer space-y-1.5">
                    <p className="text-xs font-bold text-slate-800 line-clamp-1">{book.author}</p>
                    <div className="text-[11px] text-slate-500 space-y-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{book.location}</span>
                      </div>
                      <div className="font-mono text-slate-400 truncate">
                        ISBN: {book.isbn}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Area */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    {isManager ? (
                      /* Manager Actions: Toggle availability, Edit, Delete */
                      <div className="space-y-2">
                        {isDeleting ? (
                          <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-center">
                            <p className="text-[11px] font-semibold text-rose-800">Confirmer suppression ?</p>
                            <div className="flex gap-1.5 justify-center">
                              <button
                                onClick={() => {
                                  deleteBook(book.id);
                                  setDeletingBookId(null);
                                }}
                                className="px-2.5 py-1 text-[11px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer"
                              >
                                Supprimer
                              </button>
                              <button
                                onClick={() => setDeletingBookId(null)}
                                className="px-2 py-1 text-[11px] font-medium bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors cursor-pointer"
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Toggle Availability Button */}
                            <button
                              onClick={() => toggleBookAvailability(book.id)}
                              className={`w-full py-2 px-3 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                isAvailable
                                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              <span>Changer état &rarr; {isAvailable ? 'Rendre Indisponible' : 'Rendre Disponible'}</span>
                            </button>

                            {/* Edit & Delete Mini-buttons */}
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => onEditBook(book)}
                                className="flex-1 py-1.5 px-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3 text-slate-500" />
                                <span>Modifier</span>
                              </button>
                              <button
                                onClick={() => setDeletingBookId(book.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      /* Student: Pure consultation button */
                      <button
                        onClick={() => onSelectBook(book.id)}
                        className="w-full py-2 px-3 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-center cursor-pointer"
                      >
                        Consulter la fiche détaillée
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= TABLE VIEW ================= */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Titre & Auteur</th>
                  <th className="py-3 px-3">Catégorie</th>
                  <th className="py-3 px-3">Emplacement</th>
                  <th className="py-3 px-3">Disponibilité</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBooks.map(book => {
                  const isAvailable = book.status === 'Disponible';
                  return (
                    <tr key={book.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <button
                          onClick={() => onSelectBook(book.id)}
                          className="font-bold text-slate-900 hover:underline text-left block truncate max-w-xs cursor-pointer"
                        >
                          {book.title}
                        </button>
                        <span className="text-slate-500 text-[11px] block">{book.author}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 truncate max-w-[140px]">
                        {book.category}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 truncate max-w-[140px]">
                        {book.location}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isAvailable
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isAvailable ? 'bg-emerald-600' : 'bg-rose-600'
                            }`}
                          />
                          <span>{book.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isManager ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {deletingBookId === book.id ? (
                              <>
                                <span className="text-[11px] text-rose-800 font-medium">Confirmer ?</span>
                                <button
                                  onClick={() => { deleteBook(book.id); setDeletingBookId(null); }}
                                  className="px-2 py-1 text-[11px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors cursor-pointer"
                                >
                                  Oui
                                </button>
                                <button
                                  onClick={() => setDeletingBookId(null)}
                                  className="px-2 py-1 text-[11px] font-medium bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors cursor-pointer"
                                >
                                  Non
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => toggleBookAvailability(book.id)}
                                  className={`px-2 py-1 text-[11px] font-semibold rounded-lg border cursor-pointer ${
                                    isAvailable
                                      ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                                      : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                  }`}
                                  title="Changer la disponibilité"
                                >
                                  {isAvailable ? 'Rendre Indisp.' : 'Rendre Disp.'}
                                </button>
                                <button
                                  onClick={() => onEditBook(book)}
                                  className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                                  title="Modifier"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeletingBookId(book.id)}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => onSelectBook(book.id)}
                            className="text-xs font-semibold text-slate-700 hover:text-slate-900 underline cursor-pointer"
                          >
                            Consulter
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
