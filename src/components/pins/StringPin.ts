import { INode, IODirection, PinValueType, PinValueAccess, PinArchTypeId } from "@/types";
import { Pin } from "@/components/pins";

import { getCreateChildVisualElementByClass } from "@/utils/getCreateChildVisualElementByClass";

export class StringPin<TDirection extends IODirection = IODirection> extends Pin<TDirection>
{
    public get pinType() : PinArchTypeId { return "string-pin"; };

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
        const textElement = document.createElement("input");
        textElement.type = "text";
        textElement.value = `${this.value as string}`;
        vValue.appendChild(textElement);
        
        // apply style to connector
        if(this.style) 
        { 
            vSocket.style.borderColor       = "rgb(239, 43, 205, 1.0)";
            vSocketBG.style.backgroundColor = "rgb(239, 43, 205, 1.0)";
        }
        
        // render value
        return vPin;
    }
}