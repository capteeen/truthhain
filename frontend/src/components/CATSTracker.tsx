import { useState } from 'react'

interface CATSRecord {
    cats_id: string
    property_name: string | null
    document_count: number
    documents: { hash: string; title: string; page: number }[]
}

const DEMO_CATS: CATSRecord[] = [
    { cats_id: 'CATS-ZR-2019-0001', property_name: 'Zorro Ranch, New Mexico', document_count: 47, documents: [{ hash: 'a1b2c3', title: 'Property Records', page: 1247 }, { hash: 'd4e5f6', title: 'FBI Search Warrant', page: 2341 }] },
    { cats_id: 'CATS-LSJ-2020-0034', property_name: 'Little St. James Island', document_count: 156, documents: [{ hash: 'g7h8i9', title: 'Building Permits', page: 892 }, { hash: 'j0k1l2', title: 'Victim Interview', page: 3456 }] },
    { cats_id: 'CATS-NYC-2018-0012', property_name: 'NYC Townhouse (71st Street)', document_count: 89, documents: [{ hash: 'm3n4o5', title: 'Wire Transfers', page: 5678 }] },
    { cats_id: 'CATS-PAR-2017-0008', property_name: 'Paris Apartment (Ave. Foch)', document_count: 23, documents: [{ hash: 'p6q7r8', title: 'Lease Agreement', page: 7890 }] },
]

export default function CATSTracker() {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedRecord, setSelectedRecord] = useState<CATSRecord | null>(null)

    const filtered = DEMO_CATS.filter(r =>
        !searchQuery ||
        r.cats_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.property_name?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <section className="section">
            <div className="container">
                <div className="section-header">
                    <h2 className="section-title">CATS Financial Tracker</h2>
                    <p className="section-subtitle">Consolidated Asset Tracking System - linking documents to properties</p>
                </div>

                <div className="cats-search">
                    <input type="text" className="input" placeholder="Search by CATS ID or property name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>

                {!selectedRecord ? (
                    <div className="document-grid">
                        {filtered.map(record => (
                            <article key={record.cats_id} className="card" onClick={() => setSelectedRecord(record)} style={{ cursor: 'pointer' }}>
                                <h3 className="cats-property">{record.property_name || 'Unknown Property'}</h3>
                                <p className="cats-id">{record.cats_id}</p>
                                <p style={{ marginTop: 'var(--space-4)', color: 'var(--color-text-secondary)' }}>{record.document_count} documents linked</p>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="card cats-result">
                        <button className="btn btn-secondary" onClick={() => setSelectedRecord(null)} style={{ marginBottom: 'var(--space-6)' }}>← Back</button>
                        <h3 className="cats-property">{selectedRecord.property_name}</h3>
                        <p className="cats-id">{selectedRecord.cats_id}</p>
                        <p style={{ margin: 'var(--space-4) 0' }}>{selectedRecord.document_count} documents linked to this asset</p>
                        <h4 style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-3)' }}>Linked Documents</h4>
                        {selectedRecord.documents.map(doc => (
                            <div key={doc.hash} style={{ padding: 'var(--space-3)', borderBottom: '1px solid var(--color-border)' }}>
                                <strong>{doc.title}</strong>
                                <span style={{ marginLeft: 'var(--space-3)', color: 'var(--color-text-tertiary)' }}>Page {doc.page}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}
