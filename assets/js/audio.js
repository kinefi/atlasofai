const SOUND_PROFILES = {
    mining: { tone: 92, noise: 180, waveform: 'triangle', texture: 0.65 },
    refining: { tone: 138, noise: 420, waveform: 'sawtooth', texture: 0.35 },
    'chip-design': { tone: 294, noise: 1500, waveform: 'sine', texture: 0.16 },
    fabrication: { tone: 196, noise: 760, waveform: 'triangle', texture: 0.48 },
    data: { tone: 330, noise: 2100, waveform: 'sine', texture: 0.2 },
    annotation: { tone: 440, noise: 2700, waveform: 'sine', texture: 0.12 },
    'data-center': { tone: 110, noise: 360, waveform: 'triangle', texture: 0.68 },
    water: { tone: 174, noise: 980, waveform: 'sine', texture: 0.82 },
    training: { tone: 220, noise: 1250, waveform: 'triangle', texture: 0.3 },
    use: { tone: 392, noise: 3200, waveform: 'sine', texture: 0.14 },
    surveillance: { tone: 260, noise: 1900, waveform: 'square', texture: 0.1 },
    military: { tone: 82, noise: 240, waveform: 'sawtooth', texture: 0.28 },
    'e-waste': { tone: 123, noise: 540, waveform: 'square', texture: 0.4 }
};

export function createAmbientSound() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    let context = null;
    let sourceNodes = [];
    let masterGain = null;
    let noiseFilter = null;
    let toneOscillator = null;
    let toneGain = null;
    let textureGain = null;
    let currentProfile = 'data-center';

    function setProfile(profileName) {
        currentProfile = SOUND_PROFILES[profileName] ? profileName : 'data-center';
        if (!context || !masterGain || !noiseFilter || !toneOscillator) return;

        const profile = SOUND_PROFILES[currentProfile];
        const now = context.currentTime;
        noiseFilter.frequency.setTargetAtTime(profile.noise, now, 0.12);
        toneOscillator.frequency.setTargetAtTime(profile.tone, now, 0.12);
        toneOscillator.type = profile.waveform;
        toneGain.gain.setTargetAtTime(0.35, now, 0.12);
        textureGain.gain.setTargetAtTime(profile.texture, now, 0.12);
    }

    async function start() {
        if (!AudioContextClass) throw new Error('Bu tarayıcı ortam sesini desteklemiyor.');

        context ||= new AudioContextClass();
        if (context.state !== 'running') await context.resume();
        if (context.state !== 'running') throw new Error('Tarayıcı ses başlatma izni vermedi.');

        masterGain = context.createGain();
        masterGain.gain.setValueAtTime(0, context.currentTime);
        masterGain.connect(context.destination);

        const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
        const samples = buffer.getChannelData(0);
        for (let index = 0; index < samples.length; index += 1) {
            samples[index] = (Math.random() * 2 - 1) * 0.3;
        }

        const noise = context.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;
        noiseFilter = context.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        textureGain = context.createGain();
        noise.connect(noiseFilter).connect(textureGain).connect(masterGain);
        noise.start();

        toneOscillator = context.createOscillator();
        toneGain = context.createGain();
        toneOscillator.connect(toneGain).connect(masterGain);
        toneOscillator.start();

        sourceNodes = [noise, toneOscillator];
        setProfile(currentProfile);
        masterGain.gain.setTargetAtTime(0.16, context.currentTime, 0.08);
    }

    function stop() {
        if (!context || !masterGain) return;
        const stoppingNodes = sourceNodes;
        const stoppingGain = masterGain;
        const stopAt = context.currentTime + 0.18;
        stoppingGain.gain.cancelScheduledValues(context.currentTime);
        stoppingGain.gain.setTargetAtTime(0, context.currentTime, 0.035);
        sourceNodes = [];
        masterGain = null;
        noiseFilter = null;
        toneOscillator = null;
        toneGain = null;
        textureGain = null;
        window.setTimeout(() => stoppingNodes.forEach((node) => node.stop(stopAt)), 220);
    }

    return {
        get supported() {
            return Boolean(AudioContextClass);
        },
        get playing() {
            return Boolean(masterGain);
        },
        setProfile,
        async toggle() {
            if (masterGain) stop();
            else await start();
            return Boolean(masterGain);
        }
    };
}
