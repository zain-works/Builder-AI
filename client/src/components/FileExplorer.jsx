import { FileCodeIcon, FileTextIcon, FolderIcon, FolderOpenIcon } from 'lucide-react';
import React, { useMemo, useState } from 'react';

const normalizePath = (path) => {
    if (!path) return '';
    return path.startsWith('/') ? path : '/' + path;
};

function buildTree(paths) {
    const root = [];

    for (const rawPath of paths.sort()) {
        if (!rawPath) continue;
        const isExplicitDir = rawPath.endsWith('/');
        const parts = rawPath.split("/").filter(Boolean);
        let current = root;

        for (let i = 0; i < parts.length; i++) {
            const name = parts[i];
            const isLast = i === parts.length - 1;
            const isDir = !isLast || isExplicitDir;
            const fullPath = "/" + parts.slice(0, i + 1).join("/");

            let existing = current.find((n) => n.name === name);

            if (!existing) {
                existing = {
                    name,
                    path: fullPath,
                    isDir: isDir,
                    children: [],
                };
                current.push(existing);
            } else {
                // If node exists but child files require it to be a directory, update isDir
                if (isDir) {
                    existing.isDir = true;
                }
            }

            current = existing.children;
        }
    }

    return root;
}

function getFileIcon(name) {
    if (name.endsWith(".css")) return <FileTextIcon size={14} className='text-sky-500' />;
    if (name.endsWith(".jsx") || name.endsWith(".js")) return <FileCodeIcon size={14} className='text-amber-500' />;
    if (name.endsWith(".json")) return <FileTextIcon size={14} className='text-emerald-500' />;
    return <FileTextIcon size={14} className='text-zinc-400' />;
}

function TreeItem({ node, activeFile, onFileSelect, depth = 0 }) {
    const [isOpen, setIsOpen] = useState(true);
    const isActive = normalizePath(node.path) === normalizePath(activeFile);

    if (node.isDir) {
        return (
            <div>
                <button
                    onClick={() => setIsOpen((prev) => !prev)}
                    className='w-full flex items-center gap-2 py-1 px-2 text-xs text-zinc-400 hover:text-zinc-200 select-none cursor-pointer rounded-md transition-colors'
                    style={{ paddingLeft: `${depth * 12 + 8}px` }}
                >
                    {isOpen ? (
                        <FolderOpenIcon size={14} className='text-zinc-400 opacity-80' />
                    ) : (
                        <FolderIcon size={14} className='text-zinc-400 opacity-80' />
                    )}
                    <span className='font-medium text-zinc-300'>{node.name}</span>
                </button>
                {isOpen && node.children.map((child) => (
                    <TreeItem
                        key={child.path}
                        node={child}
                        activeFile={activeFile}
                        onFileSelect={onFileSelect}
                        depth={depth + 1}
                    />
                ))}
            </div>
        );
    }

    return (
        <button
            onClick={() => onFileSelect(node.path)}
            className={`w-full flex items-center gap-2 py-1.5 px-2 text-xs transition-colors rounded-md cursor-pointer ${
                isActive
                    ? "bg-zinc-100 text-zinc-950 font-medium"
                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
            }`}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
            {getFileIcon(node.name)}
            <span className='truncate'>{node.name}</span>
        </button>
    );
}

const FileExplorer = ({ files, activeFile, onFileSelect }) => {
    const tree = useMemo(() => buildTree(Object.keys(files || {})), [files]);

    return (
        <div className="py-2 overflow-y-auto hide-scrollbar">
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                Files
            </p>

            {tree.map((node) => (
                <TreeItem
                    key={node.path}
                    node={node}
                    activeFile={activeFile}
                    onFileSelect={onFileSelect}
                />
            ))}
        </div>
    );
};

export default FileExplorer;