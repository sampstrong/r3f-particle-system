import { forwardRef, useContext, useEffect, useMemo, useRef } from "react";
import { FBOChildType } from "./FBOSimulation"
import { FBOSimulationContext } from "./FBOSimulationContext";

export const FBOSimulationShader = forwardRef(({ uniformKey = 'uFBO', ...props }, ref) => {

    const fboSimCtx = useContext(FBOSimulationContext);
    const shaderRef = useRef();

    useEffect(() => {
        if (!ref) ref = shaderRef;        
        if (ref && typeof ref === 'function') {
            ref(shaderRef.current);
        } else if (ref && typeof ref === 'object') {
            ref.current = shaderRef.current;
        }
    }, []);

    const reactNode = useMemo(() => {
        return <shaderMaterial ref={ shaderRef } { ...props } />
    }, []);

    useEffect(() => {
        fboSimCtx.setSimulationShader({ 
            shader: ref.current, 
            node: reactNode, 
            key: uniformKey 
        });
    }, [uniformKey]);

    return <>{ reactNode }</>
});
FBOSimulationShader.childType = FBOChildType.Shader;
export default FBOSimulationShader;