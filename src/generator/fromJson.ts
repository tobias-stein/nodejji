import { IContext, INode, ILink, IPin, NodejjiType } from "@/types";
import { IGenerator, IGeneratorOutput } from ".";
import { NodeFactory } from "@/components/nodes";
import { JsonObjectNode } from "@/components/nodes/JsonObjectNode";

import newUUID from "@/utils/uuid";

export class JsonNodeGenerator implements IGenerator
{
    /** clone of the original json */
    private jsonObject: any;

    public constructor(json: string | any) 
    {
        this.jsonObject = JSON.parse(typeof json === "string" ? json : JSON.stringify(json));
    }

    public async generate(ctx: IContext) : Promise<IGeneratorOutput>
    {
        return await this.generateInner(ctx, this.jsonObject, "JSON-Node", undefined, 0, 0);
    }

    private async generateInner(ctx: IContext, obj: any, label: string, parent: IPin | undefined, hOffset: number, vOffset: number) : Promise<IGeneratorOutput>
    {
        const nodes = new Array<INode>();
        const links = new Array<ILink>();
        
        const node: INode = NodeFactory.create(JsonObjectNode, hOffset, vOffset, label, obj);
        nodes.push(node);

        if(parent !== undefined)
        {
            const link: ILink = {
                type: NodejjiType.Link,
                uuid: newUUID(),
                //@ts-ignore
                output: parent,
                //@ts-ignore
                input: node.inputs[0],
                visual: undefined,
                style: {}
            };
            
            links.push(link);
        }

        let _vOffset = vOffset;
        for(const field of Object.keys(obj))
        {
            const value = obj[field];
            if(typeof value === "object")
            {
                const result = await this.generateInner(ctx, value, `${label}.${field}`, node.outputs.find(pin => pin.value === value), hOffset + 400, _vOffset);
                nodes.push(...result.nodes);
                links.push(...result.links);

                _vOffset += (result.nodes.reduce((acc, cur) => acc += cur.outputs.length, 0) * 40);
            }

        }

        return {
            nodes: nodes,
            links: links
        } as IGeneratorOutput;
    }
}