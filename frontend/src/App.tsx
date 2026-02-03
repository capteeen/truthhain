import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import DragDropVerifier from './components/DragDropVerifier'
import MetadataExplorer from './components/MetadataExplorer'
import CATSTracker from './components/CATSTracker'
import Documentation from './components/Documentation'
import Analytics from './components/Analytics'
import { Shield, Search, Database, FileText, ChevronRight, Github, ExternalLink, Twitter } from 'lucide-react'

function App() {
    return (
        <BrowserRouter>
            <div className="app">
                <div className="bg-mesh"></div>
                <div className="bg-grid"></div>

                {/* Header */}
                <header className="header">
                    <div className="container header-inner">
                        <NavLink to="/" className="logo">
                            <Shield className="logo-icon" />
                            <span className="gradient-text">TRUTH CHAIN</span>
                        </NavLink>

                        <nav className="nav">
                            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                Network
                            </NavLink>
                            <NavLink to="/explorer" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                Explorer
                            </NavLink>
                            <NavLink to="/docs" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                Documentation
                            </NavLink>
                            <NavLink to="/cats" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                CATS Tracker
                            </NavLink>
                        </nav>

                        <div className="header-actions">
                            <a href="https://x.com/truthchainonsol?s=21" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '8px 16px' }}>
                                <Twitter size={18} />
                                <span className="hide-mobile">X</span>
                            </a>
                            <a href="https://github.com/capteeen/truthhain" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '8px 16px' }}>
                                <Github size={18} />
                                <span className="hide-mobile">GitHub</span>
                            </a>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main>
                    <AnimatePresence mode="wait">
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/explorer" element={<MetadataExplorer />} />
                            <Route path="/cats" element={<CATSTracker />} />
                            <Route path="/docs" element={<Documentation />} />
                        </Routes>
                    </AnimatePresence>
                </main>

                {/* Footer */}
                <footer className="footer">
                    <div className="container">
                        <div className="footer-inner">
                            <div className="footer-brand">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <Shield size={20} className="color-accent" />
                                    <span style={{ fontWeight: 700, letterSpacing: '1px' }}>TRUTH CHAIN</span>
                                </div>
                                <p style={{ fontSize: '14px', color: 'var(--color-text-tertiary)', maxWidth: '300px' }}>
                                    The global registry for immutable investigation data. Powered by Solana.
                                </p>
                            </div>

                            <div className="footer-links">
                                <div style={{ display: 'grid', gap: '8px' }}>
                                    <span style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>Ecosystem</span>
                                    <a href="https://solscan.io" className="footer-link">Solscan <ExternalLink size={12} /></a>
                                    <a href="#" className="footer-link">Chain Status</a>
                                    <a href="#" className="footer-link">Security Pulse</a>
                                </div>
                                <div style={{ display: 'grid', gap: '8px' }}>
                                    <span style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>Community</span>
                                    <a href="https://x.com/truthchainonsol?s=21" target="_blank" rel="noopener noreferrer" className="footer-link">X (Twitter)</a>
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid var(--glass-border)', textAlign: 'center', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                            © 2026 Truth Chain Foundation. All cryptographic rights reserved.
                        </div>
                    </div>
                </footer>
            </div>
        </BrowserRouter>
    )
}

function HomePage() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Hero Section */}
            <section className="hero">
                <div className="container">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                    >
                        <h1 className="hero-title">
                            Verify the Truth.<br />
                            <span className="gradient-text">Permanently.</span>
                        </h1>
                        <p className="hero-subtitle">
                            A tamper-proof forensic registry of the 2026 release cycle.
                            Built on Solana for sub-second, multi-generational persistence.
                        </p>
                        <div className="hero-actions">
                            <a href="#verify" className="btn btn-primary">
                                Verify Document
                                <ChevronRight size={18} />
                            </a>
                            <NavLink to="/docs" className="btn btn-secondary">
                                View Whitepaper
                            </NavLink>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Stats */}
            <section className="container">
                <div className="stats-grid">
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="glass-card stat-item"
                    >
                        <span className="stat-value">3.2M+</span>
                        <span className="stat-label">Documents Indexed</span>
                    </motion.div>
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="glass-card stat-item"
                    >
                        <span className="stat-value">62ms</span>
                        <span className="stat-label">Block Finality</span>
                    </motion.div>
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="glass-card stat-item"
                    >
                        <span className="stat-value">100%</span>
                        <span className="stat-label">On-Chain Proof</span>
                    </motion.div>
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="glass-card stat-item"
                    >
                        <span className="stat-value">24</span>
                        <span className="stat-label">Tamper Attempts Foiled</span>
                    </motion.div>
                </div>
            </section>

            {/* Verifier */}
            <section id="verify" className="section">
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <h2 className="section-title">Cryptographic Verification</h2>
                        <p className="section-subtitle">
                            Direct SHA-256 anchoring against the Solana state machine.
                        </p>
                    </div>
                    <DragDropVerifier />
                </div>
            </section>

            {/* Analytics */}
            <section className="section" style={{ background: 'rgba(255,255,255,0.01)' }}>
                <div className="container">
                    <Analytics />
                </div>
            </section>

            {/* Features/Steps */}
            <section className="section">
                <div className="container">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                        <div className="glass-card">
                            <Search className="color-accent" size={32} style={{ marginBottom: '20px' }} />
                            <h3>Transparent Indexing</h3>
                            <p style={{ fontSize: '15px' }}>Every release is indexed with full metadata and provenance tracking, accessible via public API.</p>
                        </div>
                        <div className="glass-card">
                            <Database className="color-accent" size={32} style={{ marginBottom: '20px' }} />
                            <h3>Atomic Anchoring</h3>
                            <p style={{ fontSize: '15px' }}>Hashes are bundled and anchored into Solana blocks, creating a permanent chronological record.</p>
                        </div>
                        <div className="glass-card">
                            <FileText className="color-accent" size={32} style={{ marginBottom: '20px' }} />
                            <h3>Forensic Reporting</h3>
                            <p style={{ fontSize: '15px' }}>Generate cryptographically signed reports for legal and journalistic verification purposes.</p>
                        </div>
                    </div>
                </div>
            </section>
        </motion.div>
    )
}

export default App
