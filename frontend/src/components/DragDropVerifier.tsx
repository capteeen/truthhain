import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, CheckCircle2, AlertTriangle, XCircle, FileSearch, ShieldCheck } from 'lucide-react'

// Simulated hash database
const KNOWN_HASHES: Record<string, { title: string; type: string; date: string }> = {
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855': {
        title: 'DOJ-EPSTE-2026-RELEASE-V1.pdf',
        type: 'Official Release',
        date: '2026-01-20'
    }
}

function DragDropVerifier() {
    const [result, setResult] = useState<{
        status: 'idle' | 'verifying' | 'verified' | 'modified' | 'not-found'
        hash?: string
        metadata?: typeof KNOWN_HASHES[string]
    }>({ status: 'idle' })

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (!file) return

        setResult({ status: 'verifying' })

        // 1. Compute SHA-256 locally
        try {
            const buffer = await file.arrayBuffer()
            const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
            const hashArray = Array.from(new Uint8Array(hashBuffer))
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

            // 2. Simulate network delay (checking Solana state)
            setTimeout(() => {
                const metadata = KNOWN_HASHES[hashHex]
                if (metadata) {
                    setResult({ status: 'verified', hash: hashHex, metadata })
                } else {
                    // Determine if it's "not found" or "modified" based on filename simulation
                    if (file.name.toLowerCase().includes('epstein')) {
                        setResult({ status: 'modified', hash: hashHex })
                    } else {
                        setResult({ status: 'not-found', hash: hashHex })
                    }
                }
            }, 1500)
        } catch (err) {
            console.error('Hashing error:', err)
            setResult({ status: 'idle' })
        }
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        multiple: false
    })

    return (
        <div className="verifier-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <AnimatePresence mode="wait">
                {result.status === 'idle' || result.status === 'verifying' ? (
                    <div
                        key="dropzone-root"
                        {...getRootProps()}
                        className={`dropzone ${isDragActive ? 'active' : ''}`}
                    >
                        <motion.div
                            key="dropzone-motion"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <input {...getInputProps()} />
                            {result.status === 'verifying' ? (
                                <div className="verifying-overlay" style={{ textAlign: 'center' }}>
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                        style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}
                                    >
                                        <FileSearch size={64} style={{ color: 'var(--color-accent)' }} />
                                    </motion.div>
                                    <h3 className="pulse">Consulting Solana Registry...</h3>
                                    <p style={{ color: 'var(--color-text-secondary)' }}>Computing SHA-256 Local Fingerprint</p>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center' }}>
                                    <Upload className="dropzone-icon" size={64} style={{ marginBottom: '24px', opacity: 0.5 }} />
                                    <h3 className="dropzone-title">Drop investigative file here</h3>
                                    <p className="dropzone-subtitle" style={{ color: 'var(--color-text-secondary)' }}>or click to browse your local filesystem</p>
                                    <div style={{ marginTop: '24px', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                        <span className="badge badge-cyan">PDF ONLY</span>
                                        <span className="badge badge-cyan">MAX 500MB</span>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                ) : (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`result-card ${result.status} glass-card`}
                        style={{ border: `1px solid var(--color-${result.status === 'verified' ? 'success' : result.status === 'modified' ? 'warning' : 'error'})` }}
                    >
                        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
                            {result.status === 'verified' && <CheckCircle2 size={64} color="var(--color-success)" style={{ filter: 'drop-shadow(0 0 10px rgba(0,255,157,0.3))' }} />}
                            {result.status === 'modified' && <AlertTriangle size={64} color="var(--color-warning)" />}
                            {result.status === 'not-found' && <XCircle size={64} color="var(--color-error)" />}
                        </div>

                        <h2 style={{ marginBottom: '8px', textAlign: 'center' }}>
                            {result.status === 'verified' && 'Identity Verified'}
                            {result.status === 'modified' && 'Payload Mismatch'}
                            {result.status === 'not-found' && 'No Record Found'}
                        </h2>

                        <p style={{ maxWidth: '500px', margin: '0 auto 24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                            {result.status === 'verified' && `This document exactly matches the official release indexed on-chain.`}
                            {result.status === 'modified' && `Warning: The hash of this file does not match any official registry entries. It may have been modified.`}
                            {result.status === 'not-found' && `This document fingerprint is not recognized by the Truth Chain network.`}
                        </p>

                        {result.metadata && (
                            <div className="glass-card" style={{ background: 'rgba(0,0,0,0.2)', marginBottom: '24px', textAlign: 'left', padding: '20px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', fontSize: '14px' }}>
                                    <span style={{ color: 'var(--color-text-tertiary)' }}>Document:</span>
                                    <span>{result.metadata.title}</span>
                                    <span style={{ color: 'var(--color-text-tertiary)' }}>Type:</span>
                                    <span className="badge badge-cyan" style={{ width: 'fit-content' }}>{result.metadata.type}</span>
                                    <span style={{ color: 'var(--color-text-tertiary)' }}>Anchored:</span>
                                    <span>{result.metadata.date}</span>
                                </div>
                            </div>
                        )}

                        <div className="result-hash" style={{ background: 'var(--color-bg-deep)', padding: '12px', borderRadius: '8px', fontFamily: 'var(--font-mono)', fontSize: '12px', wordBreak: 'break-all' }}>
                            SHA-256: {result.hash}
                        </div>

                        <div style={{ marginTop: '32px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button onClick={() => setResult({ status: 'idle' })} className="btn btn-secondary">
                                Verify Another
                            </button>
                            {result.status === 'verified' && (
                                <button className="btn btn-primary">
                                    <ShieldCheck size={18} />
                                    Export On-Chain Proof
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default DragDropVerifier
