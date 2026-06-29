import { useState } from 'react';
import { useProjectStore, exportProjectAsJSON, importProjectFromFile } from '../../store/projectStore';
import type { MeshCount } from '../../types';

const MESH_COUNTS: MeshCount[] = [10, 13, 14, 18, 24];

export function ProjectPanel() {
  const { project, createProject, updateTitle, closeProject } = useProjectStore();
  const [showNew, setShowNew] = useState(!project);
  const [title, setTitle] = useState('My Pattern');
  const [meshCount, setMeshCount] = useState<MeshCount>(18);
  const [widthIn, setWidthIn] = useState(8);
  const [heightIn, setHeightIn] = useState(8);

  function handleCreate() {
    if (!title.trim()) return;
    createProject(title.trim(), meshCount, widthIn, heightIn);
    setShowNew(false);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const imported = await importProjectFromFile(file);
    useProjectStore.getState().loadProject(imported);
    e.target.value = '';
  }

  if (showNew || !project) {
    return (
      <div className="p-3 flex flex-col gap-3">
        <div className="text-xs font-semibold text-warm-faint uppercase tracking-widest">New Project</div>

        <div>
          <label className="text-xs text-warm-stone mb-1.5 block font-medium">Title</label>
          <input
            className="w-full text-sm border border-warm-line rounded-lg px-2.5 py-2 bg-linen/40 focus:outline-none focus:border-studio focus:ring-1 focus:ring-studio/20 transition-all"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
        </div>

        <div>
          <label className="text-xs text-warm-stone mb-1.5 block font-medium">Mesh count (threads/inch)</label>
          <div className="flex gap-1 flex-wrap">
            {MESH_COUNTS.map(m => (
              <button
                key={m}
                onClick={() => setMeshCount(m)}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  meshCount === m
                    ? 'bg-studio text-white'
                    : 'bg-warm-surface text-warm-stone hover:text-ink'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-warm-stone mb-1.5 block font-medium">Width (in)</label>
            <input
              type="number" min="1" max="30" step="0.5"
              className="w-full text-sm border border-warm-line rounded-lg px-2.5 py-2 bg-linen/40 focus:outline-none focus:border-studio focus:ring-1 focus:ring-studio/20 transition-all"
              value={widthIn}
              onChange={e => setWidthIn(Number(e.target.value))}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-warm-stone mb-1.5 block font-medium">Height (in)</label>
            <input
              type="number" min="1" max="30" step="0.5"
              className="w-full text-sm border border-warm-line rounded-lg px-2.5 py-2 bg-linen/40 focus:outline-none focus:border-studio focus:ring-1 focus:ring-studio/20 transition-all"
              value={heightIn}
              onChange={e => setHeightIn(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="text-xs text-warm-faint bg-warm-surface rounded-lg px-2.5 py-2">
          {Math.round(widthIn * meshCount)} × {Math.round(heightIn * meshCount)} cells
        </div>

        <button
          onClick={handleCreate}
          className="w-full bg-studio hover:bg-studio-dark text-white text-sm py-2 rounded-lg font-medium transition-colors"
        >
          Create Project
        </button>

        <div className="border-t border-warm-line pt-2">
          <label className="text-xs text-warm-stone block mb-1.5 font-medium">Or import .needle file</label>
          <input type="file" accept=".needle,.json" onChange={handleImport} className="text-xs text-warm-stone" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 flex flex-col gap-3">
      <div className="text-xs font-semibold text-warm-faint uppercase tracking-widest">Project</div>

      <input
        className="w-full text-sm border border-warm-line rounded-lg px-2.5 py-2 bg-linen/40 focus:outline-none focus:border-studio focus:ring-1 focus:ring-studio/20 transition-all text-ink font-medium"
        value={project.title}
        onChange={e => updateTitle(e.target.value)}
      />

      <div className="text-xs text-warm-stone space-y-1 bg-warm-surface rounded-lg px-2.5 py-2">
        <div className="text-ink font-medium">{project.width} × {project.height} stitches</div>
        <div className="text-warm-stone">
          {(project.width / project.meshCount).toFixed(1)}" × {(project.height / project.meshCount).toFixed(1)}" at {project.meshCount}-count
        </div>
        <div className="text-warm-faint">Saved {new Date(project.updatedAt).toLocaleTimeString()}</div>
      </div>

      <div className="flex flex-col gap-1.5">
        <button
          onClick={() => exportProjectAsJSON(project)}
          className="w-full bg-warm-surface hover:bg-warm-line text-warm-stone hover:text-ink text-xs py-2 rounded-lg font-medium transition-colors"
        >
          Export .needle file
        </button>
        <button
          onClick={() => { setShowNew(true); closeProject(); }}
          className="w-full bg-warm-surface hover:bg-warm-line text-warm-stone hover:text-ink text-xs py-2 rounded-lg font-medium transition-colors"
        >
          New project
        </button>
      </div>
    </div>
  );
}
