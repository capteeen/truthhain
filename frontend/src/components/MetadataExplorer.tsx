import { useState } from 'react'

interface DocumentMetadata {
    hash: string
    document_type: string
    cats_number: string | null
    title: string
    timestamp: number
    page_number: number
    is_modified: boolean
    account_pubkey: string
}

const DOCUMENT_TYPES = ['All Types', 'FD-302', 'Flight Log', 'Deposition', 'Court Filing', 'Financial Record', 'Email', 'Report']

const DEMO_DOCUMENTS: DocumentMetadata[] = [
    { hash: 'a1b2c3d4e5f6789012345678901234567890abcd', document_type: 'FD-302', cats_number: 'CATS-ZR-2019-0001', title: 'FBI Interview - Property Manager', timestamp: 1672531200, page_number: 1247, is_modified: false, account_pubkey: 'DemoAcc1XXXX' },
    { hash: 'b2c3d4e5f67890123456789012345678901bcde', document_type: 'Flight Log', cats_number: null, title: 'N908JE Flight Manifest - March 2005', timestamp: 1672617600, page_number: 3421, is_modified: true, account_pubkey: 'DemoAcc2XXXX' },
    { hash: 'c3d4e5f678901234567890123456789012cdef', document_type: 'Deposition', cats_number: 'CATS-LSJ-2020-0034', title: 'Victim Testimony - Case 20-cv-1234', timestamp: 1672704000, page_number: 892, is_modified: false, account_pubkey: 'DemoAcc3XXXX' },
    { hash: 'd4e5f6789012345678901234567890123defg', document_type: 'Financial Record', cats_number: 'CATS-NYC-2018-0012', title: 'Wire Transfer Records - Deutsche Bank', timestamp: 1672790400, page_number: 5678, is_modified: false, account_pubkey: 'DemoAcc4XXXX' },
]

export default function MetadataExplorer() {
    const [documents] = useState<DocumentMetadata[]>(DEMO_DOCUMENTS)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedType, setSelectedType] = useState('All Types')

    const filtered = documents.filter(doc => {
        const matchesSearch = !searchQuery || doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || doc.hash.includes(searchQuery.toLowerCase())
        const matchesType = selectedType === 'All Types' || doc.document_type === selectedType
        return matchesSearch && matchesType
    })

    const formatDate = (ts: number) => new Date(ts * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

    return (
        <section className="section">
            <div className="container">
                <div className="section-header">
                    <h2 className="section-title">Document Explorer</h2>
                    <p className="section-subtitle">Search verified documents from the Epstein file releases</p>
                </div>
                <div className="search-bar">
                    <input type="text" className="input search-input" placeholder="Search by title or hash..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    <button className="btn btn-primary">Search</button>
                </div>
                <div className="filters">
                    {DOCUMENT_TYPES.map(type => (
                        <button key={type} className={`filter-chip ${selectedType === type ? 'active' : ''}`} onClick={() => setSelectedType(type)}>{type}</button>
                    ))}
                </div>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' }}>Showing {filtered.length} documents</p>
                <div className="document-grid">
                    {filtered.map(doc => (
                        <article key={doc.hash} className="card document-card">
                            <div className="document-header">
                                <h3 className="document-title">{doc.title}</h3>
                                {doc.is_modified ? <span className="badge badge-modified">⚠️ Modified</span> : <span className="badge badge-verified">✓ Verified</span>}
                            </div>
                            <div className="document-meta">
                                <span className="badge badge-document-type">{doc.document_type}</span>
                                {doc.cats_number && <span className="badge badge-document-type">{doc.cats_number}</span>}
                            </div>
                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Page {doc.page_number} • {formatDate(doc.timestamp)}</p>
                            <p className="document-hash">{doc.hash}</p>
                            <div className="document-actions">
                                <a href={`https://solscan.io/account/${doc.account_pubkey}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ flex: 1 }}>View on Solscan</a>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    )
}
