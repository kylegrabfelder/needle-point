import { useState, useEffect } from 'react';
import { useProjectStore, getProjectIds, loadProjectFromStorage, deleteProjectFromStorage, importProjectFromFile } from '../../store/projectStore';
import type { MeshCount, Project } from '../../types';

const MESH_COUNTS: MeshCount[] = [10, 13, 14, 18, 24];

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
    <div className="flex-1 overflow-y-auto bg-gray-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-2xl space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Needle Point Designer</h1>
          <p className="text-sm text-gray-500 mt-1">
            Design needlepoint patterns with real DMC thread colors.
          </p>
        </div>

        {/* New project form */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">New Project</h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-600 mb-1 block font-medium">Project Name</label>
              <input
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                placeholder="e.g. Floral Pillow"
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
            </div>

            <div>
              <label className="text-xs text-gray-600 mb-1 block font-medium">Mesh Count (threads per inch)</label>
              <div className="flex gap-2 flex-wrap">
                {MESH_COUNTS.map(m => (
                  <button
                    key={m}
                    onClick={() => setMeshCount(m)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      meshCount === m
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {m}-count
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-600 mb-1 block font-medium">Width (inches)</label>
                <input
                  type="number" min="1" max="30" step="0.5"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
                  value={widthIn}
                  onChange={e => setWidthIn(Number(e.target.value))}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-600 mb-1 block font-medium">Height (inches)</label>
                <input
                  type="number" min="1" max="30" step="0.5"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
                  value={heightIn}
                  onChange={e => setHeightIn(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
              {Math.round(widthIn * meshCount)} × {Math.round(heightIn * meshCount)} cells
              ({cellCount.toLocaleString()} stitches total)
            </div>

            <button
              onClick={handleCreate}
              disabled={!title.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm py-2.5 rounded-lg font-semibold transition-colors"
            >
              Create Project
            </button>
          </div>
        </div>

        {/* Import */}
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        <label className="block cursor-pointer">
          <div className="border-2 border-dashed border-gray-200 hover:border-blue-300 rounded-xl p-4 text-center transition-colors">
            <p className="text-sm text-gray-500 font-medium">Open a .needle file</p>
            <p className="text-xs text-gray-400 mt-0.5">Click to browse</p>
          </div>
          <input type="file" accept=".needle,.json" onChange={handleImport} className="hidden" />
        </label>

        {/* Saved projects */}
        {savedProjects.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Recent Projects</h2>
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
                    className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all group"
                  >
                    {/* Color preview */}
                    <div className="flex-shrink-0 flex gap-0.5">
                      {project.palette.slice(0, 6).map(c => (
                        <div
                          key={c.id}
                          className="w-3 h-8 rounded-sm"
                          style={{ backgroundColor: c.hex }}
                        />
                      ))}
                      {project.palette.length === 0 && (
                        <div className="w-3 h-8 rounded-sm bg-gray-100" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-800 truncate">{project.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {project.width}×{project.height} · {project.meshCount}-count ·{' '}
                        {(project.width / project.meshCount).toFixed(1)}"×{(project.height / project.meshCount).toFixed(1)}"
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <div className="text-xs text-gray-400">{dateLabel}</div>
                      <div className="text-xs text-gray-300">{project.palette.length} color{project.palette.length !== 1 ? 's' : ''}</div>
                    </div>

                    <button
                      onClick={e => handleDelete(e, project.id)}
                      title="Delete project"
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-sm px-1"
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
