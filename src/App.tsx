import React, { useState } from 'react';
import { LibraryProvider, useLibrary } from './context/LibraryContext';
import { Navbar } from './components/Navbar';
import { CatalogView } from './components/CatalogView';
import { LoginPage } from './components/LoginPage';
import { ToastContainer } from './components/ToastContainer';
import { BookFormModal } from './components/modals/BookFormModal';
import { BookDetailModal } from './components/modals/BookDetailModal';
import { Book } from './types';
import { BookOpen } from 'lucide-react';

function LibraryApp() {
  const { userSession } = useLibrary();

  // If user is not logged in, render the single intelligent login page
  if (!userSession) {
    return (
      <>
        <LoginPage />
        <ToastContainer />
      </>
    );
  }

  const isManager = userSession.role === 'librarian';

  // Modals state
  const [isBookFormOpen, setIsBookFormOpen] = useState(false);
  const [bookToEdit, setBookToEdit] = useState<Book | null>(null);

  const [isBookDetailOpen, setIsBookDetailOpen] = useState(false);
  const [detailBookId, setDetailBookId] = useState<string | null>(null);

  const handleOpenNewBook = () => {
    if (!isManager) return;
    setBookToEdit(null);
    setIsBookFormOpen(true);
  };

  const handleEditBook = (book: Book) => {
    if (!isManager) return;
    setBookToEdit(book);
    setIsBookFormOpen(true);
  };

  const handleSelectBook = (bookId: string) => {
    setDetailBookId(bookId);
    setIsBookDetailOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar onOpenNewBook={isManager ? handleOpenNewBook : undefined} />

      {/* Main Content Area: Catalog */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 pt-5 pb-12">
        <CatalogView
          isManager={isManager}
          onOpenNewBook={handleOpenNewBook}
          onEditBook={handleEditBook}
          onSelectBook={handleSelectBook}
        />
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-400" />
            <span className="font-bold text-slate-800">BiblioTech</span>
            <span aria-hidden="true">·</span>
            <span>Système de Gestion et Consultation de Bibliothèque</span>
          </div>
          <div className="text-slate-400 text-[11px] font-mono">
            {isManager
              ? 'Mode Gestionnaire actif · Contrôle du catalogue & scanner'
              : 'Mode Étudiant actif · Consultation du catalogue'}
          </div>
        </div>
      </footer>

      {/* Modals */}
      {isManager && (
        <BookFormModal
          isOpen={isBookFormOpen}
          onClose={() => setIsBookFormOpen(false)}
          bookToEdit={bookToEdit}
        />
      )}

      <BookDetailModal
        isOpen={isBookDetailOpen}
        onClose={() => setIsBookDetailOpen(false)}
        bookId={detailBookId}
        isManager={isManager}
        onEdit={book => {
          setIsBookDetailOpen(false);
          handleEditBook(book);
        }}
      />

      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <LibraryProvider>
      <LibraryApp />
    </LibraryProvider>
  );
}
