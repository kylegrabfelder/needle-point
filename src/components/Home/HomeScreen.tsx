import { useState, useEffect } from 'react';
import { useProjectStore, getProjectIds, loadProjectFromStorage, deleteProjectFromStorage, importProjectFromFile } from '../../store/projectStore';
import type { MeshCount, Project } from '../../types';

const MESH_COUNTS: MeshCount[] = [10, 13, 14, 18, 24];

const THREAD_SPECTRUM = [
  '#C82626', '#D4432E', '#E05C38', '#E87B3A', '#F09A2C',
  '#F5C025', '#E8D040', '#C8D450', '#9EC855', '#6CB33F',
  '#3D9E4A', '#1E8855', '#1A7A62', '#217070', '#2A8080',
  '#3498B8', '#3D7FC5', '#3E5FB0', '#5050A8', '#7050A0',
  '#9A50A0', '#B850A0', '#C85898', '#D05880', '#D06878',
  '#E0909A', '#A87060', '#886050',
];

export function HomeScreen() {
  const { createProject, loadProject } = useProjectStore();
  const [savedProjects, setSavedProjects] = useState<Project[]>([]);
  const [title, setTitle] = useState('My Pattern');
  const [meshCount, setMeshCount] = useState<MeshCount>(18);
  const [widthIn, setWidthIn] = useState(8);
  const [heightIn, setHeightIn] = useState(8);

  useEffect(() => {
    const ids = getProjectIds();
    const projects = ids
      .map(id => loadProjectFromStorage(id))
      .filter((p): p is Project => p !== null)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    setSavedProjects(projects);
  }, []);

  function handleCreate() {
    if (!title.trim()) return;
    createProject(title.trim(), meshCount, widthIn, heightIn);
  }

  function handleOpen(project: Project) {
    loadProject(project);
  }

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm('Delete this project? This cannot be undone.')) return;
    deleteProjectFromStorage(id);
    setSavedProjects(prev => prev.filter(p => p.id !== id));
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const imported = await importProjectFromFile(file);
    loadProject(imported);
    e.target.value = '';
  }

  const cellCount = Math.round(widthIn * meshCount) * Math.round(heightIn * meshCount);

  return (
    <div className="flex-1 overflow-y-auto bg-linen flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-2xl space-y-8">

        {/* Thread spectrum — the signature element */}
        <div>
          <div
            className="h-5 flex overflow-hidden rounded-xl mb-6"
            style={{ boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.07)' }}
          >
            {THREAD_SPECTRUM.map((hex, i) => (
              <div key={i} style={{ backgroundColor: hex, flex: 1 }} />
            ))}
          </div>
          <h1 className="font-serif text-3xl text-ink leading-tight">Design your pattern</h1>
          <p className="text-sm text-warm-stone mt-2">
            Real DMC and Anchor thread colors. Export to PDF when you're ready to stitch.
          </p>
        </div>

        {/* New project form */}
        <div className="bg-white rounded-2xl border border-warm-line p-6">
          <h2 className="text-xs font-semibold text-warm-faint uppercase tracking-widest mb-5">New Project</h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-warm-stone mb-1.5 block font-medium">Pattern name</label>
              <input
                className="w-full text-sm border border-warm-line rounded-lg px-3 py-2.5 bg-linen/40 focus:outline-none focus:border-studio focus:ring-2 focus:ring-studio/20 placeholder:text-warm-faint transition-all"
                placeholder="e.g. Floral Pillow"
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
            </div>

            <div>
              <label className="text-xs text-warm-stone mb-1.5 block font-medium">Mesh count (threads per inch)</label>
              <div className="flex gap-2 flex-wrap">
                {MESH_COUNTS.map(m => (
                  <button
                    key={m}
                    onClick={() => setMeshCount(m)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      meshCount === m
                        ? 'bg-studio text-white shadow-sm'
                        : 'bg-warm-surface hover:bg-warm-line text-warm-stone'
                    }`}
                  >
                    {m}-count
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-warm-stone mb-1.5 block font-medium">Width (inches)</label>
                <input
                  type="number" min="1" max="30" step="0.5"
                  className="w-full text-sm border border-warm-line rounded-lg px-3 py-2.5 bg-linen/40 focus:outline-none focus:border-studio focus:ring-2 focus:ring-studio/20 transition-all"
                  value={widthIn}
                  onChange={e => setWidthIn(Number(e.target.value))}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-warm-stone mb-1.5 block font-medium">Height (inches)</label>
                <input
                  type="number" min="1" max="30" step="0.5"
                  className="w-full text-sm border border-warm-line rounded-lg px-3 py-2.5 bg-linen/40 focus:outline-none focus:border-studio focus:ring-2 focus:ring-studio/20 transition-all"
                  value={heightIn}
                  onChange={e => setHeightIn(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="text-xs text-warm-faint bg-warm-surface rounded-lg px-3 py-2.5 flex items-center gap-2">
              <span>{Math.round(widthIn * meshCount)} × {Math.round(heightIn * meshCount)} stitches</span>
              <span className="text-warm-line">·</span>
              <span>{cellCount.toLocaleString()} cells total</span>
            </div>

            <button
              onClick={handleCreate}
              disabled={!title.trim()}
              className="w-full bg-studio hover:bg-studio-dark disabled:opacity-40 text-white text-sm py-3 rounded-xl font-semibold transition-all shadow-sm hover:shadow disabled:cursor-not-allowed"
            >
              Start stitching
            </button>
          </div>
        </div>

        {/* Import */}
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-warm-line" />
          <span className="text-xs text-warm-faint">or open existing</span>
          <div className="flex-1 border-t border-warm-line" />
        </div>

        <label className="block cursor-pointer">
          <div className="border-2 border-dashed border-warm-line hover:border-studio/50 hover:bg-studio-light/30 rounded-2xl p-5 text-center transition-all">
            <p className="text-sm text-warm-stone font-medium">Open a .needle file</p>
            <p className="text-xs text-warm-faint mt-0.5">Click to browse</p>
          </div>
          <input type="file" accept=".needle,.json" onChange={handleImport} className="hidden" />
        </label>

        {/* Saved projects */}
        {savedProjects.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-warm-faint uppercase tracking-widest mb-3">Recent</h2>
            <div className="space-y-2">
              {savedProjects.map(project => {
                const updated = new Date(project.updatedAt);
                const isToday = updated.toDateString() === new Date().toDateString();
                const dateLabel = isToday
                  ? updated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : updated.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

                return (
                  <div
                    key={project.id}
                    onClick={() => handleOpen(project)}
                    className="bg-white border border-warm-line rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:border-studio/40 hover:shadow-sm transition-all group"
                  >
                    <div className="flex-shrink-0 flex gap-px rounded-md overflow-hidden">
                      {project.palette.slice(0, 6).map(c => (
                        <div
                          key={c.id}
                          className="w-2.5 h-9"
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                      {project.palette.length === 0 && (
                        <div className="w-2.5 h-9 bg-warm-surface rounded-md" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-ink truncate">{project.title}</div>
                      <div className="text-xs text-warm-faint mt-0.5">
                        {project.width}×{project.height} · {project.meshCount}-count ·{' '}
                        {(project.width / project.meshCount).toFixed(1)}"×{(project.height / project.meshCount).toFixed(1)}"
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <div className="text-xs text-warm-stone">{dateLabel}</div>
                      <div className="text-xs text-warm-faint mt-0.5">
                        {project.palette.length} color{project.palette.length !== 1 ? 's' : ''}
                      </div>
                    </div>

                    <button
                      onClick={e => handleDelete(e, project.id)}
                      title="Delete project"
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-warm-faint hover:text-thread transition-all text-sm px-1"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
