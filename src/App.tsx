import {
  Check,
  Copy,
  Folder,
  FolderPlus,
  HardDrive,
  Image,
  LoaderCircle,
  MoreHorizontal,
  RefreshCw,
  Search,
  Share2,
  Upload,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { open } from '@tauri-apps/plugin-dialog'

type FolderEntry = {
  key: string
  name: string
}

type FileEntry = {
  key: string
  name: string
  size: number
  etag: string
  last_modified: string
  mime_type: string
  public_url: string
}

type DirectoryListing = {
  prefix: string
  folders: FolderEntry[]
  files: FileEntry[]
}

type ConnectionInfo = {
  bucket: string
  region: string
  public_base: string
}

type UploadRequest = {
  local_path: string
  relative_path?: string
}

type UploadProgressPayload = {
  file_id: string
  file_name: string
  key: string
  progress: number
  uploaded_bytes: number
  total_bytes: number
  status: 'uploading' | 'completed' | 'failed'
  error?: string | null
}

type QueueItem = {
  id: string
  fileName: string
  key: string
  progress: number
  uploadedBytes: number
  totalBytes: number
  status: 'uploading' | 'completed' | 'failed'
  error?: string
}

function formatSize(size: number): string {
  if (size === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1)
  const value = size / Math.pow(1024, i)
  return `${value.toFixed(value >= 10 ? 0 : 2)} ${units[i]}`
}

function formatDate(value: string): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString()
}

function folderDepth(key: string): number {
  const trimmed = key.replace(/\/$/, '')
  return trimmed.split('/').length - 1
}

function folderLabel(key: string): string {
  const trimmed = key.replace(/\/$/, '')
  return trimmed.split('/').pop() ?? trimmed
}

function breadcrumbParts(prefix: string): string[] {
  const trimmed = prefix.replace(/\/$/, '')
  return trimmed ? trimmed.split('/') : []
}

function App() {
  const [connection, setConnection] = useState<ConnectionInfo | null>(null)
  const [currentPrefix, setCurrentPrefix] = useState('')
  const [listing, setListing] = useState<DirectoryListing | null>(null)
  const [tree, setTree] = useState<string[]>([])
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [dragActive, setDragActive] = useState(false)
  const uploadQueueRef = useRef<HTMLDivElement | null>(null)

  const filteredFolders = useMemo(() => {
    if (!listing) return []
    const q = search.trim().toLowerCase()
    if (!q) return listing.folders
    return listing.folders.filter((folder) => folder.name.toLowerCase().includes(q))
  }, [listing, search])

  const filteredFiles = useMemo(() => {
    if (!listing) return []
    const q = search.trim().toLowerCase()
    if (!q) return listing.files
    return listing.files.filter((file) => file.name.toLowerCase().includes(q))
  }, [listing, search])

  async function loadCurrentDirectory(prefix: string) {
    const response = await invoke<DirectoryListing>('list_directory', {
      prefix: prefix || null,
    })
    setListing(response)
  }

  async function loadTree() {
    const response = await invoke<string[]>('list_tree')
    setTree(response)
  }

  async function loadConnection() {
    const response = await invoke<ConnectionInfo>('get_connection_info')
    setConnection(response)
  }

  async function refresh(prefix = currentPrefix) {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([loadConnection(), loadTree(), loadCurrentDirectory(prefix)])
      setCurrentPrefix(prefix)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const unregister = Promise.all([
      listen<UploadProgressPayload>('upload-progress', (event) => {
        const payload = event.payload
        setQueue((prev) => {
          const next = [...prev]
          const idx = next.findIndex((item) => item.id === payload.file_id)
          const normalized: QueueItem = {
            id: payload.file_id,
            key: payload.key,
            fileName: payload.file_name,
            progress: payload.progress,
            uploadedBytes: payload.uploaded_bytes,
            totalBytes: payload.total_bytes,
            status: payload.status,
            error: payload.error ?? undefined,
          }

          if (idx >= 0) {
            next[idx] = normalized
          } else {
            next.unshift(normalized)
          }

          return next
        })
      }),
      listen('open-recent-uploads', () => {
        uploadQueueRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }),
      getCurrentWindow().onDragDropEvent((event) => {
        if (event.payload.type === 'over') {
          setDragActive(true)
          return
        }

        if (event.payload.type === 'drop') {
          setDragActive(false)
          const entries = event.payload.paths.map((path) => ({ local_path: path }))
          void startUpload(entries)
          return
        }

        setDragActive(false)
      }),
    ])

    return () => {
      void unregister.then((fns) => fns.forEach((fn) => fn()))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPrefix])

  async function openFolder(prefix: string) {
    setSelectedFile(null)
    setCurrentPrefix(prefix)
    setLoading(true)
    setError(null)
    try {
      await loadCurrentDirectory(prefix)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  async function createFolderAtCurrent() {
    const name = window.prompt('Folder name')?.trim()
    if (!name) return

    const path = currentPrefix
      ? `${currentPrefix.replace(/\/$/, '')}/${name}`
      : name

    setLoading(true)
    setError(null)
    try {
      await invoke('create_folder', { path })
      await Promise.all([loadTree(), loadCurrentDirectory(currentPrefix)])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  async function startUpload(entries: UploadRequest[]) {
    if (!entries.length) return
    setUploading(true)
    setError(null)

    try {
      await invoke('upload_entries', {
        targetPrefix: currentPrefix,
        entries,
      })
      await Promise.all([loadTree(), loadCurrentDirectory(currentPrefix)])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setUploading(false)
    }
  }

  async function pickFiles() {
    const selected = await open({ multiple: true, directory: false })
    if (!selected) return

    const paths = Array.isArray(selected) ? selected : [selected]
    const entries = paths.map((path) => ({ local_path: path }))
    await startUpload(entries)
  }

  async function pickFolder() {
    const selected = await open({ multiple: true, directory: true })
    if (!selected) return

    const paths = Array.isArray(selected) ? selected : [selected]
    const entries = paths.map((path) => ({ local_path: path }))
    await startUpload(entries)
  }

  async function copyUrl() {
    if (!selectedFile) return
    await navigator.clipboard.writeText(selectedFile.public_url)
  }

  const breadcrumbs = breadcrumbParts(currentPrefix)

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#030913] text-[#d3e3ff]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(45,122,255,0.34)_0,transparent_54%),radial-gradient(circle_at_85%_20%,rgba(29,72,191,0.36)_0,transparent_45%),linear-gradient(180deg,#040b18_0%,#020712_100%)]" />

      <main className="relative flex h-full min-h-0 flex-col p-4 md:p-6">
        <div className="glass mb-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#1f334f]">
          <header className="flex flex-wrap items-center gap-3 border-b border-[#1a2a43] px-4 py-3">
            <div className="flex items-center gap-2 font-bold text-[#eef6ff]">
              <HardDrive className="h-4 w-4 text-[#3ca4ff]" />
              <span>R2 Explorer</span>
            </div>

            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7f9dc7]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search files and folders..."
                className="h-10 w-full rounded-lg border border-[#213a5d] bg-[#081426]/70 pl-9 pr-3 text-sm text-[#d3e3ff] outline-none ring-[#3ca4ff] placeholder:text-[#6f8cb4] focus:ring-1"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button onClick={createFolderAtCurrent} className="button-primary">
                <FolderPlus className="h-4 w-4" />
                New Folder
              </button>
              <button onClick={pickFiles} className="button-secondary">
                <Upload className="h-4 w-4" />
                Upload
              </button>
              <button onClick={() => refresh(currentPrefix)} className="button-secondary">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <button onClick={pickFolder} className="button-secondary">
                <Folder className="h-4 w-4" />
                Upload Folder
              </button>
            </div>
          </header>

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 md:grid-cols-[280px_1fr_300px]">
            <aside className="panel min-h-[220px] overflow-auto">
              <div className="mb-3 flex items-center justify-between border-b border-[#1a2a43] pb-3">
                <div>
                  <div className="text-sm text-[#7f9dc7]">Bucket</div>
                  <div className="font-bold text-[#f2f7ff]">{connection?.bucket ?? '—'}</div>
                </div>
                <MoreHorizontal className="h-4 w-4 text-[#6d8db6]" />
              </div>

              <button
                onClick={() => openFolder('')}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
                  currentPrefix === '' ? 'bg-[#122a4a] text-[#dff0ff]' : 'text-[#9ab7df] hover:bg-[#0d213b]'
                }`}
              >
                / (root)
              </button>

              <div className="mt-2 space-y-1">
                {tree.map((key) => {
                  const active = key === currentPrefix
                  const depth = folderDepth(key)
                  return (
                    <button
                      key={key}
                      onClick={() => openFolder(key)}
                      className={`flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm transition ${
                        active ? 'bg-[#12325a] text-[#dff0ff]' : 'text-[#9ab7df] hover:bg-[#0d213b]'
                      }`}
                      style={{ paddingLeft: `${12 + depth * 16}px` }}
                    >
                      <Folder className="h-4 w-4 shrink-0 text-[#6ea9ff]" />
                      <span className="truncate">{folderLabel(key)}</span>
                    </button>
                  )
                })}
              </div>
            </aside>

            <section className="panel min-h-[220px] overflow-hidden">
              <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-[#1a2a43] pb-3 text-sm text-[#86a4cb]">
                <button onClick={() => openFolder('')} className="hover:text-[#dff0ff]">root</button>
                {breadcrumbs.map((part, idx) => {
                  const path = `${breadcrumbs.slice(0, idx + 1).join('/')}/`
                  return (
                    <div key={path} className="flex items-center gap-2">
                      <span>/</span>
                      <button
                        onClick={() => openFolder(path)}
                        className={`hover:text-[#dff0ff] ${idx === breadcrumbs.length - 1 ? 'font-bold text-[#e4f1ff]' : ''}`}
                      >
                        {part}
                      </button>
                    </div>
                  )
                })}
              </div>

              <div className="h-[calc(100%-44px)] overflow-auto">
                {loading ? (
                  <div className="flex h-full items-center justify-center gap-2 text-[#89a9d2]">
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                    Loading...
                  </div>
                ) : error ? (
                  <div className="flex h-full items-center justify-center text-sm text-[#ff8f8f]">{error}</div>
                ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-[#86a4cb]">
                    <Folder className="h-7 w-7" />
                    <p className="font-bold text-[#dff0ff]">Empty folder</p>
                    <p className="text-sm">Drop files here or click Upload.</p>
                  </div>
                ) : (
                  <table className="w-full table-fixed text-left text-sm">
                    <thead className="text-[#7f9dc7]">
                      <tr className="border-b border-[#1a2a43]">
                        <th className="w-[45%] px-3 py-2">Name</th>
                        <th className="w-[20%] px-3 py-2">Type</th>
                        <th className="w-[15%] px-3 py-2">Size</th>
                        <th className="w-[20%] px-3 py-2">Modified</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFolders.map((folder) => (
                        <tr
                          key={folder.key}
                          onDoubleClick={() => openFolder(folder.key)}
                          className="cursor-pointer border-b border-[#14253d] text-[#cae1ff] hover:bg-[#0c2037]/90"
                        >
                          <td className="truncate px-3 py-2">
                            <div className="flex items-center gap-2">
                              <Folder className="h-4 w-4 text-[#6ea9ff]" />
                              <span>{folder.name}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-[#86a4cb]">Folder</td>
                          <td className="px-3 py-2 text-[#86a4cb]">—</td>
                          <td className="px-3 py-2 text-[#86a4cb]">—</td>
                        </tr>
                      ))}

                      {filteredFiles.map((file) => (
                        <tr
                          key={file.key}
                          onClick={() => setSelectedFile(file)}
                          className={`cursor-pointer border-b border-[#14253d] hover:bg-[#0c2037]/90 ${
                            selectedFile?.key === file.key ? 'bg-[#12335b]' : 'text-[#cae1ff]'
                          }`}
                        >
                          <td className="truncate px-3 py-2">
                            <div className="flex items-center gap-2">
                              <Image className="h-4 w-4 text-[#75b3ff]" />
                              <span>{file.name}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-[#86a4cb]">{file.mime_type}</td>
                          <td className="px-3 py-2 text-[#86a4cb]">{formatSize(file.size)}</td>
                          <td className="px-3 py-2 text-[#86a4cb]">{formatDate(file.last_modified)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            <aside className="panel min-h-[220px] overflow-auto">
              <div className="mb-2 border-b border-[#1a2a43] pb-2 font-bold text-[#eef6ff]">Details</div>

              {!selectedFile ? (
                <div className="pt-6 text-sm text-[#86a4cb]">Select a file to view details.</div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border border-[#21416b] bg-[#0a192f]/80 p-3">
                    <p className="truncate font-bold text-[#eaf4ff]">{selectedFile.name}</p>
                    <p className="mt-1 text-xs text-[#8aabd1]">{selectedFile.mime_type}</p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <div className="text-[#7f9dc7]">Size</div>
                      <div>{formatSize(selectedFile.size)}</div>
                    </div>
                    <div>
                      <div className="text-[#7f9dc7]">Last Modified</div>
                      <div>{formatDate(selectedFile.last_modified)}</div>
                    </div>
                    <div>
                      <div className="text-[#7f9dc7]">ETag</div>
                      <div className="truncate text-[#9abbdf]">{selectedFile.etag || '—'}</div>
                    </div>
                    <div>
                      <div className="text-[#7f9dc7]">Public URL</div>
                      <a
                        href={selectedFile.public_url}
                        className="block truncate text-[#66b0ff] underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {selectedFile.public_url}
                      </a>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button onClick={copyUrl} className="button-primary flex-1">
                      <Copy className="h-4 w-4" />
                      Copy URL
                    </button>
                    <button
                      onClick={() => window.open(selectedFile.public_url, '_blank', 'noopener,noreferrer')}
                      className="button-secondary flex-1"
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </button>
                  </div>
                </div>
              )}
            </aside>
          </div>

          <section
            ref={uploadQueueRef}
            className={`mx-3 mb-3 rounded-xl border px-4 py-3 transition ${
              dragActive ? 'border-[#3fa9ff] bg-[#102645]/90' : 'border-[#1f334f] bg-[#081425]/60'
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="font-bold text-[#eff6ff]">Upload Queue</div>
              {uploading && (
                <div className="flex items-center gap-2 text-sm text-[#8ab0dd]">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Uploading...
                </div>
              )}
            </div>

            <p className="mb-3 text-sm text-[#89a9d2]">
              Drag and drop files or folders anywhere in this window.
            </p>

            <div className="space-y-2">
              {queue.length === 0 ? (
                <div className="text-sm text-[#89a9d2]">No uploads yet.</div>
              ) : (
                queue.map((item) => (
                  <div key={item.id} className="rounded-lg border border-[#1e3555] bg-[#0a1a30]/80 p-2">
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="truncate text-[#d8e9ff]">{item.fileName}</span>
                      <span className="text-[#89a9d2]">{Math.round(item.progress)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded bg-[#11263f]">
                      <div className="h-full bg-[#2f9cff] transition-all" style={{ width: `${item.progress}%` }} />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-[#7f9dc7]">
                      <span>
                        {formatSize(item.uploadedBytes)} / {formatSize(item.totalBytes)}
                      </span>
                      <span className="flex items-center gap-1">
                        {item.status === 'completed' && <Check className="h-3.5 w-3.5 text-[#4ad483]" />}
                        {item.status === 'failed' ? item.error ?? 'Failed' : item.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default App
