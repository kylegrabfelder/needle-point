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
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">New Project</div>

        <div>
          <label className="text-xs text-gray-600 mb-1 block">Title</label>
          <input
            className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
        </div>

        <div>
          <label className="text-xs text-gray-600 mb-1 block">Mesh count (threads/inch)</label>
          <div className="flex gap-1 flex-wrap">
            {MESH_COUNTS.map(m => (
              <button
                key={m}
                onClick={() => setMeshCount(m)}
                className={`px-2 py-1 rounded text-xs font-medium ${
                  meshCount === m ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-gray-600 mb-1 block">Width (inches)</label>
            <input
              type="number" min="1" max="30" step="0.5"
              className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
              value={widthIn}
              onChange={e => setWidthIn(Number(e.target.value))}
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-600 mb-1 block">Height (inches)</label>
            <input
              type="number" min="1" max="30" step="0.5"
              className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
              value={heightIn}
              onChange={e => setHeightIn(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="text-xs text-gray-400">
          → {Math.round(widthIn * meshCount)} × {Math.round(heightIn * meshCount)} cells
        </div>

        <button
          onClick={handleCreate}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-1.5 rounded font-medium"
        >
          Create Project
        </button>

        <div className="border-t border-gray-100 pt-2">
          <label className="text-xs text-gray-500 block mb-1">Or import .needle file</label>
          <input type="file" accept=".needle,.json" onChange={handleImport} className="text-xs" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 flex flex-col gap-2">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Project</div>

      <input
        className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
        value={project.title}
        onChange={e => updateTitle(e.target.value)}
      />

      <div className="text-xs text-gray-400 space-y-0.5">
        <div>{project.width} × {project.height} stitches</div>
        <div>{(project.width / project.meshCount).toFixed(1)}" × {(project.height / project.meshCount).toFixed(1)}" at {project.meshCount}-count</div>
        <div>Last saved: {new Date(project.updatedAt).toLocaleTimeString()}</div>
      </div>

      <div className="flex gap-1 flex-col pt-1">
        <button
          onClick={() => exportProjectAsJSON(project)}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs py-1.5 rounded font-medium"
        >
          Export .needle file
        </button>
        <button
          onClick={() => { setShowNew(true); closeProject(); }}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs py-1.5 rounded font-medium"
        >
          New project
        </button>
      </div>
    </div>
  );
}
