import { INode, IPin } from "@/types";
import { renderPin } from "./pin";

import { getCreateChildVisualElementById } from "@/utils/getCreateChildVisualElementById";
import { getCreateChildVisualElementByClass } from "@/utils/getCreateChildVisualElementByClass";


function deleteObsoletePins(pins: Array<IPin>, parent: HTMLElement) : void
{
    const allNodeInputPinIds = pins.map(pin => pin.uuid);
    const allVisualInputPins = Array.from(parent.querySelectorAll(".ne-pin"));
    for(const pin of allVisualInputPins)
    {
        if(!allNodeInputPinIds.includes(pin.id)) { parent.removeChild(pin); }
    }
}

export function renderBody(node: INode, vNode: HTMLElement): HTMLElement 
{
    const vBody = getCreateChildVisualElementByClass(vNode, "ne-body");

    const vInput = getCreateChildVisualElementByClass(vBody, "ne-input");
    for(const pin of node.inputs) 
    { 
        // get/create by uuid
        const vPin = pin.visual = getCreateChildVisualElementById(vInput, pin.uuid, "ne-pin");
        pin.renderer ? pin.renderer(vPin) : renderPin(pin, vPin) /** fallback pin renderer */; 
    }
    
    const vOutout = getCreateChildVisualElementByClass(vBody, "ne-output");
    for(const pin of node.outputs) 
    { 
        const vPin = pin.visual = getCreateChildVisualElementById(vOutout, pin.uuid, "ne-pin");
        pin.renderer ? pin.renderer(vPin) : renderPin(pin, vPin) /** fallback pin renderer */; 
    }

    // remove all pins, which are no longer present in the node structure
    deleteObsoletePins(node.inputs, vInput);
    deleteObsoletePins(node.outputs, vOutout);

    return vBody;
}