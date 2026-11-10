import { BookCategory } from '../types';

export interface FetchedBookMetadata {
  title?: string;
  author?: string;
  publisher?: string;
  year?: number;
  pages?: number;
  coverImage?: string;
  description?: string;
  category?: BookCategory;
}

const CATEGORY_MAP: Record<string, BookCategory> = {
  fiction: 'Littérature classique',
  literature: 'Littérature classique',
  novel: 'Littérature classique',
  roman: 'Littérature classique',
  science: 'Sciences & Techniques',
  computers: 'Sciences & Techniques',
  technology: 'Sciences & Techniques',
  history: 'Histoire & Géographie',
  geography: 'Histoire & Géographie',
  philosophy: 'Philosophie & Essais',
  essay: 'Philosophie & Essais',
  juvenile: 'Jeunesse & Contes',
  children: 'Jeunesse & Contes',
  comics: 'Bande Dessinée & Manga',
  manga: 'Bande Dessinée & Manga',
  art: 'Arts & Culture',
  self: 'Développement personnel',
};

function mapCategory(raw?: string): BookCategory {
  if (!raw) return 'Littérature classique';
  const lower = raw.toLowerCase();
  for (const [key, val] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(key)) return val;
  }
  return 'Littérature classique';
}

export async function fetchBookMetadataByIsbn(isbn: string): Promise<FetchedBookMetadata | null> {
  const cleanIsbn = isbn.replace(/[^0-9X]/gi, '');
  if (!cleanIsbn || cleanIsbn.length < 8) return null;

  // 1. Try Open Library Data API first (fast and CORS-friendly)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const olRes = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`,
      { signal: controller.signal }
    );
    clearTimeout(timer);

    if (olRes.ok) {
      const data = await olRes.json();
      const bookData = data[`ISBN:${cleanIsbn}`];
      if (bookData) {
        const metadata: FetchedBookMetadata = {};
        if (bookData.title) metadata.title = bookData.title;

        if (Array.isArray(bookData.authors) && bookData.authors.length > 0) {
          metadata.author = bookData.authors.map((a: { name: string }) => a.name).join(', ');
        }

        if (Array.isArray(bookData.publishers) && bookData.publishers.length > 0) {
          metadata.publisher = bookData.publishers[0].name;
        }

        if (bookData.publish_date) {
          const matchYear = bookData.publish_date.match(/\b(19\d\d|20\d\d)\b/);
          if (matchYear) metadata.year = parseInt(matchYear[1], 10);
        }

        if (bookData.number_of_pages) {
          metadata.pages = Number(bookData.number_of_pages);
        }

        if (bookData.cover?.large || bookData.cover?.medium) {
          metadata.coverImage = bookData.cover.large || bookData.cover.medium;
        }

        if (bookData.notes) {
          metadata.description = typeof bookData.notes === 'string' ? bookData.notes : bookData.notes.value;
        } else if (bookData.subtitle) {
          metadata.description = bookData.subtitle;
        }

        if (Array.isArray(bookData.subjects) && bookData.subjects.length > 0) {
          const subjectName = bookData.subjects[0].name || '';
          metadata.category = mapCategory(subjectName);
        }

        return metadata;
      }
    }
  } catch (err) {
    // Silent fallback to Google Books
  }

  // 2. Fallback to Google Books API
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const gbRes = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`,
      { signal: controller.signal }
    );
    clearTimeout(timer);

    if (gbRes.ok) {
      const gbData = await gbRes.json();
      if (gbData.items && gbData.items.length > 0) {
        const info = gbData.items[0].volumeInfo;
        const metadata: FetchedBookMetadata = {};

        if (info.title) metadata.title = info.title;
        if (Array.isArray(info.authors)) metadata.author = info.authors.join(', ');
        if (info.publisher) metadata.publisher = info.publisher;

        if (info.publishedDate) {
          const matchYear = info.publishedDate.match(/\b(19\d\d|20\d\d)\b/);
          if (matchYear) metadata.year = parseInt(matchYear[1], 10);
        }

        if (info.pageCount) metadata.pages = Number(info.pageCount);
        if (info.imageLinks?.thumbnail) {
          // Upgrade http to https
          metadata.coverImage = info.imageLinks.thumbnail.replace(/^http:\/\//i, 'https://');
        }
        if (info.description) metadata.description = info.description;
        if (Array.isArray(info.categories) && info.categories.length > 0) {
          metadata.category = mapCategory(info.categories[0]);
        }

        return metadata;
      }
    }
  } catch (err) {
    // Both failed or offline
  }

  return null;
}

