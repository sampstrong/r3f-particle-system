import React, { createContext, useState } from "react";

export const FBOSimulationContext = createContext();
export const FBOSimulationContextProvider = ({ children }) => {

    const [ size, setSize ] = useState(null);
    const [ simulationShader, setSimulationShader ] = useState(null);
    const [ pointsRenderer, setPointsRenderer ] = useState(null);
    const [ meshRenderer, setMeshRenderer ] = useState(null);
    
    const context = {
        size, setSize,
        simulationShader, setSimulationShader,
        pointsRenderer, setPointsRenderer,
        meshRenderer, setMeshRenderer
    }

    return (
        <FBOSimulationContext.Provider value={ context }>
            { children }
        </FBOSimulationContext.Provider>
    );
}