'use client'

import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, MapPin, Phone, CreditCard, Building2, Landmark, Globe, ArrowLeft, MoreVertical, UserCheck, Zap } from 'lucide-react'
import ElectricityPaymentForm from '@/components/form/form-elements/ElectricityPayments'
import RentEscalationTable from '@/components/form/form-elements/RentEscalationTable'
import { Toaster } from 'react-hot-toast'
import Badge from '@/components/ui/badge/Badge'

// ─── UI Helpers ───────────────────────────────────────────────────────────────

const SectionTitle = ({ title, count }: { title: string; count?: number }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <div className="w-1 h-5 bg-blue-600 rounded-full" />
      <h2 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">{title}</h2>
    </div>
    {count !== undefined && (
      <span className="text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">
        {count} {count === 1 ? 'Owner' : 'Owners'}
      </span>
    )}
  </div>
);

const InfoCard = ({ label, value, icon: Icon }: { label: string; value: any; icon?: any }) => (
  <div className="flex flex-col gap-1 p-3 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05]">
    <div className="flex items-center gap-1.5">
      {Icon && <Icon size={11} className="text-gray-400" />}
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
    </div>
    <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
      {value || <span className="text-gray-300 font-normal italic">—</span>}
    </span>
  </div>
);

const Page = () => {
  const [sites, setSites] = useState<any[]>([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSite, setSelectedSite] = useState<any>(null)
  const [siteDetails, setSiteDetails] = useState<any>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [expandedOwners, setExpandedOwners] = useState<{ [key: number]: boolean }>({})
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const [selectedBank, setSelectedBank] = useState<string>('')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const bankNames = Array.from(new Set(sites.map(site => site.addedBankName || site.added_bank_name).filter(Boolean)))

  const filtered = sites.filter(site => {
    const matchesQuery = query.trim() === '' || (site.siteName || site.site_name || '').toLowerCase().includes(query.toLowerCase()) || (site.code || '').toLowerCase().includes(query.toLowerCase())
    const matchesBank = selectedBank === '' || (site.addedBankName || site.added_bank_name) === selectedBank
    return matchesQuery && matchesBank
  })

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginatedSites = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePageChange = (page: number) => { setCurrentPage(page) }

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) throw new Error("Token not found in localStorage")
        const url = `${process.env.NEXT_PUBLIC_API_URL}/api/rent/sites`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } })
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`)
        const data = await res.json()
        const siteList = data.data || data.sites || (Array.isArray(data) ? data : [])
        setSites(siteList)
        setError(null)
      } catch (error: any) {
        console.error("Failed to fetch sites:", error)
        setError(error.message || "Error fetching sites")
        setSites([])
      } finally {
        setLoading(false)
      }
    }
    fetchSites()
  }, [])

  const fetchSiteDetails = async (siteId: string) => {
    setLoadingDetails(true)
    setSiteDetails(null)
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("Token not found in localStorage")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rent/sites/${siteId}`, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } })
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`)
      const data = await res.json()
      const details = data.data || data
      console.log("Fetched Electricity Site Details:", details);
      setSiteDetails(details)
      const owners = details.owners || details.ownerId || []
      if (owners.length > 0) {
        const initialOwnerState: { [key: number]: boolean } = {}
        owners.forEach((_: any, index: number) => { initialOwnerState[index] = false })
        setExpandedOwners(initialOwnerState)
      }
      setError(null)
    } catch (error: any) {
      console.error("Failed to fetch site details:", error)
      setError(error.message || "Error fetching site details")
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleSiteClick = async (site: any) => {
    console.log("Electricity Site Clicked:", site);
    setSelectedSite(site)
    await fetchSiteDetails(site._id || site.id)
  }

  const handleBackToSearch = () => { setSelectedSite(null); setSiteDetails(null) }

  const toggleOwner = (index: number) => {
    setExpandedOwners(prev => ({ ...prev, [index]: !prev[index] }))
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A'
    try { return new Date(dateString).toLocaleDateString() } catch (e) { return 'Invalid Date' }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Toaster position="top-center" />

      {!selectedSite ? (
        /* ─── SEARCH VIEW ─── */
        <div className="">
          <div className="">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Electricity Payment</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Search and select a site to record electricity payment</p>
          </div>

          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Zap size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by site name or code..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.05] text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
              />
            </div>
            <div className="relative min-w-[200px]">
              <button
                type="button"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.05] text-sm text-gray-700 dark:text-white text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                onClick={() => setDropdownOpen((open) => !open)}
              >
                <span>{selectedBank || 'All Banks'}</span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {dropdownOpen && (
                <div className="absolute z-20 top-full mt-1 w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/[0.1] rounded-lg shadow-xl max-h-60 overflow-auto">
                  <div
                    className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-zinc-700 ${selectedBank === '' ? 'font-semibold text-blue-600' : 'text-gray-700 dark:text-gray-200'}`}
                    onClick={() => { setSelectedBank(''); setDropdownOpen(false); setCurrentPage(1); }}
                  >All Banks</div>
                  {bankNames.map((bank: any) => (
                    <div
                      key={bank}
                      className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-blue-50 dark:hover:bg-zinc-700 ${selectedBank === bank ? 'font-semibold text-blue-600' : 'text-gray-700 dark:text-gray-200'}`}
                      onClick={() => { setSelectedBank(bank); setDropdownOpen(false); setCurrentPage(1); }}
                    >{bank}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent" />
              <p className="text-sm text-gray-400 font-medium">Loading sites...</p>
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
              <MoreVertical size={16} />{error}
            </div>
          ) : (
            <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] rounded-xl overflow-hidden shadow-sm">
              <div className="grid grid-cols-4 gap-4 px-5 py-3 bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/[0.05]">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Site Name</span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Location</span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Owner</span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bank</span>
              </div>
              {paginatedSites.length > 0 ? (
                paginatedSites.map(site => (
                  <div
                    key={site._id || site.id}
                    className="grid grid-cols-4 gap-4 px-5 py-4 border-b border-gray-50 dark:border-white/[0.03] last:border-b-0 cursor-pointer hover:bg-blue-50/50 dark:hover:bg-white/[0.03] transition-colors group"
                    onClick={() => handleSiteClick(site)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center text-yellow-600 font-bold text-sm flex-shrink-0">
                        {(site.siteName || site.site_name || 'S').charAt(0)}
                      </div>
                      <span className="text-sm font-semibold text-gray-800 dark:text-white group-hover:text-blue-600 transition-colors truncate">{site.siteName || site.site_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                      <MapPin size={13} className="flex-shrink-0" />
                      <span className="truncate">{site.propertyLocation || site.property_location || '—'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                      <UserCheck size={13} className="flex-shrink-0" />
                      <span className="truncate">{site.ownerName || site.owner_name || (site.owners?.[0]?.ownerId?.ownerName || site.owners?.[0]?.ownerName) || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <CreditCard size={13} className="flex-shrink-0" />
                        <span className="truncate">{site.addedBankName || site.added_bank_name || (site.owners?.[0]?.bankAccount?.bankName || site.owners?.[0]?.ownerBankName) || '—'}</span>
                      </div>
                      <ChevronDown size={14} className="text-gray-300 group-hover:text-blue-400 flex-shrink-0 transition-colors" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-2">
                  <Zap size={32} className="text-gray-200 dark:text-gray-700" />
                  <p className="text-sm text-gray-400 font-medium">No sites found{query ? ` for "${query}"` : ''}</p>
                </div>
              )}
              {totalPages > 1 && (
                <div className="flex justify-between items-center px-5 py-3 border-t border-gray-100 dark:border-white/[0.05]">
                  <p className="text-xs text-gray-400">Page {currentPage} of {totalPages}</p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.05] text-gray-600 dark:text-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">Prev</button>
                    {[...Array(totalPages)].map((_, idx) => (
                      <button key={idx} onClick={() => handlePageChange(idx + 1)} className={`w-8 h-8 text-xs font-medium rounded-lg border transition ${currentPage === idx + 1 ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.05] text-gray-600 dark:text-gray-300 hover:bg-gray-50'}`}>{idx + 1}</button>
                    ))}
                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-white/[0.05] text-gray-600 dark:text-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">Next</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ─── DETAIL VIEW ─── */
        <div className="flex flex-col h-full">
          {/* Header Bar */}
          <div className="bg-transparent border-b border-gray-200 dark:border-white/[0.08] px-6 py-2 flex items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-yellow-500 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                {(siteDetails?.siteName || siteDetails?.site_name || 'S').charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base font-bold text-gray-900 dark:text-white truncate">
                    {siteDetails?.siteName || siteDetails?.site_name || 'Site Details'}
                  </h1>
                  <Badge size="sm" color="info" variant="light">Electricity</Badge>
                  {siteDetails?.code && (
                    <span className="text-xs font-mono text-gray-400 bg-gray-100 dark:bg-white/[0.06] px-2 py-0.5 rounded">{siteDetails.code}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  {(siteDetails?.propertyLocation || siteDetails?.property_location) && (
                    <span className="flex items-center gap-1 text-xs text-gray-400"><MapPin size={11} />{siteDetails.propertyLocation || siteDetails.property_location}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          {loadingDetails ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-r-transparent" />
              <p className="text-sm text-gray-400 font-medium">Loading site details...</p>
            </div>
          ) : siteDetails ? (
            <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-0">

              {/* LEFT COLUMN — Form + Participants */}
              <div className="xl:col-span-2 p-4 border-r border-gray-200 dark:border-white/[0.06]">
                <ElectricityPaymentForm
                  siteId={selectedSite._id || selectedSite.id}
                  owners={(siteDetails.owners || siteDetails.ownerId || []).map((owner: any) => ({
                    id: owner.ownerId?._id || owner._id || owner.id,
                    owner_name: owner.ownerId?.ownerName || owner.ownerName || owner.owner_name,
                    owner_monthly_rent: Number(owner.ownerMonthlyRent || owner.owner_monthly_rent) || 0
                  }))}
                  currentMonthlyRent={Number(siteDetails.monthlyRent || siteDetails.monthly_rent) || 0}
                  consumers={siteDetails.electricityConsumers || siteDetails.electricity_consumers || []}
                />

                <div className="mt-6">
                  <SectionTitle title="Active Participants" count={(siteDetails.owners || siteDetails.ownerId || []).length} />
                  <div className="space-y-2">
                    {(siteDetails.owners || siteDetails.ownerId || []).map((owner: any, index: number) => (
                      <div key={index} className="bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors" onClick={() => toggleOwner(index)}>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/[0.08] dark:to-white/[0.04] flex items-center justify-center text-gray-700 dark:text-white font-bold text-sm border border-gray-200 dark:border-white/[0.1] flex-shrink-0">
                              {(owner.ownerId?.ownerName || owner.ownerName || owner.owner_name)?.charAt(0) || 'O'}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-800 dark:text-white">{owner.ownerId?.ownerName || owner.ownerName || owner.owner_name || 'Unknown Owner'}</p>
                              <p className="text-xs text-gray-400 font-medium">₹{(owner.ownerMonthlyRent || 0).toLocaleString()} / month</p>
                            </div>
                          </div>
                          <div className={`p-1.5 rounded-md transition-colors ${expandedOwners[index] ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.05]'}`}>
                            {expandedOwners[index] ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </div>
                        </div>
                        {expandedOwners[index] && (
                          <div className="px-4 pb-4 pt-1 border-t border-gray-100 dark:border-white/[0.05] grid grid-cols-2 md:grid-cols-3 gap-3">
                            <InfoCard label="Contact" value={owner.ownerId?.mobileNo || owner.ownerMobileNo} icon={Phone} />
                            <InfoCard label="Email" value={owner.ownerId?.email || owner.ownerEmail} icon={Globe} />
                            <InfoCard label="Bank Name" value={owner.bankAccount?.bankName || owner.ownerBankName} icon={Landmark} />
                            <InfoCard label="Account No" value={owner.bankAccount?.accountNo || owner.ownerAccountNo} icon={CreditCard} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN — Site Info + Electricity Metadata */}
              <div className="p-4 space-y-6 bg-gray-50/60 dark:bg-white/[0.01]">
                <div>
                  <SectionTitle title="Site Info" />
                  <div className="space-y-2">
                    <InfoCard label="Site Name" value={siteDetails.siteName || siteDetails.site_name} />
                    <InfoCard label="Site Code" value={siteDetails.code} />
                    <InfoCard label="Location" value={siteDetails.propertyLocation || siteDetails.property_location} icon={MapPin} />
                    <InfoCard label="Managed By" value={siteDetails.managedBy || siteDetails.manage_by} />
                    <InfoCard label="Monthly Rent" value={siteDetails.monthlyRent || siteDetails.monthly_rent ? `₹${Number(siteDetails.monthlyRent || siteDetails.monthly_rent || 0).toLocaleString()}` : null} icon={Landmark} />
                    <InfoCard label="Property Address" value={siteDetails.propertyAddress || siteDetails.property_address} />
                  </div>
                </div>

                {/* Electricity Metadata */}
                <div>
                  <SectionTitle title="Electricity Info" />
                  <div className="space-y-2">
                    {(() => {
                      const consumer = (siteDetails.electricityConsumers || siteDetails.electricity_consumers)?.[0];
                      return (
                        <>
                          <InfoCard label="Consumer Name" value={siteDetails.consumerName || siteDetails.consumer_name || consumer?.consumerName} />
                          <InfoCard label="Provider" value={siteDetails.electricityProvider || siteDetails.electricity_provider || consumer?.electricityProvider || consumer?.providerName || consumer?.provider} icon={Zap} />
                          <InfoCard label="Consumer No" value={siteDetails.electricityConsumerNo || siteDetails.electricity_consumerno || consumer?.consumerNo} />
                          <InfoCard label="Units" value={siteDetails.unit} />
                          <InfoCard label="Charges" value={siteDetails.electricityCharges ? `₹${Number(siteDetails.electricityCharges || 0).toLocaleString()}` : null} icon={Landmark} />
                          <InfoCard label="Status" value={siteDetails.electricityStatus || siteDetails.electricity_status || (consumer ? "Active" : null)} />
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div>
                  <SectionTitle title="Quick Stats" />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05] rounded-xl text-center">
                      <p className="text-xs text-gray-400 font-medium mb-1">Owners</p>
                      <p className="text-xl font-bold text-gray-800 dark:text-white">{(siteDetails.owners || siteDetails.ownerId || []).length}</p>
                    </div>
                    <div className="p-3 bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05] rounded-xl text-center">
                      <p className="text-xs text-gray-400 font-medium mb-1">Elec. Charges</p>
                      <p className="text-lg font-bold text-yellow-500">₹{Number(siteDetails.electricityCharges || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

export default Page