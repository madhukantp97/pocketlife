import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import PageHeader from '@/components/PageHeader';
import FAB from '@/components/FAB';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { Pin, Search, X, Tag, Star, Pencil, Download } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

type SortKey = 'date' | 'starred';

export default function NotesScreen() {
  const { notes, loadNotes, addNote, updateNote, deleteNote } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [viewNote, setViewNote] = useState<typeof notes[0] | null>(null);
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('date');
  const [deleteTarget, setDeleteTarget] = useState<typeof notes[0] | null>(null);

  useEffect(() => { loadNotes(); }, []);

  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    (n.content || '').toLowerCase().includes(search.toLowerCase()) ||
    (n.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'starred') {
      if ((a as any).starred && !(b as any).starred) return -1;
      if (!(a as any).starred && (b as any).starred) return 1;
    }
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  const resetForm = () => { setTitle(''); setContent(''); setTags(''); setEditId(null); setShowForm(false); };

  const handleSave = () => {
    if (!title.trim()) return;
    const tagArr = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (editId) {
      updateNote(editId, { title, content, tags: tagArr });
    } else {
      addNote({ title, content, tags: tagArr, pinned: false });
    }
    resetForm();
  };

  const startEdit = (n: typeof notes[0]) => {
    setViewNote(null);
    setEditId(n.id);
    setTitle(n.title);
    setContent(n.content || '');
    setTags((n.tags || []).join(', '));
    setShowForm(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, n: typeof notes[0]) => {
    e.stopPropagation();
    setDeleteTarget(n);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteNote(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const exportAsPdf = (n: typeof notes[0]) => {
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
    let y = margin;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(n.title, pageWidth);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 8 + 4;

    if ((n.tags || []).length > 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(120, 120, 120);
      doc.text(`Tags: ${(n.tags || []).join(', ')}`, margin, y);
      y += 8;
    }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(`Last updated: ${format(new Date(n.updated_at), 'MMM d, yyyy h:mm a')}`, margin, y);
    y += 10;

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, margin + pageWidth, y);
    y += 8;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    const contentLines = doc.splitTextToSize(n.content || 'No content.', pageWidth);
    for (const line of contentLines) {
      if (y > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 6;
    }

    doc.save(`${n.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  };

  return (
    <div className="pb-6 animate-fade-in">
      <PageHeader title="Notes" subtitle={`${notes.length} notes`} />

      <div className="px-4 mb-4 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes..."
            className="w-full pl-9 pr-4 py-2.5 bg-card rounded-xl border border-border text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="flex gap-2">
          {(['date', 'starred'] as SortKey[]).map(s => (
            <button key={s} onClick={() => setSortBy(s)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${sortBy === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {s === 'starred' ? '⭐ Starred' : '📅 Date'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-3">
        {sorted.map(n => (
          <div key={n.id} className="bg-card rounded-xl p-4 card-shadow animate-slide-up" onClick={() => setViewNote(n)}>
            <div className="flex items-start justify-between">
              <h3 className="text-sm font-semibold text-card-foreground flex-1">{n.title}</h3>
              <div className="flex items-center gap-1">
                <button onClick={e => { e.stopPropagation(); updateNote(n.id, { starred: !(n as any).starred } as any); }} className="p-1">
                  <Star className={`w-3.5 h-3.5 ${(n as any).starred ? 'text-warning fill-warning' : 'text-muted-foreground'}`} />
                </button>
                <button onClick={e => { e.stopPropagation(); updateNote(n.id, { pinned: !n.pinned }); }} className="p-1">
                  <Pin className={`w-3.5 h-3.5 ${n.pinned ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{n.content}</p>
            {(n.tags || []).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {(n.tags || []).map(t => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{t}</span>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between mt-2">
              <p className="text-[10px] text-muted-foreground">{format(new Date(n.updated_at), 'MMM d, yyyy')}</p>
              <button onClick={e => handleDeleteClick(e, n)} className="text-[10px] text-destructive font-medium">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <FAB onClick={() => { resetForm(); setShowForm(true); }} />

      {/* View-only modal */}
      {viewNote && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setViewNote(null)}>
          <div className="w-full max-w-lg bg-card rounded-2xl p-5 card-shadow-lg animate-fade-in max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-card-foreground flex-1 pr-2">{viewNote.title}</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => exportAsPdf(viewNote)} className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors" title="Export as PDF">
                  <Download className="w-4 h-4 text-muted-foreground" />
                </button>
                <button onClick={() => startEdit(viewNote)} className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
                  <Pencil className="w-4 h-4 text-primary" />
                </button>
                <button onClick={() => setViewNote(null)}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>
            {(viewNote.tags || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(viewNote.tags || []).map(t => (
                  <span key={t} className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{t}</span>
                ))}
              </div>
            )}
            <p className="text-sm text-card-foreground whitespace-pre-wrap leading-relaxed">{viewNote.content || 'No content.'}</p>
            <p className="text-[10px] text-muted-foreground mt-4">Last updated {format(new Date(viewNote.updated_at), 'MMM d, yyyy h:mm a')}</p>
          </div>
        </div>
      )}

      {/* Edit/Create form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card rounded-2xl p-5 card-shadow-lg animate-fade-in max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-card-foreground">{editId ? 'Edit Note' : 'New Note'}</h2>
              <button onClick={resetForm}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="w-full p-3 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground mb-3 focus:outline-none" />
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write your note..." rows={6} className="w-full p-3 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground mb-3 focus:outline-none resize-none" />
            <div className="relative mb-4">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags (comma separated)" className="w-full pl-9 pr-4 py-3 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
            </div>
            <button onClick={handleSave} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm active:scale-[0.98] transition-transform">
              {editId ? 'Update Note' : 'Save Note'}
            </button>
          </div>
        </div>
      )}

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={open => !open && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        isStarred={(deleteTarget as any)?.starred}
        itemName={deleteTarget?.title}
      />
    </div>
  );
}