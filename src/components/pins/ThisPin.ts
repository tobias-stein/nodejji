import { INode, IODirection, PinValueAccess, PinArchTypeId } from "@/types";
import { Pin } from "@/components/pins";

import { getCreateChildVisualElementByClass } from "@/utils/getCreateChildVisualElementByClass";

export class ThisPin extends Pin<IODirection.Input>
{
    public get pinType() : PinArchTypeId { return "this-pin"; };

    public constructor(parent: INode, object: Object)
    {
        super(IODirection.Input, parent, object, PinValueAccess.This);
        this.label = "this";
    }

    public renderer(vPin: HTMLElement): HTMLElement 
    {
        const vSocket = getCreateChildVisualElementByClass(vPin, "ne-socket"); 
        const vSocketBG = getCreateChildVisualElementByClass(vSocket, "ne-socket-bg");
        const vLabel = getCreateChildVisualElementByClass(vPin, "ne-label");
        // set pin display label
        vLabel.innerHTML = this.label;
        
        const vValue = getCreateChildVisualElementByClass(vPin, "ne-value");
        // do not render any value!
        
        // apply style to connector
        if(this.style) 
        { 
            vSocket.style.borderColor       = "rgba(244, 196, 32, 1.0)";
            vSocketBG.style.backgroundColor = "rgba(244, 196, 32, 1.0)";
        }
        
        // render value
        return vPin;
    }
}