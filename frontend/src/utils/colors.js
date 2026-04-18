export const USER_COLORS = [
    { name: 'cyan', text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', glow: 'shadow-[0_0_15px_rgba(34,211,238,0.15)]' },
    { name: 'rose', text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', glow: 'shadow-[0_0_15px_rgba(251,113,133,0.15)]' },
    { name: 'emerald', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', glow: 'shadow-[0_0_15px_rgba(52,211,153,0.15)]' },
    { name: 'amber', text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', glow: 'shadow-[0_0_15px_rgba(251,191,36,0.15)]' },
    { name: 'fuchsia', text: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/30', glow: 'shadow-[0_0_15px_rgba(232,121,249,0.15)]' },
];

export const getUserColor = (username) => {
    if (!username) return USER_COLORS[0];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
};
