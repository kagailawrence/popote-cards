'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { MapPin, Plus, Edit2, Trash2, RefreshCw, Search, Layers, X, Save, AlertCircle } from 'lucide-react'

interface County {
  id: string
  name: string
}

interface SubCounty {
  id: string
  county_id: string
  name: string
  zone: 'cbd' | 'outskirts'
  county_name?: string
}

interface LocationsTabProps {
  token: string
}

export default function LocationsTab({ token }: LocationsTabProps) {
  const [counties, setCounties] = useState<County[]>([])
  const [subCounties, setSubCounties] = useState<SubCounty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Search and Filter States
  const [selectedCountyId, setSelectedCountyId] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Add County Modal State
  const [showAddCounty, setShowAddCounty] = useState(false)
  const [newCountyName, setNewCountyName] = useState('')

  // Add Sub-County Modal State
  const [showAddSubCounty, setShowAddSubCounty] = useState(false)
  const [newSubCountyName, setNewSubCountyName] = useState('')
  const [newSubCountyCountyId, setNewSubCountyCountyId] = useState('')
  const [newSubCountyZone, setNewSubCountyZone] = useState<'cbd' | 'outskirts'>('cbd')

  // Edit State
  const [editingCounty, setEditingCounty] = useState<County | null>(null)
  const [editingCountyName, setEditingCountyName] = useState('')

  const [editingSubCounty, setEditingSubCounty] = useState<SubCounty | null>(null)
  const [editingSubCountyName, setEditingSubCountyName] = useState('')
  const [editingSubCountyZone, setEditingSubCountyZone] = useState<'cbd' | 'outskirts'>('cbd')

  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      // Fetch counties
      const countiesRes = await fetch('/api/v1/locations/counties', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const countiesData = await countiesRes.json()
      if (!countiesRes.ok) throw new Error(countiesData.error || 'Failed to fetch counties')
      setCounties(countiesData.data || [])

      // Fetch all sub-counties
      const subRes = await fetch('/api/v1/locations/sub-counties', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const subData = await subRes.json()
      if (!subRes.ok) throw new Error(subData.error || 'Failed to fetch sub-counties')
      setSubCounties(subData.data || [])
    } catch (err: any) {
      setError(err.message || 'Error loading locations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [token])

  // --- Counties Actions ---
  const handleAddCounty = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCountyName.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/v1/locations/counties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newCountyName.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add county')
      
      toast.success(`County '${newCountyName.trim()}' added!`)
      setNewCountyName('')
      setShowAddCounty(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Error adding county')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateCounty = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCounty || !editingCountyName.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/v1/locations/counties/${editingCounty.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: editingCountyName.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update county')

      toast.success('County updated successfully!')
      setEditingCounty(null)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Error updating county')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteCounty = (id: string) => {
    toast('Delete this county?', {
      description: 'All associated sub-counties may become orphaned.',
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            const res = await fetch(`/api/v1/locations/counties/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to delete county')
            toast.success('County removed')
            fetchData()
          } catch (err: any) {
            toast.error(err.message || 'Error deleting county')
          }
        },
      },
      cancel: { label: 'Cancel', onClick: () => {} },
    })
  }

  // --- Sub-Counties Actions ---
  const handleAddSubCounty = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubCountyName.trim() || !newSubCountyCountyId) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/v1/locations/sub-counties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          countyId: newSubCountyCountyId,
          name: newSubCountyName.trim(),
          zone: newSubCountyZone
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add sub-county')

      toast.success(`Sub-county '${newSubCountyName.trim()}' added!`)
      setNewSubCountyName('')
      setShowAddSubCounty(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Error adding sub-county')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateSubCounty = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSubCounty || !editingSubCountyName.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/v1/locations/sub-counties/${editingSubCounty.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editingSubCountyName.trim(),
          zone: editingSubCountyZone
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update sub-county')

      toast.success('Sub-county updated successfully!')
      setEditingSubCounty(null)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || 'Error updating sub-county')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSubCounty = (id: string) => {
    toast('Delete this sub-county?', {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            const res = await fetch(`/api/v1/locations/sub-counties/${id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to delete sub-county')
            toast.success('Sub-county removed')
            fetchData()
          } catch (err: any) {
            toast.error(err.message || 'Error deleting sub-county')
          }
        },
      },
      cancel: { label: 'Cancel', onClick: () => {} },
    })
  }

  // --- Filtering ---
  const filteredSubCounties = subCounties.filter(sc => {
    const matchesCounty = selectedCountyId === 'all' || sc.county_id === selectedCountyId
    const matchesSearch = sc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (sc.county_name && sc.county_name.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCounty && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Overview/Header banner */}
      <div className="p-5 rounded-3xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-pink-500/20 text-pink-500 flex items-center justify-center font-bold">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">Counties & Sub-Counties Logistics Directory</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Manage destination routing regions, pricing zones (CBD vs Outskirts), and shipping coverage.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setNewSubCountyCountyId(counties[0]?.id || '')
              setShowAddSubCounty(true)
            }}
            disabled={counties.length === 0}
            className="px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" /> Add Sub-County
          </button>
          <button
            onClick={() => setShowAddCounty(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4 text-pink-500" /> Add County
          </button>
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 transition-all hover:bg-slate-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-500 animate-pulse">Loading location matrices...</div>
      ) : error ? (
        <div className="p-6 text-center text-xs text-red-500">{error}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Counties Registry */}
          <div className="lg:col-span-1 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
              <Layers className="w-4 h-4 text-pink-500" /> Registered Counties ({counties.length})
            </h4>
            
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              <button
                onClick={() => setSelectedCountyId('all')}
                className={`w-full text-left p-3 rounded-2xl text-xs font-bold transition-all border ${
                  selectedCountyId === 'all'
                    ? 'bg-pink-500/10 border-pink-500/30 text-pink-700 dark:text-pink-400 font-extrabold'
                    : 'bg-slate-50 dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:bg-slate-100'
                }`}
              >
                🌍 Show All Counties
              </button>

              {counties.map(c => (
                <div
                  key={c.id}
                  className={`group w-full flex items-center justify-between p-3 rounded-2xl text-xs transition-all border ${
                    selectedCountyId === c.id
                      ? 'bg-pink-500/10 border-pink-500/30 text-pink-700 dark:text-pink-400 font-bold'
                      : 'bg-slate-50 dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:bg-slate-100'
                  }`}
                >
                  <button
                    onClick={() => setSelectedCountyId(c.id)}
                    className="flex-1 text-left font-bold"
                  >
                    📍 {c.name}
                  </button>
                  <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingCounty(c)
                        setEditingCountyName(c.name)
                      }}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCounty(c.id)}
                      className="p-1 rounded text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Sub-counties & Logistics Parameters */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Fulfillment Nodes ({filteredSubCounties.length})
              </h4>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search sub-county..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-950 dark:text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-zinc-100 dark:border-zinc-800/80 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-semibold text-[10px] border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="p-3">Sub-County Name</th>
                    <th className="p-3">Parent County</th>
                    <th className="p-3">Pricing Zone</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {filteredSubCounties.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400 italic">
                        No sub-counties found matching the filters.
                      </td>
                    </tr>
                  ) : (
                    filteredSubCounties.map(sc => (
                      <tr key={sc.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="p-3 font-bold text-slate-800 dark:text-zinc-200">{sc.name}</td>
                        <td className="p-3 text-slate-500 dark:text-zinc-400">{sc.county_name}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            sc.zone === 'cbd'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}>
                            {sc.zone}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingSubCounty(sc)
                                setEditingSubCountyName(sc.name)
                                setEditingSubCountyZone(sc.zone)
                              }}
                              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSubCounty(sc.id)}
                              className="p-1 rounded text-slate-400 hover:text-red-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD COUNTY DIALOG --- */}
      {showAddCounty && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Add New County</h3>
              <button onClick={() => setShowAddCounty(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddCounty} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-zinc-400">County Name</label>
                <input
                  type="text" required value={newCountyName} onChange={e => setNewCountyName(e.target.value)} placeholder="e.g. Mombasa"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:ring-1 focus:ring-pink-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddCounty(false)} className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 font-bold text-slate-700 dark:text-zinc-300">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-extrabold shadow-md shadow-pink-500/20">{submitting ? 'Creating...' : 'Create County'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT COUNTY DIALOG --- */}
      {editingCounty && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Rename County</h3>
              <button onClick={() => setEditingCounty(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleUpdateCounty} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-zinc-400">County Name</label>
                <input
                  type="text" required value={editingCountyName} onChange={e => setEditingCountyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditingCounty(null)} className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 font-bold text-slate-700 dark:text-zinc-300">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-extrabold shadow-md shadow-pink-500/20">{submitting ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD SUB-COUNTY DIALOG --- */}
      {showAddSubCounty && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Add Sub-County</h3>
              <button onClick={() => setShowAddSubCounty(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleAddSubCounty} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-zinc-400">Parent County</label>
                <select
                  value={newSubCountyCountyId} onChange={e => setNewSubCountyCountyId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white font-semibold"
                >
                  {counties.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-zinc-400">Sub-County Name</label>
                <input
                  type="text" required value={newSubCountyName} onChange={e => setNewSubCountyName(e.target.value)} placeholder="e.g. Nyali"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-zinc-400">Pricing Zone</label>
                <select
                  value={newSubCountyZone} onChange={e => setNewSubCountyZone(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white"
                >
                  <option value="cbd">CBD (Central Business District)</option>
                  <option value="outskirts">Outskirts (Higher Shipping / Long-distance)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddSubCounty(false)} className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 font-bold text-slate-700 dark:text-zinc-300">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-extrabold shadow-md shadow-pink-500/20">{submitting ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT SUB-COUNTY DIALOG --- */}
      {editingSubCounty && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Edit Sub-County</h3>
              <button onClick={() => setEditingSubCounty(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleUpdateSubCounty} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-zinc-400">Sub-County Name</label>
                <input
                  type="text" required value={editingSubCountyName} onChange={e => setEditingSubCountyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-600 dark:text-zinc-400">Pricing Zone</label>
                <select
                  value={editingSubCountyZone} onChange={e => setEditingSubCountyZone(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-slate-900 dark:text-white"
                >
                  <option value="cbd">CBD (Central Business District)</option>
                  <option value="outskirts">Outskirts (Higher Shipping / Long-distance)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditingSubCounty(null)} className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 font-bold text-slate-700 dark:text-zinc-300">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-extrabold shadow-md shadow-pink-500/20">{submitting ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
