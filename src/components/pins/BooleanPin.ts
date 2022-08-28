import { INode, IODirection, PinValueType, PinValueAccess, PinArchTypeId } from "@/types";
import { Pin } from "@/components/pins";

import { getCreateChildVisualElementByClass } from "@/utils/getCreateChildVisualElementByClass";

export class BooleanPin<TDirection extends IODirection = IODirection> extends Pin<TDirection>
{
    public get pinType() : PinArchTypeId { return "boolean-pin"; };

    public constructor(direction: TDirection, parent: INode, value: PinValueType, accessAs: PinValueAccess)
    {
        super(direction, parent, value, accessAs);
    }

    public renderer(vPin: HTMLElement): HTMLElement 
    {
        const vSocket = getCreateChildVisualElementByClass(vPin, "ne-socket"); 
        const vSocketBG = getCreateChildVisualElementByClass(vSocket, "ne-socket-bg");
        const vLabel = getCreateChildVisualElementByClass(vPin, "ne-label");
        // set pin display label
        vLabel.innerHTML = this.label;
        
        
        const vValue = getCreateChildVisualElementByClass(vPin, "ne-value");
        const checkboxElement = document.createElement("input");
        checkboxElement.type = "checkbox";
        checkboxElement.checked = this.value as boolean;
        vValue.appendChild(checkboxElement);
        
        // apply style to connector
        if(this.style) 
        { 
            vSocket.style.borderColor       = "rgba(255, 47, 47, 1.0)"; 
            vSocketBG.style.backgroundColor = "rgba(255, 47, 47, 1.0)"; 
        }
        
        // render value
        return vPin;
    }
}