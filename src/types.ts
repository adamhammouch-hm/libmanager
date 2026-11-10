export type BookCategory = 
  | 'Littérature classique'
  | 'Science-fiction & Fantasy'
  | 'Histoire & Géographie'
  | 'Philosophie & Essais'
  | 'Bande Dessinée & Manga'
  | 'Sciences & Techniques'
  | 'Jeunesse & Contes'
  | 'Arts & Culture'
  | 'Développement personnel';

export type BookAvailability = 'Disponible' | 'Indisponible';

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: BookCategory;
  publisher: string;
  year: number;
  pages: number;
  language: string;
  location: string; // e.g. "Rayon B-14", "Section Littérature"
  totalCopies: number;
  availableCopies: number;
  status: BookAvailability; // 'Disponible' | 'Indisponible'
  coverColor: string;
  coverImage?: string;
  description: string;
  addedDate: string;
}

export interface UserAccount {
  id: string;
  email: string;
  password: string;
  role: 'student' | 'librarian';
  firstName: string;
  lastName: string;
  studentNumber?: string;
  createdAt: string;
}

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'librarian';
  studentNumber?: string;
  firstName?: string;
  lastName?: string;
}
