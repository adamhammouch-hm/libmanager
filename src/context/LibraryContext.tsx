import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Book, BookAvailability, UserAccount, UserSession } from '../types';
import { INITIAL_BOOKS, INITIAL_ACCOUNTS, DEFAULT_MANAGER_ACCOUNT } from '../data/initialData';

const STORAGE_KEYS = {
  BOOKS: 'bibliotech_books_v3',
  ACCOUNTS: 'bibliotech_accounts_v3',
  SESSION: 'bibliotech_session_v3',
};

interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message?: string;
}

interface LibraryContextType {
  books: Book[];
  accounts: UserAccount[];
  userSession: UserSession | null;
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => void;
  removeToast: (id: string) => void;
  // Auth
  login: (email: string, password: string) => { success: boolean; message: string; role?: 'student' | 'librarian' };
  registerStudent: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => { success: boolean; message: string };
  logout: () => void;
  // Book operations (Manager only)
  addBook: (book: Omit<Book, 'id' | 'addedDate'>) => { success: boolean; message: string; book?: Book };
  updateBook: (id: string, book: Partial<Book>) => { success: boolean; message: string };
  deleteBook: (id: string) => { success: boolean; message: string };
  toggleBookAvailability: (id: string) => { success: boolean; message: string; newStatus?: BookAvailability };
  setBookAvailability: (id: string, status: BookAvailability) => { success: boolean; message: string };
  resetCatalogToDefault: () => void;
  stats: {
    totalBooks: number;
    availableCount: number;
    unavailableCount: number;
  };
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Accounts in localStorage (with corruption protection)
  const [accounts, setAccounts] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (!saved) {
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(INITIAL_ACCOUNTS));
        return INITIAL_ACCOUNTS;
      }
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(INITIAL_ACCOUNTS));
        return INITIAL_ACCOUNTS;
      }
      // Ensure manager account is always present and valid
      const hasManager = parsed.some(
        a => a && typeof a === 'object' && a.email && a.email.toLowerCase() === DEFAULT_MANAGER_ACCOUNT.email.toLowerCase()
      );
      if (!hasManager) {
        parsed.unshift(DEFAULT_MANAGER_ACCOUNT);
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(INITIAL_ACCOUNTS));
      return INITIAL_ACCOUNTS;
    }
  });

  // 2. Books in localStorage (with corruption & schema protection)
  const [books, setBooks] = useState<Book[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BOOKS);
      if (!saved) {
        localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(INITIAL_BOOKS));
        return INITIAL_BOOKS;
      }
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(INITIAL_BOOKS));
        return INITIAL_BOOKS;
      }
      // Ensure each book has a valid status: 'Disponible' | 'Indisponible' and required fields
      const hydrated: Book[] = parsed.map((b: any, index: number) => {
        const initialMatch = INITIAL_BOOKS.find(ib => ib.id === b.id);
        const cover = b.coverImage || initialMatch?.coverImage;
        const status: BookAvailability = b.status === 'Indisponible' ? 'Indisponible' : 'Disponible';
        return {
          id: b.id || `book-${Date.now()}-${index}`,
          title: b.title || 'Sans titre',
          author: b.author || 'Auteur non renseigné',
          isbn: b.isbn || `978-000000000${index}`,
          category: b.category || 'Littérature classique',
          publisher: b.publisher || 'Éditions BiblioTech',
          year: typeof b.year === 'number' ? b.year : new Date().getFullYear(),
          pages: typeof b.pages === 'number' ? b.pages : 100,
          language: b.language || 'Français',
          location: b.location || 'Rayon A-01',
          totalCopies: typeof b.totalCopies === 'number' ? b.totalCopies : 1,
          availableCopies: status === 'Disponible' ? 1 : 0,
          status,
          coverColor: b.coverColor || 'from-amber-900 to-stone-900',
          coverImage: cover,
          description: b.description || '',
          addedDate: b.addedDate || new Date().toISOString().split('T')[0],
        };
      });
      return hydrated;
    } catch {
      localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(INITIAL_BOOKS));
      return INITIAL_BOOKS;
    }
  });

  // 3. User Session in localStorage (with corruption protection)
  const [userSession, setUserSession] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed &&
          typeof parsed === 'object' &&
          parsed.email &&
          (parsed.role === 'student' || parsed.role === 'librarian')
        ) {
          return parsed;
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  // 4. Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'info' | 'warning' | 'error', title: string, message?: string) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts(prev => [...prev.slice(-3), { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
    } catch (e) {
      console.error('Erreur sauvegarde books localStorage', e);
    }
  }, [books]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    } catch (e) {
      console.error('Erreur sauvegarde accounts localStorage', e);
    }
  }, [accounts]);

  useEffect(() => {
    try {
      if (userSession) {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(userSession));
      } else {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
      }
    } catch (e) {
      console.error('Erreur sauvegarde session localStorage', e);
    }
  }, [userSession]);

  // Auth: Login
  const login = (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      return { success: false, message: 'Veuillez renseigner votre e-mail et votre mot de passe.' };
    }

    const account = accounts.find(a => a.email.toLowerCase() === cleanEmail);
    if (!account) {
      return { success: false, message: 'Aucun compte associé à cette adresse e-mail.' };
    }

    if (account.password !== cleanPass) {
      return { success: false, message: 'Mot de passe incorrect.' };
    }

    const session: UserSession = {
      id: 'sess-' + Date.now(),
      email: account.email,
      name: `${account.firstName} ${account.lastName}`,
      role: account.role,
      studentNumber: account.studentNumber,
      firstName: account.firstName,
      lastName: account.lastName,
    };

    setUserSession(session);
    addToast(
      'success',
      'Connexion réussie',
      account.role === 'librarian'
        ? 'Bienvenue dans votre espace Gestionnaire.'
        : `Bienvenue ${account.firstName} ! Consultation du catalogue ouverte.`
    );

    return { success: true, message: 'Connexion validée.', role: account.role };
  };

  // Auth: Student Registration (strictly student role)
  const registerStudent = (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    const firstName = data.firstName.trim();
    const lastName = data.lastName.trim();
    const email = data.email.trim().toLowerCase();
    const password = data.password.trim();
    const confirmPassword = data.confirmPassword.trim();

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return { success: false, message: 'Tous les champs sont obligatoires.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, message: 'Format d\'adresse e-mail invalide.' };
    }

    if (password.length < 6) {
      return { success: false, message: 'Le mot de passe doit contenir au moins 6 caractères.' };
    }

    if (password !== confirmPassword) {
      return { success: false, message: 'Les deux mots de passe ne correspondent pas.' };
    }

    if (accounts.some(a => a.email.toLowerCase() === email)) {
      return { success: false, message: 'Un compte avec cette adresse e-mail existe déjà.' };
    }

    const newAccount: UserAccount = {
      id: 'stu-' + Date.now(),
      email,
      password,
      role: 'student', // Hardcoded: student only!
      firstName,
      lastName,
      studentNumber: `ETU-2026-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setAccounts(prev => [...prev, newAccount]);

    // Automatically authenticate the student
    const session: UserSession = {
      id: 'sess-' + Date.now(),
      email: newAccount.email,
      name: `${newAccount.firstName} ${newAccount.lastName}`,
      role: 'student',
      studentNumber: newAccount.studentNumber,
      firstName: newAccount.firstName,
      lastName: newAccount.lastName,
    };
    setUserSession(session);

    addToast('success', 'Compte créé avec succès', `Bienvenue ${firstName} dans BiblioTech !`);
    return { success: true, message: 'Compte créé avec succès.' };
  };

  // Auth: Logout
  const logout = () => {
    setUserSession(null);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    addToast('info', 'Déconnexion', 'Vous avez été déconnecté avec succès.');
  };

  // Book Operation: Add Book (Manager only + Duplicate ISBN Prevention)
  const addBook = (bookData: Omit<Book, 'id' | 'addedDate'>) => {
    if (userSession?.role !== 'librarian') {
      addToast('error', 'Action non autorisée', 'Seul le gestionnaire peut ajouter un livre.');
      return { success: false, message: 'Action réservée au gestionnaire.' };
    }

    // Strict duplicate check by clean ISBN
    if (bookData.isbn && bookData.isbn.trim()) {
      const cleanNew = bookData.isbn.replace(/[^0-9X]/gi, '');
      if (cleanNew.length >= 8) {
        const duplicate = books.find(b => b.isbn.replace(/[^0-9X]/gi, '') === cleanNew);
        if (duplicate) {
          addToast('error', 'Doublon détecté', `Un ouvrage existe déjà avec cet ISBN (« ${duplicate.title} »).`);
          return { success: false, message: `Un livre avec cet ISBN existe déjà dans le catalogue (« ${duplicate.title} »).` };
        }
      }
    }

    const newBook: Book = {
      ...bookData,
      id: 'book-' + Date.now(),
      addedDate: new Date().toISOString().split('T')[0],
      status: bookData.status || 'Disponible',
      totalCopies: bookData.totalCopies || 1,
      availableCopies: bookData.status === 'Indisponible' ? 0 : Math.max(1, bookData.availableCopies || 1),
    };

    setBooks(prev => [newBook, ...prev]);
    addToast('success', 'Ouvrage enregistré', `« ${newBook.title} » a été ajouté au catalogue.`);
    return { success: true, message: 'Ouvrage enregistré.', book: newBook };
  };

  // Book Operation: Update Book (Manager only + Duplicate ISBN Prevention)
  const updateBook = (id: string, updates: Partial<Book>) => {
    if (userSession?.role !== 'librarian') {
      addToast('error', 'Action non autorisée', 'Seul le gestionnaire peut modifier un livre.');
      return { success: false, message: 'Action réservée au gestionnaire.' };
    }

    // Check duplicate by clean ISBN with OTHER books
    if (updates.isbn && updates.isbn.trim()) {
      const cleanNew = updates.isbn.replace(/[^0-9X]/gi, '');
      if (cleanNew.length >= 8) {
        const duplicate = books.find(b => b.id !== id && b.isbn.replace(/[^0-9X]/gi, '') === cleanNew);
        if (duplicate) {
          addToast('error', 'Doublon détecté', `L'ISBN ${updates.isbn} est déjà utilisé par « ${duplicate.title} ».`);
          return { success: false, message: `Cet ISBN est déjà utilisé par un autre ouvrage (« ${duplicate.title} »).` };
        }
      }
    }

    setBooks(prev =>
      prev.map(b => {
        if (b.id !== id) return b;
        const updated = { ...b, ...updates };
        // Sync available copies if status changed
        if (updates.status === 'Indisponible') {
          updated.availableCopies = 0;
        } else if (updates.status === 'Disponible' && updated.availableCopies === 0) {
          updated.availableCopies = Math.max(1, updated.totalCopies || 1);
        }
        return updated;
      })
    );

    addToast('success', 'Fiche modifiée', 'Les informations du livre ont été mises à jour.');
    return { success: true, message: 'Mise à jour effectuée.' };
  };

  // Book Operation: Delete Book (Manager only)
  const deleteBook = (id: string) => {
    if (userSession?.role !== 'librarian') {
      addToast('error', 'Action non autorisée', 'Seul le gestionnaire peut supprimer un livre.');
      return { success: false, message: 'Action réservée au gestionnaire.' };
    }

    const target = books.find(b => b.id === id);
    setBooks(prev => prev.filter(b => b.id !== id));
    addToast('info', 'Ouvrage supprimé', target ? `« ${target.title} » a été retiré du catalogue.` : undefined);
    return { success: true, message: 'Livre supprimé.' };
  };

  // Book Operation: Toggle Availability (Manager only)
  const toggleBookAvailability = (id: string) => {
    if (userSession?.role !== 'librarian') {
      addToast('error', 'Action non autorisée', 'Seul le gestionnaire peut modifier la disponibilité.');
      return { success: false, message: 'Action réservée au gestionnaire.' };
    }

    let newStatus: BookAvailability = 'Disponible';
    setBooks(prev =>
      prev.map(b => {
        if (b.id !== id) return b;
        newStatus = b.status === 'Disponible' ? 'Indisponible' : 'Disponible';
        return {
          ...b,
          status: newStatus,
          availableCopies: newStatus === 'Disponible' ? Math.max(1, b.availableCopies || 1) : 0,
        };
      })
    );

    addToast('success', 'Statut mis à jour', `L'ouvrage est maintenant ${newStatus}.`);
    return { success: true, message: `Disponibilité modifiée en ${newStatus}.`, newStatus };
  };

  // Set Availability explicitly
  const setBookAvailability = (id: string, status: BookAvailability) => {
    if (userSession?.role !== 'librarian') {
      addToast('error', 'Action non autorisée', 'Seul le gestionnaire peut modifier la disponibilité.');
      return { success: false, message: 'Action réservée au gestionnaire.' };
    }

    setBooks(prev =>
      prev.map(b => {
        if (b.id !== id) return b;
        return {
          ...b,
          status,
          availableCopies: status === 'Disponible' ? Math.max(1, b.availableCopies || 1) : 0,
        };
      })
    );

    addToast('success', 'Statut mis à jour', `L'ouvrage est maintenant ${status}.`);
    return { success: true, message: `Disponibilité définie sur ${status}.` };
  };

  const resetCatalogToDefault = () => {
    setBooks(INITIAL_BOOKS);
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(INITIAL_BOOKS));
    addToast('info', 'Catalogue réinitialisé', 'Le catalogue initial a été restauré.');
  };

  const stats = useMemo(() => {
    const total = books.length;
    const available = books.filter(b => b.status === 'Disponible').length;
    const unavailable = total - available;
    return {
      totalBooks: total,
      availableCount: available,
      unavailableCount: unavailable,
    };
  }, [books]);

  return (
    <LibraryContext.Provider
      value={{
        books,
        accounts,
        userSession,
        toasts,
        addToast,
        removeToast,
        login,
        registerStudent,
        logout,
        addBook,
        updateBook,
        deleteBook,
        toggleBookAvailability,
        setBookAvailability,
        resetCatalogToDefault,
        stats,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};
