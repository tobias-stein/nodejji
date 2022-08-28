import { IContext, INode, ILink } from "@/types";


export interface IGeneratorOutput 
{
    nodes: Array<INode>;
    links: Array<ILink>;
}

export interface IGenerator 
{
    generate(ctx: IContext): Promise<IGeneratorOutput>;
}