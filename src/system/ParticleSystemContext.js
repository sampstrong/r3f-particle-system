import React, { createContext, useRef, useState } from 'react';

export const ParticleSystemContext = createContext();

export const ParticleSystemContextProvider = ({ children }) => {

    const meshDataRef = useRef({ mesh: null, normals: null });

    const [ sourceData, setSourceData ] = useState(null);
    const [ spawnSettings, setSpawnSettings ] = useState(null);
    const [ sourceTexture, setSourceTexture ] = useState(null);
    const [ respawnTexture, setRespawnTexture ] = useState(null);
    const [ directionalForce, setDirectionalForce ] = useState(null);
    const [ noiseForce, setNoiseForce ] = useState(null);
    const [ rotationalForce, setRotationalForce ] = useState(null);
    const [ curveTangentForce, setCurveTangentForce ] = useState(null);
    const [ normalForce, setNormalForce ] = useState(null);
    const [ pointForce, setPointForce ] = useState(null);
    const [ returnForce, setReturnForce ] = useState(null);
    const [ particleData, setParticleData ] = useState({});

    const context = {
        meshDataRef,
        sourceData, setSourceData,
        spawnSettings, setSpawnSettings,
        sourceTexture, setSourceTexture,
        respawnTexture, setRespawnTexture,
        directionalForce, setDirectionalForce,
        noiseForce, setNoiseForce,
        rotationalForce, setRotationalForce,
        curveTangentForce, setCurveTangentForce,
        normalForce, setNormalForce,
        pointForce, setPointForce,
        returnForce, setReturnForce,
        particleData, setParticleData,
    }

    return (
        <ParticleSystemContext.Provider value={ context }>
            { children }
        </ParticleSystemContext.Provider>
    );
}