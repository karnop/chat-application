import React from 'react';

const AmbientBackground = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#050505]">
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-indigo-600/20 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-rose-600/10 blur-[150px] mix-blend-screen" />
        <div className="absolute top-[40%] left-[60%] w-[30vw] h-[30vw] rounded-full bg-emerald-600/10 blur-[100px] mix-blend-screen" />
    </div>
);

export default AmbientBackground;
