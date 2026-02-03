import { Book, Shield, Lock } from 'lucide-react';

const Documentation = () => {
    return (
        <div className="container section" style={{ paddingTop: '40px' }}>
            <header style={{ marginBottom: '60px' }}>
                <h1 className="hero-title gradient-text" style={{ fontSize: '48px', textAlign: 'left' }}>Technical Documentation</h1>
                <p className="hero-subtitle" style={{ margin: '0', textAlign: 'left' }}>
                    Deep dive into the architecture of Truth Chain's immutable verification protocol.
                </p>
            </header>

            <div className="docs-layout">
                <aside className="docs-sidebar">
                    <nav className="docs-nav">
                        <a href="#introduction" className="docs-nav-link active">Introduction</a>
                        <a href="#hashing" className="docs-nav-link">SHA-256 Protocol</a>
                        <a href="#solana" className="docs-nav-link">Solana State Machine</a>
                        <a href="#security" className="docs-nav-link">Security Audits</a>
                        <a href="#api" className="docs-nav-link">Verification API</a>
                    </nav>
                </aside>

                <main className="docs-content">
                    <section id="introduction">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <Book size={24} color="var(--color-accent)" />
                            <h2 style={{ margin: 0 }}>Introduction</h2>
                        </div>
                        <p>
                            Truth Chain is a decentralized verification engine designed to ensure the permanence and integrity of sensitive investigative data.
                            In an era of stealth edits and data scrubbing, Truth Chain provides a public, cryptographically verifiable record of original releases.
                        </p>
                        <div className="glass-card" style={{ padding: '24px', marginTop: '24px' }}>
                            <h4 style={{ color: 'var(--color-accent)', marginBottom: '12px' }}>The Core Problem</h4>
                            <p style={{ margin: 0, fontSize: '15px' }}>
                                Centralized cloud storage and government websites allow for "Stealth Edits"—changing the content of a document without changing its URL or metadata.
                                Truth Chain solves this by anchoring document fingerprints directly onto the Solana Blockchain.
                            </p>
                        </div>
                    </section>

                    <section id="hashing">
                        <h2 className="docs-heading">SHA-256 Fingerprinting</h2>
                        <p>
                            When a document is uploaded for verification, the browser computes its SHA-256 hash locally. No file data ever leaves your machine—only the unique 64-character fingerprint is transmitted to the network.
                        </p>
                        <div className="code-block">
                            <span style={{ color: 'var(--color-accent)' }}># Example CLI verification</span><br />
                            curl -X POST https://api.truthchain.io/v1/verify \<br />
                            &nbsp;&nbsp;-H "Content-Type: application/json" \<br />
                            &nbsp;&nbsp;-d &#123;"hash": "e3b0c442...855"&#125;
                        </div>
                    </section>

                    <section id="solana">
                        <h2 className="docs-heading">Solana Persistence Layer</h2>
                        <p>
                            By leveraging Solana's sub-second finality and low transaction costs, we maintain a global state of all "Epstein File" releases.
                            Each registry entry consists of:
                        </p>
                        <ul style={{ color: 'var(--color-text-secondary)', marginLeft: '20px', display: 'grid', gap: '12px' }}>
                            <li><strong>SHA-256 Hash:</strong> The unique identifier of the file content.</li>
                            <li><strong>Timestamp:</strong> The exact block time of original discovery.</li>
                            <li><strong>Authority:</strong> The cryptographic signature of the verifying entity.</li>
                            <li><strong>Metadata:</strong> Contextual labels for indexing.</li>
                        </ul>
                    </section>

                    <section id="security">
                        <h2 className="docs-heading">Zero-Knowledge Integrity</h2>
                        <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '20px' }}>
                            <div className="glass-card">
                                <Shield size={32} style={{ color: 'var(--color-accent)', marginBottom: '16px' }} />
                                <h4>Tamper Proof</h4>
                                <p style={{ fontSize: '13px' }}>Once a hash is committed to the blockchain, it cannot be removed or altered by any central authority.</p>
                            </div>
                            <div className="glass-card">
                                <Lock size={32} style={{ color: 'var(--color-accent)', marginBottom: '16px' }} />
                                <h4>Privacy First</h4>
                                <p style={{ fontSize: '13px' }}>Local hashing ensures that sensitive documents are never uploaded to our servers.</p>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
};

export default Documentation;
