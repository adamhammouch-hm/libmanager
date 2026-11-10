import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Edit3,
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Book, BookCategory, BookAvailability } from '../../types';
import { useLibrary } from '../../context/LibraryContext';
import { fetchBookMetadataByIsbn } from '../../services/bookLookup';

interface BookFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookToEdit?: Book | null;
}

const CATEGORIES: BookCategory[] = [
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

const COLOR_THEMES = [
  { label: 'Ambre classique', value: 'from-amber-900 to-stone-900' },
  { label: 'Brun cuir', value: 'from-amber-700 to-amber-950' },
  { label: 'Bleu nuit', value: 'from-sky-700 to-indigo-950' },
  { label: 'Anthracite sombre', value: 'from-zinc-800 to-stone-950' },
  { label: 'Ocre désert', value: 'from-amber-600 to-orange-950' },
  { label: 'Émeraude profonde', value: 'from-emerald-800 to-teal-950' },
  { label: 'Bordeaux royal', value: 'from-red-800 to-rose-950' },
  { label: 'Indigo cosmos', value: 'from-indigo-900 to-slate-950' },
];

export const BookFormModal: React.FC<BookFormModalProps> = ({
  isOpen,
  onClose,
  bookToEdit,
}) => {
  const { addBook, updateBook, addToast } = useLibrary();

  // Tab: 'scanner' | 'manual'
  const [activeTab, setActiveTab] = useState<'scanner' | 'manual'>('manual');

  // Form Fields
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState<BookCategory>('Littérature classique');
  const [isbn, setIsbn] = useState('');
  const [status, setStatus] = useState<BookAvailability>('Disponible');
  const [publisher, setPublisher] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [pages, setPages] = useState<number>(250);
  const [language, setLanguage] = useState('Français');
  const [location, setLocation] = useState('Rayon A-01');
  const [coverColor, setCoverColor] = useState(COLOR_THEMES[0].value);
  const [coverImage, setCoverImage] = useState<string>('');
  const [description, setDescription] = useState('');

  // Scanner State
  const [isScannerRunning, setIsScannerRunning] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [manualIsbnLookup, setManualIsbnLookup] = useState('');
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [lookupFeedback, setLookupFeedback] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isStoppingRef = useRef(false);
  const scannerContainerId = 'interactive-barcode-scanner';

  // Initialize form
  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    if (bookToEdit) {
      setActiveTab('manual');
      setTitle(bookToEdit.title);
      setAuthor(bookToEdit.author);
      setCategory(bookToEdit.category);
      setIsbn(bookToEdit.isbn);
      setStatus(bookToEdit.status || (bookToEdit.availableCopies > 0 ? 'Disponible' : 'Indisponible'));
      setPublisher(bookToEdit.publisher);
      setYear(bookToEdit.year);
      setPages(bookToEdit.pages);
      setLanguage(bookToEdit.language);
      setLocation(bookToEdit.location);
      setCoverColor(bookToEdit.coverColor);
      setCoverImage(bookToEdit.coverImage || '');
      setDescription(bookToEdit.description);
      setScannerError(null);
      setLookupFeedback(null);
    } else {
      // New book defaults
      setActiveTab('scanner');
      setTitle('');
      setAuthor('');
      setCategory('Littérature classique');
      setIsbn('');
      setStatus('Disponible');
      setPublisher('');
      setYear(new Date().getFullYear());
      setPages(250);
      setLanguage('Français');
      setLocation('Rayon A-01');
      setCoverColor(COLOR_THEMES[0].value);
      setCoverImage('');
      setDescription('');
      setScannerError(null);
      setLookupFeedback(null);
      setManualIsbnLookup('');
    }
  }, [bookToEdit, isOpen]);

  // Start scanner when switching to scanner tab
  useEffect(() => {
    if (isOpen && activeTab === 'scanner') {
      const timer = setTimeout(() => {
        startScanner();
      }, 300);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [activeTab, isOpen]);

  const startScanner = async () => {
    try {
      setScannerError(null);
      const container = document.getElementById(scannerContainerId);
      if (!container) return;

      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop();
          }
        } catch {
          // ignore
        }
      }

      const qrCodeScanner = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      });

      html5QrCodeRef.current = qrCodeScanner;

      const config = {
        fps: 10,
        qrbox: { width: 280, height: 180 },
        aspectRatio: 1.333,
      };

      await qrCodeScanner.start(
        { facingMode: 'environment' },
        config,
        async (decodedText: string) => {
          handleSuccessfulScan(decodedText);
        },
        () => {
          // Ignore individual frame non-detections
        }
      );

      setIsScannerRunning(true);
    } catch (err: any) {
      console.warn('Scanner camera error:', err);
      setIsScannerRunning(false);
      const errorMsg =
        err?.name === 'NotAllowedError'
          ? 'Autorisation de la caméra refusée. Vous pouvez autoriser la caméra ou saisir le code-barres / ISBN ci-dessous.'
          : err?.name === 'NotFoundError'
          ? 'Aucune caméra détectée sur cet appareil. Utilisez la saisie manuelle ci-dessous.'
          : 'Impossible d\'activer le flux caméra. La saisie manuelle est disponible.';
      setScannerError(errorMsg);
    }
  };

  const stopScanner = async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch {
        // ignore
      }
      html5QrCodeRef.current = null;
    }
    setIsScannerRunning(false);
    isStoppingRef.current = false;
  };

  // Called when scanner detects barcode
  const handleSuccessfulScan = async (scannedCode: string) => {
    await stopScanner();
    setIsbn(scannedCode);
    setManualIsbnLookup(scannedCode);
    addToast('info', 'Code-barres scanné', `ISBN : ${scannedCode}`);
    setActiveTab('manual');
    await lookupBookMetadata(scannedCode);
  };

  // Metadata Lookup (truthful feedback: never claim success if no data returned)
  const lookupBookMetadata = async (isbnToLookup: string) => {
    const clean = isbnToLookup.trim();
    if (!clean) return;

    setIsFetchingMetadata(true);
    setLookupFeedback({ type: 'info', message: 'Recherche des informations bibliographiques en cours...' });

    try {
      const metadata = await fetchBookMetadataByIsbn(clean);

      if (metadata && (metadata.title || metadata.author)) {
        if (metadata.title) setTitle(metadata.title);
        if (metadata.author) setAuthor(metadata.author);
        if (metadata.publisher) setPublisher(metadata.publisher);
        if (metadata.year) setYear(metadata.year);
        if (metadata.pages) setPages(metadata.pages);
        if (metadata.category) setCategory(metadata.category);
        if (metadata.coverImage) setCoverImage(metadata.coverImage);
        if (metadata.description) setDescription(metadata.description);

        setLookupFeedback({
          type: 'success',
          message: 'Informations bibliographiques trouvées et préremplies. Vous pouvez les vérifier et les ajuster avant enregistrement.',
        });
        addToast('success', 'Métadonnées trouvées', `« ${metadata.title || 'Ouvrage'} » prérempli.`);
      } else {
        setLookupFeedback({
          type: 'info',
          message: `ISBN ${clean} pris en compte. Aucune information en ligne n'a été trouvée : veuillez compléter les champs manuellement.`,
        });
      }
    } catch {
      setLookupFeedback({
        type: 'error',
        message: 'Service externe temporairement indisponible. Veuillez renseigner les informations manuellement.',
      });
    } finally {
      setIsFetchingMetadata(false);
    }
  };

  const handleManualLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualIsbnLookup.trim()) return;
    setIsbn(manualIsbnLookup.trim());
    lookupBookMetadata(manualIsbnLookup.trim());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;

    if (bookToEdit) {
      const res = updateBook(bookToEdit.id, {
        title: title.trim(),
        author: author.trim(),
        category,
        isbn: isbn.trim() || bookToEdit.isbn,
        status,
        publisher: publisher.trim() || 'Éditions BiblioTech',
        year: Number(year) || new Date().getFullYear(),
        pages: Number(pages) || 100,
        language,
        location: location.trim() || 'Rayon A-01',
        coverColor,
        coverImage: coverImage.trim() || undefined,
        description: description.trim(),
      });
      if (!res.success) {
        setLookupFeedback({ type: 'error', message: res.message });
        return;
      }
    } else {
      const res = addBook({
        title: title.trim(),
        author: author.trim(),
        category,
        isbn: isbn.trim() || `978-2${Math.floor(10000000 + Math.random() * 90000000)}`,
        status,
        publisher: publisher.trim() || 'Éditions BiblioTech',
        year: Number(year) || new Date().getFullYear(),
        pages: Number(pages) || 100,
        language,
        location: location.trim() || 'Rayon A-01',
        totalCopies: 1,
        availableCopies: status === 'Disponible' ? 1 : 0,
        coverColor,
        coverImage: coverImage.trim() || undefined,
        description: description.trim(),
      });
      if (!res.success) {
        setLookupFeedback({ type: 'error', message: res.message });
        return;
      }
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              {bookToEdit ? "Modifier l'ouvrage" : 'Ajouter un livre au catalogue'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {bookToEdit ? 'Mise à jour des métadonnées et disponibilité' : 'Scannez le code-barres ou saisissez manuellement'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher for new book */}
        {!bookToEdit && (
          <div className="px-4 sm:px-6 pt-3 shrink-0">
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('scanner')}
                className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'scanner'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Camera className="w-4 h-4 text-amber-600" />
                <span>Scanner Code-barres</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'manual'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-4 h-4 text-slate-700" />
                <span>Fiche & Saisie manuelle</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: SCANNER */}
          {activeTab === 'scanner' && !bookToEdit && (
            <div className="space-y-4">
              <div className="bg-slate-900 rounded-2xl overflow-hidden relative border border-slate-800 shadow-inner flex flex-col items-center justify-center min-h-[260px] text-white p-2">
                {/* HTML5 QR Code Mount Element */}
                <div id={scannerContainerId} className="w-full max-w-sm rounded-xl overflow-hidden" />

                {scannerError && (
                  <div className="p-4 text-center max-w-sm space-y-3">
                    <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                    <p className="text-xs text-slate-200">{scannerError}</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('manual')}
                      className="px-4 py-2 text-xs font-semibold bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Continuer en saisie manuelle
                    </button>
                  </div>
                )}
              </div>

              {/* Sub-section: Manual ISBN / Barcode input */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Saisie directe de l'ISBN / Code-barres
                  </span>
                  <span className="text-[11px] text-slate-500">Ex: 9782070409228</span>
                </div>
                <form onSubmit={handleManualLookupSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={manualIsbnLookup}
                    onChange={e => setManualIsbnLookup(e.target.value)}
                    placeholder="Saisissez l'ISBN pour auto-compléter..."
                    className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  />
                  <button
                    type="submit"
                    disabled={isFetchingMetadata || !manualIsbnLookup.trim()}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {isFetchingMetadata ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                    <span>Rechercher</span>
                  </button>
                </form>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('manual')}
                  className="text-xs text-slate-600 hover:text-slate-900 underline font-medium cursor-pointer"
                >
                  Passer directement au formulaire sans scanner &rarr;
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: MANUAL / EDIT FORM */}
          {(activeTab === 'manual' || bookToEdit) && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Lookup Feedback Banner */}
              {lookupFeedback && (
                <div
                  className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                    lookupFeedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : lookupFeedback.type === 'error'
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}
                >
                  {lookupFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <span>{lookupFeedback.message}</span>
                </div>
              )}

              {/* DISPONIBILITÉ (Contrôlée exclusivement par le gestionnaire) */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Disponibilité dans la bibliothèque *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStatus('Disponible')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      status === 'Disponible'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
                    <span>Disponible (en rayon)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('Indisponible')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      status === 'Indisponible'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-300" />
                    <span>Indisponible</span>
                  </button>
                </div>
              </div>

              {/* Main Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Title */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                    Titre de l'ouvrage *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Ex: Les Misérables"
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                {/* Author */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                    Auteur(e) *
                  </label>
                  <input
                    type="text"
                    required
                    value={author}
                    onChange={e => setAuthor(e.target.value)}
                    placeholder="Ex: Victor Hugo"
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                {/* ISBN */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Numéro ISBN
                    </label>
                    <button
                      type="button"
                      onClick={() => lookupBookMetadata(isbn)}
                      disabled={!isbn.trim() || isFetchingMetadata}
                      className="text-[11px] text-amber-700 hover:text-amber-900 font-medium underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Rechercher infos</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={isbn}
                    onChange={e => setIsbn(e.target.value)}
                    placeholder="978-2070409228"
                    className="w-full px-3 py-2 text-xs sm:text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                    Catégorie
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as BookCategory)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Publisher */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                    Maison d'édition
                  </label>
                  <input
                    type="text"
                    value={publisher}
                    onChange={e => setPublisher(e.target.value)}
                    placeholder="Gallimard, Folio, Flammarion..."
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                {/* Year & Pages */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                      Année
                    </label>
                    <input
                      type="number"
                      value={year}
                      onChange={e => setYear(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                      Pages
                    </label>
                    <input
                      type="number"
                      value={pages}
                      onChange={e => setPages(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Location / Rayon */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                    Emplacement / Rayon
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="Ex: Rayon A-14, Section Littérature"
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              {/* Cover Image URL */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                  Image de couverture (URL ou fichier)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={coverImage}
                    onChange={e => setCoverImage(e.target.value)}
                    placeholder="https://... ou /src/assets/images/..."
                    className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                  {coverImage && (
                    <div className="w-9 h-9 rounded-lg border border-slate-200 overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
                      <img
                        src={coverImage}
                        alt="Aperçu"
                        className="w-full h-full object-cover"
                        onError={e => (e.currentTarget.style.display = 'none')}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Theme color */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                  Bandeau / Couleur thématique
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {COLOR_THEMES.map(theme => (
                    <button
                      key={theme.value}
                      type="button"
                      onClick={() => setCoverColor(theme.value)}
                      className={`h-7 rounded-md bg-gradient-to-br ${theme.value} transition-all cursor-pointer ${
                        coverColor === theme.value
                          ? 'ring-2 ring-slate-900 ring-offset-2 scale-105'
                          : 'opacity-80 hover:opacity-100'
                      }`}
                      title={theme.label}
                    />
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                  Résumé / Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Brève description ou synopsis de l'ouvrage..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                  {bookToEdit ? 'Enregistrer les modifications' : 'Ajouter au catalogue'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
