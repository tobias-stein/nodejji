import { INode } from "@/types";

import { getCreateChildVisualElementByClass } from "@/utils/getCreateChildVisualElementByClass";


export function renderHeader(node: INode, vNode: HTMLElement): HTMLElement 
{
    const vHeader = getCreateChildVisualElementByClass(vNode, "ne-header");
    const vLabel = getCreateChildVisualElementByClass(vHeader, "ne-header-label");
    
    // update label
    vLabel.innerHTML = node.label;
    
    return vHeader;
}