import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

const data = [
    { name: 'Jan 20', verifications: 4000, capacity: 2400 },
    { name: 'Jan 22', verifications: 3000, capacity: 1398 },
    { name: 'Jan 24', verifications: 2000, capacity: 9800 },
    { name: 'Jan 26', verifications: 2780, capacity: 3908 },
    { name: 'Jan 28', verifications: 1890, capacity: 4800 },
    { name: 'Jan 30', verifications: 2390, capacity: 3800 },
    { name: 'Feb 01', verifications: 3490, capacity: 4300 },
];

const Analytics = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card"
            style={{ marginTop: '40px' }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h3 style={{ marginBottom: '4px' }}>Network Verification Throughput</h3>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
                        Real-time tracking of SHA-256 document anchors on Solana
                    </p>
                </div>
                <div className="badge badge-cyan pulse">Live Network Data</div>
            </div>

            <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorVer" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="var(--color-text-tertiary)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="var(--color-text-tertiary)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                background: 'var(--color-bg-tertiary)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '8px',
                                fontSize: '12px'
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="verifications"
                            stroke="var(--color-accent)"
                            fillOpacity={1}
                            fill="url(#colorVer)"
                            strokeWidth={3}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
};

export default Analytics;
