import { INode } from "@/types";

import { renderHeader } from "./header";
import { renderBody } from "./body";

import { getCreateChildVisualElementById } from "@/utils/getCreateChildVisualElementById";

export function renderNode(node: INode, canvas: HTMLElement) : HTMLElement 
{
    const vNode = getCreateChildVisualElementById(canvas, node.uuid, "ne-node");

    // update now values
    vNode.style.left = `${node.x}px`;
    vNode.style.top = `${node.y}px`;

    renderHeader(node, vNode);
    renderBody(node, vNode);
    
    return vNode;
}