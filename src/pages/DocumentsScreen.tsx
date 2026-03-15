import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import PageHeader from '@/components/PageHeader';
import FAB from '@/components/FAB';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { FileText, Download, Trash2, Upload, Image, File, X, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Document {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  storage_path: string;
  created_at: string;
  user_id: string;
  category: string;
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'text/plain',
];

const CATEGORIES = ['General', 'Work', 'Personal', 'Finance', 'Medical', 'Education', 'Legal', 'Other'];

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return <Image className="w-5 h-5 text-accent" />;
  if (type === 'application/pdf') return <FileText className="w-5 h-5 text-destructive" />;
  return <File className="w-5 h-5 text-primary" />;
}

function getCategoryColor(cat: string) {
  const colors: Record<string, string> = {
    Work: 'bg-primary/10 text-primary',
    Personal: 'bg-accent/10 text-accent',
    Finance: 'bg-warning/10 text-warning',
    Medical: 'bg-destructive/10 text-destructive',
    Education: 'bg-secondary text-secondary-foreground',
    Legal: 'bg-muted text-muted-foreground',
  };
  return colors[cat] || 'bg-muted text-muted-foreground';
}

export default function DocumentsScreen() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [docName, setDocName] = useState('');
  const [docCategory, setDocCategory] = useState('General');
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(null);
  const [filterCategory, setFilterCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');

  const filteredDocuments = documents
    .filter(d => filterCategory === 'All' || d.category === filterCategory.toLowerCase())
    .sort((a, b) => {
      if (sortBy === 'name') return a.file_name.localeCompare(b.file_name);
      if (sortBy === 'size') return b.file_size - a.file_size;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const loadDocuments = async () => {
    const { data } = await supabase.from('pocketapp_documents').select('*').order('created_at', { ascending: false });
    setDocuments((data as Document[]) || []);
  };

  useEffect(() => { loadDocuments(); }, []);

  const resetForm = () => {
    setDocName('');
    setDocCategory('General');
    setSelectedFile(null);
    setShowForm(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Unsupported file type. Supported: PDF, DOC, DOCX, JPG, PNG, TXT');
      e.target.value = '';
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File too large. Max 20MB.');
      e.target.value = '';
      return;
    }
    setSelectedFile(file);
    if (!docName) setDocName(file.name.replace(/\.[^/.]+$/, ''));
  };

  const handleUpload = async () => {
    if (!selectedFile || !docName.trim()) {
      toast.error('Please provide a name and select a file');
      return;
    }

    setUploading(true);
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const path = `${userId}/${Date.now()}-${selectedFile.name}`;
      const { error: uploadErr } = await supabase.storage.from('documents').upload(path, selectedFile);
      if (uploadErr) throw uploadErr;

      const { error: insertErr } = await supabase.from('pocketapp_documents').insert({
        user_id: userId,
        file_name: docName.trim(),
        file_size: selectedFile.size,
        file_type: selectedFile.type,
        storage_path: path,
        category: docCategory.toLowerCase(),
      } as any);
      if (insertErr) throw insertErr;

      // Auto-create notification
      await supabase.from('pocketapp_notifications').insert({
        user_id: userId,
        title: 'Document uploaded',
        message: `"${docName.trim()}" has been saved to ${docCategory}`,
        type: 'info',
      } as any);

      toast.success('Document uploaded');
      resetForm();
      loadDocuments();
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    const { data, error } = await supabase.storage.from('documents').download(doc.storage_path);
    if (error || !data) { toast.error('Download failed'); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.file_name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supabase.storage.from('documents').remove([deleteTarget.storage_path]);
    await supabase.from('pocketapp_documents').delete().eq('id', deleteTarget.id);
    toast.success('Document deleted');
    setDeleteTarget(null);
    loadDocuments();
  };

  return (
    <div className="pb-6 animate-fade-in">
      <PageHeader title="Documents" subtitle={`${filteredDocuments.length} of ${documents.length} files`} />

      {/* Filter & Sort Bar */}
      <div className="px-4 mb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {['All', ...CATEGORIES].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filterCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          {(['date', 'name', 'size'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`text-[10px] px-2 py-1 rounded-full font-medium transition-colors ${
                sortBy === s ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              {s === 'date' ? 'Recent' : s === 'name' ? 'Name' : 'Size'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-2">
        {filteredDocuments.map(doc => (
          <div key={doc.id} className="bg-card rounded-xl p-4 card-shadow flex items-center gap-3 animate-slide-up">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              {getFileIcon(doc.file_type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-card-foreground truncate">{doc.file_name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getCategoryColor(doc.category)}`}>
                  {doc.category || 'general'}
                </span>
                <p className="text-[10px] text-muted-foreground">
                  {formatSize(doc.file_size)} · {format(new Date(doc.created_at), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
            <button onClick={() => handleDownload(doc)} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <Download className="w-4 h-4 text-primary" />
            </button>
            <button onClick={() => setDeleteTarget(doc)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors">
              <Trash2 className="w-4 h-4 text-destructive" />
            </button>
          </div>
        ))}
        {filteredDocuments.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">{documents.length === 0 ? 'No documents yet' : 'No documents in this category'}</p>}
      </div>

      <FAB onClick={() => setShowForm(true)} icon={<Upload className="w-5 h-5" />} />

      {showForm && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end">
          <div className="w-full bg-card rounded-t-2xl p-5 card-shadow-lg animate-slide-up max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-card-foreground">Upload Document</h2>
              <button onClick={resetForm}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>

            <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Document Name</label>
            <input
              value={docName}
              onChange={e => setDocName(e.target.value)}
              placeholder="Enter document name"
              className="w-full p-3 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground mb-3 focus:outline-none"
            />

            <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Category</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setDocCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    docCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Attachment</label>
            <label className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors mb-4">
              <Upload className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {selectedFile ? selectedFile.name : 'Choose file (PDF, DOC, JPG, PNG, TXT)'}
              </span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                onChange={handleFileSelect}
              />
            </label>

            <button
              onClick={handleUpload}
              disabled={uploading || !selectedFile || !docName.trim()}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </div>
      )}

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={open => !open && setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={deleteTarget?.file_name}
      />
    </div>
  );
}
