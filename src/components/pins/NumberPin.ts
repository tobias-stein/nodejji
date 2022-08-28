import { INode, IODirection, PinValueType, PinValueAccess, PinArchTypeId } from "@/types";
import { Pin } from "@/components/pins";

import { getCreateChildVisualElementByClass } from "@/utils/getCreateChildVisualElementByClass";

export class NumberPin<TDirection extends IODirection = IODirection> extends Pin<TDirection>
{
    public get pinType() : PinArchTypeId { return "number-pin"; };

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
        const numberElement = document.createElement("input");
        numberElement.type = "number";
        numberElement.value = `${this.value as number}`;
        vValue.appendChild(numberElement);
        
        // apply style to connector
        if(this.style) 
        { 
            vSocket.style.borderColor       = "rgba(102, 227, 33, 1.0)";
            vSocketBG.style.backgroundColor = "rgba(102, 227, 33, 1.0)";
        }
        
        // render value
        return vPin;
    }
}