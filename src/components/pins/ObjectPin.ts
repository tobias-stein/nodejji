import { INode, IODirection, PinValueType, PinValueAccess, PinArchTypeId } from "@/types";
import { Pin } from "@/components/pins";
import { getCreateChildVisualElementByClass } from "@/utils/getCreateChildVisualElementByClass";
 
export class ObjectPin<TDirection extends IODirection = IODirection> extends Pin<TDirection>
{
    public get pinType() : PinArchTypeId { return "object-pin"; };

    public constructor(direction: TDirection, parent: INode, value: PinValueType, accessAs: PinValueAccess)
    {
        super(direction, parent, value, accessAs);

        this.style.color = "rgba(47, 157, 255, 1.0)";
    }

    public renderer(vPin: HTMLElement): HTMLElement 
    {
        const vSocket = getCreateChildVisualElementByClass(vPin, "ne-socket"); 
        const vSocketBG = getCreateChildVisualElementByClass(vSocket, "ne-socket-bg");
        const vLabel = getCreateChildVisualElementByClass(vPin, "ne-label");
        // set pin display label
        vLabel.innerHTML = this.label;
        
        const vValue = getCreateChildVisualElementByClass(vPin, "ne-value");
        // const buttonElement = document.createElement("input");
        // buttonElement.type = "button";
        // vValue.appendChild(buttonElement);
        
        // apply style to connector
        if(this.style) 
        { 
            vSocket.style.borderColor       = "rgba(47, 157, 255, 1.0)";
            vSocketBG.style.backgroundColor = "rgba(47, 157, 255, 1.0)";
        }
        
        // render value
        return vPin;
    }
}