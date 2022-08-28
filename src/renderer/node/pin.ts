import { IPin } from "@/types";

import { getCreateChildVisualElementByClass } from "@/utils/getCreateChildVisualElementByClass";


export function renderPin(pin: IPin, vPin: HTMLElement): HTMLElement 
{  
    const vSocket = getCreateChildVisualElementByClass(vPin, "ne-socket"); 
    const vSocketBG = getCreateChildVisualElementByClass(vSocket, "ne-socket-bg");
    const vLabel = getCreateChildVisualElementByClass(vPin, "ne-label");

    const vValue = getCreateChildVisualElementByClass(vPin, "ne-value");
    
    // set pin display label
    vLabel.innerHTML = pin.label;

    // apply style to connector
    if(pin.style) 
    { 
        vSocket.style.borderColor = pin.style.color || ""; 
        vSocketBG.style.backgroundColor = pin.style.color || ""; 
    }
    
    vValue.innerHTML = `${pin.value}: `;
    
    // render value
    return vPin;
}